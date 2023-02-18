/* eslint-disable no-nested-ternary */
export default <T extends (Artist | SavableArtist)[]>(
  data: T,
  sortType: ArtistSortTypes
) => {
  if (Array.isArray(data) && data.length > 0) {
    if (sortType === 'aToZ')
      return data.sort((a, b) =>
        a.name > b.name ? 1 : a.name < b.name ? -1 : 0
      );
    if (sortType === 'zToA')
      return data.sort((a, b) =>
        a.name < b.name ? 1 : a.name > b.name ? -1 : 0
      );
    if (sortType === 'noOfSongsDescending')
      return data
        .sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0))
        .sort((a, b) =>
          a.songs.length < b.songs.length
            ? 1
            : a.songs.length > b.songs.length
            ? -1
            : 0
        );
    if (sortType === 'noOfSongsAscending')
      return data
        .sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0))
        .sort((a, b) =>
          a.songs.length > b.songs.length
            ? 1
            : a.songs.length < b.songs.length
            ? -1
            : 0
        );
    if (sortType === 'mostLovedAscending')
      return data
        .sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0))
        .sort((a, b) =>
          a.isAFavorite > b.isAFavorite
            ? 1
            : a.isAFavorite < b.isAFavorite
            ? -1
            : 0
        );
    if (sortType === 'mostLovedDescending')
      return data
        .sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0))
        .sort((a, b) =>
          a.isAFavorite < b.isAFavorite
            ? 1
            : a.isAFavorite > b.isAFavorite
            ? -1
            : 0
        );
  }
  return data;
};
