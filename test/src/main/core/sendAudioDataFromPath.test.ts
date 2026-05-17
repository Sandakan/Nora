import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@main/db/queries/songs', () => ({
  getSongIdFromSongPath: vi.fn()
}));

vi.mock('node-taglib-sharp', () => ({
  File: {
    createFromPath: vi.fn()
  }
}));

vi.mock('../../../../src/main/filesystem', () => ({
  DEFAULT_FILE_URL: 'nora://localfiles/'
}));

vi.mock('../../../../src/main/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../../src/main/main', () => ({
  sendMessageToRenderer: vi.fn(),
  addToSongsOutsideLibraryData: vi.fn()
}));

vi.mock('../../../../src/main/other/artworks', () => ({
  createTempArtwork: vi.fn()
}));

vi.mock('../../../../src/main/core/sendAudioData', () => ({
  default: vi.fn(),
  parseArtworkDataForAudioPlayerData: vi.fn(() => ({ hasArtwork: true, format: 'png' }))
}));

vi.mock('../../../../src/renderer/src/assets/images/webp/song_cover_default.webp?asset', () => ({
  default: 'song_cover_default.webp'
}));

import { getSongIdFromSongPath } from '@main/db/queries/songs';
import { File } from 'node-taglib-sharp';

import sendAudioData from '../../../../src/main/core/sendAudioData';
import sendAudioDataFromPath from '../../../../src/main/core/sendAudioDataFromPath';
import { addToSongsOutsideLibraryData, sendMessageToRenderer } from '../../../../src/main/main';
import { createTempArtwork } from '../../../../src/main/other/artworks';

const mockedGetSongIdFromSongPath = vi.mocked(getSongIdFromSongPath);
const mockedCreateFromPath = vi.mocked(File.createFromPath);
const mockedSendAudioData = vi.mocked(sendAudioData);
const mockedCreateTempArtwork = vi.mocked(createTempArtwork);
const mockedAddToSongsOutsideLibraryData = vi.mocked(addToSongsOutsideLibraryData);
const mockedSendMessageToRenderer = vi.mocked(sendMessageToRenderer);

describe('sendAudioDataFromPath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('throws unsupported extension error for non-audio files', async () => {
    await expect(sendAudioDataFromPath('C:/music/readme.txt')).rejects.toThrow(
      'UNSUPPORTED_FILE_EXTENSION'
    );
    expect(mockedGetSongIdFromSongPath).not.toHaveBeenCalled();
  });

  test('returns known library audio data when song path exists in DB', async () => {
    const knownAudioData = {
      songId: 123,
      title: 'Known Song',
      path: 'nora://localfiles/C:/music/known.flac'
    } as unknown as AudioPlayerData;

    mockedGetSongIdFromSongPath.mockResolvedValue(123);
    mockedSendAudioData.mockResolvedValue(knownAudioData);

    const result = await sendAudioDataFromPath('C:/music/known.flac');

    expect(result).toBe(knownAudioData);
    expect(mockedSendAudioData).toHaveBeenCalledWith(123);
    expect(mockedCreateFromPath).not.toHaveBeenCalled();
  });

  test('throws SONG_DATA_SEND_FAILED when known ID returns no audio data', async () => {
    mockedGetSongIdFromSongPath.mockResolvedValue(123);
    mockedSendAudioData.mockResolvedValue(undefined as unknown as AudioPlayerData);

    await expect(sendAudioDataFromPath('C:/music/missing.flac')).rejects.toThrow(
      'SONG_DATA_SEND_FAILED'
    );
  });

  test('parses unknown-source file metadata and sends playback event', async () => {
    const songPath = 'C:/music/unknown.flac';
    const bytes = [1, 2, 3, 4];

    mockedGetSongIdFromSongPath.mockResolvedValue(undefined);
    mockedCreateTempArtwork.mockResolvedValue('temp-artwork.webp');
    mockedCreateFromPath.mockReturnValue({
      tag: {
        title: 'Unknown Source Song',
        performers: ['Artist A', 'Artist B'],
        pictures: [
          {
            data: {
              toByteArray: () => bytes
            }
          }
        ]
      },
      properties: {
        durationMilliseconds: 250000
      }
    } as never);

    const result = await sendAudioDataFromPath(songPath);

    expect(result.title).toBe('Unknown Source Song');
    expect(result.duration).toBe(250);
    expect(result.isKnownSource).toBe(false);
    expect(result.songId).toBeGreaterThanOrEqual(0);
    expect(result.songId).toBeLessThan(1000000);
    expect(result.path).toContain('nora://localfiles/');
    expect(result.path).toContain('unknown.flac');
    expect(result.path).not.toContain('\\localfiles\\');
    expect(result.artists?.map((artist) => artist.name)).toEqual(['Artist A', 'Artist B']);

    expect(mockedAddToSongsOutsideLibraryData).toHaveBeenCalledTimes(1);
    expect(mockedSendMessageToRenderer).toHaveBeenCalledWith({
      messageCode: 'PLAYBACK_FROM_UNKNOWN_SOURCE'
    });
  });

  test('throws SONG_DATA_SEND_FAILED when metadata cannot be read', async () => {
    mockedGetSongIdFromSongPath.mockResolvedValue(undefined);
    mockedCreateFromPath.mockReturnValue({ tag: undefined, properties: {} } as never);

    await expect(sendAudioDataFromPath('C:/music/unknown.flac')).rejects.toThrow(
      'SONG_DATA_SEND_FAILED'
    );
  });
});
