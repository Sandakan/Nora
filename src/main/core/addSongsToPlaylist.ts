import { getPlaylistById, linkSongsWithPlaylist } from '@main/db/queries/playlists';

import logger from '../logger';
import { sendMessageToRenderer } from '../main';

export type AddSongsToPlaylistResult =
  | { success: true; count: number; name: string }
  | { success: false; reason: 'PLAYLIST_NOT_FOUND' | 'LINK_FAILED'; name?: string };

const addSongsToPlaylist = async (
  playlistId: number,
  songIds: number[]
): Promise<AddSongsToPlaylistResult> => {
  logger.debug(`Requested to add songs to a playlist.`, {
    playlistId,
    songIds
  });
  const addedIds: number[] = [];
  const existingIds: number[] = [];

  const playlist = await getPlaylistById(playlistId);

  if (!playlist) {
    logger.error('Cannot add songs: playlist not found.', { playlistId });
    sendMessageToRenderer({
      messageCode: 'ADD_SONGS_TO_PLAYLIST_FAILED',
      data: { count: 0, name: '' }
    });
    return { success: false, reason: 'PLAYLIST_NOT_FOUND' };
  }

  for (let i = 0; i < songIds.length; i += 1) {
    const songId = songIds[i];

    const isSongIdInPlaylist = playlist.songs.some((song) => song.songId === songId);

    if (!isSongIdInPlaylist) addedIds.push(songId);
    else existingIds.push(songId);
  }

  let linkError: unknown = null;
  if (addedIds.length > 0) {
    try {
      await linkSongsWithPlaylist(addedIds, playlist.id);
    } catch (error) {
      linkError = error;
      logger.error('Failed to link some songs to playlist', { addedIds, playlistId, error });
    }
  }

  logger.debug(`Finished adding songs to the playlist.`, {
    addedIds,
    existingIds,
    playlistId
  });

  if (linkError) {
    sendMessageToRenderer({
      messageCode: 'ADD_SONGS_TO_PLAYLIST_FAILED',
      data: { count: 0, name: playlist.name }
    });
    return { success: false, reason: 'LINK_FAILED', name: playlist.name };
  }

  sendMessageToRenderer({
    messageCode: 'ADDED_SONGS_TO_PLAYLIST',
    data: { count: addedIds.length, name: playlist.name }
  });
  return { success: true, count: addedIds.length, name: playlist.name };
};

export default addSongsToPlaylist;
