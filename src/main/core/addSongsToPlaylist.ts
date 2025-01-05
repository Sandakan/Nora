import { sendMessageToRenderer } from '../main';
import { getPlaylistData, setPlaylistData } from '../filesystem';
import logger from '../logger';

const addSongsToPlaylist = (playlistId: string, songIds: string[]) => {
  logger.debug(`Requested to add songs to a playlist.`, {
    playlistId,
    songIds
  });
  const playlists = getPlaylistData();
  const addedIds: string[] = [];
  const existingIds: string[] = [];

  if (playlists && Array.isArray(playlists) && playlists.length > 0) {
    for (const playlist of playlists) {
      if (playlist.playlistId === playlistId) {
        for (let i = 0; i < songIds.length; i += 1) {
          const songId = songIds[i];

          if (!playlist.songs.includes(songId)) {
            playlist.songs.push(songId);
            addedIds.push(songId);
          } else existingIds.push(songId);
        }
        setPlaylistData(playlists);
        logger.debug(`Successfully added ${addedIds.length} songs to the playlist.`, {
          addedIds,
          existingIds,
          playlistId
        });
        return sendMessageToRenderer({
          messageCode: 'ADDED_SONGS_TO_PLAYLIST',
          data: { count: addedIds.length, name: playlist.name }
        });
      }
    }

    logger.error(`Request failed because a playlist cannot be found.`, {
      playlistId
    })({ throwNewError: true });
  }
  logger.error('Request failed because the playlists array is empty.')({ throwNewError: true });
};

export default addSongsToPlaylist;
