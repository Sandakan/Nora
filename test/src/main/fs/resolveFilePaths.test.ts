import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../../../src/main/filesystem', () => ({
  DEFAULT_ARTWORK_SAVE_LOCATION: '/mock/user/data/song_covers',
  DEFAULT_FILE_URL: 'nora://localfiles/'
}));

vi.mock('@db/schema', () => ({
  artworks: {}
}));

vi.mock('../../../../src/renderer/src/assets/images/webp/song_cover_default.webp?asset', () => ({
  default: 'song_cover_default.webp'
}));

vi.mock('../../../../src/renderer/src/assets/images/webp/artist_cover_default.webp?asset', () => ({
  default: 'artist_cover_default.webp'
}));

vi.mock('../../../../src/renderer/src/assets/images/webp/album_cover_default.webp?asset', () => ({
  default: 'album_cover_default.webp'
}));

vi.mock('../../../../src/renderer/src/assets/images/webp/history-playlist-icon.webp?asset', () => ({
  default: 'history-playlist-icon.webp'
}));

vi.mock(
  '../../../../src/renderer/src/assets/images/webp/favorites-playlist-icon.webp?asset',
  () => ({
    default: 'favorites-playlist-icon.webp'
  })
);

vi.mock(
  '../../../../src/renderer/src/assets/images/webp/playlist_cover_default.webp?asset',
  () => ({
    default: 'playlist_cover_default.webp'
  })
);

type ResolveFilePathsModule = typeof import('../../../../src/main/fs/resolveFilePaths');

const loadResolveFilePaths = async (
  platformName: NodeJS.Platform
): Promise<ResolveFilePathsModule> => {
  vi.resetModules();
  vi.doMock('process', () => ({
    platform: platformName
  }));
  vi.doMock('node:process', () => ({
    platform: platformName
  }));

  return await import('../../../../src/main/fs/resolveFilePaths');
};

const readTimestamp = (value: string) => new URL(value).searchParams.get('ts');

const platformCases = [
  {
    label: 'Windows',
    platformName: 'win32' as NodeJS.Platform,
    inputPath: 'C:/Users/Ada/Music/Track #1?.flac',
    protocolPath: 'nora://localfiles/C%3A/Users/Ada/Music/Track%20%231%3F.flac?ts=123',
    expectedPathSuffix: 'C:/Users/Ada/Music/Track%20%231%3F.flac'
  },
  {
    label: 'macOS',
    platformName: 'darwin' as NodeJS.Platform,
    inputPath: '/Users/ada/Music/Track #1?.flac',
    protocolPath: 'nora://localfiles/Users/ada/Music/Track%20%231%3F.flac?ts=123',
    expectedPathSuffix: '/Users/ada/Music/Track%20%231%3F.flac'
  },
  {
    label: 'Linux',
    platformName: 'linux' as NodeJS.Platform,
    inputPath: '/home/ada/Music/Track #1?.flac',
    protocolPath: 'nora://localfiles/home/ada/Music/Track%20%231%3F.flac?ts=123',
    expectedPathSuffix: '/home/ada/Music/Track%20%231%3F.flac'
  }
] as const;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unmock('process');
  vi.unmock('node:process');
});

describe.each(platformCases)(
  'resolveFilePaths on $label',
  ({ platformName, inputPath, protocolPath, expectedPathSuffix }) => {
    test('resolveSongFilePath returns a nora:// URL with a cache-busting query', async () => {
      const { resolveSongFilePath } = await loadResolveFilePaths(platformName);

      const resolvedPath = resolveSongFilePath(inputPath);
      const url = new URL(resolvedPath);

      expect(resolvedPath.startsWith('nora://localfiles')).toBe(true);
      expect(url.searchParams.get('ts')).not.toBeNull();
      // pathname will be percent-encoded; decode and assert it contains the original path suffix
      expect(decodeURIComponent(url.pathname)).toContain(
        expectedPathSuffix.replace(/%20/g, ' ').replace(/%23/g, '#').replace(/%3F/g, '?')
      );
    });

    test('resolveSongFilePath preserves the raw path when requested', async () => {
      const { resolveSongFilePath } = await loadResolveFilePaths(platformName);

      expect(resolveSongFilePath(inputPath, true, true)).toBe(inputPath);
    });

    test('removeDefaultAppProtocolFromFilePath strips the protocol and query string', async () => {
      const { removeDefaultAppProtocolFromFilePath } = await loadResolveFilePaths(platformName);

      const resolvedPath = removeDefaultAppProtocolFromFilePath(protocolPath);

      if (platformName === 'win32') {
        expect(resolvedPath).toBe('C:/Users/Ada/Music/Track #1?.flac');
      } else if (platformName === 'darwin') {
        expect(resolvedPath).toBe('/Users/ada/Music/Track #1?.flac');
      } else {
        expect(resolvedPath).toBe('/home/ada/Music/Track #1?.flac');
      }
    });
  }
);

