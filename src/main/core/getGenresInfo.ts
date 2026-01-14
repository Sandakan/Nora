import { getAllGenres } from '@main/db/queries/genres';
import { convertToGenre } from '../utils/convert';

const getGenresInfo = async (
  genreNamesOrIds: string[] = [],
  sortType?: GenreSortTypes,
  start = 0,
  end = 0
): Promise<PaginatedResult<Genre, GenreSortTypes>> => {
  const genres = await getAllGenres({
    genreIds: genreNamesOrIds.map((id) => Number(id)).filter((id) => !isNaN(id)),
    start,
    end,
    sortType
  });

  const output = genres.data.map((x) => convertToGenre(x));

  return {
    data: output,
    total: genres.data.length,
    sortType,
    start: genres.start,
    end: genres.end
  } satisfies PaginatedResult<Genre, GenreSortTypes>;
};

export default getGenresInfo;
