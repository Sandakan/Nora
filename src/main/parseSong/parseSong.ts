import fs from "fs/promises";
import path from "path";
import { File } from "node-taglib-sharp";

import logger from "../logger";
import { dataUpdateEvent, sendMessageToRenderer } from "../main";
import { storeArtworks } from "../other/artworks";
import { generatePalettes } from "../other/generatePalette";
import manageAlbumsOfParsedSong from "./manageAlbumsOfParsedSong";
import manageArtistsOfParsedSong from "./manageArtistsOfParsedSong";
import manageGenresOfParsedSong from "./manageGenresOfParsedSong";
import manageAlbumArtistOfParsedSong from "./manageAlbumArtistOfParsedSong";
import { isSongWithPathAvailable, saveSong } from "@main/db/queries/songs";
import type { songs } from "@main/db/schema";
import { db } from "@main/db/db";
import { linkArtworksToSong } from "@main/db/queries/artworks";
// import { timeEnd, timeStart } from './utils/measureTimeUsage';

const pathsQueue = new Set<string>();
export const ARTIST_SEPARATOR_REGEX = /[,&]/gm;

export const tryToParseSong = (
  songPath: string,
  folderId?: number,
  reparseToSync = false,
  generatePalettesAfterParsing = false,
  noRendererMessages = false,
) => {
  let timeOutId: NodeJS.Timeout;

  const songFileName = path.basename(songPath);
  const isSongInPathsQueue = pathsQueue.has(songPath);

  // Here paths queue is used to prevent parsing the same song multiple times due to the event being fired multiple times for the same song even before they are parsed. So if the same is going to start the parsing process, it will stop the process if the song path is in the songPaths queue.
  if (!isSongInPathsQueue) {
    pathsQueue.add(songPath);

    const tryParseSong = async (errRetryCount = 0): Promise<void> => {
      try {
        await parseSong(songPath, folderId, reparseToSync, noRendererMessages);
        logger.debug(`song added to the library.`, { songPath });
        if (generatePalettesAfterParsing) setTimeout(generatePalettes, 1500);

        dataUpdateEvent("songs/newSong");
        pathsQueue.delete(songPath);
      } catch (error) {
        if (errRetryCount < 5) {
          // THIS ERROR OCCURRED WHEN THE APP STARTS READING DATA WHILE THE SONG IS STILL WRITING TO THE DISK. POSSIBLE SOLUTION IS TO SET A TIMEOUT AND REDO THE PROCESS.
          if (timeOutId) clearTimeout(timeOutId);
          logger.debug(
            "Failed to parse song data. Retrying in 5 seconds. (error: read error)",
            {
              error,
            },
          );
          timeOutId = setTimeout(() => {
            tryParseSong(errRetryCount + 1).catch(() => {
              // Error will be handled in the recursive call
            });
          }, 5000);
        } else {
          logger.debug(
            `Failed to parse a newly added song while the app is open. Failed 5 of 5 retry efforts.`,
            { error },
          );
          sendMessageToRenderer({
            messageCode: "PARSE_FAILED",
            data: { name: songFileName },
          });
          pathsQueue.delete(songPath);
          throw error;
        }
      }
    };

    return tryParseSong();
  }
  logger.info("Song parsing ignored because it is not eligible.", {
    songPath,
    reason: {
      isSongInPathsQueue,
    },
  });
  return undefined;
};

const parseQueue = new Set<string>();

