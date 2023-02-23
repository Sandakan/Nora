import path from 'path';
import {
  getBlacklistData,
  getListeningData,
  getSongsData,
} from '../filesystem';
import { getSongArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import sortSongs from '../utils/sortSongs';

const checkIfSongFolderIsBlacklisted = (songPath: string) => {
  const { folderBlacklist } = getBlacklistData();

  return folderBlacklist.some((folderPath) =>
    path.normalize(songPath).includes(path.normalize(folderPath))
  );
};

const getSongInfo = (
  songIds: string[],
  sortType?: SongSortTypes,
  limit = songIds.length,
  preserveIdOrder = false,
  noBlacklistedSongs = false
): SongData[] => {
  log(
    `Fetching songs data from getSongInfo function about ${
      limit || songIds.length
    } songs.`
  );
  if (songIds.length > 0) {
    const songsData = getSongsData();
    const listeningData = getListeningData();
    const { songBlacklist } = getBlacklistData();

    if (Array.isArray(songsData) && songsData.length > 0) {
      const results: SavableSongData[] = [];

      if (preserveIdOrder)
        for (let x = 0; x < songIds.length; x += 1) {
          for (let y = 0; y < songsData.length; y += 1) {
            if (songIds[x] === songsData[y].songId) {
              results.push(songsData[y]);
            }
          }
        }
      else
        for (let x = 0; x < songsData.length; x += 1) {
          if (songIds.includes(songsData[x].songId)) {
            results.push(songsData[x]);
          }
        }
      if (results.length > 0) {
        let updatedResults: SongData[] = results.map((x) => {
          const isSongFolderBlacklisted = checkIfSongFolderIsBlacklisted(
            x.path
          );

          const isBlacklisted =
            songBlacklist.includes(x.songId) || isSongFolderBlacklisted;

          return {
            ...x,
            artworkPaths: getSongArtworkPath(x.songId, x.isArtworkAvailable),
            isBlacklisted,
          };
        });

        if (noBlacklistedSongs)
          updatedResults = updatedResults.filter(
            (result) => !result.isBlacklisted
          );

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
