import { getAllFolderStructures } from '@main/db/queries/folders';

import checkFolderForUnknownModifications from '../fs/checkFolderForUnknownContentModifications';
import logger from '../logger';

const getTopLevelFolderPaths = async (): Promise<string[]> => {
  const structures = await getAllFolderStructures();
  return structures.map((s) => s.path);
};

const checkForNewSongs = async () => {
  const topLevelFolders = await getTopLevelFolderPaths();
  const failedFolders: string[] = [];

  if (topLevelFolders.length > 0) {
    for (const folderPath of topLevelFolders) {
      try {
        await checkFolderForUnknownModifications(folderPath);
      } catch (error) {
        logger.error(`Failed to check for unknown modifications of a path.`, {
          error,
          path: folderPath
        });
        failedFolders.push(folderPath);
      }
    }
  } else {
    logger.warn('checkForNewSongs: no top-level music folders found — nothing to scan.');
  }

  return { failedFolders };
};

export default checkForNewSongs;
