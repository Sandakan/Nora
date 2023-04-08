import path from 'path';
import checkFolderForUnknownModifications from '../fs/checkFolderForUnknownContentModifications';
import { getSongsData, getUserData } from '../filesystem';
import log from '../log';
import { getAllFoldersFromFolderStructures } from '../fs/parseFolderForSongPaths';

const checkForNewSongs = async () => {
  const { musicFolders } = getUserData();
  const songs = getSongsData();

  const folders = getAllFoldersFromFolderStructures(musicFolders);

  if (Array.isArray(musicFolders) && Array.isArray(songs)) {
    for (const folder of folders) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await checkFolderForUnknownModifications(folder.path);
      } catch (error) {
        log(
          `Error occurred when trying to check for unknown modifications of '${path.basename(
            folder.path
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
