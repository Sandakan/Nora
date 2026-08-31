import { vi } from 'vitest';

// Mock Electron app globally for all tests
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => {
      if (name === 'userData') return '/mock/user/data';
      return '/mock/path';
    }),
    isPackaged: false,
    on: vi.fn(),
    whenReady: vi.fn(() => Promise.resolve())
  },
  BrowserWindow: vi.fn(),
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn()
  }
}));

// Mock browser globals for renderer tests
if (typeof globalThis.window === 'undefined') {
  const localStorageStore = new Map<string, string>();

  const mockLocalStorage = {
    getItem: (key: string) => localStorageStore.get(key) ?? null,
    setItem: (key: string, value: string) => localStorageStore.set(key, String(value)),
    removeItem: (key: string) => localStorageStore.delete(key),
    clear: () => localStorageStore.clear()
  };

  class MockAudioContext {
    createGain() {
      return {
        gain: { value: 1 },
        connect: vi.fn()
      };
    }
    createBiquadFilter() {
      return {
        type: 'peaking',
        frequency: { value: 0 },
        gain: { value: 0 },
        Q: { value: 0 },
        connect: vi.fn()
      };
    }
    createMediaElementSource() {
      return {
        connect: vi.fn()
      };
    }
    destination = {};
    close = vi.fn();
  }

  class MockAudio {
    src = '';
    currentTime = 0;
    duration = 180;
    paused = false;
    volume = 1;
    muted = false;
    playbackRate = 1.0;
    crossOrigin = '';
    preload = '';
    defaultPlaybackRate = 1.0;
    readyState = 4;

    private eventListeners = new Map<string, Set<(event?: unknown) => void>>();

    addEventListener(event: string, callback: (event?: unknown) => void) {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, new Set());
      }
      this.eventListeners.get(event)?.add(callback);
    }

    removeEventListener(event: string, callback: (event?: unknown) => void) {
      this.eventListeners.get(event)?.delete(callback);
    }

    dispatchEvent(event: Event) {
      this.eventListeners.get(event.type)?.forEach((cb) => cb(event));
      return true;
    }

    load = vi.fn();
    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
  }

  const mockWindow = {
    localStorage: mockLocalStorage,
    AudioContext: MockAudioContext,
    Audio: MockAudio,
    document: {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    },
    api: {
      log: {
        sendLogs: vi.fn()
      },
      properties: {
        isInDevelopment: false
      },
      settings: {
        getUserSettings: vi.fn().mockResolvedValue({ language: 'en' })
      },
      audioLibraryControls: {
        getSong: vi.fn().mockImplementation((songId: number) =>
          Promise.resolve({
            songId,
            title: `Song ${songId}`,
            path: `http://localhost:5000/song/${songId}`,
            duration: 180
          })
        )
      },
      playerControls: {
        songPlaybackStateChange: vi.fn(),
        toggleSongPlayback: vi.fn(),
        toggleLikeSongs: vi.fn()
      },
      quitEvent: {
        beforeQuitEvent: vi.fn(),
        removeBeforeQuitEventListener: vi.fn()
      },
      unknownSource: {
        playSongFromUnknownSource: vi.fn()
      }
    }
  };

  const globalScope = globalThis as unknown as Record<string, unknown>;
  globalScope.window = mockWindow;
  globalScope.document = mockWindow.document;
  globalScope.Audio = MockAudio;
  globalScope.localStorage = mockLocalStorage;
}
