import { getPlaylistData, HISTORY_PLAYLIST_TEMPLATE, setPlaylistData } from '../filesystem';
import logger from '../logger';
import { dataUpdateEvent } from '../main';

export const addToSongsHistory = (songId: string) => {
  logger.debug(`Requested a song to be added to the History playlist.`, { songId });
  const playlists = getPlaylistData();

  if (playlists && Array.isArray(playlists)) {
    const selectedPlaylist = playlists.find(
      (playlist) => playlist.name === 'History' && playlist.playlistId === 'History'
    );

    if (selectedPlaylist) {
      if (selectedPlaylist.songs.length + 1 > 50) selectedPlaylist.songs.pop();
      if (selectedPlaylist.songs.some((song) => song === songId))
        selectedPlaylist.songs = selectedPlaylist.songs.filter((song) => song !== songId);
      selectedPlaylist.songs.unshift(songId);

      setPlaylistData(playlists);
    } else {
      playlists.push(HISTORY_PLAYLIST_TEMPLATE);
      setPlaylistData(playlists);
    }
    dataUpdateEvent('playlists/history');
    dataUpdateEvent('userData/recentlyPlayedSongs');
    return true;
  }

  const errMessage =
    'Failed to add song to the history playlist because the playlist data is not an array.';
  logger.error(errMessage, { playlists, songId });
  throw new Error(errMessage);
};

export default addToSongsHistory;
