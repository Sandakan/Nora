import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@main/db/queries/playlists', () => ({
  getPlaylistByName: vi.fn(),
  linkSongsWithPlaylist: vi.fn()
}));

vi.mock('@main/db/queries/songs', () => ({
  getSongsInPathList: vi.fn(),
  updateSongFavoriteStatuses: vi.fn()
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn()
}));

vi.mock('../../../../src/main/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../../src/main/main', () => ({
  sendMessageToRenderer: vi.fn(),
  showOpenDialog: vi.fn(),
  dataUpdateEvent: vi.fn()
}));

vi.mock('../../../../src/main/core/addNewPlaylist', () => ({
  default: vi.fn()
}));

import { readFile } from 'fs/promises';
import { getPlaylistByName, linkSongsWithPlaylist } from '@main/db/queries/playlists';
import { getSongsInPathList, updateSongFavoriteStatuses } from '@main/db/queries/songs';

import { processPlaylistImport } from '../../../../src/main/core/importPlaylist';
import addNewPlaylist from '../../../../src/main/core/addNewPlaylist';
import logger from '../../../../src/main/logger';
import { dataUpdateEvent, sendMessageToRenderer } from '../../../../src/main/main';

const mockedReadFile = vi.mocked(readFile);
const mockedGetPlaylistByName = vi.mocked(getPlaylistByName);
const mockedLinkSongsWithPlaylist = vi.mocked(linkSongsWithPlaylist);
const mockedGetSongsInPathList = vi.mocked(getSongsInPathList);
const mockedUpdateSongFavoriteStatuses = vi.mocked(updateSongFavoriteStatuses);
const mockedAddNewPlaylist = vi.mocked(addNewPlaylist);
const mockedLoggerDebug = vi.mocked(logger.debug);
const mockedLoggerInfo = vi.mocked(logger.info);
const mockedLoggerWarn = vi.mocked(logger.warn);
const mockedSendMessageToRenderer = vi.mocked(sendMessageToRenderer);
const mockedDataUpdateEvent = vi.mocked(dataUpdateEvent);

const M3U_HEADER = '#EXTM3U';
const SONG1_PATH = '/music/song1.mp3';
const SONG2_PATH = '/music/song2.mp3';
const SONG1_ID = 101;
const SONG2_ID = 102;

function makeM3u8(lines: string[]): string {
  return lines.join('\n');
}

