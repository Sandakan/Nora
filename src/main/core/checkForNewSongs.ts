import checkFolderForUnknownModifications from '../fs/checkFolderForUnknownContentModifications';
import { getSongsData, getUserData } from '../filesystem';
import logger from '../logger';
import { getAllFoldersFromFolderStructures } from '../fs/parseFolderStructuresForSongPaths';

const checkForNewSongs = async () => {
  const { musicFolders } = getUserData();
  const songs = getSongsData();

  const folders = getAllFoldersFromFolderStructures(musicFolders);

  if (Array.isArray(musicFolders) && Array.isArray(songs)) {
    for (const folder of folders) {
      try {
        await checkFolderForUnknownModifications(folder.path);
      } catch (error) {
        logger.error(`Failed to check for unknown modifications of a path.`, {
          error,
          path: folder.path
        });
      }
    }
    return;
  }
  logger.error(`Failed to read music folders array in user data. it was possibly empty.`, {
    musicFolders
  });
};

export default checkForNewSongs;
