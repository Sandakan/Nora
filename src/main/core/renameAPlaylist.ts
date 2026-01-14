import logger from '../logger';
import { sendMessageToRenderer } from '../main';
import { getPlaylistById, updatePlaylistName } from '@main/db/queries/playlists';

export default async (playlistId: number, newName: string) => {
  try {
    const playlist = await getPlaylistById(playlistId);

    if (playlist) {
      await updatePlaylistName(playlist.id, newName);

      logger.info('Playlist renamed successfully.', { playlistId, newName });
      return sendMessageToRenderer({ messageCode: 'PLAYLIST_RENAME_SUCCESS' });
    }

    logger.warn('Playlist not found.', { playlistId, newName });
    return sendMessageToRenderer({ messageCode: 'PLAYLIST_NOT_FOUND' });
  } catch (error) {
    logger.error('Failed to rename the playlist.', { playlistId, newName, error });
    return sendMessageToRenderer({ messageCode: 'PLAYLIST_RENAME_FAILED' });
  }
};
