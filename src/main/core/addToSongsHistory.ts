import {
  getPlaylistData,
  HISTORY_PLAYLIST_TEMPLATE,
  setPlaylistData,
} from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';

export const addToSongsHistory = (songId: string) => {
  log(
    `Requested a song with id -${songId}- to be added to the History playlist.`
  );
  let playlists = getPlaylistData();
  if (playlists && Array.isArray(playlists)) {
    if (
      playlists.some(
        (playlist) =>
          playlist.name === 'History' && playlist.playlistId === 'History'
      )
    ) {
      playlists = playlists.map((playlist) => {
        if (playlist.name === 'History' && playlist.playlistId === 'History') {
          if (playlist.songs.length + 1 > 50) playlist.songs.pop();
          if (playlist.songs.some((song) => song === songId))
            playlist.songs = playlist.songs.filter((song) => song !== songId);
          playlist.songs.unshift(songId);
          return playlist;
        }
        return playlist;
      });

      setPlaylistData(playlists);
    } else {
      playlists.push(HISTORY_PLAYLIST_TEMPLATE);
      setPlaylistData(playlists);
    }
    dataUpdateEvent('playlists/history');
    dataUpdateEvent('userData/recentlyPlayedSongs');
    return true;
  }
  log(
    `ERROR OCCURRED WHEN TRYING TO ADD A SONG TO THE FAVORITES. PLAYLIST DATA ARE EMPTY.`
  );
  throw new Error('Playlists is not an array.');
};

export default addToSongsHistory;
