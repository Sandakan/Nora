import { describe, test, expect, vi, beforeEach } from 'vitest';

import AudioPlayer from '../../../../../src/renderer/src/other/player';
import PlayerQueue from '../../../../../src/renderer/src/other/playerQueue';

type MockAudioEngine = {
  load: ReturnType<typeof vi.fn>;
  preload: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
  setVolume: ReturnType<typeof vi.fn>;
  setPlaybackRate: ReturnType<typeof vi.fn>;
  setEqGains: ReturnType<typeof vi.fn>;
  onTrackEnded: ReturnType<typeof vi.fn>;
  onPlaybackError: ReturnType<typeof vi.fn>;
  onPositionTick: ReturnType<typeof vi.fn>;
  onTrackTransitioned: ReturnType<typeof vi.fn>;
};

let mockAudioEngine: MockAudioEngine;

beforeEach(() => {
  vi.clearAllMocks();

  mockAudioEngine = {
    load: vi.fn().mockResolvedValue({ durationSecs: 180, sampleRate: 44100, channels: 2 }),
    preload: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    setVolume: vi.fn().mockResolvedValue(undefined),
    setPlaybackRate: vi.fn().mockResolvedValue(undefined),
    setEqGains: vi.fn().mockResolvedValue(undefined),
    onTrackEnded: vi.fn().mockReturnValue(() => {}),
    onPlaybackError: vi.fn().mockReturnValue(() => {}),
    onPositionTick: vi.fn().mockReturnValue(() => {}),
    onTrackTransitioned: vi.fn().mockReturnValue(() => {})
  };

  const winApi = (window as unknown as { api?: Record<string, unknown> }).api || {};
  winApi.audioEngine = mockAudioEngine;
  winApi.properties = winApi.properties || { isInDevelopment: false };
  winApi.audioLibraryControls = {
    getSong: vi.fn().mockImplementation((songId: number) =>
      Promise.resolve({
        songId,
        title: `Song ${songId}`,
        path: `http://localhost:5000/song/${songId}`,
        duration: 180
      })
    )
  };
  (window as unknown as { api: Record<string, unknown> }).api = winApi;
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
      expect(mockAudioEngine.load).toHaveBeenCalledTimes(1);
      expect(mockAudioEngine.load).toHaveBeenCalledWith(
        'http://localhost:5000/song/101',
        expect.anything()
      );

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
      expect(mockAudioEngine.load).not.toHaveBeenCalled();

      player.destroy();
    });

    test('loads new song when currentSongId changes on positionChange', async () => {
      const queue = new PlayerQueue([101, 102, 103], 0);
      const player = new AudioPlayer(queue);

      const playerInternal = player as unknown as {
        loadSong: (id: number) => Promise<void>;
      };
      await playerInternal.loadSong(101);
      expect(mockAudioEngine.load).toHaveBeenCalledWith(
        'http://localhost:5000/song/101',
        expect.anything()
      );

      vi.clearAllMocks();

      // Move queue to position 1 (song 102)
      queue.moveToNext();

      // Wait a tick for async loadSong in positionChange handler
      await vi.waitFor(() => {
        expect(mockAudioEngine.load).toHaveBeenCalledWith(
          'http://localhost:5000/song/102',
          expect.anything()
        );
      });

      player.destroy();
    });

    test('togglePlayback handles boolean and non-boolean parameters correctly', async () => {
      const queue = new PlayerQueue([101, 102], 0);
      const player = new AudioPlayer(queue);
      const playerInternal = player as unknown as {
        nativeIsPaused: boolean;
      };
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
