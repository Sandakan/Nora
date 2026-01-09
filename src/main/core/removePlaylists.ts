import { deletePlaylists } from '@main/db/queries/playlists';
import logger from '../logger';
import { dataUpdateEvent } from '../main';

const removePlaylists = async (playlistIds: number[]) => {
  logger.debug(`Requested to remove playlist(s)`, { playlistIds });

  const deletedPlaylistCount = await deletePlaylists(playlistIds);

  dataUpdateEvent('playlists/deletedPlaylist');
  logger.debug(`${deletedPlaylistCount} playlists deleted successfully.`, {
    deletedPlaylistIds: playlistIds
  });
  return true;
};

export default removePlaylists;
