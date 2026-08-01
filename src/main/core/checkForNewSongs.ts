import { getAllFolderStructures } from '@main/db/queries/folders';

import checkFolderForUnknownModifications from '../fs/checkFolderForUnknownContentModifications';
import logger from '../logger';

const getTopLevelFolderPaths = async (): Promise<string[]> => {
  const structures = await getAllFolderStructures();
  return structures.map((s) => s.path);
};

// Single-flight guard: the full library scan must not run concurrently from
// IPC resync, startup, or future callers. Concurrent callers join the active
// scan instead of starting a second one.
let activeScanPromise: Promise<Awaited<ReturnType<typeof runCheckForNewSongs>>> | null = null;

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

const checkForNewSongs = async () => {
  if (activeScanPromise) return activeScanPromise;

  activeScanPromise = runCheckForNewSongs().finally(() => {
    activeScanPromise = null;
  });

  return activeScanPromise;
};

export default checkForNewSongs;
