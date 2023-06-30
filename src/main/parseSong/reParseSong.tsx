/* eslint-disable no-await-in-loop */
import fs from 'fs/promises';
import path from 'path';
import * as musicMetaData from 'music-metadata';

import { removeArtwork, storeArtworks } from '../other/artworks';
import {
  getSongArtworkPath,
  removeDefaultAppProtocolFromFilePath,
} from '../fs/resolveFilePaths';
import {
  removeDeletedAlbumDataOfSong,
  removeDeletedArtistDataOfSong,
  removeDeletedGenreDataOfSong,
} from '../removeSongsFromLibrary';
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
import { dataUpdateEvent } from '../main';
import log from '../log';
import {
  getAlbumInfoFromSong,
  getArtistNamesFromSong,
  getGenreInfoFromSong,
  getSongDurationFromSong,
} from './parseSong';
import manageAlbumsOfParsedSong from './manageAlbumsOfParsedSong';
import manageArtistsOfParsedSong from './manageArtistsOfParsedSong';
import manageGenresOfParsedSong from './manageGenresOfParsedSong';
import { generatePalettes } from '../other/generatePalette';

const reParseSong = async (filePath: string) => {
  const songs = getSongsData();
  const artists = getArtistsData();
  const albums = getAlbumsData();
  const genres = getGenresData();

  const songPath = removeDefaultAppProtocolFromFilePath(filePath);
  try {
    for (const song of songs) {
      if (song.path === songPath) {
        const { songId, isArtworkAvailable } = song;
        const stats = await fs.stat(songPath);
        const metadata = await musicMetaData.parseFile(songPath);

        if (metadata) {
          if (isArtworkAvailable) {
            const oldArtworkPaths = getSongArtworkPath(songId, true, true);
            await removeArtwork(oldArtworkPaths);
          }

          const songArtworkPaths = await storeArtworks(
            songId,
            'songs',
            metadata.common?.picture?.at(0)?.data
          );

          song.title =
            metadata.common.title ||
            path.basename(songPath).split('.')[0] ||
            'Unknown Title';
          song.year = metadata.common?.year;
          song.isArtworkAvailable = !songArtworkPaths.isDefaultArtwork;
          song.sampleRate = metadata.format.sampleRate;
          song.bitrate = metadata?.format?.bitrate;
          song.noOfChannels = metadata?.format?.numberOfChannels;
          song.trackNo = metadata?.common?.track?.no ?? undefined;
          song.createdDate = stats ? stats.birthtime.getTime() : undefined;
          song.modifiedDate = stats ? stats.mtime.getTime() : undefined;
          song.duration = getSongDurationFromSong(metadata.format.duration);

          const { updatedArtists: updatedArtistsFromDeletedData } =
            removeDeletedArtistDataOfSong(artists, song);

          const { updatedAlbums: updatedAlbumsFromDeletedData } =
            removeDeletedAlbumDataOfSong(albums, song);

          const { updatedGenres: updatedGenresFromDeletedData } =
            removeDeletedGenreDataOfSong(genres, song);

          song.artists = getArtistNamesFromSong(metadata.common.artists);
          song.album = getAlbumInfoFromSong(metadata.common.album);
          song.genres = getGenreInfoFromSong(metadata.common.genre);

          const { updatedAlbums, relevantAlbums } = manageAlbumsOfParsedSong(
            updatedAlbumsFromDeletedData,
            song,
            songArtworkPaths
          );

          if (song.album && relevantAlbums.length > 0)
            song.album = {
              name: relevantAlbums[0].title,
              albumId: relevantAlbums[0].albumId,
            };

          const { updatedArtists, relevantArtists } = manageArtistsOfParsedSong(
            updatedArtistsFromDeletedData,
            song,
            songArtworkPaths,
            relevantAlbums
          );

          if (song.artists && relevantArtists.length > 0) {
            for (let x = 0; x < relevantArtists.length; x += 1) {
              for (let y = 0; y < song.artists.length; y += 1) {
                if (relevantArtists[x].name === song.artists[y].name)
                  song.artists[y].artistId = relevantArtists[x].artistId;
              }
            }
          }

          const { updatedGenres, relevantGenres } = manageGenresOfParsedSong(
            updatedGenresFromDeletedData,
            song,
            songArtworkPaths,
            song.palette?.DarkVibrant
          );

          song.genres = relevantGenres.map((genre) => {
            return { name: genre.name, genreId: genre.genreId };
          });

          log(
            `Successfully reparsed '${song.title}'.`,
            {
              songPath: song?.path,
            },
            'INFO',
            { sendToRenderer: 'SUCCESS' }
          );

          setSongsData(songs);
          setArtistsData(updatedArtists);
          setAlbumsData(updatedAlbums);
          setGenresData(updatedGenres);

          dataUpdateEvent('songs/updatedSong', [songId]);
          dataUpdateEvent('artists/updatedArtist');
          dataUpdateEvent('albums/updatedAlbum');
          dataUpdateEvent('genres/updatedGenre');

          setTimeout(() => generatePalettes(), 1000);
          return song;
        }
      }
    }
    return undefined;
  } catch (error) {
    return log('Error occurred when re-parsing the song.', { error }, 'ERROR', {
      sendToRenderer: 'FAILURE',
    });
  }
};

export default reParseSong;
