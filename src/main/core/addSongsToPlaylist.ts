import { getPlaylistData, setPlaylistData } from '../filesystem';
import log from '../log';

const addSongsToPlaylist = (playlistId: string, songIds: string[]) => {
  log(
    `Requested a song with ids -${songIds.join(
      ','
    )}- to be added to a playlist with id '${playlistId}'.`
  );
  const playlists = getPlaylistData();

  if (playlists && Array.isArray(playlists) && playlists.length > 0) {
    for (let x = 0; x < playlists.length; x += 1) {
      if (playlists[x].playlistId === playlistId) {
        for (let i = 0; i < songIds.length; i += 1) {
          const songId = songIds[i];
          if (!playlists[x].songs.includes(songId)) {
            playlists[x].songs.push(songId);
            log(
              `song ${songId} add to the playlist ${playlists[x].name} successfully.`
            );
          } else
            log(
              `Song with id ${songId} already exists in playlist with id '${playlists[x].name}'.`
            );
        }
        setPlaylistData(playlists);
      }
    }

    log(
      `Request failed because a playlist with an id '${playlistId}' cannot be found.`
    );
    throw new Error(`playlist with an id ${playlistId} couldn't be found.`);
  }
  throw new Error('Empty playlists array.');
};

export default addSongsToPlaylist;