describe('resolveFilePaths artwork helpers', () => {
  test('resolveSongFilePath refreshes the cache-busting timestamp on each call', async () => {
    const { resolveSongFilePath } = await loadResolveFilePaths('win32');
    const dateNowSpy = vi.spyOn(Date, 'now');
    dateNowSpy.mockReturnValueOnce(101).mockReturnValueOnce(202);

    const firstPath = resolveSongFilePath('C:/Music/First.flac');
    const secondPath = resolveSongFilePath('C:/Music/First.flac');

    expect(readTimestamp(firstPath)).not.toBe(readTimestamp(secondPath));

    dateNowSpy.mockRestore();
  });

  test('getSongArtworkPath returns timestamped artwork URLs', async () => {
    const { getSongArtworkPath } = await loadResolveFilePaths('win32');

    const artwork = getSongArtworkPath(17, true);

    expect(artwork.isDefaultArtwork).toBe(false);
    expect(artwork.artworkPath).toContain('nora://localfiles/mock/user/data/song_covers/17.webp');
    expect(artwork.optimizedArtworkPath).toContain(
      'nora://localfiles/mock/user/data/song_covers/17-optimized.webp'
    );
    expect(readTimestamp(artwork.artworkPath)).not.toBeNull();
    expect(readTimestamp(artwork.optimizedArtworkPath)).not.toBeNull();
  });

  test('getSongArtworkPath falls back to the default cover when artwork is unavailable', async () => {
    const { getSongArtworkPath } = await loadResolveFilePaths('win32');

    const artwork = getSongArtworkPath(17, false);

    expect(artwork.isDefaultArtwork).toBe(false);
    expect(artwork.artworkPath).toBe(
      'nora://localfiles/song_cover_default.webp?ts=' + readTimestamp(artwork.artworkPath)
    );
    expect(artwork.optimizedArtworkPath).toBe(artwork.artworkPath);
  });

  test('getSongArtworkPath can return the real filesystem path', async () => {
    const { getSongArtworkPath } = await loadResolveFilePaths('win32');

    const artwork = getSongArtworkPath(17, true, false, true);

    expect(artwork.artworkPath).toBe('/mock/user/data/song_covers/17.webp');
    expect(artwork.optimizedArtworkPath).toBe('/mock/user/data/song_covers/17-optimized.webp');
  });

  test('parseSongArtworks chooses the best available resolutions', async () => {
    const { parseSongArtworks } = await loadResolveFilePaths('win32');

    const artwork = parseSongArtworks([
      { width: 1200, height: 1200, path: 'artwork/high.webp' },
      { width: 240, height: 240, path: 'artwork/low.webp' }
    ] as never[]);

    expect(artwork.isDefaultArtwork).toBe(false);
    expect(artwork.artworkPath).toContain('nora://localfiles/artwork/high.webp');
    expect(artwork.optimizedArtworkPath).toContain('nora://localfiles/artwork/low.webp');
  });

  test('parseSongArtworks falls back to the default cover without suitable artwork', async () => {
    const { parseSongArtworks } = await loadResolveFilePaths('win32');

    const artwork = parseSongArtworks([
      { width: 128, height: 128, path: 'artwork/too-small.webp' }
    ] as never[]);

    expect(artwork.isDefaultArtwork).toBe(true);
    expect(artwork.artworkPath).toContain('nora://localfiles/song_cover_default.webp');
    expect(artwork.optimizedArtworkPath).toBe(artwork.artworkPath);
  });

  test('parseSongArtworks can return real paths', async () => {
    const { parseSongArtworks } = await loadResolveFilePaths('win32');

    const artwork = parseSongArtworks(
      [
        { width: 1200, height: 1200, path: '/music/artwork/high.webp' },
        { width: 240, height: 240, path: '/music/artwork/low.webp' }
      ] as never[],
      false,
      true
    );

    expect(artwork.artworkPath).toBe('/music/artwork/high.webp');
    expect(artwork.optimizedArtworkPath).toBe('/music/artwork/low.webp');
  });

  test('parseArtistOnlineArtworks returns the remote artwork set when enough sizes exist', async () => {
    const { parseArtistOnlineArtworks } = await loadResolveFilePaths('win32');

    const artworkPaths = parseArtistOnlineArtworks([
      { width: 120, height: 120, source: 'REMOTE', path: 'artist/small.webp' },
      { width: 320, height: 320, source: 'REMOTE', path: 'artist/medium.webp' },
      { width: 640, height: 640, source: 'REMOTE', path: 'artist/xl.webp' }
    ] as never[]);

    expect(artworkPaths).toEqual({
      picture_xl: 'artist/xl.webp',
      picture_medium: 'artist/medium.webp',
      picture_small: 'artist/small.webp'
    });
  });

  test('parseArtistOnlineArtworks returns undefined when the remote set is incomplete', async () => {
    const { parseArtistOnlineArtworks } = await loadResolveFilePaths('win32');

    expect(
      parseArtistOnlineArtworks([
        { width: 80, height: 80, source: 'REMOTE', path: 'artist/small.webp' }
      ] as never[])
    ).toBeUndefined();
  });

  test('getArtistArtworkPath uses the cached artwork save location', async () => {
    const { getArtistArtworkPath } = await loadResolveFilePaths('win32');

    const artwork = getArtistArtworkPath('artist-cover.webp');

    expect(artwork.artworkPath).toContain(
      'nora://localfiles/mock/user/data/song_covers/artist-cover.webp'
    );
    expect(artwork.optimizedArtworkPath).toContain(
      'nora://localfiles/mock/user/data/song_covers/artist-cover.webp'
    );
  });

  test('parseArtistArtworks uses the highest resolution artwork when available', async () => {
    const { parseArtistArtworks } = await loadResolveFilePaths('win32');

    const artwork = parseArtistArtworks([
      { width: 700, height: 700, path: 'artist/high.webp' },
      { width: 300, height: 300, path: 'artist/low.webp' }
    ] as never[]);

    expect(artwork.isDefaultArtwork).toBe(false);
    expect(artwork.artworkPath).toContain('nora://localfiles/artist/high.webp');
    expect(artwork.optimizedArtworkPath).toContain('nora://localfiles/artist/high.webp');
  });

  test('parseArtistArtworks falls back to the default cover when needed', async () => {
    const { parseArtistArtworks } = await loadResolveFilePaths('win32');

    const artwork = parseArtistArtworks([] as never[]);

    expect(artwork.isDefaultArtwork).toBe(true);
    expect(artwork.artworkPath).toBe(
      'nora://localfiles/artist_cover_default.webp?ts=' + readTimestamp(artwork.artworkPath)
    );
  });

  test('getAlbumArtworkPath and parseAlbumArtworks mirror the artist helpers', async () => {
    const { getAlbumArtworkPath, parseAlbumArtworks } = await loadResolveFilePaths('win32');

    const albumArtwork = getAlbumArtworkPath('album-cover.webp');
    const parsedAlbumArtwork = parseAlbumArtworks([
      { width: 900, height: 900, path: 'album/high.webp' }
    ] as never[]);

    expect(albumArtwork.artworkPath).toContain(
      'nora://localfiles/mock/user/data/song_covers/album-cover.webp'
    );
    expect(albumArtwork.optimizedArtworkPath).toContain(
      'nora://localfiles/mock/user/data/song_covers/album-cover.webp'
    );
    expect(parsedAlbumArtwork.artworkPath).toContain('nora://localfiles/album/high.webp');
    expect(parsedAlbumArtwork.optimizedArtworkPath).toContain('nora://localfiles/album/high.webp');
  });

  test('getGenreArtworkPath and parseGenreArtworks return the expected defaults', async () => {
    const { getGenreArtworkPath, parseGenreArtworks } = await loadResolveFilePaths('win32');

    const genreArtwork = getGenreArtworkPath('genre-cover.webp');
    const parsedGenreArtwork = parseGenreArtworks([] as never[]);

    expect(genreArtwork.artworkPath).toContain(
      'nora://localfiles/mock/user/data/song_covers/genre-cover.webp'
    );
    expect(genreArtwork.optimizedArtworkPath).toContain(
      'nora://localfiles/mock/user/data/song_covers/genre-cover.webp'
    );
    expect(parsedGenreArtwork.artworkPath).toBe(
      'nora://localfiles/song_cover_default.webp?ts=' +
        readTimestamp(parsedGenreArtwork.artworkPath)
    );
    expect(parsedGenreArtwork.optimizedArtworkPath).toBe(parsedGenreArtwork.artworkPath);
  });

  test('getPlaylistArtworkPath and parsePlaylistArtworks cover built-in and custom playlists', async () => {
    const { getPlaylistArtworkPath, parsePlaylistArtworks } = await loadResolveFilePaths('win32');

    const historyArtwork = getPlaylistArtworkPath('History', true);
    const favoritesArtwork = getPlaylistArtworkPath('Favorites', true);
    const customPlaylistArtwork = getPlaylistArtworkPath(42, true);
    const parsedPlaylistArtwork = parsePlaylistArtworks([
      { width: 1000, height: 1000, path: 'playlist/high.webp' }
    ] as never[]);

    expect(historyArtwork.artworkPath).toContain('history-playlist-icon.webp');
    expect(favoritesArtwork.artworkPath).toContain('favorites-playlist-icon.webp');
    expect(customPlaylistArtwork.artworkPath).toContain(
      'nora://localfiles/mock/user/data/song_covers/42.webp'
    );
    expect(parsedPlaylistArtwork.artworkPath).toContain('nora://localfiles/playlist/high.webp');
    expect(parsedPlaylistArtwork.optimizedArtworkPath).toContain(
      'nora://localfiles/playlist/high.webp'
    );
  });

  test('addDefaultAppProtocolToFilePath produces the custom protocol prefix', async () => {
    const { addDefaultAppProtocolToFilePath } = await loadResolveFilePaths('win32');

    expect(addDefaultAppProtocolToFilePath('mock/user/data/song_covers/17.webp')).toBe(
      'nora://localfiles/mock/user/data/song_covers/17.webp'
    );
  });
});
