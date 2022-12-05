import { getPlaylistData, setPlaylistData } from '../filesystem';
import log from '../log';

const addSongToPlaylist = (playlistId: string, songId: string) => {
  log(
    `Requested a song with id -${songId}- to be added to a playlist with id '${playlistId}'.`
  );
  const playlists = getPlaylistData();

  if (playlists && Array.isArray(playlists) && playlists.length > 0) {
    for (let x = 0; x < playlists.length; x += 1) {
      if (playlists[x].playlistId === playlistId) {
        if (playlists[x].songs.some((id) => id === songId)) {
          log(
            `Request failed for the song with id ${songId} to be added to the playlist with id '${playlistId}' because it already exists in that playlist.`
          );
          throw new Error(
            `Song with id ${songId} already exists in playlist ${playlists[x].name}`
          );
        }

        playlists[x].songs.push(songId);
        setPlaylistData(playlists);
        log(
          `song ${songId} add to the playlist ${playlists[x].name} successfully.`
        );
        return true;
      }
    }

    log(
      `Request failed because a playlist with an id '${playlistId}' cannot be found.`
    );
    throw new Error(`playlist with an id ${playlistId} couldn't be found.`);
  }
  throw new Error('Empty playlists array.');
};

export default addSongToPlaylist;
