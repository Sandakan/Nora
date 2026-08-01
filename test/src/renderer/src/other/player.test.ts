import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing the module under test
vi.mock('../../../../../src/renderer/src/store/store', () => ({
  dispatch: vi.fn(),
  store: { state: { player: { volume: { value: 50, isMuted: false }, playbackRate: 1, isRepeating: 'off' as const } }, subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) }
}));

vi.mock('../../../../../src/renderer/src/utils/localStorage', () => ({
  default: { playback: { setCurrentSongOptions: vi.fn() } }
}));

vi.mock('../../../../../src/renderer/src/other/equalizerData', () => ({
  equalizerBandHertzData: { '60': 60, '170': 170, '310': 310, '600': 600, '1000': 1000, '3000': 3000, '6000': 6000, '12000': 12000, '14000': 14000, '16000': 16000 }
}));

// Minimal AudioContext/Audio mock for Node environment
class MockAudioContext {
  state = 'running' as AudioContextState;
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  createGain() {
    return { gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
  }
  createBiquadFilter() {
    return { type: 'peaking', frequency: { value: 0 }, Q: { value: 1 }, gain: { value: 0 }, connect: vi.fn(), disconnect: vi.fn() };
  }
  createMediaElementSource() {
    return { connect: vi.fn(), disconnect: vi.fn() };
  }
  resume() { this.state = 'running'; return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
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
  duration = 0;
  readyState = 0;
  src = '';
  srcObject = null;
  currentSrc = '';
  private listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  addEventListener(event: string, fn: (...args: unknown[]) => void) { (this.listeners[event] ??= []).push(fn); }
  removeEventListener(event: string, fn: (...args: unknown[]) => void) { this.listeners[event] = this.listeners[event]?.filter(f => f !== fn) ?? []; }
  dispatchEvent(event: Event) { this.listeners[event.type]?.forEach(fn => fn(event)); }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  load() { /* no-op in mock */ }
  setAttribute(_name: string, _value: string) { /* no-op in mock */ }
  removeAttribute(_name: string) { /* no-op in mock */ }
}

// Injecting mocks for Node environment where AudioContext/Audio don't exist
// @ts-expect-error -- Node test environment lacks Web Audio API globals
globalThis.AudioContext = MockAudioContext;
// @ts-expect-error -- Node test environment lacks HTMLAudioElement constructor
globalThis.Audio = MockAudio;
// Node test environment lacks window and navigator.mediaDevices globals
// @ts-expect-error -- Node test environment lacks window object
globalThis.window = globalThis;
Object.defineProperty(globalThis, 'navigator', {
  value: { mediaDevices: { ondevicechange: null } },
  writable: true,
  configurable: true
});

import AudioPlayer from '../../../../../src/renderer/src/other/player';

describe('AudioPlayer device change recovery', () => {
  let player: AudioPlayer;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockQueue = {
      on: vi.fn(),
      removeAllListeners: vi.fn(),
      currentSongId: null,
      position: 0,
      length: 0,
      hasNext: false,
      hasPrevious: false,
      isEmpty: true,
      moveToNext: vi.fn(),
      moveToPrevious: vi.fn(),
      moveToPosition: vi.fn(),
      moveToStart: vi.fn()
    };
    player = new AudioPlayer(mockQueue as any);
  });

  afterEach(() => {
    (player as any).destroy?.();
  });

  describe('setupDeviceChangeListener', () => {
    it('should register ondevicechange handler when supported', () => {
      // The constructor calls setupDeviceChangeListener
      expect(navigator.mediaDevices?.ondevicechange).toBeTypeOf('function');
    });
  });

  describe('isRecoveringFromDeviceChange', () => {
    it('should be false initially', () => {
      expect((player as any).isRecoveringFromDeviceChange).toBe(false);
    });
  });

  describe('deviceChangeGeneration', () => {
    it('should start at 0', () => {
      expect((player as any).deviceChangeGeneration).toBe(0);
    });
  });

  describe('play() resumes suspended context', () => {
    it('should call context.resume when suspended', async () => {
      (player.currentContext as any).state = 'suspended';
      const resumeSpy = vi.spyOn(player.currentContext, 'resume');

      // Mock audio.play to resolve
      vi.spyOn(player.audio, 'play').mockResolvedValue(undefined as any);

      await player.play();
      expect(resumeSpy).toHaveBeenCalled();
    });
  });

  describe('togglePlayback recovery', () => {
    it('should attempt recovery when play fails', async () => {
      // Set up the player with a src so togglePlayback tries to play
      (player.audio as any).src = 'http://localhost/test.mp3';
      (player.audio as any).readyState = 4;
      (player.audio as any).paused = true;

      // Make play() reject
      vi.spyOn(player.audio, 'play').mockRejectedValueOnce(new Error('play failed'));

      // Mock handleDeviceChange to track it was called
      const handleSpy = vi.spyOn(player as any, 'handleDeviceChange').mockResolvedValue(undefined);

      await player.togglePlayback(true);
      expect(handleSpy).toHaveBeenCalled();
    });
  });

  describe('destroy cleanup', () => {
    it('should clear ondevicechange handler', () => {
      player.destroy();
      expect(navigator.mediaDevices?.ondevicechange).toBeNull();
    });
  });
});
