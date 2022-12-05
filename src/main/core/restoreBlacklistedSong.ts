import path from 'path';

import { getUserData, setUserData } from '../filesystem';
import log from '../log';
import { parseSong } from '../parseSong';

const restoreBlacklistedSong = async (absolutePath: string): Promise<void> => {
  log(
    `Started the blacklist song restoring process for '${path.basename(
      absolutePath
    )}'`
  );
  const userData = getUserData();
  if (userData && userData.songBlacklist.length > 0) {
    if (userData.songBlacklist.some((songPath) => songPath === absolutePath)) {
      try {
        userData.songBlacklist = userData.songBlacklist.filter(
          (songPath) => songPath !== absolutePath
        );
        await parseSong(absolutePath);
        return setUserData('songBlacklist', userData.songBlacklist);
      } catch (error) {
        log(
          `Error occurred when restoring blacklisted song.`,
          { error },
          'ERROR'
        );
      }
    } else {
      log(
        `AN UN-BLACKLISTED SONG IS REQUESTED TO RESTORE FROM THE BLACKLIST.`,
        { songPath: absolutePath },
        'WARN'
      );
      throw new Error(`NO_BLACKLISTED_SONG_IN_GIVEN_PATH` as MessageCodes);
    }
  }
  throw new Error('EMPTY_BLACKLIST' as MessageCodes);
};

export default restoreBlacklistedSong;
