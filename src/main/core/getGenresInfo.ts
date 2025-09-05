import { getAllGenres } from '@main/db/queries/genres';
import { convertToGenre } from '../../common/convert';

const getGenresInfo = async (
  genreNamesOrIds: string[] = [],
  sortType?: GenreSortTypes
): Promise<PaginatedResult<Genre, GenreSortTypes>> => {
  const result: PaginatedResult<Genre, GenreSortTypes> = {
    data: [],
    total: 0,
    sortType,
    start: 0,
    end: 0
  };

  if (genreNamesOrIds) {
    const genres = await getAllGenres({});

    const output = genres.data.map((x) => convertToGenre(x));

    result.data = output;
    result.total = genres.data.length;
    result.start = genres.start;
    result.end = genres.end;
  }
  return result;
};

export default getGenresInfo;
