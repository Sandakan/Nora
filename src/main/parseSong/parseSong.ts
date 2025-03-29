import fs from 'fs/promises';
import path from 'path';
import * as musicMetaData from 'music-metadata';

import { generateRandomId } from '../utils/randomId';
import logger from '../logger';
import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getSongsData,
  setAlbumsData,
  setArtistsData,
  setGenresData,
  setSongsData
} from '../filesystem';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import { storeArtworks } from '../other/artworks';
import { generatePalettes } from '../other/generatePalette';
import { isSongBlacklisted } from '../utils/isBlacklisted';
import manageAlbumsOfParsedSong from './manageAlbumsOfParsedSong';
import manageArtistsOfParsedSong from './manageArtistsOfParsedSong';
import manageGenresOfParsedSong from './manageGenresOfParsedSong';
import manageAlbumArtistOfParsedSong from './manageAlbumArtistOfParsedSong';
// import { timeEnd, timeStart } from './utils/measureTimeUsage';

let pathsQueue: string[] = [];

export const tryToParseSong = (
  songPath: string,
  reparseToSync = false,
  generatePalettesAfterParsing = false,
  noRendererMessages = false
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
        logger.debug(`song added to the library.`, { songPath });
        if (generatePalettesAfterParsing) setTimeout(generatePalettes, 1500);

        dataUpdateEvent('songs/newSong');
        pathsQueue = pathsQueue.filter((x) => x !== songPath);
      } catch (error) {
        if (errRetryCount < 5) {
          // THIS ERROR OCCURRED WHEN THE APP STARTS READING DATA WHILE THE SONG IS STILL WRITING TO THE DISK. POSSIBLE SOLUTION IS TO SET A TIMEOUT AND REDO THE PROCESS.
          if (timeOutId) clearTimeout(timeOutId);
          logger.debug('Failed to parse song data. Retrying in 5 seconds. (error: read error)', {
            error
          });
          timeOutId = setTimeout(() => tryParseSong(errRetryCount + 1), 5000);
        } else {
          logger.debug(
            `Failed to parse a newly added song while the app is open. Failed 5 of 5 retry efforts.`,
            { error }
          );
          sendMessageToRenderer({
            messageCode: 'PARSE_FAILED',
            data: { name: songFileName }
          });
          throw error;
        }
      }
    };

    return tryParseSong();
  }
  logger.info('Song parsing ignored because it is not eligible.', {
    songPath,
    reason: {
      isSongInPathsQueue
    }
  });
  return undefined;
};

let parseQueue: string[] = [];

