import { getPlaylistData, setPlaylistData } from '../filesystem';
import logger from '../logger';
import { dataUpdateEvent } from '../main';
import toggleLikeSongs from './toggleLikeSongs';

const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
  logger.debug(`Requested to remove a song from playlist.`, { playlistId, songId });

  let playlistsData = getPlaylistData([]);
  let isSongFound = false;
  if (playlistId === 'Favorites') {
    logger.debug(
      'User requested to remove a song from the Favorites playlist. Request handed over to toggleLikeSongs.'
    );
    return toggleLikeSongs([songId], false);
  }
  if (Array.isArray(playlistsData) && playlistsData.length > 0) {
    playlistsData = playlistsData.map((playlist) => {
      if (playlist.playlistId === playlistId && playlist.songs.some((id) => id === songId)) {
        isSongFound = true;
        return {
          ...playlist,
          songs: playlist.songs.filter((id) => id !== songId)
        };
      }
      return playlist;
    });

    if (isSongFound) {
      dataUpdateEvent('playlists/deletedSong');
      setPlaylistData(playlistsData);
      return logger.info(`song removed from playlist successfully.`, { playlistId, songId });
    }
    logger.error(`Selected song cannot be found in the playlist`, { playlistId, songId });
    throw new Error(`'${songId}' cannot be found in the playlist of id ${playlistId}.`);
  }
  logger.error(`Request failed because playlist data is undefined.`);
  throw new Error(`Request failed because playlist data is undefined.`);
};

export default removeSongFromPlaylist;
