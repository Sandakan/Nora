import { getPlaylistById, unlinkSongsFromPlaylist } from '@main/db/queries/playlists';
import logger from '../logger';
import { dataUpdateEvent } from '../main';

const removeSongFromPlaylist = async (playlistId: number, songId: number) => {
  logger.debug(`Requested to remove a song from playlist.`, { playlistId, songId });

  const playlist = await getPlaylistById(playlistId);

  if (playlist) {
    await unlinkSongsFromPlaylist([songId], playlist.id);

    dataUpdateEvent('playlists/deletedSong');
    return logger.info(`song removed from playlist successfully.`, { playlistId, songId });
  }
  logger.error(`Failed to remove a song from playlist because playlist not found.`, { playlistId });
  throw new Error(`Playlist not found with the provided ID. ${playlistId}`);
};

export default removeSongFromPlaylist;
