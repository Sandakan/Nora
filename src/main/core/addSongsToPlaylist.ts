import { getPlaylistData, setPlaylistData } from '../filesystem';
import log from '../log';

const addSongsToPlaylist = (playlistId: string, songIds: string[]) => {
  log(
    `Requested a song with ids -${songIds.join(
      ',',
    )}- to be added to a playlist with id '${playlistId}'.`,
  );
  const playlists = getPlaylistData();
  const addedIds: string[] = [];
  const existingIds: string[] = [];

  if (playlists && Array.isArray(playlists) && playlists.length > 0) {
    for (const playlist of playlists) {
      if (playlist.playlistId === playlistId) {
        for (let i = 0; i < songIds.length; i += 1) {
          const songId = songIds[i];

          if (!playlist.songs.includes(songId)) {
            playlist.songs.push(songId);
            addedIds.push(songId);
          } else existingIds.push(songId);
        }
        setPlaylistData(playlists);
        return log(
          `Added ${addedIds.length} songs to '${playlist.name}' successfully. ${
            existingIds.length > 0
              ? `Ignored ${existingIds.length} existing songs in the playlist.`
              : ''
          }`,
          undefined,
          'INFO',
          {
            sendToRenderer: {
              messageCode: 'ADDED_SONGS_TO_PLAYLIST',
              data: { count: addedIds.length, name: playlist.name },
            },
          },
        );
      }
    }

    log(
      `Request failed because a playlist with an id '${playlistId}' cannot be found.`,
    );
    throw new Error(`playlist with an id ${playlistId} couldn't be found.`);
  }
  throw new Error('Empty playlists array.');
};

export default addSongsToPlaylist;
