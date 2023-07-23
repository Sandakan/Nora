import { getPlaylistData, setPlaylistData } from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';

const removeFromFavorites = (
  songId: string,
): { success: boolean; message?: string } => {
  log(`Requested a song with id -${songId}- to be removed to the favorites.`);
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
          playlists[i].playlistId === 'Favorites' &&
          playlists[i].songs.some(
            (playlistSongId: string) => playlistSongId === songId,
          )
        ) {
          const { songs } = playlists[i];
          songs.splice(songs.indexOf(songId), 1);
          playlists[i].songs = songs;
        }
      }
      setPlaylistData(playlists);
      dataUpdateEvent('playlists/favorites');
      return { success: true };
    }
    log(
      `Request failed for the song with id ${songId} to be removed to the Favorites because it is already unavailable in the Favorites.`,
    );
    return { success: false };
  }
  log(
    `ERROR OCCURRED WHEN TRYING TO REMOVE A SONG TO THE FAVORITES. PLAYLIST DATA ARE EMPTY.`,
  );
  throw new Error('Playlists is not an array.');
};

export default removeFromFavorites;
