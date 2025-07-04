import { Vibrant } from 'node-vibrant/node';
import { timeEnd, timeStart } from '../utils/measureTimeUsage';
import logger from '../logger';
import { getPaletteData } from '../filesystem';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import roundTo from '../../common/roundTo';
import { generateRandomId } from '../utils/randomId';
import { createArtworkPalette, getLowResArtworksWithoutPalettes } from '@main/db/queries/palettes';
import { db } from '@main/db/db';
import { swatchTypeEnum } from '@db/schema';
import generateCoverBuffer from '@main/parseSong/generateCoverBuffer';

export const DEFAULT_SONG_PALETTE: PaletteData = {
  paletteId: 'DEFAULT_PALETTE',
  DarkMuted: {
    hex: '#104888',
    hsl: [0.589, 0.789, 0.3],
    population: 0
  },
  DarkVibrant: {
    hex: '#0d3e76',
    hsl: [0.589, 0.789, 0.26],
    population: 0
  },
  LightMuted: {
    hex: '#154383',
    hsl: [0.597, 0.716, 0.3],
    population: 0
  },
  LightVibrant: {
    hex: '#8cb4ec',
    hsl: [0.597, 0.716, 0.737],
    population: 8
  },
  Muted: {
    hex: '#104888',
    hsl: [0.589, 0.789, 0.3],
    population: 0
  },
  Vibrant: {
    hex: '#3c8ce8',
    hsl: [0.589, 0.789, 0.576],
    population: 2
  }
};

const generatePalette = async (artwork?: Buffer | string): Promise<PaletteData | undefined> => {
  if (artwork) {
    const palette = await Vibrant.from(artwork)
      .getPalette()
      .catch((error) => {
        logger.error(`Failed to parse a song artwork to get a color palette.`, {
          error
        });
      });

    if (palette) {
      const generatePaletteSwatch = <T extends typeof palette.DarkMuted>(
        nodeVibrantSwatch: T
      ): NodeVibrantPaletteSwatch | undefined => {
        if (nodeVibrantSwatch && Array.isArray(nodeVibrantSwatch.hsl)) {
          const [h, s, l] = nodeVibrantSwatch.hsl;

          const data: NodeVibrantPaletteSwatch = {
            population: nodeVibrantSwatch.population,
            hex: nodeVibrantSwatch.hex,
            hsl: [roundTo(h, 3), roundTo(s, 3), roundTo(l, 3)]
          };

          return data;
        }
        return undefined;
      };

      const outputPalette: PaletteData = {
        paletteId: generateRandomId(),
        Vibrant: generatePaletteSwatch(palette.Vibrant),
        LightVibrant: generatePaletteSwatch(palette.LightVibrant),
        DarkVibrant: generatePaletteSwatch(palette.DarkVibrant),
        Muted: generatePaletteSwatch(palette.Muted),
        LightMuted: generatePaletteSwatch(palette.LightMuted),
        DarkMuted: generatePaletteSwatch(palette.DarkMuted)
      };

      return outputPalette;
    }
    logger.warn('Generated artwork palette empty.');
    return undefined;
  }
  logger.warn('Empty input to generate a palette.');
  return DEFAULT_SONG_PALETTE;
};

const generatePalettesForSongs = async () => {
  const artworks = await getLowResArtworksWithoutPalettes();

  if (artworks.length > 0) {
    let x = 0;
    const noOfNoPaletteArtworks = artworks.reduce(
      (acc, artwork) => (!artwork.paletteId ? acc + 1 : acc),
      0
    );

    if (noOfNoPaletteArtworks > 0) {
      const start = timeStart();

      await db.transaction(async (trx) => {
        for (let i = 0; i < artworks.length; i += 1) {
          const artwork = artworks[i];

          if (!artwork.paletteId) {
            // const metadata = await musicMetaData.parseFile(song.path);

            const buffer = await generateCoverBuffer(artwork.path, false, false);
            const palette = await generatePalette(buffer);

            // const swatch =
            //   palette && palette.DarkVibrant && palette.LightVibrant
            //     ? {
            //         DarkVibrant: palette.DarkVibrant,
            //         LightVibrant: palette.LightVibrant
            //       }
            //     : undefined;

            await savePalette(artwork.id, palette, trx);
            x += 1;

            sendMessageToRenderer({
              messageCode: 'SONG_PALETTE_GENERATING_PROCESS_UPDATE',
              data: { total: noOfNoPaletteArtworks, value: x }
            });
          }
        }
      });

      timeEnd(start, 'Time to finish generating palettes for songs');

      dataUpdateEvent('songs/palette');
    } else sendMessageToRenderer({ messageCode: 'NO_MORE_SONG_PALETTES' });
  }
};

