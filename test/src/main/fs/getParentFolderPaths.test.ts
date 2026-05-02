import { describe, it, expect } from 'vitest';

import getParentFolderPaths from '../../../../src/main/fs/getParentFolderPaths';

/**
 * TEST SUITE FOR getParentFolderPaths
 *
 * Tests the getParentFolderPaths function from src/main/fs/getParentFolderPaths.ts Includes
 * regression tests for issue #458 (AppImage/AUR path resolution)
 */

describe('getParentFolderPaths', () => {
  // ============================================================================
  // BASIC ABSOLUTE PATH TESTS
  // ============================================================================
  describe('absolute paths - basic', () => {
    it('should preserve leading slash for absolute paths', () => {
      const paths = ['/home/dev/music/rock', '/home/dev/music/jazz'];
      const result = getParentFolderPaths(paths);

      // Both paths should have the leading slash preserved
      expect(result.every((p) => p.startsWith('/'))).toBe(true);

      // The parent should be /home/dev/music
      expect(result).toContain('/home/dev/music');
    });

    it('should handle single absolute path', () => {
      const paths = ['/home/dev/music'];
      const result = getParentFolderPaths(paths);

      // Should preserve the leading slash
      expect(result[0]).toBe('/home/dev');
    });

    it('should not lose directory structure', () => {
      const paths = ['/home/user/music/library'];
      const result = getParentFolderPaths(paths);

      // Should return /home/user/music
      expect(result[0]).toBe('/home/user/music');
    });

    it('should handle two-level absolute path', () => {
      const paths = ['/home/music'];
      const result = getParentFolderPaths(paths);

      // Parent of /home/music is /home
      expect(result[0]).toBe('/home');
    });

    it('should handle single-level absolute path', () => {
      const paths = ['/home'];
      const result = getParentFolderPaths(paths);

      expect(result[0]).toBe('/');
    });

    it('should handle root path', () => {
      const paths = ['/'];
      const result = getParentFolderPaths(paths);

      expect(result[0]).toBe('/');
    });
  });

  // ============================================================================
  // ISSUE #458 SPECIFIC REGRESSION TESTS
  // ============================================================================
  describe('issue #458 - AppImage and AUR path resolution', () => {
    it('should handle /home/dev/music without losing leading slash', () => {
      const paths = ['/home/dev/music/Library'];
      const result = getParentFolderPaths(paths);

      // This was the failing case: should NOT become "home/dev/music"
      expect(result[0]).toBe('/home/dev/music');
      expect(result[0].startsWith('/')).toBe(true);
      expect(result[0].includes('home/dev/music')).toBe(true);
    });

    it('should not create incorrect paths like /usr/lib/nora/home/dev/music', () => {
      const paths = ['/home/dev/music'];
      const result = getParentFolderPaths(paths);

      // Result should be /home/dev (parent of /home/dev/music), not /usr/lib/nora/home
      expect(result[0]).toBe('/home/dev');
      expect(result[0]).not.toContain('usr');
      expect(result[0]).not.toContain('nora');
    });

    it('should not create incorrect paths like /home/dev/git/home/dev/music', () => {
      const paths = ['/home/dev/music'];
      const result = getParentFolderPaths(paths);

      // Result should NOT have duplicate path segments
      expect(result[0]).not.toContain('home/dev/home/dev');
      expect(result[0]).toBe('/home/dev');
    });
  });

  // ============================================================================
  // MULTIPLE INDEPENDENT PATHS
  // ============================================================================
  describe('multiple independent paths', () => {
    it('should handle multiple independent paths', () => {
      const paths = ['/home/dev/music', '/var/lib/audio'];
      const result = getParentFolderPaths(paths);

      // Each parent should start with /
      expect(result.every((p) => p.startsWith('/'))).toBe(true);
      expect(result).toContain('/home/dev');
      expect(result).toContain('/var/lib');
    });

    it('should handle multiple paths with same root', () => {
      const paths = ['/media/music', '/media/videos'];
      const result = getParentFolderPaths(paths);

      // Both should reduce to /media
      expect(result[0]).toBe('/media');
    });

    it('should handle deeply nested paths with same root', () => {
      const paths = ['/home/user/music/rock/albums', '/home/user/music/jazz/artists'];
      const result = getParentFolderPaths(paths);

      // Both have same root and depth, so it picks first one and returns its parent
      expect(result[0]).toBe('/home/user/music/rock');
    });

    it('should handle three independent paths from different roots', () => {
      const paths = ['/home/music', '/mnt/storage/songs', '/var/lib/audio'];
      const result = getParentFolderPaths(paths);

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((p) => p.startsWith('/'))).toBe(true);
    });
  });

  // ============================================================================
  // WINDOWS-STYLE PATHS
  // ============================================================================
  describe('windows paths - backslash handling', () => {
    it('should handle Windows-style absolute paths', () => {
      const paths = ['C:\\Users\\Music\\Library'];
      const result = getParentFolderPaths(paths);

      // Should convert to forward slashes and work correctly
      expect(result[0]).toBe('C:/Users/Music');
    });

    it('should handle Windows-style paths consistently', () => {
      const paths = ['D:\\Data\\Audio\\Songs'];
      const result = getParentFolderPaths(paths);

      expect(result[0]).toBe('D:/Data/Audio');
    });

    it('should handle mixed separators in a single path', () => {
      const paths = ['/home\\dev/music'];
      const result = getParentFolderPaths(paths);

      // Should normalize and work
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle multiple Windows paths', () => {
      const paths = ['C:\\Music\\Rock', 'C:\\Music\\Jazz'];
      const result = getParentFolderPaths(paths);

      expect(result[0]).toBe('C:/Music');
    });
  });

  // ============================================================================
  // TRAILING SLASHES
  // ============================================================================
  describe('trailing slash handling', () => {
    it('should handle paths with trailing slashes', () => {
      const paths = ['/home/music/'];
      const result = getParentFolderPaths(paths);

      // Trailing slash filtered out, so /home/music/ becomes /home/music, returns parent /home
      expect(result[0]).toBe('/home');
    });

    it('should handle multiple trailing slashes', () => {
      const paths = ['/home/music//'];
      const result = getParentFolderPaths(paths);

      // Multiple trailing slashes filtered out, returns parent /home
      expect(result[0]).toBe('/home');
    });

    it('should handle inconsistent trailing slashes', () => {
      const paths = ['/home/music', '/var/audio/'];
      const result = getParentFolderPaths(paths);

      expect(result.every((p) => !p.endsWith('/'))).toBe(true);
    });
  });

  // ============================================================================
  // COMPLEX NESTED STRUCTURES
  // ============================================================================
  describe('complex nested structures', () => {
    it('should handle deeply nested paths (10+ levels)', () => {
      const paths = ['/home/user/music/library/rock/artists/beatles/albums/abbey-road/cd1'];
      const result = getParentFolderPaths(paths);

      expect(result[0]).toBe('/home/user/music/library/rock/artists/beatles/albums/abbey-road');
      expect(result[0].startsWith('/')).toBe(true);
    });

    it('should handle symlink-like nested structures', () => {
      const paths = ['/mnt/drive1/music/sync/library/backup/current'];
      const result = getParentFolderPaths(paths);

      expect(result[0].startsWith('/')).toBe(true);
      expect(result[0]).not.toContain('mnt/drive1/mnt/drive1');
      // Parent of /mnt/drive1/music/sync/library/backup/current should be /mnt/drive1/music/sync/library/backup
      expect(result[0]).toBe('/mnt/drive1/music/sync/library/backup');
    });
  });

  // ============================================================================
  // SPECIAL CHARACTERS AND EDGE CASES
  // ============================================================================
  describe('special characters', () => {
    it('should handle paths with spaces', () => {
      const paths = ['/home/my music/Library'];
      const result = getParentFolderPaths(paths);

      expect(result[0]).toBe('/home/my music');
      expect(result[0].startsWith('/')).toBe(true);
    });

    it('should handle paths with multiple spaces', () => {
      const paths = ['/home/user folder/audio files/songs'];
      const result = getParentFolderPaths(paths);

      expect(result[0]).toBe('/home/user folder/audio files');
    });

    it('should handle paths with dots', () => {
      const paths = ['/home/user.name/music.backup/songs'];
      const result = getParentFolderPaths(paths);

      expect(result[0]).toBe('/home/user.name/music.backup');
    });

    it('should handle paths with hyphens and underscores', () => {
      const paths = ['/home/user-name/music_library/songs_backup'];
      const result = getParentFolderPaths(paths);

      expect(result[0]).toBe('/home/user-name/music_library');
    });

    it('should handle paths with unicode characters', () => {
      const paths = ['/home/用户/音乐/库'];
      const result = getParentFolderPaths(paths);

      expect(result[0]).toBe('/home/用户/音乐');
    });

    it('should handle paths with mixed case', () => {
      const paths = ['/Home/User/Music/Library'];
      const result = getParentFolderPaths(paths);

      expect(result[0]).toBe('/Home/User/Music');
    });
  });

  // ============================================================================
  // DUPLICATE AND SIMILAR PATHS
  // ============================================================================
  describe('duplicate and similar paths', () => {
    it('should handle duplicate paths', () => {
      const paths = ['/home/music', '/home/music'];
      const result = getParentFolderPaths(paths);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toBe('/home');
    });

    it('should handle very similar paths', () => {
      const paths = ['/home/music', '/home/musics'];
      const result = getParentFolderPaths(paths);

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((p) => p.startsWith('/'))).toBe(true);
    });

    it('should handle paths that are parents of each other', () => {
      const paths = ['/home/music/rock', '/home/music'];
      const result = getParentFolderPaths(paths);

      // /home/music has 2 parts (shallowest), /home/music/rock has 3
      // Picks shallowest which is /home/music, returns its parent /home
      expect(result[0]).toBe('/home');
    });
  });

  // ============================================================================
  // RELATIVE PATHS
  // ============================================================================
  describe('relative paths', () => {
    it('should handle relative paths', () => {
      const paths = ['home/user/music'];
      const result = getParentFolderPaths(paths);

      expect(result[0]).toBe('home/user');
    });

    it('should handle relative paths with dots', () => {
      const paths = ['./music/library', './music/backup'];
      const result = getParentFolderPaths(paths);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should not add leading slash to relative paths', () => {
      const paths = ['music/library'];
      const result = getParentFolderPaths(paths);

      expect(result[0]).not.toContain('/music/library');
    });
  });

  // ============================================================================
  // CONSISTENCY AND INVARIANTS
  // ============================================================================
  describe('consistency invariants', () => {
    it('should always return paths with consistent separators (forward slashes)', () => {
      const paths = ['/home/music', 'C:\\Users\\Music'];
      const result = getParentFolderPaths(paths);

      expect(result.every((p) => !p.includes('\\') || p.includes(':'))).toBe(true);
    });

    it('should never create duplicate path segments', () => {
      const paths = ['/home/dev/music/rock'];
      const result = getParentFolderPaths(paths);

      const pathStr = result[0];
      const parts = pathStr.split('/').filter((p) => p);
      const uniqueParts = new Set(parts);

      // Check for no repeating consecutive segments
      expect(result[0]).not.toMatch(/\/(.+)\/\1/);
    });

    it('should preserve path hierarchy', () => {
      const paths = ['/a/b/c/d/e/f'];
      const result = getParentFolderPaths(paths);

      // Parent of a deeply nested path should still be deeper than its parent
      const parent = result[0];
      const parentOfParent = getParentFolderPaths([parent])[0];

      expect(parent.length).toBeGreaterThan(parentOfParent.length);
    });

    it('should not lose information when processing paths', () => {
      const paths = ['/home/user/music/rock', '/home/user/music/jazz'];
      const result = getParentFolderPaths(paths);

      // Should identify common parent correctly
      expect(result[0]).toContain('user');
      expect(result[0]).toContain('music');
    });
  });

  // ============================================================================
  // REAL-WORLD SCENARIOS
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should handle typical music library structure', () => {
      const paths = [
        '/home/user/Music/Artists/Beatles',
        '/home/user/Music/Albums/Help',
        '/home/user/Music/Playlists/Favorites'
      ];
      const result = getParentFolderPaths(paths);

      expect(result.every((p) => p.startsWith('/'))).toBe(true);
    });

    it('should handle multi-drive setup', () => {
      const paths = ['C:/Music/Rock', 'D:/Audio/Jazz', 'E:/Songs/Pop'];
      const result = getParentFolderPaths(paths);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle cloud storage paths', () => {
      const paths = ['/home/user/Dropbox/Music', '/home/user/OneDrive/Songs'];
      const result = getParentFolderPaths(paths);

      // Both have same root /home, but different depth:
      // /home/user/Dropbox/Music has 4 parts
      // /home/user/OneDrive/Songs has 4 parts (same)
      // Picks first with min depth, returns its parent
      expect(result[0]).toBe('/home/user/Dropbox');
    });

    it('should handle NAS and network paths', () => {
      const paths = ['/mnt/nas/Music', '/mnt/external/Audio'];
      const result = getParentFolderPaths(paths);

      expect(result.every((p) => p.startsWith('/'))).toBe(true);
    });
  });
});
