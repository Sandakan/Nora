import { parsePaletteFromArtworks } from '@main/core/getAllSongs';
import type { GetAllAlbumsReturnType } from '@main/db/queries/albums';
import type { GetAllArtistsReturnType } from '@main/db/queries/artists';
import type { GetAllGenresReturnType } from '@main/db/queries/genres';
import type { GetAllPlaylistsReturnType } from '@main/db/queries/playlists';
import type { GetAllSongsReturnType } from '@main/db/queries/songs';
import {
  parseAlbumArtworks,
  parseArtistArtworks,
  parseGenreArtworks,
  parsePlaylistArtworks,
  parseSongArtworks
} from '@main/fs/resolveFilePaths';

export const convertToSongData = (song: GetAllSongsReturnType[number]): SongData => {
  const artists =
    song.artists?.map((a) => ({ artistId: String(a.artist.id), name: a.artist.name })) ?? [];

  // Album (pick first if multiple)
  const albumObj = song.albums?.[0]?.album;
  const album = albumObj ? { albumId: String(albumObj.id), name: albumObj.title } : undefined;

  // Blacklist
  const isBlacklisted = !!song.blacklist;
  // Track number
  const trackNo = song.trackNumber ?? undefined;
  // Added date
  const addedDate = song.createdAt ? new Date(song.createdAt).getTime() : 0;
  // isAFavorite: You must join your favorites table if you have one. Here we default to false.
  const isAFavorite = song.playlists.some((p) => p.playlist.name === 'Favorites');

  const artworks = song.artworks.map((a) => a.artwork);
  return {
    title: song.title,
    artists,
    album,
    duration: Number(song.duration),
    artworkPaths: parseSongArtworks(artworks),
    path: song.path,
    songId: String(song.id),
    addedDate,
    isAFavorite,
    year: song.year ?? undefined,
    paletteData: parsePaletteFromArtworks(artworks),
    isBlacklisted,
    trackNo,
    isArtworkAvailable: artworks.length > 0
  } satisfies SongData;
};

export const convertToArtist = (artist: GetAllArtistsReturnType[number]) => {
  const artworks = artist.artworks.map((a) => a.artwork);

  return {
    artistId: String(artist.id),
    name: artist.name,
    artworkPaths: parseArtistArtworks(artworks),
    songs: artist.songs.map((s) => ({
      title: s.song.title,
      songId: String(s.song.id)
    })),
    isAFavorite: artist.isFavorite
  } satisfies Artist;
};

export const convertToAlbum = (album: GetAllAlbumsReturnType[number]) => {
  const artworks = album.artworks.map((a) => a.artwork);
  return {
    albumId: String(album.id),
    title: album.title,
    artworkPaths: parseAlbumArtworks(artworks),
    songs: album.songs.map((s) => ({
      title: s.song.title,
      songId: String(s.song.id)
    }))
  } satisfies Album;
};

export const convertToPlaylist = (playlist: GetAllPlaylistsReturnType['data'][number]) => {
  const artworks = playlist.artworks.map((a) => a.artwork);
  return {
    playlistId: String(playlist.id),
    name: playlist.name,
    artworkPaths: parsePlaylistArtworks(artworks),
    songs: playlist.songs.map((s) => String(s.song.id)),
    isArtworkAvailable: artworks.length > 0,
    createdDate: playlist.createdAt
  } satisfies Playlist;
};

export const convertToGenre = (genre: GetAllGenresReturnType['data'][number]) => {
  const artworks = genre.artworks.map((a) => a.artwork);
  return {
    genreId: String(genre.id),
    name: genre.name,
    artworkPaths: parseGenreArtworks(artworks),
    songs: genre.songs.map((s) => ({
      title: s.song.title,
      songId: String(s.song.id)
    }))
  } satisfies Genre;
};
