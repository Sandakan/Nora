import { describe, expect, test, vi } from 'vitest';

vi.mock('@db/schema', () => ({
  artworks: {
    $inferSelect: {}
  }
}));

vi.mock('../../../../src/main/filesystem', () => ({
  DEFAULT_ARTWORK_SAVE_LOCATION: 'artworks',
  DEFAULT_FILE_URL: 'nora://localfiles/'
}));

vi.mock('../../../../src/renderer/src/assets/images/webp/album_cover_default.webp?asset', () => ({
  default: 'album-cover.webp'
}));
vi.mock('../../../../src/renderer/src/assets/images/webp/artist_cover_default.webp?asset', () => ({
  default: 'artist-cover.webp'
}));
vi.mock(
  '../../../../src/renderer/src/assets/images/webp/favorites-playlist-icon.webp?asset',
  () => ({
    default: 'favorites-playlist.webp'
  })
);
vi.mock('../../../../src/renderer/src/assets/images/webp/history-playlist-icon.webp?asset', () => ({
  default: 'history-playlist.webp'
}));
vi.mock(
  '../../../../src/renderer/src/assets/images/webp/playlist_cover_default.webp?asset',
  () => ({
    default: 'playlist-cover.webp'
  })
);
vi.mock('../../../../src/renderer/src/assets/images/webp/song_cover_default.webp?asset', () => ({
  default: 'song-cover.webp'
}));

import {
  addDefaultAppProtocolToFilePath,
  getPlaylistArtworkPath,
  getSongArtworkPath,
  parseSongArtworks,
  removeDefaultAppProtocolFromFilePath,
  resetArtworkCache,
  resolveSongFilePath
} from '../../../../src/main/fs/resolveFilePaths';

describe('resolveFilePaths', () => {
  test('resolveSongFilePath adds cache-busting timestamp by default', () => {
    const resolved = resolveSongFilePath('C:/Music/Test.flac');

    expect(resolved).toContain('C:/Music/Test.flac');
    expect(resolved).toContain('?ts=');
  });

  test('resolveSongFilePath returns raw path when sendRealPath=true', () => {
    const resolved = resolveSongFilePath('C:/Music/Test.flac', false, true);

    expect(resolved).toBe('C:/Music/Test.flac');
  });

  test('resetArtworkCache returns numeric timestamp for single key and all', () => {
    const songTs = resetArtworkCache('songs');
    const allTs = resetArtworkCache('all');

    expect(typeof songTs).toBe('number');
    expect(typeof allTs).toBe('number');
    expect(allTs).toBeGreaterThanOrEqual(songTs);
  });

  test('getSongArtworkPath returns generated artwork paths when available', () => {
    const paths = getSongArtworkPath(42, true, true);

    expect(paths.isDefaultArtwork).toBe(false);
    expect(paths.artworkPath).toContain('42.webp');
    expect(paths.optimizedArtworkPath).toContain('42-optimized.webp');
    expect(paths.artworkPath).toContain('?ts=');
  });

  test('getSongArtworkPath returns default artwork when unavailable', () => {
    const paths = getSongArtworkPath(42, false, true);

    expect(paths.isDefaultArtwork).toBe(false);
    expect(paths.artworkPath).toContain('song-cover.webp');
    expect(paths.optimizedArtworkPath).toContain('song-cover.webp');
  });

  test('parseSongArtworks picks high and low resolution images when both exist', () => {
    const paths = parseSongArtworks(
      [
        { width: 1000, height: 1000, path: 'high.webp' },
        { width: 300, height: 300, path: 'low.webp' }
      ] as never,
      true,
      false
    );

    expect(paths.isDefaultArtwork).toBe(false);
    expect(paths.artworkPath).toContain('high.webp');
    expect(paths.optimizedArtworkPath).toContain('low.webp');
    expect(paths.artworkPath).toContain('?ts=');
  });

  test('parseSongArtworks falls back to default artwork when no suitable pair exists', () => {
    const paths = parseSongArtworks([{ width: 300, height: 300, path: 'low.webp' }] as never);

    expect(paths.isDefaultArtwork).toBe(true);
    expect(paths.artworkPath).toContain('song-cover.webp');
    expect(paths.optimizedArtworkPath).toContain('song-cover.webp');
  });

  test('getPlaylistArtworkPath returns history and favorites defaults', () => {
    const history = getPlaylistArtworkPath('History', false, true);
    const favorites = getPlaylistArtworkPath('Favorites', false, true);

    expect(history.artworkPath).toContain('history-playlist.webp');
    expect(favorites.artworkPath).toContain('favorites-playlist.webp');
  });

  test('removeDefaultAppProtocolFromFilePath strips protocol and query string', () => {
    const input = 'nora://localfiles/C:/Music/Song.flac?ts=1234';
    const output = removeDefaultAppProtocolFromFilePath(input);

    expect(output).toContain('C:/Music/Song.flac');
    expect(output).not.toContain('?ts=');
  });

  test('addDefaultAppProtocolToFilePath prefixes nora localfiles path', () => {
    const output = addDefaultAppProtocolToFilePath('C:/Music/Song.flac');

    expect(output).toContain('localfiles');
    expect(output).toContain('C:/Music/Song.flac');
    expect(output.startsWith('nora:')).toBe(true);
  });
});
