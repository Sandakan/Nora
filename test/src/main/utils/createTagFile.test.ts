import { createTagFile, withTagFile, withTagFileSync } from '@main/utils/createTagFile';
import { File } from 'node-taglib-sharp';
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@main/logger', () => ({
  default: { debug: vi.fn(), warn: vi.fn() }
}));

vi.mock('node-taglib-sharp', () => ({
  File: {
    createFromPath: vi.fn()
  }
}));

const mockedCreateFromPath = vi.mocked(File.createFromPath);

function makeFakeFile() {
  return { dispose: vi.fn(), tag: {}, properties: {} } as unknown as File;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createTagFile', () => {
  test('calls createFromPath with auto-detect for .mp3', () => {
    const fake = makeFakeFile();
    mockedCreateFromPath.mockReturnValue(fake);

    const result = createTagFile('/songs/track.mp3');

    expect(mockedCreateFromPath).toHaveBeenCalledWith('/songs/track.mp3');
    expect(result).toBe(fake);
  });

  test('passes audio/x-m4a mime for .m4r extension', () => {
    const fake = makeFakeFile();
    mockedCreateFromPath.mockReturnValue(fake);

    const result = createTagFile('/ringtones/alert.m4r');

    expect(mockedCreateFromPath).toHaveBeenCalledWith('/ringtones/alert.m4r', 'audio/x-m4a');
    expect(result).toBe(fake);
  });

  test('auto-detects for unknown extensions', () => {
    const fake = makeFakeFile();
    mockedCreateFromPath.mockReturnValue(fake);

    createTagFile('/songs/track.flac');

    expect(mockedCreateFromPath).toHaveBeenCalledWith('/songs/track.flac');
  });
});

describe('withTagFile', () => {
  test('disposes file after callback completes', async () => {
    const fake = makeFakeFile();
    mockedCreateFromPath.mockReturnValue(fake);

    const callback = vi.fn().mockResolvedValue('ok');
    const result = await withTagFile('/songs/track.mp3', callback);

    expect(callback).toHaveBeenCalledWith(fake);
    expect(fake.dispose).toHaveBeenCalledOnce();
    expect(result).toBe('ok');
  });

  test('disposes file when callback throws', async () => {
    const fake = makeFakeFile();
    mockedCreateFromPath.mockReturnValue(fake);

    const callback = vi.fn().mockRejectedValue(new Error('parse failed'));

    await expect(withTagFile('/songs/track.mp3', callback)).rejects.toThrow('parse failed');
    expect(fake.dispose).toHaveBeenCalledOnce();
  });

  test('handles dispose error gracefully', async () => {
    const fake = makeFakeFile();
    (fake.dispose as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('dispose failed');
    });
    mockedCreateFromPath.mockReturnValue(fake);

    const callback = vi.fn().mockResolvedValue('ok');
    const result = await withTagFile('/songs/track.mp3', callback);

    expect(result).toBe('ok');
  });
});

describe('withTagFileSync', () => {
  test('disposes file after synchronous callback', () => {
    const fake = makeFakeFile();
    mockedCreateFromPath.mockReturnValue(fake);

    const callback = vi.fn().mockReturnValue(42);
    const result = withTagFileSync('/songs/track.mp3', callback);

    expect(callback).toHaveBeenCalledWith(fake);
    expect(fake.dispose).toHaveBeenCalledOnce();
    expect(result).toBe(42);
  });

  test('disposes file when synchronous callback throws', () => {
    const fake = makeFakeFile();
    mockedCreateFromPath.mockReturnValue(fake);

    const callback = vi.fn().mockImplementation(() => {
      throw new Error('sync error');
    });

    expect(() => withTagFileSync('/songs/track.mp3', callback)).toThrow('sync error');
    expect(fake.dispose).toHaveBeenCalledOnce();
  });
});
