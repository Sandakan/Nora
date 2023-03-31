import { getGenresData } from '../filesystem';
import { getGenreArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
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
            if (
              genres[x].genreId === genreNamesOrIds[y] ||
              genres[x].name === genreNamesOrIds[y]
            )
              results.push(genres[x]);
          }
        }
      }
    }
    log(
      `Fetching genres data for genres with ids '${genreNamesOrIds.join(
        ','
      )}'.${
        genreNamesOrIds.length > 0
          ? ` Found ${results.length} out of ${genreNamesOrIds.length} results.`
          : ` Found ${results.length} results.`
      }`
    );
    results = results.map((x) => ({
      ...x,
      artworkPaths: getGenreArtworkPath(x.artworkName),
    })) as Genre[];
    if (sortType) sortGenres(results, sortType);
    return results as Genre[];
  }
  return [];
};

export default getGenresInfo;
