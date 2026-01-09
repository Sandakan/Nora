import { parsePaletteFromArtworks } from '@main/core/getAllSongs';
import type { GetAllAlbumsReturnType } from '@main/db/queries/albums';
import type { GetAllArtistsReturnType } from '@main/db/queries/artists';
import type { GetAllGenresReturnType } from '@main/db/queries/genres';
import type { GetAllPlaylistsReturnType } from '@main/db/queries/playlists';
import type { GetAllSongsReturnType } from '@main/db/queries/songs';
import {
  parseAlbumArtworks,
  parseArtistArtworks,
  parseArtistOnlineArtworks,
  parseGenreArtworks,
  parsePlaylistArtworks,
  parseSongArtworks
} from '@main/fs/resolveFilePaths';

export const convertToSongData = (song: GetAllSongsReturnType[number]): SongData => {
  const artists =
    song.artists?.map((a) => ({ artistId: a.artist.id, name: a.artist.name })) ?? [];

  // Album (pick first if multiple)
  const albumObj = song.albums?.[0]?.album;
  const album = albumObj ? { albumId: albumObj.id, name: albumObj.title } : undefined;

  // Blacklist
  const isBlacklisted = song.isBlacklisted;
  // Track number
  const trackNo = song.trackNumber ?? undefined;
  // Added date
  const addedDate = song.createdAt ? new Date(song.createdAt).getTime() : 0;

  const artworks = song.artworks.map((a) => a.artwork);

  const albumArtists = albumObj
    ? (albumObj.artists?.map((a) => ({ artistId: a.artist.id, name: a.artist.name })) ?? [])
    : [];

  const genres =
    song.genres?.map((g) => ({ genreId: g.genre.id, name: g.genre.name })) ?? [];

  return {
    title: song.title,
    artists,
    album,
    albumArtists,
    genres,
    duration: Number(song.duration),
    artworkPaths: parseSongArtworks(artworks),
    path: song.path,
    songId: song.id,
    addedDate,
    isAFavorite: song.isFavorite,
    year: song.year ?? undefined,
    paletteData: parsePaletteFromArtworks(artworks),
    isBlacklisted,
    trackNo,
    isArtworkAvailable: artworks.length > 0,
    bitrate: song.bitRate ?? undefined,
    sampleRate: song.sampleRate ?? undefined,
    createdDate: song.createdAt ? new Date(song.createdAt).getTime() : 0,
    modifiedDate: song.updatedAt ? new Date(song.updatedAt).getTime() : undefined,
    discNo: song.diskNumber ?? undefined,
    noOfChannels: song.noOfChannels ?? undefined
  } satisfies SongData;
};

export const convertToArtist = (artist: GetAllArtistsReturnType[number]) => {
  const artworks = artist.artworks.map((a) => a.artwork);

  return {
    artistId: artist.id,
    name: artist.name,
    artworkPaths: parseArtistArtworks(artworks),
    songs: artist.songs.map((s) => ({
      title: s.song.title,
      songId: s.song.id
    })),
    onlineArtworkPaths: parseArtistOnlineArtworks(artworks),
    isAFavorite: artist.isFavorite
  } satisfies Artist;
};

export const convertToAlbum = (album: GetAllAlbumsReturnType[number]) => {
  const artworks = album.artworks.map((a) => a.artwork);
  const artists =
    album.artists?.map((a) => ({ artistId: a.artist.id, name: a.artist.name })) ?? [];

  return {
    albumId: album.id,
    title: album.title,
    artworkPaths: parseAlbumArtworks(artworks),
    artists,
    songs: album.songs.map((s) => ({
      title: s.song.title,
      songId: s.song.id
    }))
  } satisfies Album;
};

export const convertToPlaylist = (playlist: GetAllPlaylistsReturnType['data'][number]) => {
  const artworks = playlist.artworks.map((a) => a.artwork);
  return {
    playlistId: playlist.id,
    name: playlist.name,
    artworkPaths: parsePlaylistArtworks(artworks),
    songs: playlist.songs.map((s) => s.song.id),
    isArtworkAvailable: artworks.length > 0,
    createdDate: playlist.createdAt
  } satisfies Playlist;
};

export const convertToGenre = (genre: GetAllGenresReturnType['data'][number]) => {
  const artworks = genre.artworks.map((a) => a.artwork);
  return {
    genreId: genre.id,
    name: genre.name,
    artworkPaths: parseGenreArtworks(artworks),
    songs: genre.songs.map((s) => ({
      title: s.song.title,
      songId: s.song.id
    }))
  } satisfies Genre;
};

// export const convertToSongListeningData = (
//   listeningData: GetAllSongListeningDataReturnType[number]
// ): SongListeningData => {
//   return {
//     songId: String(listeningData.id),
//     skips: listeningData.skipEvents.length,
//     listens:
//   };
// };
