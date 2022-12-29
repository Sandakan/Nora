import { getListeningData, getSongsData } from '../filesystem';
import { getSongArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import sortSongs from '../utils/sortSongs';

const getSongInfo = (
  songIds: string[],
  sortType?: SongSortTypes,
  limit = songIds.length
): SongData[] => {
  log(
    `Fetching songs data from getSongInfo function about ${
      limit || songIds.length
    } songs.`
  );
  if (songIds.length > 0) {
    const songsData = getSongsData();
    const listeningData = getListeningData();
    if (Array.isArray(songsData) && songsData.length > 0) {
      const results: SavableSongData[] = [];
      for (let x = 0; x < songsData.length; x += 1) {
        if (songIds.includes(songsData[x].songId)) {
          results.push(songsData[x]);
        }
      }
      if (results.length > 0) {
        const updatedResults = results.map((x) => ({
          ...x,
          artworkPaths: getSongArtworkPath(x.songId, x.isArtworkAvailable),
        }));
        if (limit) {
          if (typeof sortType === 'string')
            return sortSongs(updatedResults, sortType, listeningData).filter(
              (_, index) => index < limit
            );
          return updatedResults.filter((_, index) => index < limit);
        }
        return updatedResults;
      }
      log(
        `Request failed to get songs info of songs with ids ${songIds.join(
          ','
        )} because they cannot be found.`
      );
      return [];
    }
    log(
      `ERROR OCCURRED WHEN TRYING GET SONGS INFO FROM getSongInfo FUNCTION. SONGS DATA ARE EMPTY.`
    );
    return [];
  }
  log(
    `APP MADE A REQUEST TO getSongInfo FUNCTION WITH AN EMPTY ARRAY OF SONG IDS. `
  );
  return [];
};

export default getSongInfo;
