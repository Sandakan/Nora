/* eslint-disable no-nested-ternary */
const currentMonth = new Date().getMonth();

export default (data: SongData[], sortType: SongSortTypes) => {
  if (data && data.length > 0) {
    let sortedSongData: SongData[];
    if (sortType === 'aToZ')
      sortedSongData = data.sort((a, b) => {
        if (a.title.replace(/\W/gi, '') > b.title.replace(/\W/gi, '')) return 1;
        if (a.title.replace(/\W/gi, '') < b.title.replace(/\W/gi, ''))
          return -1;
        return 0;
      });
    else if (sortType === 'zToA')
      sortedSongData = data.sort((a, b) => {
        if (a.title.replace(/\W/gi, '') < b.title.replace(/\W/gi, '')) return 1;
        if (a.title.replace(/\W/gi, '') > b.title.replace(/\W/gi, ''))
          return -1;
        return 0;
      });
    else if (sortType === 'artistNameAscending')
      sortedSongData = data.sort((a, b) => {
        if (a.artists && b.artists) {
          if (
            a.artists.map((artist) => artist.name).join(',') >
            b.artists.map((artist) => artist.name).join(',')
          )
            return 1;
          if (
            a.artists.map((artist) => artist.name).join(',') <
            b.artists.map((artist) => artist.name).join(',')
          )
            return -1;
        }
        return 0;
      });
    else if (sortType === 'artistNameDescending')
      sortedSongData = data.sort((a, b) => {
        if (a.artists && b.artists) {
          if (
            a.artists.map((artist) => artist.name).join(',') <
            b.artists.map((artist) => artist.name).join(',')
          )
            return 1;
          if (
            a.artists.map((artist) => artist.name).join(',') >
            b.artists.map((artist) => artist.name).join(',')
          )
            return -1;
        }
        return 0;
      });
    else if (sortType === 'albumNameAscending')
      sortedSongData = data.sort((a, b) => {
        if (a.album && b.album) {
          if (a.album.name > b.album.name) return 1;
          if (a.album.name < b.album.name) return -1;
        }
        return 0;
      });
    else if (sortType === 'albumNameDescending')
      sortedSongData = data.sort((a, b) => {
        if (a.album && b.album) {
          if (a.album.name < b.album.name) return 1;
          if (a.album.name > b.album.name) return -1;
        }
        return 0;
      });
    else if (sortType === 'allTimeMostListened')
      sortedSongData = data.sort((a, b) => {
        if (a.listeningRate && b.listeningRate) {
          if (a.listeningRate.allTime < b.listeningRate.allTime) return 1;
          if (a.listeningRate.allTime > b.listeningRate.allTime) return -1;
        }
        return 0;
      });
    else if (sortType === 'allTimeLeastListened')
      sortedSongData = data.sort((a, b) => {
        if (a.listeningRate && b.listeningRate) {
          if (a.listeningRate.allTime > b.listeningRate.allTime) return 1;
          if (a.listeningRate.allTime < b.listeningRate.allTime) return -1;
        }
        return 0;
      });
    else if (sortType === 'monthlyMostListened')
      sortedSongData = data.sort((a, b) => {
        if (a.listeningRate && b.listeningRate) {
          if (
            a.listeningRate.monthly.months[currentMonth] <
            b.listeningRate.monthly.months[currentMonth]
          )
            return 1;

          if (
            a.listeningRate.monthly.months[currentMonth] >
            b.listeningRate.monthly.months[currentMonth]
          )
            return -1;
        }
        return 0;
      });
    else if (sortType === 'monthlyLeastListened')
      sortedSongData = data.sort((a, b) => {
        if (a.listeningRate && b.listeningRate) {
          if (
            a.listeningRate.monthly.months[currentMonth] >
            b.listeningRate.monthly.months[currentMonth]
          )
            return 1;

          if (
            a.listeningRate.monthly.months[currentMonth] <
            b.listeningRate.monthly.months[currentMonth]
          )
            return -1;
        }
        return 0;
      });
    else if (sortType === 'dateAddedAscending')
      sortedSongData = data
        .sort((a, b) => {
          if (a.title.replace(/\W/gi, '') > b.title.replace(/\W/gi, ''))
            return 1;
          if (a.title.replace(/\W/gi, '') < b.title.replace(/\W/gi, ''))
            return -1;
          return 0;
        })
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
        .sort((a, b) => {
          if (a.title.replace(/\W/gi, '') > b.title.replace(/\W/gi, ''))
            return 1;
          if (a.title.replace(/\W/gi, '') < b.title.replace(/\W/gi, ''))
            return -1;
          return 0;
        })
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
