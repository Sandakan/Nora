/* eslint-disable no-await-in-loop */
import nodeVibrant from 'node-vibrant';
import * as musicMetaData from 'music-metadata';
import { timeEnd, timeStart } from '../utils/measureTimeUsage';
import log from '../log';
import {
  getGenresData,
  getSongsData,
  setGenresData,
  setSongsData,
} from '../filesystem';
import {
  generateCoverBuffer,
  getDefaultSongCoverImgBuffer,
} from '../parseSong/generateCoverBuffer';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';

let defaultPalette: NodeVibrantPalette;

const getDefaultPalette = async () => {
  if (defaultPalette) return defaultPalette;

  const buffer = await getDefaultSongCoverImgBuffer();
  // eslint-disable-next-line no-use-before-define
  const palette = await generatePalette(buffer);

  if (palette) defaultPalette = palette;

  return palette;
};

const generatePalette = async (
  artwork?: Buffer | string,
  sendAdditionalData = true,
): Promise<NodeVibrantPalette | undefined> => {
  if (artwork) {
    const start = timeStart();
    const palette = await nodeVibrant
      .from(artwork)
      .getPalette()
      .catch((err) => {
        return log(
          `ERROR OCCURRED WHEN PARSING A SONG ARTWORK TO GET A COLOR PALETTE.`,
          { err },
          'ERROR',
        );
      });

    timeEnd(start, 'Time to generate the nodeVibrant palette');

    if (palette) {
      const generatePaletteSwatch = <T extends typeof palette.DarkMuted>(
        nodeVibrantSwatch: T,
      ): NodeVibrantPaletteSwatch | undefined => {
        if (nodeVibrantSwatch) {
          const data = {
            rgb: nodeVibrantSwatch.rgb,
          };

          if (sendAdditionalData) {
            const additionalData = {
              population: nodeVibrantSwatch.population,
              hex: nodeVibrantSwatch.hex,
              hsl: nodeVibrantSwatch.hsl,
              bodyTextColor:
                nodeVibrantSwatch.bodyTextColor ||
                nodeVibrantSwatch.getBodyTextColor(),
              titleTextColor:
                nodeVibrantSwatch.titleTextColor ||
                nodeVibrantSwatch.getTitleTextColor(),
            };

            Object.assign(data, additionalData);
          }

          return data;
        }
        return undefined;
      };

      const outputPalette: NodeVibrantPalette = {
        Vibrant: generatePaletteSwatch(palette.Vibrant),
        LightVibrant: generatePaletteSwatch(palette.LightVibrant),
        DarkVibrant: generatePaletteSwatch(palette.DarkVibrant),
        Muted: generatePaletteSwatch(palette.Muted),
        LightMuted: generatePaletteSwatch(palette.LightMuted),
        DarkMuted: generatePaletteSwatch(palette.DarkMuted),
      };

      timeEnd(start, 'Time to finish generating the palette');
      return outputPalette;
    }
    log('GENERATED ARTWORK PALETTE EMPTY.', undefined, 'ERROR');
    return undefined;
  }
  log('EMPTY INPUT TO GENERATE A PALETTE.', undefined, 'WARN');
  return getDefaultPalette();
};

const generatePalettesForSongs = async () => {
  const songs = getSongsData();

  if (Array.isArray(songs) && songs.length > 0) {
    let x = 0;
    const noOfNoPaletteSongs = songs.reduce(
      (acc, song) => (!song.palette ? acc + 1 : acc),
      0,
    );

    if (noOfNoPaletteSongs > 0) {
      for (let i = 0; i < songs.length; i += 1) {
        if (!songs[i].palette) {
          const metadata = await musicMetaData.parseFile(songs[i].path);

          const coverBuffer = await generateCoverBuffer(
            metadata?.common?.picture,
            true,
          );

          const palette = await generatePalette(coverBuffer);

          const swatch =
            palette && palette.DarkVibrant && palette.LightVibrant
              ? {
                  DarkVibrant: palette.DarkVibrant,
                  LightVibrant: palette.LightVibrant,
                }
              : undefined;

          songs[i].palette = swatch;
          x += 1;

          sendMessageToRenderer(
            `Generating palettes for ${x} out of ${noOfNoPaletteSongs} songs.`,
            'SONG_PALETTE_GENERAING_PROCESS_UPDATE',
            { max: noOfNoPaletteSongs, value: x },
          );
        }
      }

      setSongsData(songs);
      dataUpdateEvent('songs/palette');
    } else sendMessageToRenderer(`No more palettes for songs to be generated.`);
  }
};

const generatePalettesForGenres = async () => {
  const genres = getGenresData();
  const songs = getSongsData();

  if (
    Array.isArray(songs) &&
    Array.isArray(genres) &&
    songs.length > 0 &&
    genres.length > 0
  ) {
    let x = 0;
    const noOfNoPaletteGenres = genres.reduce(
      (acc, genre) => (!genre?.backgroundColor ? acc + 1 : acc),
      0,
    );

    if (noOfNoPaletteGenres > 0) {
      for (let i = 0; i < genres.length; i += 1) {
        const genreArtworkName = genres[i].artworkName;
        if (!genres[i]?.backgroundColor) {
          if (genreArtworkName) {
            const artNameWithoutExt = genreArtworkName.split('.')[0];

            for (const song of songs) {
              if (song.songId === artNameWithoutExt) {
                genres[i].backgroundColor = song?.palette?.DarkVibrant?.rgb
                  ? { rgb: song?.palette?.DarkVibrant.rgb }
                  : undefined;
                x += 1;
                break;
              }
            }
          } else {
            const coverBuffer = await generateCoverBuffer(
              genreArtworkName,
              true,
            );

            const palette = await generatePalette(coverBuffer);

            genres[i].backgroundColor = palette?.DarkVibrant;
            x += 1;
          }

          sendMessageToRenderer(
            `Generating palettes for ${x} out of ${noOfNoPaletteGenres} genres.`,
            'GENRE_PALETTE_GENERAING_PROCESS_UPDATE',
            { max: noOfNoPaletteGenres, value: x },
          );
        }
      }

      setGenresData(genres);
      dataUpdateEvent('genres/backgroundColor');
    } else
      sendMessageToRenderer(`No more palettes for genres to be generated.`);
  }
};

export const generatePalettes = async () => {
  return generatePalettesForSongs()
    .then(() => {
      setTimeout(generatePalettesForGenres, 1000);
      return undefined;
    })
    .catch((error) =>
      log('Error occurred when generating palettes.', { error }, 'ERROR'),
    );
};

export default generatePalette;
