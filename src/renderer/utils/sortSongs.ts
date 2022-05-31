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
        a.artists &&
        b.artists &&
        a.artists.map((artist) => artist.name).join(',') >
          b.artists.map((artist) => artist.name).join(',')
          ? 1
          : a.artists &&
            b.artists &&
            a.artists.map((artist) => artist.name).join(',') <
              b.artists.map((artist) => artist.name).join(',')
          ? -1
          : 0
      );
    else if (sortType === 'artistNameDescending')
      sortedSongData = data.sort((a, b) =>
        a.artists &&
        b.artists &&
        a.artists.map((artist) => artist.name).join(',') <
          b.artists.map((artist) => artist.name).join(',')
          ? 1
          : a.artists &&
            b.artists &&
            a.artists.map((artist) => artist.name).join(',') >
              b.artists.map((artist) => artist.name).join(',')
          ? -1
          : 0
      );
    // else if (sortType === 'albumNameAscending')
    //   sortedSongData = data.sort((a, b) =>
    //     a.album &&
    //     b.album &&
    //     a.album.map((artist) => artist.name).join(',') >
    //       b.album.map((artist) => artist.name).join(',')
    //       ? 1
    //       : a.album &&
    //         b.album &&
    //         a.album.map((artist) => artist.name).join(',') <
    //           b.album.map((artist) => artist.name).join(',')
    //       ? -1
    //       : 0
    //   );
    // else if (sortType === 'albumNameDescending')
    //   sortedSongData = data.sort((a, b) =>
    //     a.album &&
    //     b.album &&
    //     a.album.map((artist) => artist.name).join(',') <
    //       b.album.map((artist) => artist.name).join(',')
    //       ? 1
    //       : a.album &&
    //         b.album &&
    //         a.album.map((artist) => artist.name).join(',') >
    //           b.album.map((artist) => artist.name).join(',')
    //       ? -1
    //       : 0
    //   );
    else if (sortType === 'dateAddedAscending')
      sortedSongData = data
        .sort((a, b) =>
          a.title.replace(/\W/gi, '') > b.title.replace(/\W/gi, '')
            ? 1
            : a.title.replace(/\W/gi, '') < b.title.replace(/\W/gi, '')
            ? -1
            : 0
        )
        .sort((a, b) => {
          if (a.addedDate && b.addedDate) {
            return new Date(a.addedDate).getTime() <
              new Date(b.addedDate).getTime()
              ? 1
              : -1;
          }
          return 0;
        });
    else if (sortType === 'dateAddedDescending')
      sortedSongData = data
        .sort((a, b) =>
          a.title.replace(/\W/gi, '') > b.title.replace(/\W/gi, '')
            ? 1
            : a.title.replace(/\W/gi, '') < b.title.replace(/\W/gi, '')
            ? -1
            : 0
        )
        .sort((a, b) => {
          if (a.addedDate && b.addedDate) {
            return new Date(a.addedDate).getTime() >
              new Date(b.addedDate).getTime()
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
