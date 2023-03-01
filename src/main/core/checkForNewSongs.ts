import path from 'path';
import checkFolderForUnknownModifications from '../fs/checkFolderForUnknownContentModifications';
import { getSongsData, getUserData } from '../filesystem';
import log from '../log';

const checkForNewSongs = async () => {
  const { musicFolders } = getUserData();
  const songs = getSongsData();

  if (Array.isArray(musicFolders) && Array.isArray(songs)) {
    for (let i = 0; i < musicFolders.length; i += 1) {
      const musicFolder = musicFolders[i];
      try {
        // eslint-disable-next-line no-await-in-loop
        await checkFolderForUnknownModifications(musicFolder.path);
      } catch (error) {
        log(
          `Error occurred when trying to check for unknown modifications of '${path.basename(
            musicFolder.path
          )}'.`,
          { error },
          'ERROR'
        );
      }
    }
    return;
  }
  log(
    `ERROR OCCURRED WHEN TRYING TO READ MUSIC FOLDERS ARRAY IN USER DATA. IT WAS POSSIBLY EMPTY.`,
    undefined,
    'ERROR'
  );
};

export default checkForNewSongs;
