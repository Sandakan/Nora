import { getPlaylistData, HISTORY_PLAYLIST_TEMPLATE, setPlaylistData } from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';

export const addToSongsHistory = (songId: string) => {
  log(`Requested a song with id -${songId}- to be added to the History playlist.`);
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
  log(`ERROR OCCURRED WHEN TRYING TO ADD A SONG TO THE FAVORITES. PLAYLIST DATA ARE EMPTY.`);
  throw new Error('Playlists is not an array.');
};

export default addToSongsHistory;
