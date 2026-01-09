import path from 'path';
import { dataUpdateEvent, sendMessageToRenderer } from './main';
import logger from './logger';
import { unlinkSongFromArtist } from './db/queries/artists';
import { unlinkSongFromAlbum } from './db/queries/albums';
import { unlinkSongFromGenre } from './db/queries/genres';
import { deleteArtworks, getArtworkIdsOfSong } from './db/queries/artworks';
import { db } from './db/db';
import { getSongByPath, removeSongById } from './db/queries/songs';
import { convertToSongData } from './utils/convert';

export const removeDeletedArtistDataOfSong = async (song: SavableSongData, trx: DBTransaction) => {
  let isArtistRemoved = false;

  if (Array.isArray(song.artists) && song.artists.length > 0) {
    for (let i = 0; i < song.artists.length; i += 1) {
      const songArtist = song.artists[i];

      await unlinkSongFromArtist(Number(songArtist.artistId), Number(song.songId), trx);

      // TODO: Check if the artist has any songs left, if not remove the artist from the artists data.
    }
  }
  return { isArtistRemoved };
};

export const removeDeletedAlbumDataOfSong = async (song: SavableSongData, trx: DBTransaction) => {
  let isAlbumRemoved = false;

  const albumId = song.album?.albumId;
  if (albumId == null) return { isAlbumRemoved };

  await unlinkSongFromAlbum(Number(albumId), Number(song.songId), trx);

  // TODO: Check if the album has any songs left, if not remove the album from the albums data.

  return { isAlbumRemoved };
};

// export const removeDeletedPlaylistDataOfSong = (song: SavableSongData) => {
//   let isPlaylistRemoved = false;
//   if (
//     Array.isArray(playlists) &&
//     playlists.length > 0 &&
//     playlists.some((playlist) => playlist.songs.some((str) => str === song.songId))
//   ) {
//     for (let x = 0; x < playlists.length; x += 1) {
//       if (playlists[x].songs.length > 0 && playlists[x].songs.some((y) => y === song.songId)) {
//         playlists[x].songs.splice(playlists[x].songs.indexOf(song.songId), 1);
//         logger.debug(
//           `Data related to '${song.title}' in playlist '${playlists[x].name}' removed.`,
//           {
//             songId: song.songId,
//             playlistId: playlists[x].playlistId
//           }
//         );
//       } else {
//         logger.debug(`Playlist '${playlists[x].name}' removed because it doesn't have any songs.`, {
//           playlistId: playlists[x].playlistId
//         });
//         isPlaylistRemoved = true;
//       }
//     }
//   }
//   return { isPlaylistRemoved };
// };

export const removeDeletedGenreDataOfSong = async (song: SavableSongData, trx: DBTransaction) => {
  let isGenreRemoved = false;
  if (Array.isArray(song.genres) && song.genres.length > 0) {
    for (let i = 0; i < song.genres.length; i += 1) {
      const songGenre = song.genres[i];

      await unlinkSongFromGenre(Number(songGenre.genreId), Number(song.songId), trx);
    }
  }
  return { isGenreRemoved };
};

export const removeDeletedArtworkDataOfSong = async (song: SavableSongData, trx: DBTransaction) => {
  const artworkIds = await getArtworkIdsOfSong(Number(song.songId), trx);

  if (artworkIds.length === 0) return;

  await deleteArtworks(
    artworkIds.map((a) => a.artworkId),
    trx
  );
};

// const removeDeletedListeningDataOfSong = async (song: SavableSongData, trx: DBTransaction) => {
//   await deleteSongPlayEvents(Number(song.songId), trx);
//   await deleteSongSeekEvents(Number(song.songId), trx);
//   await deleteSongSkipEvents(Number(song.songId), trx);
// };

const removeSong = async (song: SavableSongData) => {
  logger.debug(`Started the deletion process of the song '${path.basename(song.path)}'`, {
    songId: song.songId,
    path: song.path
  });

  // # No need to delete associated artist data because of foreign key constraints with ON DELETE CASCADE.
  // //   ARTIST DATA UPDATES
  // const updatedArtistData = removeDeletedArtistDataOfSong(artists, song);
  // isArtistRemoved = updatedArtistData.isArtistRemoved;
  // artists = updatedArtistData.updatedArtists;

  // # No need to delete associated album data because of foreign key constraints with ON DELETE CASCADE.
  // //   ALBUM DATA UPDATES
  // const updatedAlbumData = removeDeletedAlbumDataOfSong(albums, song);
  // isAlbumRemoved = updatedAlbumData.isAlbumRemoved;
  // albums = updatedAlbumData.updatedAlbums;

  // # No need to delete associated playlist data because of foreign key constraints with ON DELETE CASCADE.
  // //   PLAYLIST DATA UPDATES
  // const updatedPlaylistData = removeDeletedPlaylistDataOfSong(playlists, song);
  // isPlaylistRemoved = updatedPlaylistData.isPlaylistRemoved;
  // playlists = updatedPlaylistData.updatedPlaylists;

  // # No need to delete associated genre data because of foreign key constraints with ON DELETE CASCADE.
  // //   GENRE DATA UPDATES
  // const updatedGenreData = removeDeletedGenreDataOfSong(genres, song);
  // isGenreRemoved = updatedGenreData.isGenreRemoved;
  // genres = updatedGenreData.updatedGenres;

  // # No need to delete associated listening data because of foreign key constraints with ON DELETE CASCADE.
  // LISTENING DATA UPDATES
  // const { updatedListeningData } = removeDeletedListeningDataOfSong(listeningData, song);
  // listeningData = updatedListeningData;

  //   SONG ARTWORK UPDATES
  await db.transaction(async (trx) => {
    // Artwork data are handled with an associate table with ON DELETE CASCADE, but they won't be deleted from the artworks table.
    // This is because one song can only have one artwork.
    await removeDeletedArtworkDataOfSong(song, trx);

    await removeSongById(Number(song.songId), trx);
  });

  logger.debug(`'${path.basename(song.path)}' song removed from the library.`);
  return { song };
};

const removeSongsFromLibrary = async (
  songPaths: string[],
  abortSignal: AbortSignal
): PromiseFunctionReturn => {
  for (let i = 0; i < songPaths.length; i += 1) {
    const songPath = songPaths[i];

    if (abortSignal?.aborted) {
      logger.warn('Removing songs in the music folder aborted by an abortController signal.', {
        reason: abortSignal?.reason
      });
      break;
    }

    const song = await getSongByPath(songPath);
    if (song == null) continue;

    const songData = convertToSongData(song);

    const data = await removeSong(songData);
    if (!data) {
      return {
        success: false,
        message: `Error occurred when trying to remove the song '${path.basename(song.path)}' from the library.`
      };
    }

    sendMessageToRenderer({
      messageCode: 'SONG_REMOVE_PROCESS_UPDATE',
      data: { total: songPaths.length, value: i }
    });
  }

  dataUpdateEvent('songs/deletedSong');
  dataUpdateEvent('artists/deletedArtist');
  dataUpdateEvent('albums/deletedAlbum');
  dataUpdateEvent('genres/deletedGenre');
  dataUpdateEvent('playlists/deletedPlaylist');

  return {
    success: true,
    message: `${songPaths.length} songs removed and updated artists, albums, playlists and genres related to them.`
  };
};

export default removeSongsFromLibrary;
