import { sendMessageToRenderer } from '../main';
import logger from '../logger';
import { getPlaylistById, linkSongsWithPlaylist } from '@main/db/queries/playlists';

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
    await linkSongsWithPlaylist(
      addedIds,
      playlist.id
    );

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

  const errMessage = 'Request failed because a playlist cannot be found.';
  logger.error(errMessage, {
    playlistId
  });
  throw new Error(errMessage);
};

export default addSongsToPlaylist;
