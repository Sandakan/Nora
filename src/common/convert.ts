import { parsePaletteFromArtworks } from '@main/core/getAllSongs';
import type { GetAllSongsReturnType } from '@main/db/queries/songs';
import { parseSongArtworks } from '@main/fs/resolveFilePaths';

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
  const isAFavorite = false;

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
