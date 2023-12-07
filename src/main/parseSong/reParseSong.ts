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
import manageAlbumArtistOfParsedSong from './manageAlbumArtistOfParsedSong';

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
            metadata.common?.picture?.at(0)?.data,
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

          song.artists = getArtistNamesFromSong(metadata.common.artist);
          song.album = getAlbumInfoFromSong(metadata.common.album);
          song.genres = getGenreInfoFromSong(metadata.common.genre);

          const { updatedAlbums, relevantAlbum } = manageAlbumsOfParsedSong(
            updatedAlbumsFromDeletedData,
            song,
            songArtworkPaths,
          );

          if (song.album && relevantAlbum)
            song.album = {
              name: relevantAlbum.title,
              albumId: relevantAlbum.albumId,
            };

          const { updatedArtists: updatedSongArtists, relevantArtists } =
            manageArtistsOfParsedSong(
              updatedArtistsFromDeletedData,
              song,
              songArtworkPaths,
            );

          const { relevantAlbumArtists, updatedArtists } =
            manageAlbumArtistOfParsedSong(
              updatedSongArtists,
              song,
              songArtworkPaths,
              relevantAlbum,
            );

          if (song.artists && relevantArtists.length > 0) {
            song.artists = relevantArtists.map((artist) => ({
              artistId: artist.artistId,
              name: artist.name,
            }));
          }

          if (relevantAlbumArtists.length > 0) {
            song.albumArtists = relevantAlbumArtists.map((albumArtist) => ({
              artistId: albumArtist.artistId,
              name: albumArtist.name,
            }));
          }

          if (relevantAlbum) {
            const allRelevantArtists =
              relevantArtists.concat(relevantAlbumArtists);

            for (const relevantArtist of allRelevantArtists) {
              relevantAlbum.artists?.forEach((artist) => {
                if (
                  artist.name === relevantArtist.name &&
                  artist.artistId.length === 0
                )
                  artist.artistId = relevantArtist.artistId;
              });
            }
          }

          const { updatedGenres, relevantGenres } = manageGenresOfParsedSong(
            updatedGenresFromDeletedData,
            song,
            songArtworkPaths,
            song.palette?.DarkVibrant,
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
            {
              sendToRenderer: {
                messageCode: 'SONG_REPARSE_SUCCESS',
                data: { title: song.title },
              },
            },
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
      sendToRenderer: { messageCode: 'SONG_REPARSE_FAILED' },
    });
  }
};

export default reParseSong;
