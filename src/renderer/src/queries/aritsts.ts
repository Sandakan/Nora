import { createQueryKeys } from '@lukemorales/query-key-factory';

export const artistQuery = createQueryKeys('artists', {
  all: (data: {
    sortType: ArtistSortTypes;
    filterType?: ArtistFilterTypes;
    start?: number;
    end?: number;
    limit?: number;
  }) => {
    const { sortType = 'aToZ', filterType = 'notSelected', start = 0, end = 0 } = data;

    return {
      queryKey: [
        `sortType=${sortType}`,
        `filterType=${filterType}`,
        `start=${start}`,
        `end=${end}`,
        `limit=${end - start}`
      ],
      queryFn: () =>
        window.api.artistsData.getArtistData(
          [],
          sortType as ArtistSortTypes,
          filterType as ArtistFilterTypes,
          start,
          end
        )
    };
  },
  single: (data: { artistId: number }) => {

    return {
      queryKey: [data.artistId],
      queryFn: () => window.api.artistsData.getArtistData([data.artistId])
    };
  },
  fetchOnlineInfo: (data: { artistId: number }) => {
    return {
      queryKey: [data.artistId],
      queryFn: () => window.api.artistsData.getArtistArtworks(data.artistId)
    };
  }
});

export const artistMutations = {
  toggleLike: (data: { artistIds: number[]; isLikeArtist?: boolean }) => ({
    invalidatingQueryKeys: [['artists']],
    mutationFn: () => window.api.artistsData.toggleLikeArtists(data.artistIds, data.isLikeArtist)
  })
};