describe('processPlaylistImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedReadFile.mockResolvedValue(
      makeM3u8([M3U_HEADER, SONG1_PATH, SONG2_PATH])
    );
    // Default: all songs available in the library
    mockedGetSongsInPathList.mockResolvedValue([
      { id: SONG1_ID, path: SONG1_PATH } as never,
      { id: SONG2_ID, path: SONG2_PATH } as never
    ]);
  });

  describe('double-message guard (Issue #361 regression check)', () => {
    test('Scenario 1: unavailable > 0, available > 0 — sends EXACTLY ONE success message', async () => {
      // Only song1 is available, song2 is unavailable
      mockedGetSongsInPathList.mockResolvedValue([
        { id: SONG1_ID, path: SONG1_PATH } as never
      ]);
      mockedGetPlaylistByName.mockResolvedValue(null);
      mockedAddNewPlaylist.mockResolvedValue({ success: true, message: 'created' });

      await processPlaylistImport('C:/import/test.m3u8');

      // Must only be ONE call to sendMessageToRenderer
      expect(mockedSendMessageToRenderer).toHaveBeenCalledTimes(1);
      expect(mockedSendMessageToRenderer).toHaveBeenCalledWith({
        messageCode: 'PLAYLIST_IMPORT_SUCCESS',
        data: { name: 'test' }
      });
    });

    test('Scenario 2: unavailable > 0, available = 0 — sends PLAYLIST_IMPORT_FAILED_DUE_TO_SONGS_OUTSIDE_LIBRARY', async () => {
      // No songs available in the library
      mockedGetSongsInPathList.mockResolvedValue([]);

      await processPlaylistImport('C:/import/test.m3u8');

      expect(mockedSendMessageToRenderer).toHaveBeenCalledTimes(1);
      expect(mockedSendMessageToRenderer).toHaveBeenCalledWith({
        messageCode: 'PLAYLIST_IMPORT_FAILED_DUE_TO_SONGS_OUTSIDE_LIBRARY'
      });
    });

    test('Scenario 3: unavailable = 0, available > 0 — sends EXACTLY ONE success message', async () => {
      // All songs available
      mockedGetPlaylistByName.mockResolvedValue(null);
      mockedAddNewPlaylist.mockResolvedValue({ success: true, message: 'created' });

      await processPlaylistImport('C:/import/test.m3u8');

      expect(mockedSendMessageToRenderer).toHaveBeenCalledTimes(1);
    });

    test('Scenario 4: unavailable = 0, available = 0 — falls through to invalid file data error', async () => {
      // Both arrays empty — no songs extracted from M3U
      mockedReadFile.mockResolvedValue(makeM3u8([M3U_HEADER]));
      mockedGetSongsInPathList.mockResolvedValue([]);

      await processPlaylistImport('C:/import/test.m3u8');

      expect(mockedSendMessageToRenderer).toHaveBeenCalledTimes(1);
      expect(mockedSendMessageToRenderer).toHaveBeenCalledWith({
        messageCode: 'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_DATA'
      });
    });

    test('non-M3U8 extension sends INVALID_FILE_EXTENSION, one message', async () => {
      mockedReadFile.mockResolvedValue('not relevant');

      await processPlaylistImport('C:/import/test.txt');

      expect(mockedSendMessageToRenderer).toHaveBeenCalledTimes(1);
      expect(mockedSendMessageToRenderer).toHaveBeenCalledWith({
        messageCode: 'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_EXTENSION'
      });
    });

    test('M3U8 without #EXTM3U header sends INVALID_FILE_DATA, one message', async () => {
      mockedReadFile.mockResolvedValue('# My playlist\nsong1.mp3');

      await processPlaylistImport('C:/import/test.m3u8');

      expect(mockedSendMessageToRenderer).toHaveBeenCalledTimes(1);
      expect(mockedSendMessageToRenderer).toHaveBeenCalledWith({
        messageCode: 'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_DATA'
      });
    });
  });

  describe('dataUpdateEvent notifications (CodeRabbit inline review)', () => {
    test('Favorites import: calls dataUpdateEvent after updateSongFavoriteStatuses', async () => {
      mockedUpdateSongFavoriteStatuses.mockResolvedValue(undefined);

      await processPlaylistImport('C:/import/favorites.m3u8');

      expect(mockedUpdateSongFavoriteStatuses).toHaveBeenCalledWith([SONG1_ID, SONG2_ID], true);
      expect(mockedDataUpdateEvent).toHaveBeenCalledTimes(1);
    });

    test('Existing-playlist import: calls dataUpdateEvent after linkSongsWithPlaylist', async () => {
      mockedGetPlaylistByName.mockResolvedValue({ id: 7, name: 'test' } as never);
      mockedLinkSongsWithPlaylist.mockResolvedValue(undefined);

      await processPlaylistImport('C:/import/test.m3u8');

      expect(mockedLinkSongsWithPlaylist).toHaveBeenCalledWith([SONG1_ID, SONG2_ID], 7);
      expect(mockedDataUpdateEvent).toHaveBeenCalledTimes(1);
    });

    test('New-playlist import: addNewPlaylist handles its own dataUpdateEvent (no double-fire)', async () => {
      mockedGetPlaylistByName.mockResolvedValue(null);
      mockedAddNewPlaylist.mockResolvedValue({ success: true, message: 'created' });

      await processPlaylistImport('C:/import/test.m3u8');

      // addNewPlaylist is responsible for firing dataUpdateEvent internally;
      // importToPlaylist should NOT fire it again.
      expect(mockedDataUpdateEvent).not.toHaveBeenCalled();
    });

    test('Failed favorites import does not call dataUpdateEvent', async () => {
      mockedUpdateSongFavoriteStatuses.mockRejectedValue(new Error('db down'));

      await processPlaylistImport('C:/import/favorites.m3u8');

      expect(mockedDataUpdateEvent).not.toHaveBeenCalled();
      expect(mockedSendMessageToRenderer).toHaveBeenCalledWith({
        messageCode: 'PLAYLIST_IMPORT_FAILED'
      });
    });
  });
});
