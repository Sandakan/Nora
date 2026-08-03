import { getAllFolderStructures } from '@main/db/queries/folders';
import checkFolderForUnknownModifications from './checkFolderForUnknownContentModifications';
import logger from '../logger';

/**
 * Shared scan coordination for library scans.
 *
 * Full-library scans (checkForNewSongs) and per-folder watcher scans both touch
 * disk + DB inventory. Running them concurrently can compare different
 * snapshots and parse/remove songs at the same time. This module serializes
 * them:
 *
 * - A full scan is single-flight; concurrent callers join the active one.
 * - A folder scan during a full scan is redundant (the full scan covers every
 *   registered folder), so it defers: the path is marked dirty and ONE
 *   follow-up folder scan runs after the full scan completes.
 * - Every scan failure is observed and logged here, so callers cannot leak
 *   unhandled rejections.
 */

let activeFullScanPromise: Promise<unknown> | null = null;
let followUpScheduled = false;
let deferredFolderScans = 0;

export const isFullScanActive = (): boolean => activeFullScanPromise !== null;

export const runFullScan = <T>(scan: () => Promise<T>): Promise<T> => {
  if (activeFullScanPromise) return activeFullScanPromise as Promise<T>;

  activeFullScanPromise = scan().finally(() => {
    activeFullScanPromise = null;
    if (deferredFolderScans > 0) {
      deferredFolderScans = 0;
      scheduleFollowUpScan();
    }
  });

  return activeFullScanPromise as Promise<T>;
};

const scheduleFollowUpScan = () => {
  if (followUpScheduled) return;
  followUpScheduled = true;
  void runFollowUpScan().finally(() => {
    followUpScheduled = false;
  });
};

// The full scan covers every folder, so a single follow-up pass after it
// completes is enough to pick up any folder event that arrived mid-scan.
const runFollowUpScan = async () => {
  const topLevelFolders = await getTopLevelFolderPaths();
  for (const folderPath of topLevelFolders) {
    try {
      await checkFolderForUnknownModifications(folderPath);
    } catch (error) {
      logger.error(`Follow-up folder scan failed.`, { error, folderPath });
    }
  }
};

const getTopLevelFolderPaths = async (): Promise<string[]> => {
  const structures = await getAllFolderStructures();
  return structures.map((s) => s.path);
};

export const runFolderScan = async (folderPath: string): Promise<void> => {
  if (activeFullScanPromise) {
    // Deferred: the follow-up pass after the full scan covers this folder.
    deferredFolderScans += 1;
    return;
  }
  try {
    await checkFolderForUnknownModifications(folderPath);
  } catch (error) {
    logger.error(`Folder scan failed.`, { error, folderPath });
  }
};
