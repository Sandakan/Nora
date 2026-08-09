import { describe, it, expect, vi } from 'vitest';
import path from 'path';

vi.mock('../../../../src/main/db/queries/settings', () => ({
  getUserSettings: vi.fn().mockResolvedValue({ customLrcFilesSaveLocation: null })
}));
vi.mock('../../../../src/main/main', () => ({
  checkIfConnectedToInternet: vi.fn().mockResolvedValue(true),
  sendMessageToRenderer: vi.fn()
}));
vi.mock('../../../../src/main/filesystem', () => ({}));
vi.mock('../../../../src/main/db/db', () => ({}));
vi.mock('../../../../src/main/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

import { getLrcFilePaths } from '../../../../src/main/core/getSongLyrics';

describe('getLrcFilePaths', () => {
  it('returns the default path and extension-stripped path', () => {
    const paths = getLrcFilePaths('/music/song.flac');
    expect(paths).toContain('/music/song.flac.lrc');
    expect(paths).toContain('/music/song.lrc');
  });

  it('does not corrupt paths that contain the extension string in a directory', () => {
    // The old replaceAll(path.extname(x), '') removed EVERY occurrence of the
    // extension, corrupting '/music/rock.flac/song.flac' into '/music/rock/song.lrc'.
    const paths = getLrcFilePaths('/music/rock.flac/song.flac');
    expect(paths).toContain('/music/rock.flac/song.flac.lrc');
    expect(paths).toContain('/music/rock.flac/song.lrc');
  });

  it('strips only the trailing extension from the basename in custom dirs', () => {
    const paths = getLrcFilePaths('/music/song.flac', '/lrc');
    expect(paths).toContain(path.join('/lrc', 'song.flac.lrc'));
    expect(paths).toContain(path.join('/lrc', 'song.lrc'));
  });

  it('handles files with no extension', () => {
    const paths = getLrcFilePaths('/music/noext');
    expect(paths).toContain('/music/noext.lrc');
  });

  it('includes no custom paths when no custom directory is provided', () => {
    const paths = getLrcFilePaths('/music/song.mp3');
    expect(paths.filter((p) => p.startsWith('/lrc'))).toHaveLength(0);
  });
});
