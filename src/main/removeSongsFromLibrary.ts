import path from 'path';
import { removeArtwork } from './other/artworks';
import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getPlaylistData,
  getSongsData,
  setAlbumsData,
  setArtistsData,
  setGenresData,
  setPlaylistData,
  setSongsData
} from './filesystem';
import { dataUpdateEvent, sendMessageToRenderer } from './main';
import { getSongArtworkPath } from './fs/resolveFilePaths';
import logger from './logger';

export const removeDeletedArtistDataOfSong = (artists: SavableArtist[], song: SavableSongData) => {
  let isArtistRemoved = false;

  if (
    Array.isArray(artists) &&
    artists.length > 0 &&
    Array.isArray(song.artists) &&
    song.artists.length > 0 &&
    artists.some((artist) =>
      song.artists ? song.artists.some((x) => x.name === artist.name) : false
    )
  ) {
    for (let i = 0; i < song.artists.length; i += 1) {
      const songArtist = song.artists[i];

      for (let x = 0; x < artists.length; x += 1) {
        if (artists[x].name === songArtist.name) {
          if (artists[x].songs.length > 1) {
            artists[x].songs = artists[x].songs.filter((y) => y.songId !== song.songId);
            logger.debug(
              `Data related to '${song.title}' in artist '${artists[x].name}' removed.`,
              { songId: song.songId, artistId: artists[x].artistId }
            );
          } else {
            if (artists[x].songs.length === 1 && artists[x].songs[0].songId === song.songId)
              logger.debug(
                `Artist '${artists[x].name}' related to '${song.title}' removed because of it doesn't contain any other songs.`,
                { songId: song.songId, artistId: artists[x].artistId }
              );
            else
              logger.debug(
                `Artist '${artists[x].name}' removed because it doesn't have any songs.`,
                { artistId: artists[x].artistId }
              );
            artists.splice(x, 1);
            isArtistRemoved = true;
          }
        }
      }
    }
  }
  return { updatedArtists: artists, isArtistRemoved };
};

export const removeDeletedAlbumDataOfSong = (albums: SavableAlbum[], song: SavableSongData) => {
  let isAlbumRemoved = false;
  if (
    Array.isArray(albums) &&
    albums.length > 0 &&
    albums.some((album) => song.album && album.albumId === song.album.albumId)
  ) {
    for (let x = 0; x < albums.length; x += 1) {
      if (song.album && albums[x].albumId === song.album.albumId) {
        if (albums[x].songs.length > 1) {
          albums[x].songs = albums[x].songs.filter((y) => y.songId !== song.songId);
          logger.debug(`Data related to '${song.title}' in album '${albums[x].title}' removed.`, {
            songId: song.songId,
            albumId: albums[x].albumId
          });
        } else {
          if (albums[x].songs.length === 1 && albums[x].songs[0].songId === song.songId)
            logger.debug(
              `Album '${albums[x].title}' related to '${song.title}' removed because of it doesn't contain any other songs.`,
              { songId: song.songId, albumId: albums[x].albumId }
            );
          else
            logger.debug(`Album '${albums[x].title}' removed because it doesn't have any songs.`, {
              albumId: albums[x].albumId
            });
          albums.splice(x, 1);
          isAlbumRemoved = true;
        }
      }
    }
  }
  return { updatedAlbums: albums, isAlbumRemoved };
};

export const removeDeletedPlaylistDataOfSong = (
  playlists: SavablePlaylist[],
  song: SavableSongData
) => {
  let isPlaylistRemoved = false;
  if (
    Array.isArray(playlists) &&
    playlists.length > 0 &&
    playlists.some((playlist) => playlist.songs.some((str) => str === song.songId))
  ) {
    for (let x = 0; x < playlists.length; x += 1) {
      if (playlists[x].songs.length > 0 && playlists[x].songs.some((y) => y === song.songId)) {
        playlists[x].songs.splice(playlists[x].songs.indexOf(song.songId), 1);
        logger.debug(
          `Data related to '${song.title}' in playlist '${playlists[x].name}' removed.`,
          {
            songId: song.songId,
            playlistId: playlists[x].playlistId
          }
        );
      } else {
        logger.debug(`Playlist '${playlists[x].name}' removed because it doesn't have any songs.`, {
          playlistId: playlists[x].playlistId
        });
        isPlaylistRemoved = true;
      }
    }
  }
  return { updatedPlaylists: playlists, isPlaylistRemoved };
};

