/* eslint-disable no-await-in-loop */
import log from '../log';
import { getPlaylistData, setPlaylistData } from '../filesystem';

export default async (playlistId: string, newName: string) => {
  const playlists = getPlaylistData();

  for (let i = 0; i < playlists.length; i += 1) {
    if (playlistId === playlists[i].playlistId) {
      playlists[i].name = newName;
      setPlaylistData(playlists);
      return log(
        'Playlist renamed successfully.',
        { playlistId, newName },
        'INFO',
        {
          sendToRenderer: 'SUCCESS',
        },
      );
    }
  }
  return log('Playlist not found.', { playlistId, newName }, 'WARN', {
    sendToRenderer: 'FAILURE',
  });
};
