import { getAllFolderStructures } from '@main/db/queries/folders';

import { runFullScan } from '../fs/scanCoordinator';
import checkFolderForUnknownModifications from '../fs/checkFolderForUnknownContentModifications';
import logger from '../logger';

const getTopLevelFolderPaths = async (): Promise<string[]> => {
  const structures = await getAllFolderStructures();
  return structures.map((s) => s.path);
};

const runCheckForNewSongs = async () => {
  const topLevelFolders = await getTopLevelFolderPaths();
  const failedFolders: string[] = [];
  const failedSongPaths: string[] = [];
  const deletionFailures: string[] = [];
  let scanFailed = false;

  if (topLevelFolders.length > 0) {
    for (const folderPath of topLevelFolders) {
      try {
        const result = await checkFolderForUnknownModifications(folderPath);
        if (result.failedSongPaths.length > 0)
          failedSongPaths.push(...result.failedSongPaths);
        if (result.deletionFailures.length > 0)
          deletionFailures.push(...result.deletionFailures);
        if (result.scanFailed) scanFailed = true;
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

  const hasFailures =
    failedFolders.length > 0 || failedSongPaths.length > 0 || deletionFailures.length > 0 || scanFailed;

  return { failedFolders, failedSongPaths, deletionFailures, hasFailures, scanFailed };
};

// Full-library scans go through the shared scan coordinator so they cannot
// overlap per-folder watcher scans (and vice versa). Concurrent callers join
// the active scan instead of starting a second one.
const checkForNewSongs = () => runFullScan(runCheckForNewSongs);

export default checkForNewSongs;
