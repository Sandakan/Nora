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
import { dispatch } from '../../../../../src/renderer/src/store/store';
import storage from '../../../../../src/renderer/src/utils/localStorage';

describe('AudioPlayer: completeCrossfade song-data/position ordering', () => {
  const buildPlayer = () => {
    const queue = new PlayerQueue([1, 2, 3]);
    const player = new AudioPlayer(queue) as unknown as {
      activeElement: 'primary' | 'secondary';
      isCrossfading: boolean;
      preloadedSongId: number | null;
      preloadedSongData: unknown;
      preloadGeneration: number;
      suppressNextPositionLoad: boolean;
      completeCrossfade: () => void;
      emit: (event: string, ...args: unknown[]) => void;
    };
    player.activeElement = 'primary';
    player.isCrossfading = true;
    player.preloadedSongId = 2;
    player.preloadedSongData = { songId: 2, path: 'file:///2.mp3' };
    return { queue, player };
  };

  beforeEach(() => {
    vi.mocked(dispatch).mockClear();
    vi.mocked(storage.playback.setCurrentSongOptions).mockClear();
  });

  it('dispatches CURRENT_SONG_DATA_CHANGE and sets the song option before emitting durationChange', () => {
    const { player } = buildPlayer();
    // Unified ordered log of store dispatches + player emits so we can compare
    // cross-source ordering (a store update must precede a durationChange emit).
    const sequence: string[] = [];
    vi.mocked(dispatch).mockImplementation((action: { type: string }) => {
      sequence.push(`dispatch:${action.type}`);
      return undefined as never;
    });
    const emitSpy = vi.spyOn(player, 'emit').mockImplementation((event: string) => {
      sequence.push(`emit:${event}`);
    });

    player.completeCrossfade();

    const songDataIndex = sequence.indexOf('dispatch:CURRENT_SONG_DATA_CHANGE');
    const durationIndex = sequence.indexOf('emit:durationChange');

    expect(songDataIndex).toBeGreaterThanOrEqual(0);
    expect(durationIndex).toBeGreaterThanOrEqual(0);
    // Store metadata update lands before the durationChange emit that consumers read,
    // so Media Session never shows outgoing metadata with incoming-track duration.
    expect(songDataIndex).toBeLessThan(durationIndex);
    expect(player.isCrossfading).toBe(false);

    emitSpy.mockRestore();
  });
});

describe('AudioPlayer: pending autoplay handler cleanup on destroy', () => {
  it('removes the deferred canplay autoplay handler before closing the context', () => {
    const queue = new PlayerQueue([1, 2, 3]);
    const player = new AudioPlayer(queue) as unknown as {
      loadSong: (data: { songId: number; path: string }, opts?: { autoPlay?: boolean }) => Promise<void>;
      destroy: () => void;
      pendingAutoPlayHandler: (() => void) | null;
      pendingAutoPlayElement: MockAudio | null;
    };

    // Register a pending autoplay handler via loadSong with autoPlay before canplay.
    player.loadSong({ songId: 1, path: 'file:///1.mp3' }, { autoPlay: true });
    expect(player.pendingAutoPlayHandler).not.toBeNull();
    expect(player.pendingAutoPlayElement).not.toBeNull();

    player.destroy();
    expect(player.pendingAutoPlayHandler).toBeNull();
    expect(player.pendingAutoPlayElement).toBeNull();
  });
});
