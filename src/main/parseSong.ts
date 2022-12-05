/* eslint-disable promise/no-nesting */
/* eslint-disable no-console */
/* eslint-disable no-nested-ternary */
/* eslint-disable consistent-return */
/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-cycle */
/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/return-await */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable promise/always-return */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
import * as musicMetaData from 'music-metadata';

import path from 'path';
import fs from 'fs/promises';

import sharp from 'sharp';
import { generateRandomId } from './utils/randomId';
import log from './log';
import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getSongsData,
  setAlbumsData,
  setArtistsData,
  setGenresData,
  setSongsData,
} from './filesystem';
import { dataUpdateEvent, sendMessageToRenderer } from './main';
import { storeArtworks } from './other/artworks';
import generatePalette from './other/generatePalette';
import getAssetPath from './utils/getAssetPath';

export const generateDefaultSongCoverImgBuffer = async () =>
  await fs
    .readFile(getAssetPath('images', 'png', 'song_cover_default.png'))
    .then((res) => res)
    .catch((err) =>
      log(
        `ERROR OCCURRED WHEN READING A FILE OF NAME 'song_cover_default.png'.`,
        { err },
        'ERROR'
      )
    );

const generateCoverBuffer = async (
  coverData: musicMetaData.IPicture[] | undefined
) => {
  if (coverData) {
    if (coverData[0].format === 'image/webp') {
      try {
        const buffer = await sharp(coverData[0].data).png().toBuffer();
        return buffer;
      } catch (error) {
        log(
          'Error occurred when trying to get artwork buffer of a song.',
          { error },
          'WARN'
        );
        return await generateDefaultSongCoverImgBuffer();
      }
    }
    return coverData[0].data;
  }
  return await generateDefaultSongCoverImgBuffer();
};

