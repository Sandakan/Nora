import { createQueryKeys } from '@lukemorales/query-key-factory';

export const playlistQuery = createQueryKeys('playlists', {
  all: (data: {
    sortType: PlaylistSortTypes;
    start?: number;
    end?: number;
    limit?: number;
    onlyMutablePlaylists?: boolean;
  }) => {
    const { sortType = 'aToZ', start = 0, end = 0, onlyMutablePlaylists = false } = data;

    return {
      queryKey: [
        `sortType=${sortType}`,
        `start=${start}`,
        `end=${end}`,
        `limit=${end - start}`,
        `onlyMutablePlaylists=${onlyMutablePlaylists}`
      ],
      queryFn: () =>
        window.api.playlistsData.getPlaylistData(
          [],
          sortType as PlaylistSortTypes,
          start,
          end,
          onlyMutablePlaylists
        )
    };
  },
  single: (data: { playlistId: number }) => {
    return {
      queryKey: [data.playlistId],
      queryFn: () => window.api.playlistsData.getPlaylistData([data.playlistId])
    };
  },
  songArtworks: (data: { songIds: (string | number)[] }) => {
    const stringIds = data.songIds.map(String);
    return {
      queryKey: ['songArtworks', `songIds=${stringIds.join(',')}`],
      queryFn: () => window.api.playlistsData.getArtworksForMultipleArtworksCover(stringIds.map(Number))
    };
  }
});