const savePalette = async (
  artworkId: number,
  palette: PaletteData | undefined,
  trx: DBTransaction
) => {
  if (palette) {
    const swatches: Parameters<typeof createArtworkPalette>[0]['swatches'] = [];

    const swatchTypes: {
      key: keyof typeof palette;
      label: (typeof swatchTypeEnum.enumValues)[number];
    }[] = [
      { key: 'DarkVibrant', label: 'DARK_VIBRANT' },
      { key: 'LightVibrant', label: 'LIGHT_VIBRANT' },
      { key: 'DarkMuted', label: 'DARK_MUTED' },
      { key: 'LightMuted', label: 'LIGHT_MUTED' },
      { key: 'Muted', label: 'MUTED' },
      { key: 'Vibrant', label: 'VIBRANT' }
    ];

    swatchTypes.forEach(({ key, label }) => {
      const swatch = palette[key];

      if (swatch && typeof swatch === 'object') {
        swatches.push({
          hex: swatch.hex,
          hsl: {
            h: swatch.hsl[0],
            s: swatch.hsl[1],
            l: swatch.hsl[2]
          },
          population: swatch.population,
          swatchType: label
        });
      }
    });

    await createArtworkPalette({ artworkId, swatches }, trx);
  }
};

export const getSelectedPaletteData = (paletteId?: string) => {
  const palettes = getPaletteData();

  if (paletteId) {
    for (const palette of palettes) {
      if (palette.paletteId === paletteId) return palette;
    }
  }
  return undefined;
};

// const generatePalettesForGenres = async () => {
//   const genres = getGenresData();
//   const songs = getSongsData();

//   if (Array.isArray(songs) && Array.isArray(genres) && songs.length > 0 && genres.length > 0) {
//     let x = 0;
//     const noOfNoPaletteGenres = genres.reduce(
//       (acc, genre) => (!genre?.paletteId ? acc + 1 : acc),
//       0
//     );

//     if (noOfNoPaletteGenres > 0) {
//       const start = timeStart();

//       for (let i = 0; i < genres.length; i += 1) {
//         const genreArtworkName = genres[i].artworkName;
//         if (!genres[i]?.paletteId) {
//           if (genreArtworkName) {
//             const artNameWithoutExt = genreArtworkName.split('.')[0];

//             for (const song of songs) {
//               if (song.songId === artNameWithoutExt) {
//                 genres[i].paletteId = song.paletteId;
//                 x += 1;
//                 break;
//               }
//             }
//           } else {
//             const coverBuffer = await generateCoverBuffer(
//               genreArtworkName?.replace('.webp', '-optimized.webp'),
//               true
//             );

//             const palette = await generatePalette(coverBuffer);

//             genres[i].paletteId = palette?.paletteId;
//             x += 1;
//           }

//           sendMessageToRenderer({
//             messageCode: 'SONG_PALETTE_GENERATING_PROCESS_UPDATE',
//             data: { total: noOfNoPaletteGenres, value: x }
//           });
//         }
//       }
//       timeEnd(start, 'Time to finish generating palettes for genres');

//       setGenresData(genres);
//       dataUpdateEvent('genres/backgroundColor');
//     } else sendMessageToRenderer({ messageCode: 'NO_MORE_SONG_PALETTES' });
//   }
// };

export const generatePalettes = async () => {
  generatePalettesForSongs()
    .then(() => {
      // setTimeout(generatePalettesForGenres, 1000);
      return undefined;
    })
    .catch((error) => logger.error('Failed to generating palettes.', { error }));
};

export default generatePalette;
