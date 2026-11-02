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

  describe('togglePlayback', () => {
    test('pauses audio when playing and forcePlay is undefined', async () => {
      const queue = new PlayerQueue([101], 0);
      const player = new AudioPlayer(queue);
      player.audio.paused = false;

      const pauseSpy = vi.spyOn(player, 'pause').mockResolvedValue(undefined);
      const playSpy = vi.spyOn(player, 'play').mockResolvedValue(undefined);

      await player.togglePlayback();

      expect(pauseSpy).toHaveBeenCalledTimes(1);
      expect(playSpy).not.toHaveBeenCalled();

      player.destroy();
    });

    test('resumes audio when paused and forcePlay is undefined', async () => {
      const queue = new PlayerQueue([101], 0);
      const player = new AudioPlayer(queue);
      player.audio.paused = true;

      const pauseSpy = vi.spyOn(player, 'pause').mockResolvedValue(undefined);
      const playSpy = vi.spyOn(player, 'play').mockResolvedValue(undefined);

      await player.togglePlayback();

      expect(playSpy).toHaveBeenCalledTimes(1);
      expect(pauseSpy).not.toHaveBeenCalled();

      player.destroy();
    });

    test('pauses audio when playing even if an event object is passed', async () => {
      const queue = new PlayerQueue([101], 0);
      const player = new AudioPlayer(queue);
      player.audio.paused = false;

      const pauseSpy = vi.spyOn(player, 'pause').mockResolvedValue(undefined);
      const playSpy = vi.spyOn(player, 'play').mockResolvedValue(undefined);

      // Simulating a click event passed to togglePlayback
      const clickEvent = { isTrusted: true, type: 'click' } as unknown as boolean;
      await player.togglePlayback(clickEvent);

      expect(pauseSpy).toHaveBeenCalledTimes(1);
      expect(playSpy).not.toHaveBeenCalled();

      player.destroy();
    });

    test('forces play when forcePlay is true', async () => {
      const queue = new PlayerQueue([101], 0);
      const player = new AudioPlayer(queue);
      player.audio.paused = false;

      const playSpy = vi.spyOn(player, 'play').mockResolvedValue(undefined);
      await player.togglePlayback(true);

      expect(playSpy).toHaveBeenCalledTimes(1);

      player.destroy();
    });

    test('forces pause when forcePlay is false', async () => {
      const queue = new PlayerQueue([101], 0);
      const player = new AudioPlayer(queue);
      player.audio.paused = true;

      const pauseSpy = vi.spyOn(player, 'pause').mockResolvedValue(undefined);
      await player.togglePlayback(false);

      expect(pauseSpy).toHaveBeenCalledTimes(1);

      player.destroy();
    });
  });
});
