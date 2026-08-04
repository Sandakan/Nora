import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => 'C:/users/owie/appdata/roaming/nora')
  }
}));

vi.mock('@main/db/queries/folders', () => ({
  getAllFolderStructures: vi.fn()
}));

vi.mock('../../../../src/main/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    silly: vi.fn()
  }
}));

import { realpathSync, existsSync, statSync } from 'fs';
import { getAllFolderStructures } from '@main/db/queries/folders';
import { handleFileProtocol } from '../../../../src/main/handleFileProtocol';

// Build platform-appropriate fixtures so the positive-path tests pass on both
// Windows and Linux CI. On POSIX, C:/music is not an absolute path, so the
// protocol would reject it before the root check.
const IS_WIN = process.platform === 'win32';
const MUSIC = IS_WIN ? 'C:/music' : '/music';
const SUB = IS_WIN ? 'C:/music/rock' : '/music/rock';
const SONG = `${MUSIC}/song.flac`;
const SUBSONG = `${SUB}/song.flac`;
const TRAVERSAL = `${MUSIC}/../../etc/passwd`;
const OUTSIDE = IS_WIN ? 'C:/Windows/system32/cmd.exe' : '/usr/bin/cmd';

const mockedGetAllFolderStructures = vi.mocked(getAllFolderStructures);

// Resolve requested paths to a real-ish absolute path. Anything pointing outside
// the approved music roots should be rejected.
vi.mock('fs', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('fs');
  return {
    ...actual,
    realpathSync: vi.fn((p: string) => p),
    existsSync: vi.fn(() => true),
    statSync: vi.fn(() => ({ size: 1024 }) as never)
  };
});

const mockedRealpathSync = vi.mocked(realpathSync);
const mockedExistsSync = vi.mocked(existsSync);

const makeReq = (url: string) => ({ url } as never);

describe('handleFileProtocol', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAllFolderStructures.mockResolvedValue([
      { path: MUSIC, subFolders: [{ path: SUB }] }
    ] as never);
  });

  test('serves a file inside an approved music folder root', async () => {
    const res = await handleFileProtocol(makeReq(`nora://localfiles/${SONG}`));
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(404);
  });

  test('serves a file inside an approved subfolder', async () => {
    const res = await handleFileProtocol(makeReq(`nora://localfiles/${SUBSONG}`));
    expect(res.status).not.toBe(403);
  });

  test('rejects a path traversal attempt outside approved roots', async () => {
    mockedRealpathSync.mockImplementation((p: string) => {
      // Simulate realpath collapsing the traversal to an outside path.
      if (p.includes('..')) return IS_WIN ? 'C:/etc/passwd' : '/etc/passwd';
      return p;
    });
    mockedExistsSync.mockReturnValue(true);

    const res = await handleFileProtocol(
      makeReq(`nora://localfiles/${TRAVERSAL}`)
    );
    expect(res.status).toBe(403);
  });

  test('rejects an absolute path that is not under any approved root', async () => {
    mockedRealpathSync.mockImplementation((p: string) => p);
    mockedExistsSync.mockReturnValue(true);

    const res = await handleFileProtocol(makeReq(`nora://localfiles/${OUTSIDE}`));
    expect(res.status).toBe(403);
  });
});
