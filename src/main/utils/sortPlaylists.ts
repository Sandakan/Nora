/* eslint-disable no-nested-ternary */
export default <T extends (Playlist | SavablePlaylist)[]>(
  data: T,
  sortType: PlaylistSortTypes
) => {
  if (data.length > 0) {
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
        .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
        .sort((a, b) =>
          a.songs.length < b.songs.length
            ? 1
            : a.songs.length > b.songs.length
            ? -1
            : 0
        );
    if (sortType === 'noOfSongsAscending')
      return data
        .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
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
