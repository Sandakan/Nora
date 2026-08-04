import { getPlaylistById, linkSongsWithPlaylist } from '@main/db/queries/playlists';

import logger from '../logger';
import { sendMessageToRenderer } from '../main';

const addSongsToPlaylist = async (playlistId: number, songIds: number[]) => {
  logger.debug(`Requested to add songs to a playlist.`, {
    playlistId,
    songIds
  });
  const addedIds: number[] = [];
  const existingIds: number[] = [];

  const playlist = await getPlaylistById(playlistId);

  if (playlist) {
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

    logger.debug(`Successfully added ${addedIds.length} songs to the playlist.`, {
      addedIds,
      existingIds,
      playlistId
    });

    if (linkError) {
      return sendMessageToRenderer({
        messageCode: 'ADD_SONGS_TO_PLAYLIST_FAILED',
        data: { count: 0, name: playlist.name }
      });
    }

    return sendMessageToRenderer({
      messageCode: 'ADDED_SONGS_TO_PLAYLIST',
      data: { count: addedIds.length, name: playlist.name }
    });
  }

  const errMessage = 'Request failed because a playlist cannot be found.';
  logger.error(errMessage, {
    playlistId
  });
  throw new Error(errMessage);
};

export default addSongsToPlaylist;
