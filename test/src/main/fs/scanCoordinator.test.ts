import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@main/db/queries/folders', () => ({
  getAllFolderStructures: vi.fn()
}));

vi.mock('../../../../src/main/fs/checkFolderForUnknownContentModifications', () => ({
  default: vi.fn()
}));

vi.mock('../../../../src/main/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn()
  }
}));

import { getAllFolderStructures } from '@main/db/queries/folders';
import checkFolderForUnknownModifications from '../../../../src/main/fs/checkFolderForUnknownContentModifications';
import { runFolderScan, runFullScan } from '../../../../src/main/fs/scanCoordinator';

const mockedGetAllFolderStructures = vi.mocked(getAllFolderStructures);
const mockedCheck = vi.mocked(checkFolderForUnknownModifications);

describe('scanCoordinator', () => {
  let order: string[] = [];
  beforeEach(() => {
    vi.clearAllMocks();
    order = [];
    mockedGetAllFolderStructures.mockResolvedValue([{ path: 'C:/music' }] as never);
    mockedCheck.mockImplementation(async (path: string) => {
      order.push('folder-check');
      return undefined;
    });
  });

  test('serializes a folder scan behind an active full scan', async () => {
    const fullScanPromise = runFullScan(async () => {
      order.push('full-start');
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.push('full-end');
      return 'done';
    });

    // Folder scan fired concurrently (as a watcher would, not awaited inside the full scan).
    const folderPromise = runFolderScan('C:/music/sub');
    await Promise.all([fullScanPromise, folderPromise]);

    // The folder scan's disk check ran only after the full scan released the lock.
    expect(mockedCheck).toHaveBeenCalledWith('C:/music/sub');
    // full-end must come before the folder check in execution order.
    const fullEndIdx = order.indexOf('full-end');
    const subCheckIdx = order.lastIndexOf('folder-check');
    expect(fullEndIdx).toBeGreaterThanOrEqual(0);
    expect(subCheckIdx).toBeGreaterThan(fullEndIdx);
  });

  test('follow-up pass runs after a full scan when a folder event arrived mid-scan', async () => {
    const fullScanPromise = runFullScan(async () => 'ok');
    // A watcher folder event arrives during the active full scan. This must
    // schedule the deferred follow-up pass (which re-scans top-level folders).
    const folderPromise = runFolderScan('C:/music/sub');
    await Promise.all([fullScanPromise, folderPromise]);

    // The follow-up queried top-level folder paths and scanned the top-level folder.
    expect(mockedGetAllFolderStructures).toHaveBeenCalled();
    expect(mockedCheck).toHaveBeenCalledWith('C:/music');
  });

  test('no follow-up pass runs when no folder event arrived during the full scan', async () => {
    await runFullScan(async () => 'ok');

    // Without a concurrent folder event, the follow-up pass must NOT run.
    expect(mockedGetAllFolderStructures).not.toHaveBeenCalled();
  });

  test('a rejected follow-up root query does not leak an unhandled rejection', async () => {
    mockedGetAllFolderStructures.mockRejectedValueOnce(new Error('db down'));

    // Should resolve (the rejection is caught + logged inside the coordinator).
    await expect(runFullScan(async () => 'ok')).resolves.toBe('ok');
  });

  test('folder scan failure is observed and does not reject the caller', async () => {
    mockedCheck.mockRejectedValueOnce(new Error('scan failed'));

    await expect(runFolderScan('C:/music/bad')).resolves.toBeUndefined();
  });
});
