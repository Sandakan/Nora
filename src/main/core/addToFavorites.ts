import {
  FAVORITES_PLAYLIST_TEMPLATE,
  getPlaylistData,
  setPlaylistData,
} from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';

const addToFavorites = (
  songId: string,
): { success: boolean; message?: string } => {
  log(`Requested a song with id -${songId}- to be added to the favorites.`);
  const playlists = getPlaylistData();
  if (playlists && Array.isArray(playlists)) {
    if (
      playlists.length > 0 &&
      playlists.some(
        (playlist) =>
          playlist.name === 'Favorites' && playlist.playlistId === 'Favorites',
      )
    ) {
      for (let i = 0; i < playlists.length; i += 1) {
        if (
          playlists[i].name === 'Favorites' &&
          playlists[i].playlistId === 'Favorites'
        ) {
          if (
            playlists[i].songs.some(
              (playlistSongId: string) => playlistSongId === songId,
            )
          ) {
            log(
              `Request failed for the song with id ${songId} to be added to the Favorites because it was already in the Favorites.`,
            );
            return {
              success: false,
              message: `Song with id ${songId} is already in Favorites.`,
            };
          }
          playlists[i].songs.push(songId);
        }
      }

      setPlaylistData(playlists);
      return { success: true };
    }
    playlists.push(FAVORITES_PLAYLIST_TEMPLATE);
    setPlaylistData(playlists);
    dataUpdateEvent('playlists/favorites');
    return { success: true };
  }
  log(
    `ERROR OCCURRED WHEN TRYING TO ADD A SONG TO THE FAVORITES. PLAYLIST DATA ARE EMPTY.`,
  );
  throw new Error('Playlists is not an array.');
};

export default addToFavorites;
