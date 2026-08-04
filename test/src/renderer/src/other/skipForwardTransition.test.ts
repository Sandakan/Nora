import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('../../../../../src/renderer/src/utils/log', () => ({
  default: vi.fn()
}));

class MockAudioContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  createGain() {
    return {
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
        linearRampToValueAtTime: vi.fn()
      },
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
    return true;
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

import AudioPlayer from '../../../../../src/renderer/src/other/player';
import PlayerQueue from '../../../../../src/renderer/src/other/playerQueue';

describe('AudioPlayer: skipForward transition decision', () => {
  const setupPlayer = (crossfadeDuration: number) => {
    const queue = new PlayerQueue([1, 2, 3]);
    const player = new AudioPlayer(queue) as unknown as {
      crossfadeDuration: number;
      preloadedSongId: number | null;
      preloadedSongData: unknown;
      isCrossfading: boolean;
      preloadGeneration: number;
      gaplessSwapToNext: () => void;
      startCrossfade: () => void;
      getEffectiveNextSongId: () => number | null;
      skipForward: (reason?: string) => Promise<void>;
    };
    player.crossfadeDuration = crossfadeDuration;
    player.preloadedSongId = 2;
    player.preloadedSongData = { songId: 2, path: 'file:///2.mp3' };
    player.isCrossfading = false;
    return { queue, player };
  };

  it('uses gaplessSwapToNext when crossfade is disabled (duration === 0) and the preload matches the effective next', async () => {
    const { player } = setupPlayer(0);

    const gaplessSpy = vi.spyOn(player, 'gaplessSwapToNext').mockImplementation(() => {});
    const crossfadeSpy = vi.spyOn(player, 'startCrossfade').mockImplementation(() => {});

    await player.skipForward('USER_AUTO_NEXT');

    expect(gaplessSpy).toHaveBeenCalledTimes(1);
    expect(crossfadeSpy).not.toHaveBeenCalled();
  });

  it('uses startCrossfade when crossfade is enabled (duration > 0) and the preload matches the effective next', async () => {
    const { player } = setupPlayer(3000);

    const gaplessSpy = vi.spyOn(player, 'gaplessSwapToNext').mockImplementation(() => {});
    const crossfadeSpy = vi.spyOn(player, 'startCrossfade').mockImplementation(() => {});

    await player.skipForward('USER_AUTO_NEXT');

    expect(crossfadeSpy).toHaveBeenCalledTimes(1);
    expect(gaplessSpy).not.toHaveBeenCalled();
  });

  it('does not start a crossfade when the preload does not match the effective next song', async () => {
    const { player } = setupPlayer(3000);
    // Preload is song 2, but move the queue so the effective next is no longer 2.
    player.preloadedSongId = 3;
    player.preloadedSongData = { songId: 3, path: 'file:///3.mp3' };

    const gaplessSpy = vi.spyOn(player, 'gaplessSwapToNext').mockImplementation(() => {});
    const crossfadeSpy = vi.spyOn(player, 'startCrossfade').mockImplementation(() => {});

    await player.skipForward('USER_AUTO_NEXT');

    expect(crossfadeSpy).not.toHaveBeenCalled();
    expect(gaplessSpy).not.toHaveBeenCalled();
  });
});

describe('AudioPlayer: abortCrossfade state reset', () => {
  it('resets crossfade state and advances the preload generation', () => {
    const queue = new PlayerQueue([1, 2, 3]);
    const player = new AudioPlayer(queue) as unknown as {
      isCrossfading: boolean;
      preloadedSongId: number | null;
      preloadedSongData: unknown;
      preloadGeneration: number;
      abortCrossfade: () => void;
    };

    player.isCrossfading = true;
    player.preloadedSongId = 2;
    player.preloadedSongData = { songId: 2, path: 'file:///2.mp3' };
    const beforeGen = player.preloadGeneration;

    player.abortCrossfade();

    expect(player.isCrossfading).toBe(false);
    expect(player.preloadedSongId).toBeNull();
    expect(player.preloadedSongData).toBeNull();
    expect(player.preloadGeneration).toBe(beforeGen + 1);
  });

  it('is a no-op when not currently crossfading', () => {
    const queue = new PlayerQueue([1, 2, 3]);
    const player = new AudioPlayer(queue) as unknown as {
      isCrossfading: boolean;
      preloadGeneration: number;
      abortCrossfade: () => void;
    };

    player.isCrossfading = false;
    const beforeGen = player.preloadGeneration;

    player.abortCrossfade();

    expect(player.preloadGeneration).toBe(beforeGen);
  });
});

describe('AudioPlayer: startCrossfade short-track clamp', () => {
  it('clamps the fade duration to half the active track length for short tracks', () => {
    const queue = new PlayerQueue([1, 2, 3]);
    const player = new AudioPlayer(queue) as unknown as {
      crossfadeDuration: number;
      preloadedSongId: number | null;
      preloadedSongData: unknown;
      isCrossfading: boolean;
      crossfadeTimer: ReturnType<typeof setTimeout> | null;
      startCrossfade: () => void;
      getActiveAudio: () => { duration: number };
    };

    player.crossfadeDuration = 12000;
    player.preloadedSongId = 2;
    player.preloadedSongData = { songId: 2, path: 'file:///2.mp3' };
    player.isCrossfading = false;

    const startCrossfade = player.startCrossfade;
    // Capture the timer duration via the global setTimeout mock.
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    startCrossfade.call(player);
    // The clamp: min(12000/1000, 100 * 0.5) = min(12, 50) = 12s for duration 100.
    expect(player.isCrossfading).toBe(true);
    expect(setTimeoutSpy).toHaveBeenCalled();
    const delay = setTimeoutSpy.mock.calls[0]?.[1] as number;
    expect(delay).toBe(12000);
    setTimeoutSpy.mockRestore();
  });
});
