import { getGenresData } from '../filesystem';
import { getGenreArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import sortGenres from '../utils/sortGenres';

const getGenresInfo = async (
  genreIds: string[] = [],
  sortType?: GenreSortTypes
): Promise<Genre[]> => {
  if (genreIds) {
    const genres = getGenresData();
    let results: SavableGenre[] = [];
    if (Array.isArray(genres) && genres.length > 0) {
      if (genreIds.length === 0) results = genres;
      else {
        for (let x = 0; x < genres.length; x += 1) {
          for (let y = 0; y < genreIds.length; y += 1) {
            if (genres[x].genreId === genreIds[y]) results.push(genres[x]);
          }
        }
      }
    }
    log(
      `Fetching genres data for genres with ids '${genreIds.join(',')}'.${
        genreIds.length > 0
          ? ` Found ${results.length} out of ${genreIds.length} results.`
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
