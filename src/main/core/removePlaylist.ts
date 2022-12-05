import { getPlaylistData, setPlaylistData } from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';

const removePlaylist = (playlistId: string) => {
  log(
    `Requested a playlist with id -${playlistId}- to be to be deleted from the app.`
  );
  const playlists = getPlaylistData();
  if (playlists && Array.isArray(playlists)) {
    if (
      playlists.length > 0 &&
      playlists.some((playlist) => playlist.playlistId === playlistId)
    ) {
      const updatedPlaylists = playlists.filter(
        (playlist) => playlist.playlistId !== playlistId
      );
      setPlaylistData(updatedPlaylists);
      dataUpdateEvent('playlists/deletedPlaylist');
      log(`Playlist with id ${playlistId} deleted successfully.`);
      return true;
    }
    log(
      `Request failed for the playlist with id ${playlistId} to be removed because it cannot be located.`
    );
    throw new Error(`Playlist with id ${playlistId} cannot be located.`);
  } else {
    log(
      `ERROR OCCURRED WHEN TRYING TO ADD A SONG TO THE FAVORITES. PLAYLIST DATA ARE EMPTY.`
    );
    throw new Error('Playlists is not an array.');
  }
};

export default removePlaylist;
