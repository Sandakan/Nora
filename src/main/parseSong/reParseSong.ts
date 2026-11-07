import fs from 'fs/promises';
import path from 'path';

import { db } from '@main/db/db';
import { linkArtworksToSong } from '@main/db/queries/artworks';
import { getSongByPath, updateSongByPath } from '@main/db/queries/songs';
import type { songs } from '@main/db/schema';
import { convertToSongData } from '@main/utils/convert';
import { File } from 'node-taglib-sharp';

import { removeDefaultAppProtocolFromFilePath } from '../fs/resolveFilePaths';
import logger from '../logger';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import { removeArtwork, storeArtworks } from '../other/artworks';
import { generatePalettes } from '../other/generatePalette';
import {
  removeDeletedAlbumDataOfSong,
  removeDeletedArtistDataOfSong,
  removeDeletedArtworkDataOfSong,
  removeDeletedGenreDataOfSong
} from '../removeSongsFromLibrary';
import manageAlbumArtistOfParsedSong from './manageAlbumArtistOfParsedSong';
import manageAlbumsOfParsedSong from './manageAlbumsOfParsedSong';
import manageArtistsOfParsedSong from './manageArtistsOfParsedSong';
import manageGenresOfParsedSong from './manageGenresOfParsedSong';
import {
  resolveDeferredArtistSimilarities,
  resolveDeferredSongSimilarities
} from '../recommendations/deferredMatch';
import { indexSongAudioFeatures } from '../recommendations/featureIndexer';
import {
  getAlbumInfoFromSong,
  getArtistNamesFromSong,
  getGenreInfoFromSong,
  getSongDurationFromSong
} from './parseSong';

const reParseSong = async (filePath: string) => {
  const songPath = removeDefaultAppProtocolFromFilePath(filePath);
  const songData = await getSongByPath(songPath);
  try {
    if (songData) {
      const song = convertToSongData(songData);
      const { songId, isArtworkAvailable, artworkPaths: oldArtworkPaths } = song;
      const stats = await fs.stat(songPath);

      const file = File.createFromPath(songPath);
      const metadata = file.tag;

      const songTitle =
        metadata.title || path.basename(songPath, path.extname(songPath)) || 'Unknown Title';

      if (metadata) {
        if (isArtworkAvailable && !oldArtworkPaths.isDefaultArtwork) {
          await removeArtwork(oldArtworkPaths);
        }

        const updatedSong: Partial<typeof songs.$inferInsert> = {
          title: songTitle,
          duration: getSongDurationFromSong(file.properties.durationMilliseconds / 1000).toFixed(2),
          year: metadata.year || undefined,
          path: songPath,
          sampleRate: file.properties.audioSampleRate,
          bitRate: file.properties.audioBitrate
            ? Math.ceil(file.properties.audioBitrate)
            : undefined,
          noOfChannels: file.properties.audioChannels,
          diskNumber: metadata.disc ?? undefined,
          trackNumber: metadata.track ?? undefined,
          mbid: metadata.musicBrainzTrackId || undefined,
          bpm:
            metadata.beatsPerMinute && metadata.beatsPerMinute > 0
              ? Math.round(metadata.beatsPerMinute)
              : undefined,
          initialKey: metadata.initialKey || undefined,
          replayGainTrackGain: !isNaN(metadata.replayGainTrackGain)
            ? metadata.replayGainTrackGain
            : undefined,
          replayGainTrackPeak: !isNaN(metadata.replayGainTrackPeak)
            ? metadata.replayGainTrackPeak
            : undefined,
          grouping: metadata.grouping || undefined,
          publisher: metadata.publisher || undefined,
          isCompilation: Boolean(metadata.isCompilation),
          bitsPerSample: file.properties.bitsPerSample || undefined,
          isrc: metadata.isrc || undefined,
          fileCreatedAt: stats ? stats.birthtime : new Date(),
          fileModifiedAt: stats ? stats.mtime : new Date()
        };

        const artistsData = getArtistNamesFromSong(metadata.performers.join(', '));
        const albumArtistsData = getArtistNamesFromSong(metadata.albumArtists.join(', '));
        const albumData = getAlbumInfoFromSong(metadata.album);
        const genresData = getGenreInfoFromSong(metadata.genres);

        await db.transaction(async (trx) => {
          await removeDeletedArtistDataOfSong(song, trx);
          await removeDeletedAlbumDataOfSong(song, trx);
          await removeDeletedGenreDataOfSong(song, trx);
          await removeDeletedArtworkDataOfSong(song, trx);

          // No need to delete playlists, play events, seek events, or skip events as they will be the same even after re-parsing.

          updateSongByPath(songPath, updatedSong, trx);

          const artworkData = await storeArtworks(
            'songs',
            metadata.pictures?.at(0) ? metadata.pictures[0].data.toByteArray() : undefined,
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
              albumName: albumData,
              mbid: metadata.musicBrainzReleaseId || undefined
            },
            trx
          );

          const { newArtists, relevantArtists } = await manageArtistsOfParsedSong(
            {
              artworkId: artworkData[0].id,
              songId: songData.id,
              songArtists: artistsData,
              mbid: metadata.musicBrainzArtistId || undefined
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

          // Resolve deferred similarities matching newly updated song and artists
          await resolveDeferredSongSimilarities(
            {
              id: songData.id,
              title: songTitle,
              mbid: metadata.musicBrainzTrackId || undefined,
              artistNames: artistsData
            },
            trx
          );

          const allSongArtists = [...newArtists, ...relevantArtists];
          const processedArtistIds = new Set<number>();
          for (const artist of allSongArtists) {
            if (processedArtistIds.has(artist.id)) continue;
            processedArtistIds.add(artist.id);
            await resolveDeferredArtistSimilarities(
              {
                id: artist.id,
                name: artist.name,
                mbid: artist.mbid
              },
              trx
            );
          }

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

        // Trigger background audio feature extraction
        indexSongAudioFeatures(songData.id, songPath).catch((err) => {
          logger.debug('Background feature extraction deferred/failed on reparse', { err });
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
