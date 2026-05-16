import { db } from '@main/db/db';
import { getAllAlbums, linkArtistToAlbum } from '@main/db/queries/albums';
import {
  getAllArtists,
  createArtist,
  getLinkedSongArtist,
  linkSongToArtist,
  unlinkSongFromArtist,
  deleteArtist,
  getLinkedAlbumArtist
} from '@main/db/queries/artists';
import { getAllSongs } from '@main/db/queries/songs';

import { getArtistArtworkPath } from '../fs/resolveFilePaths';
import logger from '../logger';
import { dataUpdateEvent } from '../main';
import updateSongId3Tags from '../updateSong/updateSongId3Tags';
import { convertToArtist, convertToAlbum, convertToSongData } from '../utils/convert';
import { getSelectedArtist } from './resolveDuplicates';
import sendSongID3Tags from './sendSongMetadata';

export const resolveSeparateArtists = async (
  separateArtistId: number,
  separateArtistNames: string[]
) => {
  let updatedData: UpdateSongDataResult | undefined;

  const artistsRes = await getAllArtists({});
  const songsRes = await getAllSongs({});
  const albumsRes = await getAllAlbums({});

  let artistsData = artistsRes.data.map(convertToArtist);
  const songsData = songsRes.data.map(convertToSongData);
  const albumsData = albumsRes.data.map(convertToAlbum);

  const selectedArtistData = getSelectedArtist(separateArtistId, artistsData);
  const selectedArtistSongIds = selectedArtistData?.artist?.songs.map((x) => x.songId);

  if (selectedArtistData) {
    const selectedArtist = selectedArtistData.artist;

    const availArtists: (typeof artistsData)[number][] = [];
    const newArtists: (typeof artistsData)[number][] = [];

    // ARTISTS
    for (const artistName of separateArtistNames) {
      const artistData = getSelectedArtist(artistName, artistsData);

      if (artistData && artistsData[artistData.index]) {
        artistsData[artistData.index].songs.push(...selectedArtist.songs);
        availArtists.push(artistsData[artistData.index] as (typeof artistsData)[number]);
      } else
        newArtists.push({
          artistId: Math.floor(Math.random() * 1000000),
          isAFavorite: false,
          name: artistName,
          songs: selectedArtist?.songs ?? [],
          artworkName: (selectedArtist as unknown as SavableArtist).artworkName,
          albums: (selectedArtist as unknown as (typeof artistsData)[number]).albums ?? [],
          artworkPaths: (selectedArtist as unknown as (typeof artistsData)[number]).artworkPaths,
          onlineArtworkPaths: (selectedArtist as unknown as (typeof artistsData)[number])
            .onlineArtworkPaths
        } as (typeof artistsData)[number]);
    }

    artistsData = artistsData.filter((x) => x.artistId !== selectedArtist.artistId);

    artistsData.push(...(newArtists as unknown as (typeof artistsData)[number][]));

    // ALBUMS
    for (const album of albumsData) {
      if (album?.artists?.some((x) => x.artistId === selectedArtist.artistId)) {
        album.artists = album.artists!.filter((x) => {
          if (x.artistId === selectedArtist.artistId) return false;
          if (availArtists.some((y) => y.artistId === x.artistId)) return false;
          return true;
        });

        album.artists!.push(
          ...newArtists.concat(availArtists).map((x) => ({ artistId: x.artistId, name: x.name }))
        );
      }
    }

    // SONGS
    for (const song of songsData) {
      if (selectedArtistSongIds?.includes(song.songId)) {
        if (song.artists) {
          const songTags = await sendSongID3Tags(song.songId, true);

          song.artists = song.artists!.filter((x) => {
            if (x.artistId === selectedArtist.artistId) return false;
            if (availArtists.some((y) => y.artistId === x.artistId)) return false;
            return true;
          });

          if (songTags.artists) {
            songTags.artists = songTags.artists.filter((x) => {
              if (x.artistId === selectedArtist.artistId) return false;
              if (availArtists.some((y) => y.artistId === x.artistId)) return false;
              return true;
            });

            songTags.artists.push(
              ...(newArtists.concat(availArtists).map((x) => {
                return {
                  name: x.name,
                  artistId: x.artistId,
                  artworkPath: getArtistArtworkPath((x as unknown as SavableArtist).artworkName)
                    .artworkPath,
                  onlineArtworkPaths: (x as unknown as (typeof artistsData)[number])
                    .onlineArtworkPaths
                };
              }) as typeof songTags.artists)
            );
          }

          song.artists!.push(
            ...newArtists.concat(availArtists).map((x) => ({
              artistId: x.artistId,
              name: x.name
            }))
          );

          updatedData = await updateSongId3Tags(song.songId, songTags, true, true);
        }
      }
    }

    // Persist changes to DB: create/link new artists, move songs, update album links, and remove original artist
    const targetArtists: { name: string; id: number }[] = [];

    // Existing artists (availArtists) are already in artistsData and will be used
    for (const a of availArtists) {
      targetArtists.push({ name: a.name, id: a.artistId });
    }

    // Create artists for newArtists and collect their DB ids
    for (const na of newArtists) {
      const created = await createArtist({ name: na.name, isFavorite: na.isAFavorite }, db);
      targetArtists.push({ name: na.name, id: created.id });
    }

    // For each song that belonged to the selected artist, link to all target artists and unlink from selected
    const selectedArtistId = selectedArtist.artistId;
    for (const songRef of selectedArtist.songs) {
      const songId = songRef.songId;
      for (const ta of targetArtists) {
        const alreadyLinked = await getLinkedSongArtist(songId, ta.id, db);
        if (!alreadyLinked) await linkSongToArtist(ta.id, songId, db);
      }
      // Unlink from original selected artist
      await unlinkSongFromArtist(selectedArtistId, songId, db);
    }

    // Link target artists to albums where selected artist was present
    for (const album of albumsData) {
      if (album?.artists?.some((x) => x.artistId === selectedArtist.artistId)) {
        for (const ta of targetArtists) {
          const linked = await getLinkedAlbumArtist(album.albumId, ta.id, db);
          if (!linked) await linkArtistToAlbum(album.albumId, ta.id, db);
        }
      }
    }

    // Delete the original artist
    await deleteArtist(selectedArtistId, db);

    // Notify renderer to refresh from DB
    dataUpdateEvent('artists');
    dataUpdateEvent('albums');
    dataUpdateEvent('songs');

    logger.debug(`Resolved suggestion to separate artist`, {
      separateArtistId,
      separateArtistNames
    });
  }
  return updatedData;
};
