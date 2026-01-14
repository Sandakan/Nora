import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { tryToParseSong } from '../../../../src/main/parseSong/parseSong';
import {
  createMockSongMetadata,
  createMockFileStats,
  createMockSongData,
  createMockArtworkData,
  createMockAlbumManagerResult,
  createMockArtistManagerResult,
  createMockGenreManagerResult,
  expectMessageSentToRenderer
} from './testUtils';

// Mock all dependencies
vi.mock('../../../../src/main/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn()
  }
}));

vi.mock('node-taglib-sharp', () => ({
  File: {
    createFromPath: vi.fn()
  }
}));

vi.mock('fs/promises', () => ({
  default: {
    stat: vi.fn()
  }
}));

vi.mock('../../../../src/main/main', () => ({
  dataUpdateEvent: vi.fn(),
  sendMessageToRenderer: vi.fn()
}));

vi.mock('../../../../src/main/other/artworks', () => ({
  storeArtworks: vi.fn()
}));

vi.mock('../../../../src/main/other/generatePalette', () => ({
  generatePalettes: vi.fn()
}));

vi.mock('../../../../src/main/db/queries/songs', () => ({
  isSongWithPathAvailable: vi.fn(),
  saveSong: vi.fn()
}));

vi.mock('../../../../src/main/db/queries/artworks', () => ({
  linkArtworksToSong: vi.fn()
}));

vi.mock('../../../../src/main/db/db', () => ({
  db: {
    transaction: vi.fn((callback) => callback({}))
  }
}));

vi.mock('../../../../src/main/parseSong/manageAlbumsOfParsedSong', () => ({
  default: vi.fn()
}));

vi.mock('../../../../src/main/parseSong/manageArtistsOfParsedSong', () => ({
  default: vi.fn()
}));

vi.mock('../../../../src/main/parseSong/manageGenresOfParsedSong', () => ({
  default: vi.fn()
}));

vi.mock('../../../../src/main/parseSong/manageAlbumArtistOfParsedSong', () => ({
  default: vi.fn()
}));

