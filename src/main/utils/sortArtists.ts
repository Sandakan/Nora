/* eslint-disable no-nested-ternary */
const sortAtoZ = <T extends (Artist | SavableArtist)[]>(arr: T) =>
  arr.sort((a, b) =>
    a.name.toLowerCase().replace(/\W/gi, '') >
    b.name.toLowerCase().replace(/\W/gi, '')
      ? 1
      : a.name.toLowerCase().replace(/\W/gi, '') <
        b.name.toLowerCase().replace(/\W/gi, '')
      ? -1
      : 0,
  );
const sortZtoA = <T extends (Artist | SavableArtist)[]>(arr: T) =>
  arr.sort((a, b) =>
    a.name.toLowerCase().replace(/\W/gi, '') <
    b.name.toLowerCase().replace(/\W/gi, '')
      ? 1
      : a.name.toLowerCase().replace(/\W/gi, '') >
        b.name.toLowerCase().replace(/\W/gi, '')
      ? -1
      : 0,
  );

export default <T extends (Artist | SavableArtist)[]>(
  data: T,
  sortType: ArtistSortTypes,
) => {
  if (Array.isArray(data) && data.length > 0) {
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
    if (sortType === 'mostLovedAscending')
      return sortAtoZ(data).sort((a, b) =>
        a.isAFavorite > b.isAFavorite
          ? 1
          : a.isAFavorite < b.isAFavorite
          ? -1
          : 0,
      );
    if (sortType === 'mostLovedDescending')
      return sortAtoZ(data).sort((a, b) =>
        a.isAFavorite < b.isAFavorite
          ? 1
          : a.isAFavorite > b.isAFavorite
          ? -1
          : 0,
      );
  }
  return data;
};
