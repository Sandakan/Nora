import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../src/main/db/queries/folders', () => ({
  getAllFolderStructures: vi.fn().mockResolvedValue([{ path: '/music' }])
}));

vi.mock('../../../../src/main/fs/checkFolderForUnknownContentModifications', () => ({
  default: vi.fn().mockResolvedValue({
    failedSongPaths: [],
    deletionFailures: [],
    scanFailed: false
  })
}));

vi.mock('../../../../src/main/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

import checkFolderForUnknownModifications from '../../../../src/main/fs/checkFolderForUnknownContentModifications';
import checkForNewSongs from '../../../../src/main/core/checkForNewSongs';

describe('checkForNewSongs single-flight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the scan result', async () => {
    const result = await checkForNewSongs();
    expect(result.hasFailures).toBe(false);
    expect(checkFolderForUnknownModifications).toHaveBeenCalledWith('/music');
  });

  it('coalesces concurrent calls into one underlying scan', async () => {
    const first = checkForNewSongs();
    const second = checkForNewSongs();
    const third = checkForNewSongs();

    const [r1, r2, r3] = await Promise.all([first, second, third]);
    expect(r1).toEqual(r2);
    expect(r2).toEqual(r3);
    // Only ONE underlying folder scan ran despite three concurrent callers.
    expect(checkFolderForUnknownModifications).toHaveBeenCalledTimes(1);
  });

  it('runs a fresh scan after the previous one completes', async () => {
    await checkForNewSongs();
    await checkForNewSongs();
    // Two sequential calls produce two scans (no sticky single-flight).
    expect(checkFolderForUnknownModifications).toHaveBeenCalledTimes(2);
  });

  it('clears the single-flight lock after a rejected scan', async () => {
    // getAllFolderStructures is called outside the per-folder try/catch, so a
    // DB failure rejects the whole scan. The coordinator must clear its lock
    // so the next call starts a fresh scan instead of reusing the rejection.
    const { getAllFolderStructures } = await import(
      '../../../../src/main/db/queries/folders'
    );
    (getAllFolderStructures as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('db unreachable')
    );

    await expect(checkForNewSongs()).rejects.toThrow('db unreachable');

    // A fresh call after the rejection must start a NEW scan (the lock was
    // cleared in the coordinator's finally), not reuse the rejected promise.
    const result = await checkForNewSongs();
    expect(result.hasFailures).toBe(false);
    expect(checkFolderForUnknownModifications).toHaveBeenCalledTimes(1);
  });
});