export const parseSong = async (
  absoluteFilePath: string,
  folderId?: number,
  reparseToSync = false,
  noRendererMessages = false,
): Promise<SongData | undefined> => {
  // const start = timeStart();
  logger.debug(
    `Starting the parsing process of song '${
      path.basename(absoluteFilePath)
    }'.`,
  );

  // Check if already parsing this file (prevents concurrent parses of same file)
  const isSongInParseQueue = parseQueue.has(absoluteFilePath);
  if (isSongInParseQueue) {
    logger.debug("Song not eligable for parsing.", {
      absoluteFilePath,
      reason: {
        isSongInParseQueue,
      },
    });
    return undefined;
  }

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
    const file = File.createFromPath(absoluteFilePath);
    const metadata = file.tag;

    // songFileStream.close();

    // const start2 = timeEnd(start1, 'Time to fetch stats and parse metadata');

    const isSongAvailable = await isSongWithPathAvailable(absoluteFilePath);
    const isSongEligibleForParsing = metadata &&
      (reparseToSync || !isSongAvailable);

    if (isSongEligibleForParsing) {
      parseQueue.add(absoluteFilePath);

      // timeEnd(start2, 'Time to start organizing metadata');

      const songTitle = metadata.title ||
        path.basename(absoluteFilePath, path.extname(absoluteFilePath)) ||
        "Unknown Title";

      // const start3 = timeStart();

      // const start4 = timeEnd(start3, 'Time to generate random id');

      // const coverBuffer = await generateCoverBuffer(metadata.common.picture);

      // const start6 = timeEnd(start4, 'Time to generate store artwork');

      // const palette = await generatePalette(coverBuffer, false);

      // const start7 = timeEnd(start6, 'Time to generate palette');

      // if (metadata.common.lyrics)
      //   consolelogger.debug(metadata.common.title, metadata.common.lyrics);

      const artistsData = getArtistNamesFromSong(
        metadata.performers.join(", "),
      );
      const albumArtistsData = getArtistNamesFromSong(
        metadata.albumArtists.join(", "),
      );
      const albumData = getAlbumInfoFromSong(metadata.album);
      const genresData = getGenreInfoFromSong(metadata.genres);

      const songInfo: typeof songs.$inferInsert = {
        title: songTitle,
        duration: getSongDurationFromSong(
          file.properties.durationMilliseconds / 1000,
        ).toFixed(2),
        year: metadata.year || undefined,
        path: absoluteFilePath,
        sampleRate: file.properties.audioSampleRate,
        bitRate: file.properties.audioBitrate
          ? Math.ceil(file.properties.audioBitrate)
          : undefined,
        noOfChannels: file.properties.audioChannels,
        diskNumber: metadata.disc ?? undefined,
        trackNumber: metadata.track ?? undefined,
        fileCreatedAt: stats ? stats.birthtime : new Date(),
        fileModifiedAt: stats ? stats.mtime : new Date(),
        folderId,
      };

      const res = await db.transaction(async (trx) => {
        const songData = await saveSong(songInfo, trx);

        const artworkData = await storeArtworks(
          "songs",
          metadata.pictures?.at(0)
            ? metadata.pictures[0].data.toByteArray()
            : undefined,
          trx,
        );

        const linkedArtworks = await linkArtworksToSong(
          artworkData.map((artwork) => ({
            songId: songData.id,
            artworkId: artwork.id,
          })),
          trx,
        );

        // const start8 = timeEnd(start6, 'Time to create songInfo basic object');

        const { relevantAlbum, newAlbum } = await manageAlbumsOfParsedSong(
          {
            songId: songData.id,
            artworkId: artworkData[0].id,
            songYear: songData.year,
            artists: artistsData,
            albumArtists: albumArtistsData,
            albumName: albumData,
          },
          trx,
        );
        // const start9 = timeEnd(start8, 'Time to manage albums');

        // if (songInfo.album && relevantAlbum)
        //   songInfo.album = {
        //     name: relevantAlbum.title,
        //     albumId: relevantAlbum.albumId
        //   };

        // const start10 = timeEnd(
        //   start9,
        //   'Time to update album data in songInfo object'
        // );
        const { newArtists, relevantArtists } = await manageArtistsOfParsedSong(
          {
            artworkId: artworkData[0].id,
            songId: songData.id,
            songArtists: artistsData,
          },
          trx,
        );
        // const start11 = timeEnd(start10, 'Time to manage artists');

        const { newAlbumArtists, relevantAlbumArtists } =
          await manageAlbumArtistOfParsedSong(
            { albumArtists: albumArtistsData, albumId: relevantAlbum?.id },
            trx,
          );

        // const start12 = timeEnd(
        //   start11,
        //   'Time to update artist data in songInfo object'
        // );

        const { newGenres, relevantGenres } = await manageGenresOfParsedSong(
          {
            artworkId: artworkData[0].id,
            songId: songData.id,
            songGenres: genresData,
          },
          trx,
        );

        return {
          songData,
          linkedArtworks,
          relevantAlbum,
          newAlbum,
          newArtists,
          relevantArtists,
          newGenres,
          relevantGenres,
          relevantAlbumArtists,
          newAlbumArtists,
        };
      });

      logger.debug(`Song parsing completed successfully.`, {
        songId: res.songData.id,
        title: res.songData.title,
        artistCount: res.relevantArtists.length,
        albumCount: 1,
        genreCount: res.relevantGenres.length,
      });

      dataUpdateEvent("songs/newSong", [res.songData.id]);

      parseQueue.delete(absoluteFilePath);

      // timeEnd(start14, 'Time to reach end of the parsing process.');

      // const start15 = timeEnd(start, 'Time to finish the parsing process.');

      if (res.newArtists.length > 0) {
        dataUpdateEvent(
          "artists/newArtist",
          res.newArtists.map((x) => x.id),
        );
      }
      if (res.relevantArtists.length > 0) {
        dataUpdateEvent(
          "artists",
          res.relevantArtists.map((x) => x.id),
        );
      }
      if (res.newAlbum) dataUpdateEvent("albums/newAlbum", [res.newAlbum.id]);
      if (res.relevantAlbum) dataUpdateEvent("albums", [res.relevantAlbum.id]);
      if (res.newGenres.length > 0) {
        dataUpdateEvent(
          "genres/newGenre",
          res.newGenres.map((x) => x.id),
        );
      }
      if (res.relevantGenres.length > 0) {
        dataUpdateEvent(
          "genres",
          res.relevantGenres.map((x) => x.id),
        );
      }

      if (!noRendererMessages) {
        sendMessageToRenderer({
          messageCode: "PARSE_SUCCESSFUL",
          data: { name: songTitle, songId: res.songData.id },
        });
      }

      // timeEnd(
      //   start15,
      //   'Time to finalize the data events of the parsing process.'
      // );

      // timeEnd(start, 'Total time taken for the parsing process.');

      return undefined;
    }
    logger.debug("Song not eligable for parsing.", {
      absoluteFilePath,
      reason: {
        isSongArrayAvailable: true,
      },
    });
    return undefined;
  } catch (error) {
    logger.error(`Error occurred when parsing a song.`, {
      error,
      absoluteFilePath,
    });
    throw error;
  } finally {
    parseQueue.delete(absoluteFilePath);
  }
};

export const getArtistNamesFromSong = (artists?: string) => {
  if (artists) {
    const splittedArtists = artists
      .split(ARTIST_SEPARATOR_REGEX)
      .map((artist) => artist.trim())
      .filter((a) => a.length > 0);

    return splittedArtists;
  }
  return [];
};

export const getSongDurationFromSong = (duration?: number) => {
  if (typeof duration === "number") {
    const fixedDuration = duration.toFixed(2);
    return parseFloat(fixedDuration);
  }
  return 0;
};

export const getAlbumInfoFromSong = (album?: string) => {
  if (album) return album;
  return undefined;
};

export const getGenreInfoFromSong = (genres?: string[]) => {
  if (Array.isArray(genres) && genres.length > 0) return genres;

  return [];
};
