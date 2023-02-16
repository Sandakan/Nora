import { getPlaylistData, setPlaylistData } from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';
import toggleLikeSongs from './toggleLikeSongs';

const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
  log(
    `Requested a song with id -${songId}- to be removed from a playlist with id '${playlistId}'.`
  );
  let playlistsData = getPlaylistData([]);
  let isSongFound = false;
  if (playlistId === 'Favorites') {
    log(
      'User requested to remove a song from the Favorites playlist. Request handed over to toggleLikeSongs.'
    );
    return toggleLikeSongs([songId], false);
  }
  if (Array.isArray(playlistsData) && playlistsData.length > 0) {
    playlistsData = playlistsData.map((playlist) => {
      if (
        playlist.playlistId === playlistId &&
        playlist.songs.some((id) => id === songId)
      ) {
        isSongFound = true;
        return {
          ...playlist,
          songs: playlist.songs.filter((id) => id !== songId),
        };
      }
      return playlist;
    });

    if (isSongFound) {
      dataUpdateEvent('playlists/deletedSong');
      setPlaylistData(playlistsData);
      return log(
        `song '${songId}' removed from the playlist '${playlistId}' successfully.`
      );
    }
    log(
      `Request failed because a song with an id '${songId}' cannot be found in the playlist of id ${playlistId}.`
    );
    throw new Error(
      `'${songId}' cannot be found in the playlist of id ${playlistId}.`
    );
  }
  log(`Request failed because a playlist data is undefined.`);
  throw new Error(`Request failed because a playlist data is undefined.`);
};

export default removeSongFromPlaylist;
