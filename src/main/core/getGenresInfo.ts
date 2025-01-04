import { getGenresData } from '../filesystem';
import { getGenreArtworkPath } from '../fs/resolveFilePaths';
import logger from '../logger';
import { getSelectedPaletteData } from '../other/generatePalette';
import sortGenres from '../utils/sortGenres';

const getGenresInfo = async (
  genreNamesOrIds: string[] = [],
  sortType?: GenreSortTypes
): Promise<Genre[]> => {
  if (genreNamesOrIds) {
    const genres = getGenresData();
    let results: SavableGenre[] = [];
    if (Array.isArray(genres) && genres.length > 0) {
      if (genreNamesOrIds.length === 0) results = genres;
      else {
        for (let x = 0; x < genres.length; x += 1) {
          for (let y = 0; y < genreNamesOrIds.length; y += 1) {
            if (genres[x].genreId === genreNamesOrIds[y] || genres[x].name === genreNamesOrIds[y])
              results.push(genres[x]);
          }
        }
      }
    }
    logger.debug(`Fetching genres data`, {
      genreNamesOrIdsCount: genreNamesOrIds.length,
      sortType,
      resultsCount: results.length
    });
    results = results.map((x): Genre => {
      return {
        ...x,
        artworkPaths: getGenreArtworkPath(x.artworkName),
        paletteData: getSelectedPaletteData(x.paletteId)
      };
    });
    if (sortType) sortGenres(results, sortType);
    return results as Genre[];
  }
  return [];
};

export default getGenresInfo;
