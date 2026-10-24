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

    test('togglePlayback handles boolean and non-boolean parameters correctly', async () => {
      const queue = new PlayerQueue([101, 102], 0);
      const player = new AudioPlayer(queue);
      const playerInternal = player as unknown as {
        isUsingNativeEngine: boolean;
        nativeIsPaused: boolean;
      };
      playerInternal.isUsingNativeEngine = true;
      playerInternal.nativeIsPaused = true;

      const playSpy = vi.spyOn(player, 'play').mockResolvedValue(undefined);
      const pauseSpy = vi.spyOn(player, 'pause').mockResolvedValue(undefined);

      // Initially paused: togglePlayback() should call play
      await player.togglePlayback();
      expect(playSpy).toHaveBeenCalledTimes(1);

      // Force play: togglePlayback(true) calls play
      await player.togglePlayback(true);
      expect(playSpy).toHaveBeenCalledTimes(2);

      // Force pause: togglePlayback(false) calls pause
      await player.togglePlayback(false);
      expect(pauseSpy).toHaveBeenCalledTimes(1);

      // Mock paused to false (simulating active playback)
      vi.spyOn(player, 'paused', 'get').mockReturnValue(false);

      // When playing: togglePlayback() should call pause
      await player.togglePlayback();
      expect(pauseSpy).toHaveBeenCalledTimes(2);

      // When playing: passing an event object (e.g. from Button clickHandler) should NOT force-play, it must toggle (pause)
      const mockMouseEvent = { type: 'click', target: {} } as unknown as boolean;
      await player.togglePlayback(mockMouseEvent);
      expect(pauseSpy).toHaveBeenCalledTimes(3);
      expect(playSpy).toHaveBeenCalledTimes(2);

      player.destroy();
    });
  });
});
