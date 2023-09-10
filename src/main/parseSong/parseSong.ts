/* eslint-disable no-use-before-define */

// import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import * as musicMetaData from 'music-metadata';

import { generateRandomId } from '../utils/randomId';
import log from '../log';
import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getSongsData,
  setAlbumsData,
  setArtistsData,
  setGenresData,
  setSongsData,
} from '../filesystem';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import { storeArtworks } from '../other/artworks';
import { generatePalettes } from '../other/generatePalette';
import { isSongBlacklisted } from '../utils/isBlacklisted';
import manageAlbumsOfParsedSong from './manageAlbumsOfParsedSong';
import manageArtistsOfParsedSong from './manageArtistsOfParsedSong';
import manageGenresOfParsedSong from './manageGenresOfParsedSong';
// import { timeEnd, timeStart } from './utils/measureTimeUsage';

let pathsQueue: string[] = [];

export const tryToParseSong = (
  songPath: string,
  reparseToSync = false,
  generatePalettesAfterParsing = false,
  noRendererMessages = false,
) => {
  let timeOutId: NodeJS.Timeout;

  const songFileName = path.basename(songPath);
  const isSongInPathsQueue = pathsQueue.includes(songPath);

  // Here paths queue is used to prevent parsing the same song multiple times due to the event being fired multiple times for the same song even before they are parsed. So if the same is going to start the parsing process, it will stop the process if the song path is in the songPaths queue.
  if (!isSongInPathsQueue) {
    pathsQueue.push(songPath);

    const tryParseSong = async (errRetryCount = 0): Promise<void> => {
      try {
        await parseSong(songPath, reparseToSync, noRendererMessages);
        log(`'${songFileName}' song added to the library.`);
        if (generatePalettesAfterParsing) setTimeout(generatePalettes, 1500);

        dataUpdateEvent('songs/newSong');
        pathsQueue = pathsQueue.filter((x) => x !== songPath);
      } catch (error) {
        if (errRetryCount < 5) {
          // THIS ERROR OCCURRED WHEN THE APP STARTS READING DATA WHILE THE SONG IS STILL WRITING TO THE DISK. POSSIBLE SOLUTION IS TO SET A TIMEOUT AND REDO THE PROCESS.
          if (timeOutId) clearTimeout(timeOutId);
          log(
            'ERROR OCCURRED WHEN TRYING TO PARSE SONG DATA. RETRYING IN 5 SECONDS. (ERROR: READ ERROR)',
          );
          setTimeout(() => tryParseSong(errRetryCount + 1), 5000);
        } else {
          log(
            `ERROR OCCURRED WHEN PARSING A NEWLY ADDED SONG WHILE THE APP IS OPEN. FAILED 5 OF 5 RETRY EFFORTS.`,
            { error },
            'ERROR',
          );
          sendMessageToRenderer(
            `'${songFileName}' failed when trying to add the song to the library. Go to settings to resync the library.`,
            'PARSE_FAILED',
          );
          throw error;
        }
      }
    };

    return tryParseSong();
  }
  log(
    'Song is not added for parsing because it is not eligible for parsing.',
    {
      songPath,
      reason: {
        isSongInPathsQueue,
      },
    },
    'WARN',
  );
  return undefined;
};

let parseQueue: string[] = [];

