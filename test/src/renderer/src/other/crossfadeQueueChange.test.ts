import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../../src/renderer/src/store/store', () => ({
  dispatch: vi.fn(),
  store: {
    state: {
      player: {
        volume: { value: 50, isMuted: false },
        playbackRate: 1,
        isRepeating: 'off' as const
      }
    },
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
  }
}));

vi.mock('../../../../../src/renderer/src/utils/localStorage', () => ({
  default: {
    playback: {
      setCurrentSongOptions: vi.fn(),
      setPlaybackOptions: vi.fn(),
      getPlaybackOptions: vi.fn().mockReturnValue(0)
    },
    getLocalStorage: vi.fn().mockReturnValue({})
  }
}));

vi.mock('../../../../../src/renderer/src/other/equalizerData', () => ({
  equalizerBandHertzData: {}
}));

class MockAudioContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  createGain() {
    return {
      gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn()
    };
  }
  createBiquadFilter() {
    return {
      type: 'peaking',
      frequency: { value: 0 },
      Q: { value: 1 },
      gain: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn()
    };
  }
  createMediaElementSource() {
    return { connect: vi.fn(), disconnect: vi.fn() };
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

class MockAudio {
  crossOrigin = '';
  preload = '';
  defaultPlaybackRate = 1;
  playbackRate = 1;
  volume = 1;
  muted = false;
  paused = true;
  currentTime = 0;
  duration = 100;
  readyState = 0;
  src = '';
  srcObject = null;
  currentSrc = '';
  private listeners: { [ev: string]: ((...a: unknown[]) => void)[] } = {};
  addEventListener(ev: string, fn: (...a: unknown[]) => void) {
    (this.listeners[ev] ??= []).push(fn);
  }
  removeEventListener(ev: string, fn: (...a: unknown[]) => void) {
    this.listeners[ev] = this.listeners[ev]?.filter((f) => f !== fn) ?? [];
  }
  dispatchEvent(e: Event) {
    this.listeners[e.type]?.forEach((fn) => fn(e));
  }
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  load() {
    /* no-op */
  }
  setAttribute(_n: string, _v: string) {
    /* no-op */
  }
  removeAttribute(_n: string) {
    /* no-op */
  }
}

// @ts-expect-error -- Node test environment lacks Web Audio API globals
globalThis.AudioContext = MockAudioContext;
// @ts-expect-error -- Node test environment lacks HTMLAudioElement constructor
globalThis.Audio = MockAudio;
// @ts-expect-error -- Node test environment lacks window object
globalThis.window = globalThis;
// @ts-expect-error -- window.api used by preloadNextSong wrapper in tests
globalThis.window.api = {
  audioLibraryControls: {
    getSong: vi.fn().mockResolvedValue({ path: 'file:///song.mp3', songId: 2, duration: 100 })
  }
};

import AudioPlayer from '../../../../../src/renderer/src/other/player';
import PlayerQueue from '../../../../../src/renderer/src/other/playerQueue';

describe('AudioPlayer: crossfade + queue change', () => {
  it('aborts an active crossfade before refreshing the preload when the next song changes', async () => {
    const queue = new PlayerQueue([1, 2, 3]);
    const player = new AudioPlayer(queue);

    const asAny = player as unknown as {
      isCrossfading: boolean;
      preloadedSongId: number | null;
      preloadedSongData: unknown;
      preloadNextSong: () => Promise<void>;
      abortCrossfade: () => void;
      queueHandlers: Record<string, (...a: unknown[]) => unknown>;
    };

    vi.spyOn(asAny, 'preloadNextSong').mockResolvedValue(undefined as never);
    const abortSpy = vi.spyOn(asAny, 'abortCrossfade').mockImplementation(() => {
      asAny.isCrossfading = false;
      asAny.preloadedSongId = null;
      asAny.preloadedSongData = null;
    });

    // Simulate an active crossfade toward song 2 while the queue's effective
    // next is a different song (e.g. the user reordered the queue mid-fade).
    asAny.isCrossfading = true;
    asAny.preloadedSongId = 2;
    asAny.preloadedSongData = { songId: 2, path: 'file:///2.mp3' };

    // Move the queue so the current song is 2 and the effective next is 3:
    // the stale preload target (2) is no longer the next song.
    queue.moveToPosition(1);
    expect(queue.currentSongId).toBe(2);
    expect(queue.songIds[2]).toBe(3);

    asAny.queueHandlers.queueChange({ type: 'queueChange' });

    // The crossfade must be aborted (the incoming element cannot be reused for
    // a different target), and a fresh preload must be scheduled.
    expect(abortSpy).toHaveBeenCalled();
    expect(asAny.preloadNextSong).toHaveBeenCalled();
  });

  it('keeps the crossfade when the queue change does not alter the effective next song', async () => {
    const queue = new PlayerQueue([1, 2, 3]);
    const player = new AudioPlayer(queue);

    const asAny = player as unknown as {
      isCrossfading: boolean;
      preloadedSongId: number | null;
      preloadedSongData: unknown;
      preloadNextSong: () => Promise<void>;
      abortCrossfade: () => void;
      queueHandlers: Record<string, (...a: unknown[]) => unknown>;
    };

    vi.spyOn(asAny, 'preloadNextSong').mockResolvedValue(undefined as never);
    const abortSpy = vi.spyOn(asAny, 'abortCrossfade').mockImplementation(() => {
      asAny.isCrossfading = false;
      asAny.preloadedSongId = null;
      asAny.preloadedSongData = null;
    });

    // Active crossfade whose target IS still the effective next song: the
    // queueChange handler must not abort it.
    asAny.isCrossfading = true;
    asAny.preloadedSongId = 2;

    asAny.queueHandlers.queueChange({ type: 'queueChange' });

    expect(abortSpy).not.toHaveBeenCalled();
  });
});