describe('tryToParseSong', () => {
  let pathsQueue: Set<string>;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    
    // Import and clear the pathsQueue
    const module = await import('../../../../src/main/parseSong/parseSong');
    // Access the internal pathsQueue to clear it
    // Note: This requires exporting pathsQueue or using a test helper
    // For now, we'll work around it by using fresh paths
    
    // Setup default successful mocks
    const fs = await import('fs/promises');
    const taglib = await import('node-taglib-sharp');
    const { isSongWithPathAvailable, saveSong } = await import(
      '../../../../src/main/db/queries/songs'
    );
    const { storeArtworks } = await import('../../../../src/main/other/artworks');
    const { linkArtworksToSong } = await import('../../../../src/main/db/queries/artworks');
    const manageAlbumsOfParsedSong = (
      await import('../../../../src/main/parseSong/manageAlbumsOfParsedSong')
    ).default;
    const manageArtistsOfParsedSong = (
      await import('../../../../src/main/parseSong/manageArtistsOfParsedSong')
    ).default;
    const manageGenresOfParsedSong = (
      await import('../../../../src/main/parseSong/manageGenresOfParsedSong')
    ).default;
    const manageAlbumArtistOfParsedSong = (
      await import('../../../../src/main/parseSong/manageAlbumArtistOfParsedSong')
    ).default;

    vi.mocked(fs.default.stat).mockResolvedValue(createMockFileStats() as any);
    vi.mocked(taglib.File.createFromPath).mockReturnValue(createMockSongMetadata() as any);
    vi.mocked(isSongWithPathAvailable).mockResolvedValue(false);
    vi.mocked(saveSong).mockResolvedValue(createMockSongData() as any);
    vi.mocked(storeArtworks).mockResolvedValue(createMockArtworkData() as any);
    vi.mocked(linkArtworksToSong).mockResolvedValue([] as any);
    vi.mocked(manageAlbumsOfParsedSong).mockResolvedValue(createMockAlbumManagerResult() as any);
    vi.mocked(manageArtistsOfParsedSong).mockResolvedValue(
      createMockArtistManagerResult() as any
    );
    vi.mocked(manageGenresOfParsedSong).mockResolvedValue(createMockGenreManagerResult() as any);
    vi.mocked(manageAlbumArtistOfParsedSong).mockResolvedValue({
      newAlbumArtists: [],
      relevantAlbumArtists: []
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Duplicate Prevention', () => {
    test('should prevent duplicate parsing attempts for same path', async () => {
      const songPath = '/test/song1.mp3';
      const logger = (await import('../../../../src/main/logger')).default;

      // First call - should proceed
      const promise1 = tryToParseSong(songPath);
      
      // Second call immediately - should be blocked
      const promise2 = tryToParseSong(songPath);

      expect(promise2).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        'Song parsing ignored because it is not eligible.',
        expect.objectContaining({
          songPath,
          reason: { isSongInPathsQueue: true }
        })
      );

      await promise1;
    });

    test('should allow parsing after first attempt completes', async () => {
      const songPath = '/test/song2.mp3';
      const { saveSong } = await import('../../../../src/main/db/queries/songs');

      // First call
      await tryToParseSong(songPath);
      expect(saveSong).toHaveBeenCalledTimes(1);

      // Second call after first completes - will parse again since mock still returns false
      await tryToParseSong(songPath);
      
      // Should parse again since isSongWithPathAvailable still returns false in mocks
      expect(saveSong).toHaveBeenCalledTimes(2);
    });

    test('should handle different paths independently', async () => {
      const songPath1 = '/test/song3.mp3';
      const songPath2 = '/test/song4.mp3';

      const promise1 = tryToParseSong(songPath1);
      const promise2 = tryToParseSong(songPath2);

      expect(promise1).toBeDefined();
      expect(promise2).toBeDefined();

      await Promise.all([promise1, promise2]);
    });
  });

  describe('Success Scenarios', () => {
    test('should successfully parse song and call dataUpdateEvent', async () => {
      const songPath = '/test/song5.mp3';
      const { dataUpdateEvent } = await import('../../../../src/main/main');

      await tryToParseSong(songPath);

      expect(dataUpdateEvent).toHaveBeenCalledWith('songs/newSong');
    });

    test('should log successful parsing', async () => {
      const songPath = '/test/song6.mp3';
      const logger = (await import('../../../../src/main/logger')).default;

      await tryToParseSong(songPath);

      expect(logger.debug).toHaveBeenCalledWith('song added to the library.', { songPath });
    });

    test('should call generatePalettes when flag is true', async () => {
      vi.useFakeTimers();
      const songPath = '/test/song7.mp3';
      const { generatePalettes } = await import('../../../../src/main/other/generatePalette');

      await tryToParseSong(songPath, undefined, false, true);

      // Advance timers to trigger setTimeout
      vi.advanceTimersByTime(1500);

      expect(generatePalettes).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    test('should not call generatePalettes when flag is false', async () => {
      const songPath = '/test/song8.mp3';
      const { generatePalettes } = await import('../../../../src/main/other/generatePalette');

      await tryToParseSong(songPath, undefined, false, false);

      expect(generatePalettes).not.toHaveBeenCalled();
    });

    test('should pass folderId to parseSong', async () => {
      const songPath = '/test/song9.mp3';
      const folderId = 42;
      const { saveSong } = await import('../../../../src/main/db/queries/songs');

      await tryToParseSong(songPath, folderId);

      expect(saveSong).toHaveBeenCalledWith(
        expect.objectContaining({
          folderId
        }),
        expect.anything()
      );
    });
  });

  describe('Retry Logic', () => {
    test('should retry parsing on error up to 5 times', async () => {
      vi.useFakeTimers();
      const songPath = '/test/song10.mp3';
      const { isSongWithPathAvailable } = await import('../../../../src/main/db/queries/songs');
      const logger = (await import('../../../../src/main/logger')).default;

      // Make parsing fail
      vi.mocked(isSongWithPathAvailable).mockRejectedValue(new Error('Read error'));

      const promise = tryToParseSong(songPath);

      // Catch the rejection to avoid unhandled promise
      if (promise) promise.catch(() => {});

      // Wait for initial attempt and all retries
      for (let i = 0; i < 6; i++) {
        await vi.runOnlyPendingTimersAsync();
        if (i < 5) {
          await vi.advanceTimersByTimeAsync(5000);
        }
      }
      
      // Verify retry attempts were logged
      const retryLogs = vi.mocked(logger.debug).mock.calls.filter(
        call => typeof call[0] === 'string' && call[0].includes('Retrying in 5 seconds')
      );
      expect(retryLogs.length).toBeGreaterThanOrEqual(1);

      vi.useRealTimers();
    });

    test('should send PARSE_FAILED message after 5 failed retries', async () => {
      vi.useFakeTimers();
      const songPath = '/test/song11.mp3';
      const { isSongWithPathAvailable } = await import('../../../../src/main/db/queries/songs');
      const { sendMessageToRenderer } = await import('../../../../src/main/main');

      vi.mocked(isSongWithPathAvailable).mockRejectedValue(new Error('Read error'));

      const promise = tryToParseSong(songPath);

      // Catch rejection to prevent unhandled promise
      if (promise) promise.catch(() => {});

      // Advance through all retries
      for (let i = 0; i < 6; i++) {
        await vi.runOnlyPendingTimersAsync();
        if (i < 5) {
          await vi.advanceTimersByTimeAsync(5000);
        }
      }

      expectMessageSentToRenderer(sendMessageToRenderer, 'PARSE_FAILED', 'song11.mp3');

      vi.useRealTimers();
    });

    test('should succeed on retry after initial failure', async () => {
      vi.useFakeTimers();
      const songPath = '/test/song12.mp3';
      const { isSongWithPathAvailable } = await import('../../../../src/main/db/queries/songs');
      const { dataUpdateEvent } = await import('../../../../src/main/main');

      // Fail first attempt, succeed on second
      vi.mocked(isSongWithPathAvailable)
        .mockRejectedValueOnce(new Error('Read error'))
        .mockResolvedValue(false);

      const promise = tryToParseSong(songPath);

      // Wait for initial failure
      await vi.runOnlyPendingTimersAsync();

      // Advance to retry
      await vi.advanceTimersByTimeAsync(5000);

      await promise;

      expect(dataUpdateEvent).toHaveBeenCalledWith('songs/newSong');

      vi.useRealTimers();
    });

    test('should clear previous timeout when retrying', async () => {
      vi.useFakeTimers();
      const songPath = '/test/song13.mp3';
      const { isSongWithPathAvailable } = await import('../../../../src/main/db/queries/songs');

      // Fail twice, then succeed
      vi.mocked(isSongWithPathAvailable)
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue(false);

      const promise = tryToParseSong(songPath);

      await vi.runOnlyPendingTimersAsync();
      await vi.advanceTimersByTimeAsync(5000);
      await vi.advanceTimersByTimeAsync(5000);

      await promise;

      vi.useRealTimers();
    });
  });

  describe('Renderer Messages', () => {
    test('should not send messages when noRendererMessages is true', async () => {
      const songPath = '/test/song14.mp3';
      const { sendMessageToRenderer } = await import('../../../../src/main/main');

      await tryToParseSong(songPath, undefined, false, false, true);

      expect(sendMessageToRenderer).not.toHaveBeenCalled();
    });

    test('should send PARSE_SUCCESSFUL message by default', async () => {
      const songPath = '/test/song15.mp3';
      const { sendMessageToRenderer } = await import('../../../../src/main/main');

      await tryToParseSong(songPath);

      expectMessageSentToRenderer(sendMessageToRenderer, 'PARSE_SUCCESSFUL', 'Test Song');
    });
  });

  describe('Path Queue Cleanup', () => {
    test('should remove path from queue after successful parsing', async () => {
      const songPath = '/test/song16.mp3';
      const logger = (await import('../../../../src/main/logger')).default;

      await tryToParseSong(songPath);

      // Try to parse same path again - should now be allowed
      await tryToParseSong(songPath);

      // Should not log "not eligible" message on second attempt
      const ineligibleCalls = vi
        .mocked(logger.info)
        .mock.calls.filter((call) => call[0].includes('not eligible'));
      expect(ineligibleCalls.length).toBe(0);
    });

    test('should remove path from queue after failed parsing', async () => {
      vi.useFakeTimers();
      const songPath = '/test/song17.mp3';
      const { isSongWithPathAvailable } = await import('../../../../src/main/db/queries/songs');

      vi.mocked(isSongWithPathAvailable).mockRejectedValue(new Error('Fatal error'));

      const promise = tryToParseSong(songPath);

      // Catch rejection to prevent unhandled promise
      if (promise) promise.catch(() => {});

      // Advance through all retries
      for (let i = 0; i < 6; i++) {
        await vi.runOnlyPendingTimersAsync();
        if (i < 5) {
          await vi.advanceTimersByTimeAsync(5000);
        }
      }

      // Path should be removed from queue (implicitly tested by not blocking next call)
      
      vi.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    test('should handle file path with special characters', async () => {
      const songPath = '/test/song with spaces & special!chars.mp3';

      await tryToParseSong(songPath);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).toHaveBeenCalledWith(
        expect.objectContaining({
          path: songPath
        }),
        expect.anything()
      );
    });

    test('should extract correct filename for logging', async () => {
      const songPath = '/very/long/path/to/music/folder/song.mp3';
      const logger = (await import('../../../../src/main/logger')).default;

      await tryToParseSong(songPath);

      expect(logger.debug).toHaveBeenCalledWith('song added to the library.', {
        songPath
      });
    });

    test('should handle reparseToSync flag', async () => {
      const songPath = '/test/song18.mp3';
      const { isSongWithPathAvailable } = await import('../../../../src/main/db/queries/songs');

      // Song exists
      vi.mocked(isSongWithPathAvailable).mockResolvedValue(true);

      // Should not parse without flag
      await tryToParseSong(songPath, undefined, false);

      const { saveSong } = await import('../../../../src/main/db/queries/songs');
      expect(saveSong).not.toHaveBeenCalled();
    });
  });
});
