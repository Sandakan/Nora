/* eslint-disable no-use-before-define */
import * as musicMetaData from 'music-metadata';

import path from 'path';
import fs from 'fs/promises';

import sharp from 'sharp';
import { generateRandomId } from './utils/randomId';
import log from './log';
import {
  DEFAULT_ARTWORK_SAVE_LOCATION,
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
import getAssetPath from './utils/getAssetPath';
// import { timeEnd, timeStart } from './utils/measureTimeUsage';

let defaultSongCoverImgBuffer: Buffer;

export const getDefaultSongCoverImgBuffer = async () => {
  if (defaultSongCoverImgBuffer) return defaultSongCoverImgBuffer;

  try {
    const buffer = await sharp(
      getAssetPath('images', 'webp', 'song_cover_default.webp')
    )
      .png()
      .toBuffer();
    defaultSongCoverImgBuffer = buffer;
    return buffer;
  } catch (error) {
    log(
      `ERROR OCCURRED WHEN READING A FILE OF NAME 'song_cover_default.webp'.`,
      { error },
      'ERROR'
    );
    return undefined;
  }
};

export const generateCoverBuffer = async (
  cover?: musicMetaData.IPicture[] | string,
  noDefaultOnUndefined = false
) => {
  if (
    (cover === undefined ||
      (typeof cover !== 'string' && cover[0].data === undefined)) &&
    noDefaultOnUndefined
  )
    return undefined;
  if (cover) {
    if (typeof cover === 'string') {
      try {
        const imgPath = path.join(DEFAULT_ARTWORK_SAVE_LOCATION, cover);
        const isWebp = path.extname(imgPath) === '.webp';

        const buffer = isWebp
          ? await sharp(imgPath).png().toBuffer()
          : await fs.readFile(imgPath);

        return buffer;
      } catch (error) {
        log(
          `ERROR OCCURRED WHEN TRYING TO GENERATE ARTWORK BUFFER.`,
          { error },
          'ERROR'
        );
        return getDefaultSongCoverImgBuffer();
      }
    }

    if (cover[0].format === 'image/webp') {
      try {
        const buffer = await sharp(cover[0].data).png().toBuffer();
        return buffer;
      } catch (error) {
        log(
          'Error occurred when trying to get artwork buffer of a song.',
          { error },
          'WARN'
        );
        return getDefaultSongCoverImgBuffer();
      }
    }

    return cover[0].data;
  }

  return getDefaultSongCoverImgBuffer();
};

let parseQueue: string[] = [];

export const parseSong = async (
  absoluteFilePath: string,
  noRendererMessages = false
): Promise<SongData | undefined> => {
  // const start = timeStart();

  log(
    `Starting the parsing process of song '${path.basename(absoluteFilePath)}'.`
  );
  const songs = getSongsData();
  const artists = getArtistsData();
  const albums = getAlbumsData();
  const genres = getGenresData();

  // const start1 = timeEnd(start, 'Time to fetch songs,artists,albums,genres');

  const stats = await fs.stat(absoluteFilePath);
  const metadata = await musicMetaData.parseFile(absoluteFilePath);

  // const start2 = timeEnd(start1, 'Time to fetch stats and parse metadata');

  if (
    Array.isArray(songs) &&
    metadata &&
    !songs.some((song) => song.path === absoluteFilePath) &&
    !parseQueue.includes(absoluteFilePath)
  ) {
    parseQueue.push(absoluteFilePath);

    // timeEnd(start2, 'Time to start organizing metadata');

    const songTitle =
      metadata.common.title ||
      path.basename(absoluteFilePath).split('.')[0] ||
      'Unknown Title';

    // const start3 = timeStart();

    const songId = generateRandomId();

    // const start4 = timeEnd(start3, 'Time to generate random id');

    // const coverBuffer = await generateCoverBuffer(metadata.common.picture);

    const songArtworkPaths = await storeArtworks(
      songId,
      'songs',
      metadata.common?.picture?.at(0)?.data
    );

    // const start6 = timeEnd(start4, 'Time to generate store artwork');

    // const palette = await generatePalette(coverBuffer, false);

    // const start7 = timeEnd(start6, 'Time to generate palette');

    // if (metadata.common.lyrics)
    //   console.log(metadata.common.title, metadata.common.lyrics);

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
      // palette:
      //   palette && palette.DarkVibrant && palette.LightVibrant
      //     ? {
      //         DarkVibrant: palette.DarkVibrant,
      //         LightVibrant: palette.LightVibrant,
      //       }
      //     : undefined,
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

    // const start8 = timeEnd(start6, 'Time to create songInfo basic object');

    const { updatedAlbums, relevantAlbums, newAlbums } = manageAlbums(
      albums,
      songInfo.title,
      songInfo.songId,
      metadata.common.album,
      songArtworkPaths,
      songInfo.artists,
      songInfo.year
    );

    // const start9 = timeEnd(start8, 'Time to manage albums');

    if (songInfo.album)
      songInfo.album = {
        name: relevantAlbums[0].title,
        albumId: relevantAlbums[0].albumId,
      };

    // const start10 = timeEnd(
    //   start9,
    //   'Time to update album data in songInfo object'
    // );

    const { allArtists, relevantArtists, newArtists } = manageArtists(
      artists,
      songInfo.title,
      songInfo.songId,
      songInfo.artists,
      songArtworkPaths,
      relevantAlbums
    );

    // const start11 = timeEnd(start10, 'Time to manage artists');

    if (songInfo.artists) {
      for (let x = 0; x < relevantArtists.length; x += 1) {
        for (let y = 0; y < songInfo.artists.length; y += 1) {
          if (relevantArtists[x].name === songInfo.artists[y].name)
            songInfo.artists[y].artistId = relevantArtists[x].artistId;
        }
      }
    }

    // const start12 = timeEnd(
    //   start11,
    //   'Time to update artist data in songInfo object'
    // );

    const { allGenres, relevantGenres, newGenres } = manageGenres(
      genres,
      songInfo.title,
      songInfo.songId,
      metadata.common.genre,
      songArtworkPaths,
      songInfo.palette?.DarkVibrant
    );

    // const start13 = timeEnd(start12, 'Time to manage genres');

    songInfo.genres = relevantGenres.map((genre) => {
      return { name: genre.name, genreId: genre.genreId };
    });

    // const start14 = timeEnd(
    //   start13,
    //   'Time to update genre data in songInfo object'
    // );

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

    parseQueue = parseQueue.filter((dir) => dir !== absoluteFilePath);

    // timeEnd(start14, 'Time to reach end of the parsing process.');

    // const start15 = timeEnd(start, 'Time to finish the parsing process.');

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

    if (!noRendererMessages)
      sendMessageToRenderer(
        `'${songTitle}' song added to the library.`,
        'PARSE_SUCCESSFUL',
        { songId }
      );

    // timeEnd(
    //   start15,
    //   'Time to finalize the data events of the parsing process.'
    // );

    // timeEnd(start, 'Total time taken for the parsing process.');

    return {
      ...songInfo,
      artworkPaths: songArtworkPaths,
      // a newly parsed song cannot be blacklisted
      isBlacklisted: false,
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
      if (genres.some((genre) => genre.name === songGenre)) {
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