export const parseSong = async (
  absoluteFilePath: string,
  reparseToSync = false,
  noRendererMessages = false,
): Promise<SongData | undefined> => {
  // const start = timeStart();
  log(
    `Starting the parsing process of song '${path.basename(
      absoluteFilePath,
    )}'.`,
  );
  const songs = getSongsData();
  const artists = getArtistsData();
  const albums = getAlbumsData();
  const genres = getGenresData();

  // const start1 = timeEnd(start, 'Time to fetch songs,artists,albums,genres');

  try {
    // const songFileStream = createReadStream(absoluteFilePath);

    // songFileStream.on('error', (err) => {
    //   log(err);
    //   throw err;
    // });

    // if (!songFileStream.readable)
    //   log('song stream not readable', undefined, 'ERROR');

    const stats = await fs.stat(absoluteFilePath);
    const metadata = await musicMetaData.parseFile(absoluteFilePath);

    // songFileStream.close();

    // const start2 = timeEnd(start1, 'Time to fetch stats and parse metadata');

    const isSongAvailable = songs.some(
      (song) => song.path === absoluteFilePath,
    );
    const isSongInParseQueue = parseQueue.includes(absoluteFilePath);
    const isSongEligibleForParsing =
      Array.isArray(songs) &&
      metadata &&
      (reparseToSync || !isSongAvailable) &&
      !isSongInParseQueue;

    if (isSongEligibleForParsing) {
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
        metadata.common?.picture?.at(0)?.data,
      );

      // const start6 = timeEnd(start4, 'Time to generate store artwork');

      // const palette = await generatePalette(coverBuffer, false);

      // const start7 = timeEnd(start6, 'Time to generate palette');

      // if (metadata.common.lyrics)
      //   console.log(metadata.common.title, metadata.common.lyrics);

      const songInfo: SavableSongData = {
        songId,
        title: songTitle,
        artists: getArtistNamesFromSong(metadata.common.artists),
        duration: getSongDurationFromSong(metadata.format.duration),
        album: getAlbumInfoFromSong(metadata.common.album),
        genres: getGenreInfoFromSong(metadata.common.genre),
        year: metadata.common?.year,
        isAFavorite: false,
        isArtworkAvailable: !songArtworkPaths.isDefaultArtwork,
        path: absoluteFilePath,
        sampleRate: metadata.format.sampleRate,
        bitrate: metadata?.format?.bitrate,
        noOfChannels: metadata?.format?.numberOfChannels,
        trackNo: metadata?.common?.track?.no ?? undefined,
        addedDate: new Date().getTime(),
        createdDate: stats ? stats.birthtime.getTime() : undefined,
        modifiedDate: stats ? stats.mtime.getTime() : undefined,
      };

      // const start8 = timeEnd(start6, 'Time to create songInfo basic object');

      const { updatedAlbums, relevantAlbums, newAlbums } =
        manageAlbumsOfParsedSong(albums, songInfo, songArtworkPaths);

      // const start9 = timeEnd(start8, 'Time to manage albums');

      if (songInfo.album && relevantAlbums.length > 0)
        songInfo.album = {
          name: relevantAlbums[0].title,
          albumId: relevantAlbums[0].albumId,
        };

      // const start10 = timeEnd(
      //   start9,
      //   'Time to update album data in songInfo object'
      // );

      const { updatedArtists, relevantArtists, newArtists } =
        manageArtistsOfParsedSong(
          artists,
          songInfo,
          songArtworkPaths,
          relevantAlbums,
        );

      // const start11 = timeEnd(start10, 'Time to manage artists');

      if (songInfo.artists && relevantArtists.length > 0) {
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

      const { updatedGenres, relevantGenres, newGenres } =
        manageGenresOfParsedSong(
          genres,
          songInfo,
          songArtworkPaths,
          songInfo.palette?.DarkVibrant,
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
        undefined,
      );
      setSongsData(songs);
      setArtistsData(updatedArtists);
      setAlbumsData(updatedAlbums);
      setGenresData(updatedGenres);
      dataUpdateEvent('songs/newSong', [songId]);

      parseQueue = parseQueue.filter((dir) => dir !== absoluteFilePath);

      // timeEnd(start14, 'Time to reach end of the parsing process.');

      // const start15 = timeEnd(start, 'Time to finish the parsing process.');

      if (newArtists.length > 0)
        dataUpdateEvent(
          'artists/newArtist',
          newArtists.map((x) => x.artistId),
        );
      if (relevantArtists.length > 0)
        dataUpdateEvent(
          'artists',
          relevantArtists.map((x) => x.artistId),
        );
      if (newAlbums.length > 0)
        dataUpdateEvent(
          'albums/newAlbum',
          newAlbums.map((x) => x.albumId),
        );
      if (relevantAlbums.length > 0)
        dataUpdateEvent(
          'albums',
          relevantAlbums.map((x) => x.albumId),
        );
      if (newGenres.length > 0)
        dataUpdateEvent(
          'genres/newGenre',
          newGenres.map((x) => x.genreId),
        );
      if (relevantGenres.length > 0)
        dataUpdateEvent(
          'genres',
          relevantGenres.map((x) => x.genreId),
        );

      if (!noRendererMessages)
        sendMessageToRenderer(
          `'${songTitle}' song added to the library.`,
          'PARSE_SUCCESSFUL',
          { songId },
        );

      // timeEnd(
      //   start15,
      //   'Time to finalize the data events of the parsing process.'
      // );

      // timeEnd(start, 'Total time taken for the parsing process.');

      return {
        ...songInfo,
        artworkPaths: songArtworkPaths,
        isBlacklisted: isSongBlacklisted(songId, absoluteFilePath),
      };
    }
    log(
      'Song not eligable for parsing.',
      {
        absoluteFilePath,
        reason: {
          isSongArrayAvailable: Array.isArray(songs),
          isSongInParseQueue,
        },
      },
      'WARN',
    );
    return undefined;
  } catch (err) {
    log(`Error occurred when parsing a song.`, { err }, 'ERROR');
    throw err;
  } finally {
    parseQueue = parseQueue.filter((dir) => dir !== absoluteFilePath);
  }
};

export const getArtistNamesFromSong = (artists = [] as string[]) => {
  if (artists.length > 0) {
    const [artistData] = artists;
    const splittedArtists = artistData.split(',');
    const splittedArtistsInfo = splittedArtists.map((x) => ({
      name: x.trim(),
      artistId: '',
    }));

    return splittedArtistsInfo;
  }
  return undefined;
};

export const getSongDurationFromSong = (duration?: number) => {
  if (typeof duration === 'number') {
    const fixedDuration = duration.toFixed(2);
    return parseFloat(fixedDuration);
  }
  return 0;
};

export const getAlbumInfoFromSong = (album?: string) => {
  if (album) return { name: album, albumId: '' };
  return undefined;
};

export const getGenreInfoFromSong = (genres?: string[]) => {
  if (Array.isArray(genres) && genres.length > 0)
    return genres.map((genre) => ({ name: genre, genreId: '' }));
  return undefined;
};
