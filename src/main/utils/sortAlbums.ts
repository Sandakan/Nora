/* eslint-disable no-nested-ternary */
const sortAtoZ = <T extends (Album | SavableAlbum)[]>(arr: T) =>
  arr.sort((a, b) =>
    a.title.toLowerCase().replace(/\W/gi, '') >
    b.title.toLowerCase().replace(/\W/gi, '')
      ? 1
      : a.title.toLowerCase().replace(/\W/gi, '') <
        b.title.toLowerCase().replace(/\W/gi, '')
      ? -1
      : 0,
  );
const sortZtoA = <T extends (Album | SavableAlbum)[]>(arr: T) =>
  arr.sort((a, b) =>
    a.title.toLowerCase().replace(/\W/gi, '') <
    b.title.toLowerCase().replace(/\W/gi, '')
      ? 1
      : a.title.toLowerCase().replace(/\W/gi, '') >
        b.title.toLowerCase().replace(/\W/gi, '')
      ? -1
      : 0,
  );

export default <T extends (Album | SavableAlbum)[]>(
  data: T,
  sortType: AlbumSortTypes,
) => {
  if (data.length > 0) {
    if (sortType === 'aToZ') return sortAtoZ(data);
    if (sortType === 'zToA') return sortZtoA(data);
    if (sortType === 'noOfSongsDescending')
      return sortAtoZ(data).sort((a, b) =>
        a.songs.length < b.songs.length
          ? 1
          : a.songs.length > b.songs.length
          ? -1
          : 0,
      );
    if (sortType === 'noOfSongsAscending')
      return sortAtoZ(data).sort((a, b) =>
        a.songs.length > b.songs.length
          ? 1
          : a.songs.length < b.songs.length
          ? -1
          : 0,
      );
  }
  return data;
};
