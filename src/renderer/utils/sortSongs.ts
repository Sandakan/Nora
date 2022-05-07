/* eslint-disable no-nested-ternary */
export default (data: AudioInfo[], sortType: SongsPageSortTypes) => {
  if (data && data.length > 0) {
    let sortedSongData: AudioInfo[];
    if (sortType === 'aToZ')
      sortedSongData = data.sort((a, b) =>
        a.title.replace(/\W/gi, '') > b.title.replace(/\W/gi, '')
          ? 1
          : a.title.replace(/\W/gi, '') < b.title.replace(/\W/gi, '')
          ? -1
          : 0
      );
    else if (sortType === 'zToA')
      sortedSongData = data.sort((a, b) =>
        a.title.replace(/\W/gi, '') < b.title.replace(/\W/gi, '')
          ? 1
          : a.title.replace(/\W/gi, '') > b.title.replace(/\W/gi, '')
          ? -1
          : 0
      );
    else if (sortType === 'artistNameAscending')
      sortedSongData = data.sort((a, b) =>
        a.artists.join(',') > b.artists.join(',')
          ? 1
          : a.artists.join(',') < b.artists.join(',')
          ? -1
          : 0
      );
    else if (sortType === 'artistNameDescending')
      sortedSongData = data.sort((a, b) =>
        a.artists.join(',') < b.artists.join(',')
          ? 1
          : a.artists.join(',') > b.artists.join(',')
          ? -1
          : 0
      );
    else if (sortType === 'dateAddedAscending')
      sortedSongData = data.sort((a, b) => {
        if (a.modifiedDate && b.modifiedDate) {
          return new Date(a.modifiedDate).getTime() <
            new Date(b.modifiedDate).getTime()
            ? 1
            : -1;
        }
        return 0;
      });
    else if (sortType === 'dateAddedDescending')
      sortedSongData = data.sort((a, b) => {
        if (a.modifiedDate && b.modifiedDate) {
          return new Date(a.modifiedDate).getTime() >
            new Date(b.modifiedDate).getTime()
            ? 1
            : -1;
        }
        return 0;
      });
    else sortedSongData = data;
    return sortedSongData;
  }
  return data;
};
