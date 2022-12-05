const date = new Date();
const currentYear = date.getFullYear();
const currentMonth = date.getMonth();

const getListeningDataOfASong = (
  songId: string,
  listeningData: SongListeningData[]
) => {
  if (listeningData.length > 0) {
    for (let i = 0; i < listeningData.length; i += 1) {
      if (listeningData[i].songId === songId) {
        return listeningData[i];
      }
    }
  }
  return undefined;
};

const parseListeningData = (listeningData?: SongListeningData) => {
  let allTime = 0;
  let thisYearNoofListens = 0;
  let thisMonthNoOfListens = 0;
  if (listeningData) {
    const { listens } = listeningData;

    allTime =
      listens
        .map((x) => x.months)
        .flat(2)
        .reduce((prevValue, currValue) => prevValue + (currValue || 0)) || 0;

    for (let i = 0; i < listens.length; i += 1) {
      if (listens[i].year === currentYear) {
        thisYearNoofListens =
          listens[i].months
            .flat(2)
            .reduce((prevValue, currValue) => prevValue + (currValue || 0)) ||
          0;

        thisMonthNoOfListens = listens[i].months[currentMonth].reduce(
          (prevValue, currValue) => prevValue + (currValue || 0)
        );
      }
    }
  }
  return {
    allTimeListens: allTime,
    thisYearListens: thisYearNoofListens,
    thisMonthListens: thisMonthNoOfListens,
  };
};

function sortSongs<T extends (SongData | SavableSongData)[]>(
  data: T,
  sortType: SongSortTypes,
  listeningData?: SongListeningData[]
) {
  if (data && data.length > 0) {
    if (sortType === 'aToZ')
      return data.sort((a, b) => {
        if (a.title.replace(/\W/gi, '') > b.title.replace(/\W/gi, '')) return 1;
        if (a.title.replace(/\W/gi, '') < b.title.replace(/\W/gi, ''))
          return -1;
        return 0;
      });
    if (sortType === 'zToA')
      return data.sort((a, b) => {
        if (a.title.replace(/\W/gi, '') < b.title.replace(/\W/gi, '')) return 1;
        if (a.title.replace(/\W/gi, '') > b.title.replace(/\W/gi, ''))
          return -1;
        return 0;
      });
    if (sortType === 'artistNameAscending')
      return data.sort((a, b) => {
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
    if (sortType === 'artistNameDescending')
      return data.sort((a, b) => {
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
    if (sortType === 'albumNameAscending')
      return data.sort((a, b) => {
        if (a.album && b.album) {
          if (a.album.name > b.album.name) return 1;
          if (a.album.name < b.album.name) return -1;
        }
        return 0;
      });
    if (sortType === 'albumNameDescending')
      return data.sort((a, b) => {
        if (a.album && b.album) {
          if (a.album.name < b.album.name) return 1;
          if (a.album.name > b.album.name) return -1;
        }
        return 0;
      });
    if (listeningData) {
      if (sortType === 'allTimeMostListened')
        return data.sort((a, b) => {
          const listeningDataOfA = getListeningDataOfASong(
            a.songId,
            listeningData
          );
          const listeningDataOfB = getListeningDataOfASong(
            b.songId,
            listeningData
          );
          const parsedListeningDataOfA = parseListeningData(listeningDataOfA);
          const parsedListeningDataOfB = parseListeningData(listeningDataOfB);
          if (
            parsedListeningDataOfA.allTimeListens <
            parsedListeningDataOfB.allTimeListens
          )
            return 1;
          if (
            parsedListeningDataOfA.allTimeListens >
            parsedListeningDataOfB.allTimeListens
          )
            return -1;
          return 0;
        });
      if (sortType === 'allTimeLeastListened')
        return data.sort((a, b) => {
          const listeningDataOfA = getListeningDataOfASong(
            a.songId,
            listeningData
          );
          const listeningDataOfB = getListeningDataOfASong(
            b.songId,
            listeningData
          );
          const parsedListeningDataOfA = parseListeningData(listeningDataOfA);
          const parsedListeningDataOfB = parseListeningData(listeningDataOfB);
          if (
            parsedListeningDataOfA.allTimeListens >
            parsedListeningDataOfB.allTimeListens
          )
            return 1;
          if (
            parsedListeningDataOfA.allTimeListens <
            parsedListeningDataOfB.allTimeListens
          )
            return -1;
          return 0;
        });
      if (sortType === 'monthlyMostListened')
        return data.sort((a, b) => {
          const listeningDataOfA = getListeningDataOfASong(
            a.songId,
            listeningData
          );
          const listeningDataOfB = getListeningDataOfASong(
            b.songId,
            listeningData
          );
          const parsedListeningDataOfA = parseListeningData(listeningDataOfA);
          const parsedListeningDataOfB = parseListeningData(listeningDataOfB);
          if (
            parsedListeningDataOfA.thisMonthListens <
            parsedListeningDataOfB.thisMonthListens
          )
            return 1;
          if (
            parsedListeningDataOfA.thisMonthListens >
            parsedListeningDataOfB.thisMonthListens
          )
            return -1;
          return 0;
        });
      if (sortType === 'monthlyLeastListened')
        return data.sort((a, b) => {
          const listeningDataOfA = getListeningDataOfASong(
            a.songId,
            listeningData
          );
          const listeningDataOfB = getListeningDataOfASong(
            b.songId,
            listeningData
          );
          const parsedListeningDataOfA = parseListeningData(listeningDataOfA);
          const parsedListeningDataOfB = parseListeningData(listeningDataOfB);
          if (
            parsedListeningDataOfA.thisMonthListens >
            parsedListeningDataOfB.thisMonthListens
          )
            return 1;
          if (
            parsedListeningDataOfA.thisMonthListens <
            parsedListeningDataOfB.thisMonthListens
          )
            return -1;
          return 0;
        });
    }
    if (sortType === 'dateAddedAscending')
      return data
        .sort((a, b) => {
          if (a.title.replace(/\W/gi, '') > b.title.replace(/\W/gi, ''))
            return 1;
          if (a.title.replace(/\W/gi, '') < b.title.replace(/\W/gi, ''))
            return -1;
          return 0;
        })
        .sort((a, b) => {
          if (a.modifiedDate && b.modifiedDate) {
            return new Date(a.modifiedDate).getTime() <
              new Date(b.modifiedDate).getTime()
              ? 1
              : -1;
          }
          return 0;
        });
    if (sortType === 'dateAddedDescending')
      return data
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
  }
  return data;
}

export default sortSongs;
