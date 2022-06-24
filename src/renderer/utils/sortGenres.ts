/* eslint-disable no-nested-ternary */
export default (data: Genre[], sortType: GenreSortTypes) => {
  if (data.length > 0) {
    let sortedGenres: Genre[] = [];
    switch (sortType) {
      case 'aToZ':
        sortedGenres = data.sort((a, b) =>
          a.name > b.name ? 1 : a.name < b.name ? -1 : 0
        );
        break;
      case 'zToA':
        sortedGenres = data.sort((a, b) =>
          a.name < b.name ? 1 : a.name > b.name ? -1 : 0
        );
        break;
      case 'noOfSongsDescending':
        sortedGenres = data
          .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
          .sort((a, b) =>
            a.songs.length < b.songs.length
              ? 1
              : a.songs.length > b.songs.length
              ? -1
              : 0
          );
        break;
      case 'noOfSongsAscending':
        sortedGenres = data
          .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
          .sort((a, b) =>
            a.songs.length > b.songs.length
              ? 1
              : a.songs.length < b.songs.length
              ? -1
              : 0
          );
        break;
      default:
        return data;
        break;
    }
    return sortedGenres;
  }
  return data;
};
