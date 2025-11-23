import fs from 'fs/promises';
import path from 'path';
import * as musicMetaData from 'music-metadata';

import { removeArtwork, storeArtworks } from '../other/artworks';
import { removeDefaultAppProtocolFromFilePath } from '../fs/resolveFilePaths';
import {
  removeDeletedAlbumDataOfSong,
  removeDeletedArtistDataOfSong,
  removeDeletedArtworkDataOfSong,
  removeDeletedGenreDataOfSong
} from '../removeSongsFromLibrary';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import logger from '../logger';
import {
  getAlbumInfoFromSong,
  getArtistNamesFromSong,
  getGenreInfoFromSong,
  getSongDurationFromSong
} from './parseSong';
import manageAlbumsOfParsedSong from './manageAlbumsOfParsedSong';
import manageArtistsOfParsedSong from './manageArtistsOfParsedSong';
import manageGenresOfParsedSong from './manageGenresOfParsedSong';
import { generatePalettes } from '../other/generatePalette';
import manageAlbumArtistOfParsedSong from './manageAlbumArtistOfParsedSong';
import { getSongByPath, updateSongByPath } from '@main/db/queries/songs';
import { convertToSongData } from '../../common/convert';
import { db } from '@main/db/db';
import { linkArtworksToSong } from '@main/db/queries/artworks';
import type { songs } from '@main/db/schema';

const reParseSong = async (filePath: string) => {
  const songPath = removeDefaultAppProtocolFromFilePath(filePath);
  const songData = await getSongByPath(songPath);
  try {
    if (songData) {
      const song = convertToSongData(songData);
      const { songId, isArtworkAvailable, artworkPaths: oldArtworkPaths } = song;
      const stats = await fs.stat(songPath);
      const metadata = await musicMetaData.parseFile(songPath);

      const songTitle =
        metadata.common.title || path.basename(songPath, path.extname(songPath)) || 'Unknown Title';

      if (metadata) {
        if (isArtworkAvailable && !oldArtworkPaths.isDefaultArtwork) {
          await removeArtwork(oldArtworkPaths);
        }

        const updatedSong: Partial<typeof songs.$inferInsert> = {
          title: songTitle,
          duration: getSongDurationFromSong(metadata.format.duration).toFixed(2),
          year: metadata.common?.year || undefined,
          sampleRate: metadata.format.sampleRate,
          bitRate: metadata?.format?.bitrate ? Math.ceil(metadata.format.bitrate) : undefined,
          noOfChannels: metadata?.format?.numberOfChannels,
          diskNumber: metadata?.common?.disk?.no ?? undefined,
          trackNumber: metadata?.common?.track?.no ?? undefined,
          fileCreatedAt: stats ? stats.birthtime : new Date(),
          fileModifiedAt: stats ? stats.mtime : new Date()
        };

        const artistsData = getArtistNamesFromSong(metadata.common.artist);
        const albumArtistsData = getArtistNamesFromSong(metadata.common.albumartist);
        const albumData = getAlbumInfoFromSong(metadata.common.album);
        const genresData = getGenreInfoFromSong(metadata.common.genre);

        await db.transaction(async (trx) => {
          await removeDeletedArtistDataOfSong(song, trx);
          await removeDeletedAlbumDataOfSong(song, trx);
          await removeDeletedGenreDataOfSong(song, trx);
          await removeDeletedArtworkDataOfSong(song, trx);

          // No need to delete playlists, play events, seek events, or skip events as they will be the same even after re-parsing.

          updateSongByPath(songPath, updatedSong, trx);

          const artworkData = await storeArtworks(
            'songs',
            metadata.common?.picture?.at(0)
              ? Buffer.from(metadata.common.picture[0].data)
              : undefined,
            trx
          );

          const linkedArtworks = await linkArtworksToSong(
            artworkData.map((artwork) => ({ songId: songData.id, artworkId: artwork.id })),
            trx
          );

          const { relevantAlbum, newAlbum } = await manageAlbumsOfParsedSong(
            {
              songId: songData.id,
              artworkId: artworkData[0].id,
              songYear: songData.year,
              artists: artistsData,
              albumArtists: albumArtistsData,
              albumName: albumData
            },
            trx
          );

          const { newArtists, relevantArtists } = await manageArtistsOfParsedSong(
            {
              artworkId: artworkData[0].id,
              songId: songData.id,
              songArtists: artistsData
            },
            trx
          );

          const { newAlbumArtists, relevantAlbumArtists } = await manageAlbumArtistOfParsedSong(
            { albumArtists: albumArtistsData, albumId: relevantAlbum?.id },
            trx
          );

          const { newGenres, relevantGenres } = await manageGenresOfParsedSong(
            { artworkId: artworkData[0].id, songId: songData.id, songGenres: genresData },
            trx
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
            newAlbumArtists
          };
        });

        logger.debug(`Song reparsed successfully.`, {
          songPath: song?.path
        });
        sendMessageToRenderer({
          messageCode: 'SONG_REPARSE_SUCCESS',
          data: { title: song.title }
        });

        dataUpdateEvent('songs/updatedSong', [songId]);
        dataUpdateEvent('artists/updatedArtist');
        dataUpdateEvent('albums/updatedAlbum');
        dataUpdateEvent('genres/updatedGenre');

        setTimeout(() => generatePalettes(), 1000);
        return song;
      }
    }
    return undefined;
  } catch (error) {
    logger.error('Error occurred when re-parsing the song.', { error, filePath });
    return sendMessageToRenderer({ messageCode: 'SONG_REPARSE_FAILED' });
  }
};

export default reParseSong;