export const parseSong = async (
  absoluteFilePath: string
): Promise<SongData | undefined> => {
  log(
    `Starting the parsing process of song '${path.basename(absoluteFilePath)}'.`
  );
  const songs = getSongsData();
  const artists = getArtistsData();
  const albums = getAlbumsData();
  const genres = getGenresData();

  const stats = await fs.stat(absoluteFilePath);
  const metadata = await musicMetaData.parseFile(absoluteFilePath);

  if (
    Array.isArray(songs) &&
    metadata &&
    !songs.some((song) => song.path === absoluteFilePath)
  ) {
    const songTitle =
      metadata.common.title ||
      path.basename(absoluteFilePath).split('.')[0] ||
      'Unknown Title';
    const songId = generateRandomId();

    const coverBuffer = await generateCoverBuffer(metadata.common.picture);

    const songArtworkPaths = await storeArtworks(
      songId,
      'songs',
      metadata.common?.picture?.at(0)?.data
    );

    const palette = coverBuffer
      ? await generatePalette(coverBuffer, false)
      : undefined;

    if (metadata.common.lyrics)
      console.log(metadata.common.title, metadata.common.lyrics);

    const songInfo: SavableSongData = {
      songId,
      title: songTitle,
      artists: metadata.common.artists
        ? metadata.common.artists[0].split(',').map((x) => {
            return { name: x.trim(), artistId: '' };
          })
        : undefined,
      duration:
        typeof metadata.format.duration === 'number'
          ? parseFloat(metadata.format.duration.toFixed(2))
          : 0,
      album: metadata.common.album
        ? { name: metadata.common.album, albumId: '' }
        : undefined,
      genres: [],
      // albumArtist: metadata.common.albumartist || undefined,
      year: metadata.common?.year,
      palette:
        palette && palette.DarkVibrant && palette.LightVibrant
          ? {
              DarkVibrant: palette.DarkVibrant,
              LightVibrant: palette.LightVibrant,
            }
          : undefined,
      isAFavorite: false,
      isArtworkAvailable: !songArtworkPaths.isDefaultArtwork,
      path: absoluteFilePath,
      sampleRate: metadata.format.sampleRate,
      bitrate: metadata?.format?.bitrate,
      noOfChannels: metadata?.format?.numberOfChannels,
      addedDate: new Date().getTime(),
      createdDate: stats ? stats.birthtime.getTime() : undefined,
      modifiedDate: stats ? stats.mtime.getTime() : undefined,
    };

    const { updatedAlbums, relevantAlbums, newAlbums } = manageAlbums(
      albums,
      songInfo.title,
      songInfo.songId,
      metadata.common.album,
      songArtworkPaths,
      songInfo.artists,
      songInfo.year
    );

    if (songInfo.album)
      songInfo.album = {
        name: relevantAlbums[0].title,
        albumId: relevantAlbums[0].albumId,
      };

    const { allArtists, relevantArtists, newArtists } = manageArtists(
      artists,
      songInfo.title,
      songInfo.songId,
      songInfo.artists,
      songArtworkPaths,
      relevantAlbums
    );

    if (songInfo.artists) {
      for (let x = 0; x < relevantArtists.length; x += 1) {
        for (let y = 0; y < songInfo.artists.length; y += 1) {
          if (relevantArtists[x].name === songInfo.artists[y].name)
            songInfo.artists[y].artistId = relevantArtists[x].artistId;
        }
      }
    }

    const { allGenres, relevantGenres, newGenres } = manageGenres(
      genres,
      songInfo.title,
      songInfo.songId,
      metadata.common.genre,
      songArtworkPaths,
      songInfo.palette?.DarkVibrant
    );

    songInfo.genres = relevantGenres.map((genre) => {
      return { name: genre.name, genreId: genre.genreId };
    });

    songs.push(songInfo);
    log(
      `Finished the parsing process of song with name '${songInfo.title}'. Updated ${relevantArtists.length} artists, ${relevantAlbums.length}  albums, ${relevantGenres.length} genres in the process of parsing song.`,
      undefined
    );
    setSongsData(songs);
    setArtistsData(allArtists);
    setAlbumsData(updatedAlbums);
    setGenresData(allGenres);
    dataUpdateEvent('songs/newSong', [songId]);
    if (newArtists.length > 0)
      dataUpdateEvent(
        'artists/newArtist',
        newArtists.map((x) => x.artistId)
      );
    if (relevantArtists.length > 0)
      dataUpdateEvent(
        'artists',
        relevantArtists.map((x) => x.artistId)
      );
    if (newAlbums.length > 0)
      dataUpdateEvent(
        'albums/newAlbum',
        newAlbums.map((x) => x.albumId)
      );
    if (relevantAlbums.length > 0)
      dataUpdateEvent(
        'albums',
        relevantAlbums.map((x) => x.albumId)
      );
    if (newGenres.length > 0)
      dataUpdateEvent(
        'genres/newGenre',
        newGenres.map((x) => x.genreId)
      );
    if (relevantGenres.length > 0)
      dataUpdateEvent(
        'genres',
        relevantGenres.map((x) => x.genreId)
      );
    sendMessageToRenderer(
      `'${songTitle}' song added to the library.`,
      'PARSE_SUCCESSFUL',
      { songId }
    );
    return {
      ...songInfo,
      artworkPaths: songArtworkPaths,
    };
  }
  return undefined;
};

export const manageAlbums = (
  allAlbumsData: SavableAlbum[],
  songTitle: string,
  songId: string,
  songAlbumName?: string,
  songArtworkPaths?: ArtworkPaths,
  songArtists?: { name: string; artistId: string }[],
  songYear?: number
) => {
  const relevantAlbums: SavableAlbum[] = [];
  if (songAlbumName) {
    if (Array.isArray(allAlbumsData)) {
      if (allAlbumsData.some((a) => a.title === songAlbumName)) {
        const updatedAlbums = allAlbumsData.map((album) => {
          if (album.title === songAlbumName) {
            album.songs.push({
              title: songTitle,
              songId,
            });
            relevantAlbums.push(album);
            return album;
          }
          return album;
        });
        return { updatedAlbums, relevantAlbums, newAlbums: [] };
      }
      const newAlbum: SavableAlbum = {
        title: songAlbumName,
        artworkName:
          songArtworkPaths && !songArtworkPaths.isDefaultArtwork
            ? path.basename(songArtworkPaths.artworkPath)
            : undefined,
        year: songYear,
        albumId: generateRandomId(),
        artists: songArtists,
        songs: [
          {
            songId,
            title: songTitle,
          },
        ],
      };
      allAlbumsData.push(newAlbum);
      relevantAlbums.push(newAlbum);
      return {
        updatedAlbums: allAlbumsData,
        relevantAlbums,
        newAlbums: [newAlbum],
      };
    }
    return { updatedAlbums: [], relevantAlbums, newAlbums: [] };
  }
  return {
    updatedAlbums: allAlbumsData || [],
    relevantAlbums: [],
    newAlbums: [],
  };
};

