import { getAllFolderStructures } from '@main/db/queries/folders';

import checkFolderForUnknownModifications from './checkFolderForUnknownContentModifications';
import logger from '../logger';

/**
 * Shared scan coordination for library scans.
 *
 * Full-library scans (checkForNewSongs) and per-folder watcher scans both touch
 * disk + DB inventory. Running them concurrently can compare different
 * snapshots and parse/remove songs at the same time. This module serializes
 * every scan through ONE active promise so no two scans overlap:
 *
 * - A full scan is single-flight; concurrent callers join the active one.
 * - A folder scan started while any scan is active is serialized behind it.
 *   Because the full scan already covers every registered folder, a single
 *   follow-up pass runs after the active scan (and its follow-up) completes to
 *   pick up events that arrived mid-scan.
 * - The follow-up pass is part of the serialized state: the coordinator stays
 *   "active" until the follow-up finishes, so a new scan cannot race it.
 * - Every scan failure is observed and logged here, so callers cannot leak
 *   unhandled rejections.
 */

let activeScanPromise: Promise<unknown> | null = null;
let pendingScanCount = 0;
let followUpAfterFullScan = false;

const getTopLevelFolderPaths = async (): Promise<string[]> => {
  const structures = await getAllFolderStructures();
  return structures.map((s) => s.path);
};

// The full scan covers every folder, so a single follow-up pass after the active
// scan completes is enough to pick up any folder event that arrived mid-scan.
const runFollowUpScan = async (): Promise<void> => {
  const topLevelFolders = await getTopLevelFolderPaths();
  for (const folderPath of topLevelFolders) {
    try {
      await checkFolderForUnknownModifications(folderPath);
    } catch (error) {
      logger.error(`Follow-up folder scan failed.`, { error, folderPath });
    }
  }
};

// Serialize a unit of work behind the shared active promise. `work` runs only
// once the current scan (if any) has fully settled, including its follow-up.
const enqueue = <T>(work: () => Promise<T>): Promise<T> => {
  pendingScanCount += 1;

  const run = async (): Promise<T> => {
    try {
      return await work();
    } finally {
      // After a full scan settles, run the deferred follow-up (if a full scan ran)
      // while the coordinator is still considered active, so a new scan cannot
      // start until the follow-up completes.
      if (followUpAfterFullScan) {
        followUpAfterFullScan = false;
        await runFollowUpScan().catch((error) =>
          logger.error('Follow-up library scan failed.', { error })
        );
      }

      pendingScanCount -= 1;
      if (pendingScanCount === 0) activeScanPromise = null;
    }
  };

  const previous = activeScanPromise ?? Promise.resolve();
  const chained = previous.then(run, run);
  // Keep the shared promise pointed at the latest link so subsequent scans wait.
  activeScanPromise = chained.catch(() => undefined);
  return chained as Promise<T>;
};

export const isFullScanActive = (): boolean => activeScanPromise !== null;

export const runFullScan = <T>(scan: () => Promise<T>): Promise<T> => {
  followUpAfterFullScan = true;
  return enqueue(scan);
};

export const runFolderScan = (folderPath: string): Promise<void> =>
  enqueue(async () => {
    try {
      await checkFolderForUnknownModifications(folderPath);
    } catch (error) {
      logger.error(`Folder scan failed.`, { error, folderPath });
    }
  });
