/* eslint-disable no-nested-ternary */
export default (data: Album[], sortType: AlbumSortTypes) => {
  if (data.length > 0) {
    let sortedAlbums: Album[];
    if (sortType === 'aToZ')
      sortedAlbums = data.sort((a, b) =>
        a.title > b.title ? 1 : a.title < b.title ? -1 : 0
      );
    else if (sortType === 'noOfSongs')
      sortedAlbums = data.sort((a, b) =>
        a.songs.length < b.songs.length
          ? 1
          : a.songs.length > b.songs.length
          ? -1
          : 0
      );
    else sortedAlbums = data;
    return sortedAlbums;
  }
  return data;
};
