import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@main/db/queries/playlists', () => ({
  getPlaylistById: vi.fn(),
  linkSongsWithPlaylist: vi.fn()
}));

vi.mock('../../../../src/main/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../../src/main/main', () => ({
  sendMessageToRenderer: vi.fn()
}));

import { getPlaylistById, linkSongsWithPlaylist } from '@main/db/queries/playlists';
import { sendMessageToRenderer } from '../../../../src/main/main';
import addSongsToPlaylist from '../../../../src/main/core/addSongsToPlaylist';

const mockedGetPlaylistById = vi.mocked(getPlaylistById);
const mockedLinkSongsWithPlaylist = vi.mocked(linkSongsWithPlaylist);
const mockedSendMessageToRenderer = vi.mocked(sendMessageToRenderer);

const makePlaylist = (songIds: number[]) => ({
  id: 1,
  name: 'Workout',
  songs: songIds.map((songId) => ({ songId }))
});

describe('addSongsToPlaylist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reports success when the link writes to the database', async () => {
    mockedGetPlaylistById.mockResolvedValue(makePlaylist([1, 2]) as never);
    mockedLinkSongsWithPlaylist.mockResolvedValue(undefined);

    await addSongsToPlaylist(1, [3, 4]);

    expect(mockedLinkSongsWithPlaylist).toHaveBeenCalledWith([3, 4], 1);
    expect(mockedSendMessageToRenderer).toHaveBeenCalledWith({
      messageCode: 'ADDED_SONGS_TO_PLAYLIST',
      data: { count: 2, name: 'Workout' }
    });
  });

  test('routes to the failure notification when the link rejects', async () => {
    mockedGetPlaylistById.mockResolvedValue(makePlaylist([1, 2]) as never);
    mockedLinkSongsWithPlaylist.mockRejectedValue(new Error('db write failed'));

    await addSongsToPlaylist(1, [3, 4]);

    expect(mockedLinkSongsWithPlaylist).toHaveBeenCalledWith([3, 4], 1);
    expect(mockedSendMessageToRenderer).toHaveBeenCalledWith({
      messageCode: 'ADD_SONGS_TO_PLAYLIST_FAILED',
      data: { count: 0, name: 'Workout' }
    });
    // The "success" code must not fire on failure.
    expect(mockedSendMessageToRenderer).not.toHaveBeenCalledWith(
      expect.objectContaining({ messageCode: 'ADDED_SONGS_TO_PLAYLIST' })
    );
  });

  test('returns a discriminated failure when the playlist does not exist', async () => {
    mockedGetPlaylistById.mockResolvedValue(undefined);

    const result = await addSongsToPlaylist(99, [1]);
    expect(result).toEqual({ success: false, reason: 'PLAYLIST_NOT_FOUND' });
  });
});
