import { db } from '@main/db/db';
import { getAllAlbums, linkArtistToAlbum } from '@main/db/queries/albums';
import {
  getAllArtists,
  getLinkedSongArtist,
  linkSongToArtist,
  unlinkSongFromArtist,
  deleteArtist,
  getLinkedAlbumArtist
} from '@main/db/queries/artists';
import { getAllSongs } from '@main/db/queries/songs';

import { dataUpdateEvent } from '../main';
import updateSongId3Tags from '../updateSong/updateSongId3Tags';
import { convertToArtist, convertToAlbum, convertToSongData } from '../utils/convert';
import sendSongID3Tags from './sendSongMetadata';

export const getSelectedArtist = (artistIdOrName: string | number, artists: Artist[]) => {
  for (let index = 0; index < artists.length; index += 1) {
    const artist = artists[index];

    if (artist.artistId === artistIdOrName || artist.name === artistIdOrName)
      return { artist, index };
  }
  return undefined;
};

export const resolveArtistDuplicates = async (selectedArtistId: number, duplicateIds: number[]) => {
  let updatedData: UpdateSongDataResult | undefined;

  const artistsRes = await getAllArtists({});
  const songsRes = await getAllSongs({});
  const albumsRes = await getAllAlbums({});

  const artists = artistsRes.data.map(convertToArtist);
  const songs = songsRes.data.map(convertToSongData);
  const albums = albumsRes.data.map(convertToAlbum);

  const selectedArtist = getSelectedArtist(selectedArtistId, artists)?.artist;

  if (selectedArtist) {
    for (const artist of artists) {
      // check if artist is a duplicate
      if (duplicateIds.includes(artist.artistId)) {
        // get songs of the duplicate artist
        const artistSongs = artist.songs;
        // copy all the songs from the duplicate artist to the selected artist.
        selectedArtist?.songs.push(...artistSongs);

        const artistAlbums = (artist.albums || []) as { albumId: number; title?: string }[];

        // loop through albums
        for (const album of albums) {
          // check if the albums are linked to the duplicate artist
          const isAlbumLinkedToDuplicateArtist = artistAlbums.some(
            (artistAlbum: { albumId: number }) => artistAlbum.albumId === album.albumId
          );
          if (isAlbumLinkedToDuplicateArtist) {
            if (album.artists) {
              album.artists = album.artists!.filter(
                (songArtist) => songArtist.artistId !== artist.artistId
              );
            } else album.artists = [];

            album.artists?.push({
              artistId: selectedArtist.artistId,
              name: selectedArtist.name
            });

            if (selectedArtist.albums === undefined) selectedArtist.albums = [];

            selectedArtist.albums?.push({
              albumId: album.albumId,
              title: album.title
            });
          }
        }

        // loop through songs
        for (const song of songs) {
          // check if the songs are linked to a duplicate artist
          if (artistSongs.some((artistSong) => artistSong.songId === song.songId)) {
            // get song tags
            const songTags = await sendSongID3Tags(song.songId, true);

            if (songTags.artists) {
              songTags.artists = songTags.artists.filter(
                (songArtist) => songArtist.artistId !== artist.artistId
              );
            } else songTags.artists = [];

            songTags.artists?.push({
              ...selectedArtist
            });

            updatedData = await updateSongId3Tags(song.songId, songTags, true, true);
          }
        }
      }
    }

    // Persist changes to the database: link songs/albums to the selected artist and remove duplicates
    for (const artist of artists) {
      if (!duplicateIds.includes(artist.artistId)) continue;

      const duplicateArtistId = artist.artistId;

      // Link songs from duplicate artist to selected artist and unlink from duplicate
      for (const artistSong of artist.songs) {
        const songId = artistSong.songId;
        const alreadyLinked = await getLinkedSongArtist(songId, selectedArtist.artistId, db);
        if (!alreadyLinked) await linkSongToArtist(selectedArtist.artistId, songId, db);
        await unlinkSongFromArtist(duplicateArtistId, songId, db);
      }

      // Link albums to selected artist if not already linked
      for (const album of albums) {
        const linked = await getLinkedAlbumArtist(album.albumId, selectedArtist.artistId, db);
        if (!linked) await linkArtistToAlbum(album.albumId, selectedArtist.artistId, db);
      }

      // Delete the duplicate artist row (cascade will remove related rows)
      await deleteArtist(duplicateArtistId, db);
    }

    // Notify renderer of updates (they should requery DB)
    dataUpdateEvent('artists');
    dataUpdateEvent('albums');
    dataUpdateEvent('songs');
    return updatedData;
  }
  return undefined;
};
