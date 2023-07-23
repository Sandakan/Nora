import { isSongBlacklisted } from '../utils/isBlacklisted';
import { getListeningData, getSongsData } from '../filesystem';
import { getSongArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import sortSongs from '../utils/sortSongs';

const getAllSongs = async (
  sortType = 'aToZ' as SongSortTypes,
  pageNo = 1,
  maxResultsPerPage = 0,
) => {
  const result: GetAllSongsResult = {
    data: [],
    pageNo: pageNo || 1,
    maxResultsPerPage,
    noOfPages: 1,
    sortType,
  };
  const songsData = getSongsData();
  const listeningData = getListeningData();

  if (songsData && songsData.length > 0) {
    if (maxResultsPerPage === 0 || maxResultsPerPage > songsData.length)
      result.maxResultsPerPage = songsData.length;
    if (result.maxResultsPerPage !== undefined)
      result.noOfPages = Math.floor(
        songsData.length / result.maxResultsPerPage,
      );
    const audioData = sortSongs(songsData, sortType, listeningData).map(
      (songInfo) => {
        const isBlacklisted = isSongBlacklisted(songInfo.songId, songInfo.path);

        return {
          title: songInfo.title,
          artists: songInfo.artists,
          album: songInfo.album,
          duration: songInfo.duration,
          artworkPaths: getSongArtworkPath(
            songInfo.songId,
            songInfo.isArtworkAvailable,
          ),
          path: songInfo.path,
          year: songInfo.year,
          songId: songInfo.songId,
          palette: songInfo.palette,
          addedDate: songInfo.addedDate,
          isAFavorite: songInfo.isAFavorite,
          isBlacklisted,
        } satisfies AudioInfo;
      },
    );

    const resultsStartIndex = (result.pageNo - 1) * result.maxResultsPerPage;
    const resultsEndIndex = result.pageNo * result.maxResultsPerPage;
    result.data =
      result.maxResultsPerPage === audioData.length
        ? audioData.slice(0)
        : audioData.slice(resultsStartIndex, resultsEndIndex);
  }
  log(
    `Sending data related to all the songs with filters of sortType=${sortType} pageNo=${result.pageNo} maxResultsPerPage=${result.maxResultsPerPage}`,
  );
  return result;
};

export default getAllSongs;
