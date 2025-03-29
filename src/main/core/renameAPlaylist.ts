import logger from '../logger';
import { getPlaylistData, setPlaylistData } from '../filesystem';
import { sendMessageToRenderer } from '../main';

export default async (playlistId: string, newName: string) => {
  const playlists = getPlaylistData();

  for (let i = 0; i < playlists.length; i += 1) {
    if (playlistId === playlists[i].playlistId) {
      playlists[i].name = newName;
      setPlaylistData(playlists);

      logger.info('Playlist renamed successfully.', { playlistId, newName });
      return sendMessageToRenderer({ messageCode: 'PLAYLIST_RENAME_SUCCESS' });
    }
  }
  logger.warn('Playlist not found.', { playlistId, newName });
  return sendMessageToRenderer({ messageCode: 'PLAYLIST_NOT_FOUND' });
};
