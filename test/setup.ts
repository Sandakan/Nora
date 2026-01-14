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
