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
      data
        .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
        .sort((a, b) =>
          a.songs.length < b.songs.length
            ? 1
            : a.songs.length > b.songs.length
            ? -1
            : 0
        );
    if (sortType === 'noOfSongsAscending')
      data
        .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
        .sort((a, b) =>
          a.songs.length > b.songs.length
            ? 1
            : a.songs.length < b.songs.length
            ? -1
            : 0
        );
    if (sortType === 'mostLovedAscending')
      data
        .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
        .sort((a, b) =>
          a.isAFavorite > b.isAFavorite
            ? 1
            : a.isAFavorite < b.isAFavorite
            ? -1
            : 0
        );
    if (sortType === 'mostLovedDescending')
      data
        .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
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
