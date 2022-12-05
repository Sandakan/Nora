/* eslint-disable no-nested-ternary */
export default <T extends (Album | SavableAlbum)[]>(
  data: T,
  sortType: AlbumSortTypes
) => {
  if (data.length > 0) {
    if (sortType === 'aToZ')
      return data.sort((a, b) =>
        a.title > b.title ? 1 : a.title < b.title ? -1 : 0
      );
    if (sortType === 'zToA')
      return data.sort((a, b) =>
        a.title < b.title ? 1 : a.title > b.title ? -1 : 0
      );
    if (sortType === 'noOfSongsDescending')
      return data
        .sort((a, b) => (a.title > b.title ? 1 : a.title < b.title ? -1 : 0))
        .sort((a, b) =>
          a.songs.length < b.songs.length
            ? 1
            : a.songs.length > b.songs.length
            ? -1
            : 0
        );
    if (sortType === 'noOfSongsAscending')
      return data
        .sort((a, b) => (a.title > b.title ? 1 : a.title < b.title ? -1 : 0))
        .sort((a, b) =>
          a.songs.length > b.songs.length
            ? 1
            : a.songs.length < b.songs.length
            ? -1
            : 0
        );
  }
  return data;
};
