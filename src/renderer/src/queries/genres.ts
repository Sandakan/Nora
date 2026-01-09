import { createQueryKeys } from '@lukemorales/query-key-factory';

export const genreQuery = createQueryKeys('genres', {
  all: (data: { sortType: GenreSortTypes; start?: number; end?: number; limit?: number }) => {
    const { sortType = 'aToZ', start = 0, end = 0 } = data;

    return {
      queryKey: [`sortType=${sortType}`, `start=${start}`, `end=${end}`, `limit=${end - start}`],
      queryFn: () => window.api.genresData.getGenresData([], sortType as GenreSortTypes, start, end)
    };
  },
  single: (data: { genreId: number }) => {
    return {
      queryKey: [data.genreId],
      queryFn: () => window.api.genresData.getGenresData([data.genreId])
    };
  }
});
