/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import path from 'path';
import { removeArtwork } from './other/artworks';
import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getListeningData,
  getPlaylistData,
  getSongsData,
  setAlbumsData,
  setArtistsData,
  setGenresData,
  setPlaylistData,
  setSongsData
} from './filesystem';
import log from './log';
import { dataUpdateEvent, sendMessageToRenderer } from './main';
import { getSongArtworkPath } from './fs/resolveFilePaths';

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
            log(`Data related to '${song.title}' in artist '${artists[x].name}' removed.`);
          } else {
            if (artists[x].songs.length === 1 && artists[x].songs[0].songId === song.songId)
              log(
                `Artist '${artists[x].name}' related to '${song.title}' removed because of it doesn't contain any other songs.`
              );
            else log(`Artist '${artists[x].name}' removed because it doesn't have any songs.`);
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
          log(`Data related to '${song.title}' in album '${albums[x].title}' removed.`);
        } else {
          if (albums[x].songs.length === 1 && albums[x].songs[0].songId === song.songId)
            log(
              `Album '${albums[x].title}' related to '${song.title}' removed because of it doesn't contain any other songs.`
            );
          else log(`Album '${albums[x].title}' removed because it doesn't have any songs.`);
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
        log(`Data related to '${song.title}' in playlist '${playlists[x].name}' removed.`);
      } else {
        log(`Playlist '${playlists[x].name}' removed because it doesn't have any songs.`);
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
            log(`Data related to '${song.title}' in genre '${genres[x].name}' removed.`);
          } else {
            if (genres[x].songs.length === 1 && genres[x].songs[0].songId === song.songId)
              log(
                `Genre '${genres[x].name}' related to '${song.title}' removed because of it doesn't contain any other songs.`
              );
            else log(`Genre '${genres[x].name}' removed because it doesn't have any songs.`);
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
      log(
        `Error occurred when removing artworks of a song marked for removal from the library.`,
        { error },
        'ERROR'
      );
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

  log(`Started the deletion process of the song '${path.basename(song.path)}'`);

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
    throw new Error(`Error occurred when trying to remove artwork of ${song.title}`);
  }

  // LISTENING DATA UPDATES
  const { updatedListeningData } = removeDeletedListeningDataOfSong(listeningData, song);
  listeningData = updatedListeningData;

  log(`'${path.basename(song.path)}' song removed from the library.`);
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
  let listeningData = getListeningData();
  let isArtistRemoved = false;
  let isAlbumRemoved = false;
  let isPlaylistRemoved = false;
  let isGenreRemoved = false;

  const updatedSongs: SavableSongData[] = [];
  // We can't use array filter method here because it uses callbacks. Because we need to use promises, using async callbacks can give unexpected results.
  let index = 0;
  for (let i = 0; i < songs.length; i += 1) {
    if (abortSignal?.aborted) {
      log(
        'Removing songs in the music folder aborted by an abortController signal.',
        { reason: abortSignal?.reason },
        'WARN'
      );
      break;
    }

    const song = songs[i];
    const isThisTheSong = songPaths.some((songPath) => song.path === path.normalize(songPath));
    if (!isThisTheSong) {
      updatedSongs.push(song);
      continue;
    } else index += 1;

    const data = await removeSong(song, artists, albums, playlists, genres, listeningData);
    artists = data.artists;
    albums = data.albums;
    playlists = data.playlists;
    genres = data.genres;
    listeningData = data.listeningData;
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
