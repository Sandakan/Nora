import { createQueryKeys } from '@lukemorales/query-key-factory';

export const songQuery = createQueryKeys('songs', {
  all: (data: {
    sortType: SongSortTypes;
    filterType?: SongFilterTypes;
    start?: number;
    end?: number;
    limit?: number;
  }) => {
    const { sortType = 'addedOrder', filterType = 'notSelected', start = 0, end = 0 } = data;

    return {
      queryKey: [
        `sortType=${sortType}`,
        `filterType=${filterType}`,
        `start=${start}`,
        `end=${end}`,
        `limit=${end - start}`
      ],
      queryFn: () =>
        window.api.audioLibraryControls.getAllSongs(sortType, filterType, {
          start,
          end: end
        })
    };
  },
  allSongInfo: (data: { songIds: string[] }) => {
    const { songIds } = data;
    return {
      queryKey: [`songIds=${songIds.sort().join(',')}`],
      queryFn: () => window.api.audioLibraryControls.getSongInfo(songIds)
    };
  }
});
