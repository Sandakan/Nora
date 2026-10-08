import { describe, test, expect, vi, beforeEach } from 'vitest';

import AudioPlayer from '../../../../../src/renderer/src/other/player';
import PlayerQueue from '../../../../../src/renderer/src/other/playerQueue';

type MockWindowApi = {
  api: {
    audioLibraryControls: {
      getSong: ReturnType<typeof vi.fn>;
    };
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  (window as unknown as MockWindowApi).api.audioLibraryControls.getSong = vi
    .fn()
    .mockImplementation((songId: number) =>
      Promise.resolve({
        songId,
        title: `Song ${songId}`,
        path: `http://localhost:5000/song/${songId}`,
        duration: 180
      })
    );
});

describe('AudioPlayer', () => {
  describe('positionChange handling', () => {
    test('does not reload song if the currentSongId is unchanged', async () => {
      const queue = new PlayerQueue([101, 102, 103], 0);
      const player = new AudioPlayer(queue);

      // Manually trigger initial song load
      const playerInternal = player as unknown as {
        loadSong: (id: number) => Promise<void>;
      };
      await playerInternal.loadSong(101);
      expect(player.audio.src).toContain('101');
      expect(
        (player.audio as unknown as { load: ReturnType<typeof vi.fn> }).load
      ).toHaveBeenCalledTimes(1);

      // Reset mock counts
      vi.clearAllMocks();

      // Emit positionChange with the SAME songId (e.g. index shifted or queue rearranged)
      (
        queue as unknown as {
          emit: (event: string, data: unknown) => void;
        }
      ).emit('positionChange', {
        oldPosition: 0,
        newPosition: 0,
        currentSongId: 101
      });

      // Since songId 101 is already loaded, load() should NOT be called again
      expect(
        (player.audio as unknown as { load: ReturnType<typeof vi.fn> }).load
      ).not.toHaveBeenCalled();
      expect(
        (window as unknown as MockWindowApi).api.audioLibraryControls.getSong
      ).not.toHaveBeenCalled();

      player.destroy();
    });

    test('loads new song when currentSongId changes on positionChange', async () => {
      const queue = new PlayerQueue([101, 102, 103], 0);
      const player = new AudioPlayer(queue);

      const playerInternal = player as unknown as {
        loadSong: (id: number) => Promise<void>;
      };
      await playerInternal.loadSong(101);
      expect(player.audio.src).toContain('101');

      vi.clearAllMocks();

      // Move queue to position 1 (song 102)
      queue.moveToNext();

      // Wait a tick for async loadSong in positionChange handler
      await vi.waitFor(() => {
        expect(
          (window as unknown as MockWindowApi).api.audioLibraryControls.getSong
        ).toHaveBeenCalledWith(102);
        expect(player.audio.src).toContain('102');
      });

      player.destroy();
    });
  });
});