export const removeDeletedGenreDataOfSong = (genres: SavableGenre[], song: SavableSongData) => {
  let isGenreRemoved = false;
  if (
    Array.isArray(genres) &&
    genres.length > 0 &&
    song.genres &&
    song.genres.length > 0 &&
    genres.some((genre) =>
      song.genres ? song.genres.some((songGenre) => songGenre.genreId === genre.genreId) : false
    )
  ) {
    for (let i = 0; i < song.genres.length; i += 1) {
      const songGenre = song.genres[i];
      for (let x = 0; x < genres.length; x += 1) {
        if (genres[x].name === songGenre.name) {
          if (genres[x].songs.length > 1) {
            genres[x].songs = genres[x].songs.filter((y) => y.songId !== song.songId);
            logger.debug(`Data related to '${song.title}' in genre '${genres[x].name}' removed.`, {
              songId: song.songId,
              genreId: genres[x].genreId
            });
          } else {
            if (genres[x].songs.length === 1 && genres[x].songs[0].songId === song.songId)
              logger.debug(
                `Genre '${genres[x].name}' related to '${song.title}' removed because of it doesn't contain any other songs.`,
                { songId: song.songId, genreId: genres[x].genreId }
              );
            else
              logger.debug(`Genre '${genres[x].name}' removed because it doesn't have any songs.`, {
                genreId: genres[x].genreId
              });
            genres.splice(x, 1);
            isGenreRemoved = true;
          }
        }
      }
    }
  }
  return { updatedGenres: genres, isGenreRemoved };
};

export const removeDeletedArtworkDataOfSong = async (song: SavableSongData) => {
  if (song.isArtworkAvailable) {
    const artworkPaths = getSongArtworkPath(song.songId, song.isArtworkAvailable);
    try {
      await removeArtwork(artworkPaths);
    } catch (error) {
      logger.error(`Failed to remove artworks of a song marked for removal from the library.`, {
        error
      });
    }
  }
};

const removeDeletedListeningDataOfSong = (
  listeningData: SongListeningData[],
  song: SavableSongData
) => {
  if (Array.isArray(listeningData) && listeningData.length > 0) {
    const updatedListeningData = listeningData.filter((data) => data.songId !== song.songId);
    return { updatedListeningData };
  }
  return { updatedListeningData: listeningData };
};

const removeSong = async (
  song: SavableSongData,
  artistsData: SavableArtist[],
  albumsData: SavableAlbum[],
  playlistsData: SavablePlaylist[],
  genreData: SavableGenre[],
  songsListeningData: SongListeningData[]
) => {
  let artists = artistsData;
  let albums = albumsData;
  let playlists = playlistsData;
  let genres = genreData;
  let listeningData = songsListeningData;
  let isArtistRemoved = false;
  let isAlbumRemoved = false;
  let isPlaylistRemoved = false;
  let isGenreRemoved = false;

  logger.debug(`Started the deletion process of the song '${path.basename(song.path)}'`, {
    songId: song.songId,
    path: song.path
  });

  //   ARTIST DATA UPDATES
  const updatedArtistData = removeDeletedArtistDataOfSong(artists, song);
  isArtistRemoved = updatedArtistData.isArtistRemoved;
  artists = updatedArtistData.updatedArtists;

  //   ALBUM DATA UPDATES
  const updatedAlbumData = removeDeletedAlbumDataOfSong(albums, song);
  isAlbumRemoved = updatedAlbumData.isAlbumRemoved;
  albums = updatedAlbumData.updatedAlbums;

  //   PLAYLIST DATA UPDATES
  const updatedPlaylistData = removeDeletedPlaylistDataOfSong(playlists, song);
  isPlaylistRemoved = updatedPlaylistData.isPlaylistRemoved;
  playlists = updatedPlaylistData.updatedPlaylists;

  //   GENRE DATA UPDATES
  const updatedGenreData = removeDeletedGenreDataOfSong(genres, song);
  isGenreRemoved = updatedGenreData.isGenreRemoved;
  genres = updatedGenreData.updatedGenres;

  //   SONG ARTWORK UPDATES
  try {
    await removeDeletedArtworkDataOfSong(song);
  } catch (error) {
    logger.error(`Error occurred when trying to remove artwork of ${song.title}`, {
      error,
      path: song.path
    });
    return;
  }

  // LISTENING DATA UPDATES
  const { updatedListeningData } = removeDeletedListeningDataOfSong(listeningData, song);
  listeningData = updatedListeningData;

  logger.debug(`'${path.basename(song.path)}' song removed from the library.`);
  return {
    song,
    artists,
    albums,
    playlists,
    genres,
    listeningData,
    isArtistRemoved,
    isAlbumRemoved,
    isPlaylistRemoved,
    isGenreRemoved
  };
};

