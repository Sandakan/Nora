import { getPlaylistData, setPlaylistData } from '../filesystem';
import logger from '../logger';
import { dataUpdateEvent } from '../main';

const removeFromFavorites = (songId: string): { success: boolean; message?: string } => {
  logger.debug(`Requested to remove a song from the favorites.`, { songId });
  const playlists = getPlaylistData();

  if (playlists && Array.isArray(playlists)) {
    if (
      playlists.length > 0 &&
      playlists.some(
        (playlist) => playlist.name === 'Favorites' && playlist.playlistId === 'Favorites'
      )
    ) {
      const selectedPlaylist = playlists.find(
        (playlist) => playlist.name === 'Favorites' && playlist.playlistId === 'Favorites'
      );

      if (
        selectedPlaylist &&
        selectedPlaylist.songs.some((playlistSongId: string) => playlistSongId === songId)
      ) {
        const { songs } = selectedPlaylist;
        songs.splice(songs.indexOf(songId), 1);
        selectedPlaylist.songs = songs;
      }
      setPlaylistData(playlists);
      dataUpdateEvent('playlists/favorites');
      return { success: true };
    }
    logger.warn(`Failed to remove a song from Favorites because it is unavailable.`);
    return { success: false };
  }
  logger.error(`Failed to remove a song from favorites. playlist data are empty.`);
  throw new Error('Playlists is not an array.');
};

export default removeFromFavorites;
