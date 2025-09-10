import { createQueryKeys } from '@lukemorales/query-key-factory';

export const albumQuery = createQueryKeys('albums', {
  all: (data: {
    albumIds: string[];
    sortType?: AlbumSortTypes;
    start?: number;
    end?: number;
    limit?: number;
  }) => {
    const { albumIds = [], sortType = 'aToZ', start = 0, end = 0 } = data;

    return {
      queryKey: [`sortType=${sortType}`, `start=${start}`, `end=${end}`, `limit=${end - start}`],
      queryFn: () =>
        window.api.albumsData.getAlbumData(albumIds, sortType as AlbumSortTypes, start, end)
    };
  }
});