const removeSongsFromLibrary = async (
  songPaths: string[],
  abortSignal: AbortSignal
): PromiseFunctionReturn => {
  const songs = getSongsData();
  let artists = getArtistsData();
  let genres = getGenresData();
  let albums = getAlbumsData();
  let playlists = getPlaylistData();
  const listeningData: SongListeningData[] = [];
  let isArtistRemoved = false;
  let isAlbumRemoved = false;
  let isPlaylistRemoved = false;
  let isGenreRemoved = false;

  const updatedSongs: SavableSongData[] = [];
  // We can't use array filter method here because it uses callbacks. Because we need to use promises, using async callbacks can give unexpected results.
  let index = 0;
  for (let i = 0; i < songs.length; i += 1) {
    if (abortSignal?.aborted) {
      logger.warn('Removing songs in the music folder aborted by an abortController signal.', {
        reason: abortSignal?.reason
      });
      break;
    }

    const song = songs[i];
    const isThisTheSong = songPaths.some((songPath) => song.path === path.normalize(songPath));
    if (!isThisTheSong) {
      updatedSongs.push(song);
      continue;
    } else index += 1;

    const data = await removeSong(song, artists, albums, playlists, genres, listeningData);
    if (!data)
      return {
        success: false,
        message: `Error occurred when trying to remove the song '${path.basename(song.path)}' from the library.`
      };

    artists = data.artists;
    albums = data.albums;
    playlists = data.playlists;
    genres = data.genres;
    // listeningData = data.listeningData;
    isAlbumRemoved = data.isAlbumRemoved;
    isArtistRemoved = data.isArtistRemoved;
    isPlaylistRemoved = data.isPlaylistRemoved;
    isGenreRemoved = data.isGenreRemoved;

    sendMessageToRenderer({
      messageCode: 'SONG_REMOVE_PROCESS_UPDATE',
      data: { total: songPaths.length, value: index }
    });
  }

  if (updatedSongs && artists && albums) {
    setSongsData(updatedSongs);
    setArtistsData(artists);
    setAlbumsData(albums);
    setGenresData(genres);
    dataUpdateEvent('songs/deletedSong');
  }
  if (playlists) setPlaylistData(playlists);

  dataUpdateEvent('artists');
  dataUpdateEvent('albums');
  dataUpdateEvent('playlists');
  dataUpdateEvent('genres');

  if (isArtistRemoved) dataUpdateEvent('artists/deletedArtist');
  if (isAlbumRemoved) dataUpdateEvent('albums/deletedAlbum');
  if (isGenreRemoved) dataUpdateEvent('genres/deletedGenre');
  if (isPlaylistRemoved) dataUpdateEvent('playlists/deletedPlaylist');

  return {
    success: true,
    message: `${songPaths.length} songs removed and updated artists, albums, playlists and genres related to them.`
  };
};

export default removeSongsFromLibrary;
