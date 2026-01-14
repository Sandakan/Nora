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
  allSongInfo: (data: {
    songIds: number[];
    sortType: SongSortTypes;
    filterType?: SongFilterTypes;
  }) => {
    const { songIds, sortType, filterType } = data;
    return {
      queryKey: [
        // Do NOT mutate the incoming array; copy before sort for cache key stability
        `songIds=${[...songIds].sort().join(',')}`,
        `sortType=${sortType}`,
        `filterType=${filterType}`
      ],
      queryFn: () => window.api.audioLibraryControls.getSongInfo(songIds, sortType, filterType)
    };
  },
  singleSongInfo: (data: { songId: number }) => {
    return {
      queryKey: [data.songId],
      queryFn: () => window.api.audioLibraryControls.getSongInfo([data.songId])
    };
  },
  similarTracks: (data: { songId: number }) => {
    return {
      queryKey: [data.songId],
      queryFn: () => window.api.audioLibraryControls.getSimilarTracksForASong(data.songId)
    };
  },
  queue: (songIds: number[]) => {
    return {
      // Avoid mutating the provided queue array when building the cache key
      queryKey: [`songIds=${[...songIds].sort().join(',')}`],
      queryFn: () =>
        window.api.audioLibraryControls.getSongInfo(
          songIds,
          'addedOrder',
          undefined,
          undefined,
          true
        )
    };
  },
  favorites: (data: { sortType: SongSortTypes; start?: number; end?: number; limit?: number }) => {
    const { sortType = 'addedOrder', start = 0, end = 0, limit } = data;

    return {
      queryKey: [`sortType=${sortType}`, `start=${start}`, `end=${end}`, `limit=${limit}`],
      queryFn: () =>
        window.api.audioLibraryControls.getAllFavoriteSongs(sortType, {
          start,
          end
        })
    };
  },
  history: (data: { sortType: SongSortTypes; start?: number; end?: number; limit?: number }) => {
    const { sortType = 'addedOrder', start = 0, end = 0, limit } = data;

    return {
      queryKey: [`sortType=${sortType}`, `start=${start}`, `end=${end}`, `limit=${limit}`],
      queryFn: () => window.api.audioLibraryControls.getAllHistorySongs(sortType, { start, end })
    };
  }
});
