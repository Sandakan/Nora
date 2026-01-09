// import { getListeningData } from '../filesystem';
import logger from '../logger';
import { getAllSongs as getAllSavedSongs } from '@main/db/queries/songs';
import { convertToSongData } from '../utils/convert';

type SongArtwork = Awaited<
  ReturnType<typeof getAllSavedSongs>
>['data'][number]['artworks'][number]['artwork'];
export const parsePaletteFromArtworks = (artworks: SongArtwork[]): PaletteData | undefined => {
  const artworkWithPalette = artworks.find((artwork) => !!artwork.palette);

  if (artworkWithPalette) {
    const palette: PaletteData = { paletteId: String(artworkWithPalette.palette?.id) };

    if (artworkWithPalette.palette && artworkWithPalette.palette.swatches.length > 0) {
      for (const swatch of artworkWithPalette.palette.swatches) {
        switch (swatch.swatchType) {
          case 'DARK_VIBRANT':
            palette.DarkVibrant = {
              hex: swatch.hex,
              population: swatch.population,
              hsl: [swatch.hsl.h, swatch.hsl.s, swatch.hsl.l]
            };
            break;
          case 'LIGHT_VIBRANT':
            palette.LightVibrant = {
              hex: swatch.hex,
              population: swatch.population,
              hsl: [swatch.hsl.h, swatch.hsl.s, swatch.hsl.l]
            };
            break;
          case 'DARK_MUTED':
            palette.DarkMuted = {
              hex: swatch.hex,
              population: swatch.population,
              hsl: [swatch.hsl.h, swatch.hsl.s, swatch.hsl.l]
            };
            break;
          case 'LIGHT_MUTED':
            palette.LightMuted = {
              hex: swatch.hex,
              population: swatch.population,
              hsl: [swatch.hsl.h, swatch.hsl.s, swatch.hsl.l]
            };
            break;
          case 'MUTED':
            palette.Muted = {
              hex: swatch.hex,
              population: swatch.population,
              hsl: [swatch.hsl.h, swatch.hsl.s, swatch.hsl.l]
            };
            break;
          case 'VIBRANT':
            palette.Vibrant = {
              hex: swatch.hex,
              population: swatch.population,
              hsl: [swatch.hsl.h, swatch.hsl.s, swatch.hsl.l]
            };
            break;
        }
      }
    }

    return palette;
  }

  return undefined;
};

const getAllSongs = async (
  sortType = 'aToZ' as SongSortTypes,
  filterType?: SongFilterTypes,
  paginatingData?: PaginatingData
) => {
  const songsData = await getAllSavedSongs({
    start: paginatingData?.start ?? 0,
    end: paginatingData?.end ?? 0,
    filterType,
    sortType
  });
  // const listeningData = getListeningData();

  const result: PaginatedResult<AudioInfo, SongSortTypes> = {
    data: [],
    total: 0,
    sortType,
    start: 0,
    end: 0
  };

  if (songsData && songsData.data.length > 0) {
    // const audioData = sortSongs(
    //   filterSongs(songsData, filterType),
    //   sortType,
    //   undefined
    //   // listeningData
    // );

    result.data = songsData.data.map((song) => convertToSongData(song));

    // result = paginateData(parsedData, sortType, paginatingData);
    result.total = songsData.data.length;
    result.start = songsData.start;
    result.end = songsData.end;
  }

  logger.debug(`Sending data related to all the songs`, {
    sortType,
    filterType,
    start: songsData.start,
    end: songsData.end
  });
  return result;
};

export default getAllSongs;
