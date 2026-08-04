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
      { path: 'C:/music', subFolders: [{ path: 'C:/music/rock' }] }
    ] as never);
  });

  test('serves a file inside an approved music folder root', async () => {
    const res = await handleFileProtocol(makeReq('nora://localfiles/C:/music/song.flac'));
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(404);
  });

  test('serves a file inside an approved subfolder', async () => {
    const res = await handleFileProtocol(makeReq('nora://localfiles/C:/music/rock/song.flac'));
    expect(res.status).not.toBe(403);
  });

  test('rejects a path traversal attempt outside approved roots', async () => {
    mockedRealpathSync.mockImplementation((p: string) => {
      // Simulate realpath collapsing the traversal to /etc/passwd.
      if (p.includes('..')) return 'C:/etc/passwd';
      return p;
    });
    mockedExistsSync.mockReturnValue(true);

    const res = await handleFileProtocol(
      makeReq('nora://localfiles/C:/music/../../etc/passwd')
    );
    expect(res.status).toBe(403);
  });

  test('rejects an absolute path that is not under any approved root', async () => {
    mockedRealpathSync.mockImplementation((p: string) => p);
    mockedExistsSync.mockReturnValue(true);

    const res = await handleFileProtocol(makeReq('nora://localfiles/C:/Windows/system32/cmd.exe'));
    expect(res.status).toBe(403);
  });
});
