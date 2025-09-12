import checkFolderForUnknownModifications from '../fs/checkFolderForUnknownContentModifications';
import logger from '../logger';
import { getAllFolders } from '@main/db/queries/folders';

const checkForNewSongs = async () => {
  const folders = await getAllFolders();

  if (folders.length > 0) {
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
  }
  logger.error(`Failed to read music folders array in user data. it was possibly empty.`, {
    folders
  });
};

export default checkForNewSongs;
