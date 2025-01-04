import { getPlaylistData, setPlaylistData } from '../filesystem';
import logger from '../logger';
import { dataUpdateEvent } from '../main';

const removePlaylists = (playlistIds: string[]) => {
  logger.debug(`Requested to remove playlist(s)`, { playlistIds });

  const deletedPlaylistIds: string[] = [];
  const playlists = getPlaylistData();
  if (playlists && Array.isArray(playlists)) {
    if (
      playlists.length > 0 &&
      playlists.some((playlist) => playlistIds.includes(playlist.playlistId))
    ) {
      const updatedPlaylists = playlists.filter((playlist) => {
        const isAReservedPlaylist = ['History', 'Favorites'].includes(playlist.playlistId);
        const isMarkedToDelete = playlistIds.includes(playlist.playlistId) && !isAReservedPlaylist;

        if (isMarkedToDelete) deletedPlaylistIds.push(playlist.playlistId);

        return !isMarkedToDelete;
      });

      setPlaylistData(updatedPlaylists);
      dataUpdateEvent('playlists/deletedPlaylist');
      logger.debug(`${deletedPlaylistIds.length} playlists deleted successfully.`, {
        deletedPlaylistIds
      });
      return true;
    }
    logger.error(`Failed to remove playlists because playlists cannot be located.`, {
      playlistIds
    });
    throw new Error(`Failed to remove playlists because playlists cannot be located.`);
  } else {
    logger.error(`Playlists array is empty or it is not an array.`, {
      playlists: typeof playlists,
      isArray: Array.isArray(playlists)
    });
    throw new Error('Playlists array is empty or it is not an array.');
  }
};

export default removePlaylists;
