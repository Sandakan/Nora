import { getPlaylistData, setPlaylistData } from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';

const removePlaylists = (playlistIds: string[]) => {
  log(
    `Requested a playlists with ids -${playlistIds.join(', ')}- to be to be deleted from the app.`
  );
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
      log(`${deletedPlaylistIds.length} playlists deleted successfully.`, {
        deletedPlaylistIds
      });
      return true;
    }
    log(
      `Request failed because request contains playlist ids that cannot be located to be removed.`,
      { playlistIds }
    );
    throw new Error(
      `Request failed because request contains playlist ids that cannot be located to be removed.`
    );
  } else {
    log(`ERROR OCCURRED WHEN TRYING TO ADD A SONG TO THE FAVORITES. PLAYLIST DATA ARE EMPTY.`);
    throw new Error('Playlists array is empty or it is not an array.');
  }
};

export default removePlaylists;