export const manageArtists = (
  allArtists: SavableArtist[],
  songTitle: string,
  songId: string,
  songArtists?: { name: string; artistId?: string }[],
  songArtworkPaths?: ArtworkPaths,
  relevantAlbums = [] as SavableAlbum[]
) => {
  let updatedArtists = allArtists;
  const newArtists: SavableArtist[] = [];
  const relevantArtists: SavableArtist[] = [];
  if (Array.isArray(updatedArtists)) {
    if (songArtists && songArtists.length > 0) {
      for (let x = 0; x < songArtists.length; x += 1) {
        const newArtist = songArtists[x];
        if (allArtists.some((artist) => artist.name === newArtist.name)) {
          let z = updatedArtists.filter((val) => val.name === newArtist.name);
          z = z.map((artist) => {
            artist.songs.push({
              title: songTitle,
              songId,
            });
            if (relevantAlbums.length > 0) {
              relevantAlbums.forEach((relevantAlbum) =>
                artist.albums?.push({
                  title: relevantAlbum.title,
                  albumId: relevantAlbum.albumId,
                })
              );
            }
            relevantArtists.push(artist);
            return artist;
          });
          updatedArtists = updatedArtists
            .filter((val) => val.name !== newArtist.name)
            .concat(z);
        } else {
          const artist: SavableArtist = {
            name: newArtist.name,
            artistId: generateRandomId(),
            songs: [
              {
                songId,
                title: songTitle,
              },
            ],
            artworkName:
              songArtworkPaths && !songArtworkPaths.isDefaultArtwork
                ? path.basename(songArtworkPaths.artworkPath)
                : undefined,
            albums:
              relevantAlbums.length > 0
                ? [
                    {
                      title: relevantAlbums[0].title,
                      albumId: relevantAlbums[0].albumId,
                    },
                  ]
                : [],
            isAFavorite: false,
          };
          relevantArtists.push(artist);
          updatedArtists.push(artist);
        }
      }
      return { allArtists: updatedArtists, newArtists, relevantArtists };
    }
    return { allArtists: updatedArtists, newArtists, relevantArtists };
  }
  return { allArtists: [], newArtists, relevantArtists };
};

export const manageGenres = (
  allGenres: SavableGenre[],
  songTitle: string,
  songId: string,
  songGenres?: string[],
  songArtworkPaths?: ArtworkPaths,
  darkVibrantBgColor?: { rgb: unknown }
) => {
  const newGenres: SavableGenre[] = [];
  const relevantGenres: SavableGenre[] = [];
  let genres = allGenres;
  if (
    Array.isArray(songGenres) &&
    songGenres.length > 0 &&
    Array.isArray(genres)
  ) {
    for (let x = 0; x < songGenres.length; x += 1) {
      const songGenre = songGenres[x];
      if (genres.some((x) => x.name === songGenre)) {
        let y = genres.filter((genre) => genre.name === songGenre);
        y = y.map((z) => {
          z.artworkName =
            songArtworkPaths && !songArtworkPaths.isDefaultArtwork
              ? path.basename(songArtworkPaths.artworkPath)
              : z.artworkName || undefined;
          z.backgroundColor = darkVibrantBgColor || z.backgroundColor;
          z.songs.push({
            songId,
            title: songTitle,
          });
          relevantGenres.push(z);
          return z;
        });
        genres = genres.filter((genre) => genre.name !== songGenre).concat(y);
      } else {
        const newGenre: SavableGenre = {
          name: songGenre,
          genreId: generateRandomId(),
          songs: [
            {
              songId,
              title: songTitle,
            },
          ],
          artworkName:
            songArtworkPaths && !songArtworkPaths.isDefaultArtwork
              ? path.basename(songArtworkPaths.artworkPath)
              : undefined,
          backgroundColor: darkVibrantBgColor,
        };
        relevantGenres.push(newGenre);
        newGenres.push(newGenre);
        genres.push(newGenre);
      }
    }
    return { allGenres: genres, newGenres, relevantGenres };
  }
  return { allGenres: genres || [], newGenres, relevantGenres };
};
