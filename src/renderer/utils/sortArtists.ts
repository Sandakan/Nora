/* eslint-disable no-nested-ternary */
export default (data: Artist[], sortType: ArtistSortTypes) => {
  if (Array.isArray(data) && data.length > 0) {
    let sortedArtists: Artist[];
    if (sortType === 'aToZ')
      sortedArtists = data.sort((a, b) =>
        a.name > b.name ? 1 : a.name < b.name ? -1 : 0
      );
    else if (sortType === 'noOfSongs')
      sortedArtists = data.sort((a, b) =>
        a.songs.length > b.songs.length
          ? 1
          : a.songs.length < b.songs.length
          ? -1
          : 0
      );
    else sortedArtists = data;
    return sortedArtists;
  }
  return data;
};
