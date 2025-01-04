import { FAVORITES_PLAYLIST_TEMPLATE, getPlaylistData, setPlaylistData } from '../filesystem';
import logger from '../logger';
import { dataUpdateEvent } from '../main';

const addToFavorites = (songId: string) => {
  logger.debug(`Requested a song to be added to the favorites.`, { songId });
  const playlists = getPlaylistData();
  if (playlists && Array.isArray(playlists)) {
    if (playlists.length > 0) {
      const selectedPlaylist = playlists.find(
        (playlist) => playlist.name === 'Favorites' && playlist.playlistId === 'Favorites'
      );
      if (selectedPlaylist) {
        if (selectedPlaylist.songs.some((playlistSongId: string) => playlistSongId === songId)) {
          logger.debug(
            `Request failed for the song to be added to the Favorites because it was already in the Favorites.`,
            { songId }
          );
          return {
            success: false,
            message: `Song with id ${songId} is already in Favorites.`
          };
        }
        selectedPlaylist.songs.push(songId);
      }

      setPlaylistData(playlists);
      return { success: true };
    }
    playlists.push(FAVORITES_PLAYLIST_TEMPLATE);
    setPlaylistData(playlists);
    dataUpdateEvent('playlists/favorites');
    return { success: true };
  }
  logger.error(`Failed to add to favorites because the playlist data is not an array.`, {
    playlists: typeof playlists,
    songId
  })({ throwNewError: true });
  return undefined;
};

export default addToFavorites;
