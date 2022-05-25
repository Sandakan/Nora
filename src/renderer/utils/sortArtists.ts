/* eslint-disable no-nested-ternary */
export default (data: Artist[], sortType: ArtistSortTypes) => {
  if (Array.isArray(data) && data.length > 0) {
    let sortedArtists: Artist[];
    if (sortType === 'aToZ')
      sortedArtists = data.sort((a, b) =>
        a.name > b.name ? 1 : a.name < b.name ? -1 : 0
      );
    else if (sortType === 'ZToA')
      sortedArtists = data.sort((a, b) =>
        a.name < b.name ? 1 : a.name > b.name ? -1 : 0
      );
    else if (sortType === 'noOfSongsDescending')
      sortedArtists = data
        .sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0))
        .sort((a, b) =>
          a.songs.length < b.songs.length
            ? 1
            : a.songs.length > b.songs.length
            ? -1
            : 0
        );
    else if (sortType === 'noOfSongsAscending')
      sortedArtists = data
        .sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0))
        .sort((a, b) =>
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