export const parseSong = async (
  absoluteFilePath: string,
  reparseToSync = false,
  noRendererMessages = false
): Promise<SongData | undefined> => {
  // const start = timeStart();
  logger.debug(`Starting the parsing process of song '${path.basename(absoluteFilePath)}'.`);

  const songs = getSongsData();
  const artists = getArtistsData();
  const albums = getAlbumsData();
  const genres = getGenresData();

  // const start1 = timeEnd(start, 'Time to fetch songs,artists,albums,genres');

  try {
    // const songFileStream = createReadStream(absoluteFilePath);

    // songFileStream.on('error', (err) => {
    //  logger.debug(err);
    //   throw err;
    // });

    // if (!songFileStream.readable)
    //  logger.debug('song stream not readable', undefined, 'ERROR');

    const stats = await fs.stat(absoluteFilePath);
    const metadata: musicMetaData.IAudioMetadata = await musicMetaData.parseFile(absoluteFilePath);

    // songFileStream.close();

    // const start2 = timeEnd(start1, 'Time to fetch stats and parse metadata');

    const isSongAvailable = songs.some((song) => song.path === absoluteFilePath);
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
        path.basename(absoluteFilePath, path.extname(absoluteFilePath)) ||
        'Unknown Title';

      // const start3 = timeStart();

      const songId = generateRandomId();

      // const start4 = timeEnd(start3, 'Time to generate random id');

      // const coverBuffer = await generateCoverBuffer(metadata.common.picture);

      const songArtworkPaths = await storeArtworks(
        songId,
        'songs',
        metadata.common?.picture?.at(0) ? Buffer.from(metadata.common.picture[0].data) : undefined
      );

      // const start6 = timeEnd(start4, 'Time to generate store artwork');

      // const palette = await generatePalette(coverBuffer, false);

      // const start7 = timeEnd(start6, 'Time to generate palette');

      // if (metadata.common.lyrics)
      //   consolelogger.debug(metadata.common.title, metadata.common.lyrics);

      const songInfo: SavableSongData = {
        songId,
        title: songTitle,
        artists: getArtistNamesFromSong(metadata.common.artist),
        albumArtists: getArtistNamesFromSong(metadata.common.albumartist),
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
        discNo: metadata?.common?.disk?.no ?? undefined,
        trackNo: metadata?.common?.track?.no ?? undefined,
        addedDate: new Date().getTime(),
        createdDate: stats ? stats.birthtime.getTime() : undefined,
        modifiedDate: stats ? stats.mtime.getTime() : undefined
      };

      // const start8 = timeEnd(start6, 'Time to create songInfo basic object');

      const { updatedAlbums, relevantAlbum, newAlbum } = manageAlbumsOfParsedSong(
        albums,
        songInfo,
        songArtworkPaths
      );

      // const start9 = timeEnd(start8, 'Time to manage albums');

      if (songInfo.album && relevantAlbum)
        songInfo.album = {
          name: relevantAlbum.title,
          albumId: relevantAlbum.albumId
        };

      // const start10 = timeEnd(
      //   start9,
      //   'Time to update album data in songInfo object'
      // );
      const {
        updatedArtists: updatedSongArtists,
        relevantArtists,
        newArtists
      } = manageArtistsOfParsedSong(artists, songInfo, songArtworkPaths);
      // const start11 = timeEnd(start10, 'Time to manage artists');

      const { relevantAlbumArtists, updatedArtists } = manageAlbumArtistOfParsedSong(
        updatedSongArtists,
        songInfo,
        songArtworkPaths,
        relevantAlbum
      );

      if (songInfo.artists && relevantArtists.length > 0) {
        songInfo.artists = relevantArtists.map((artist) => ({
          artistId: artist.artistId,
          name: artist.name
        }));
      }

      if (relevantAlbumArtists.length > 0) {
        songInfo.albumArtists = relevantAlbumArtists.map((albumArtist) => ({
          artistId: albumArtist.artistId,
          name: albumArtist.name
        }));
      }

      if (relevantAlbum) {
        const allRelevantArtists = relevantArtists.concat(relevantAlbumArtists);

        for (const relevantArtist of allRelevantArtists) {
          relevantAlbum.artists?.forEach((artist) => {
            if (artist.name === relevantArtist.name && artist.artistId.length === 0)
              artist.artistId = relevantArtist.artistId;
          });
        }
      }

      // const start12 = timeEnd(
      //   start11,
      //   'Time to update artist data in songInfo object'
      // );

      const { updatedGenres, relevantGenres, newGenres } = manageGenresOfParsedSong(
        genres,
        songInfo,
        songArtworkPaths
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
      logger.debug(`Song parsing completed successfully.`, {
        songId,
        title: songTitle,
        artistCount: updatedArtists.length,
        albumCount: updatedAlbums.length,
        genreCount: updatedGenres.length
      });
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
          newArtists.map((x) => x.artistId)
        );
      if (relevantArtists.length > 0)
        dataUpdateEvent(
          'artists',
          relevantArtists.map((x) => x.artistId)
        );
      if (newAlbum) dataUpdateEvent('albums/newAlbum', [newAlbum.albumId]);
      if (relevantAlbum) dataUpdateEvent('albums', [relevantAlbum.albumId]);
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
        sendMessageToRenderer({
          messageCode: 'PARSE_SUCCESSFUL',
          data: { name: songTitle, songId }
        });

      // timeEnd(
      //   start15,
      //   'Time to finalize the data events of the parsing process.'
      // );

      // timeEnd(start, 'Total time taken for the parsing process.');

      return {
        ...songInfo,
        artworkPaths: songArtworkPaths,
        isBlacklisted: isSongBlacklisted(songId, absoluteFilePath)
      };
    }
    logger.debug('Song not eligable for parsing.', {
      absoluteFilePath,
      reason: {
        isSongArrayAvailable: Array.isArray(songs),
        isSongInParseQueue
      }
    });
    return undefined;
  } catch (error) {
    logger.error(`Error occurred when parsing a song.`, { error, absoluteFilePath });
    throw error;
  } finally {
    parseQueue = parseQueue.filter((dir) => dir !== absoluteFilePath);
  }
};

export const getArtistNamesFromSong = (artists?: string) => {
  if (artists) {
    const splittedArtists = artists.split(',');
    const splittedArtistsInfo = splittedArtists.map((x) => ({
      name: x.trim(),
      artistId: ''
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
