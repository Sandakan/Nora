import path from 'path';
import { File } from 'node-taglib-sharp';
// import { parseSyncedLyricsFromAudioDataSource } from '../../common/parseLyrics';
import {
  parseAlbumArtworks,
  parseArtistArtworks,
  parseArtistOnlineArtworks,
  parseGenreArtworks,
  parseSongArtworks,
  removeDefaultAppProtocolFromFilePath
} from '../fs/resolveFilePaths';
import { isLyricsSavePending } from '../saveLyricsToSong';
import logger from '../logger';
import { getSongsOutsideLibraryData } from '../main';
import { isMetadataUpdatesPending } from '../updateSong/updateSongId3Tags';

import { appPreferences } from '../../../package.json';
import { getSongByIdForSongMetadata } from '@main/db/queries/songs';

const { metadataEditingSupportedExtensions } = appPreferences;


const getSongFileObject = (songPath: string) => File.createFromPath(songPath);

// const getUnsynchronizedLyricsFromSongID3Tags = (songID3Tags: SongTags) => {
//   const { unsynchronisedLyrics } = songID3Tags;

//   if (unsynchronisedLyrics) return unsynchronisedLyrics.text;

//   return undefined;
// };

// const getSynchronizedLyricsFromSongID3Tags = (songID3Tags: SongTags) => {
//   const { synchronisedLyrics } = songID3Tags;

//   if (Array.isArray(synchronisedLyrics) && synchronisedLyrics.length > 0) {
//     const syncedLyricsData = synchronisedLyrics[synchronisedLyrics.length - 1];
//     const parsedSyncedLyrics = parseSyncedLyricsFromAudioDataSource(syncedLyricsData);

//     return parsedSyncedLyrics?.unparsedLyrics;
//   }
//   return undefined;
// };

const sendSongMetadata = async (songIdOrPath: number | string, isKnownSource = true): Promise<SongTags> => {
  logger.debug(`Requested song metadata of a song`, { songIdOrPath, isKnownSource });

  if (isKnownSource) {
    const songId = songIdOrPath as number;
    const song = await getSongByIdForSongMetadata(songId);

    if (song) {
      const pathExt = path.extname(song.path).replace(/\W/, '');
      const isASupporedFormat = metadataEditingSupportedExtensions.includes(pathExt);

      if (!isASupporedFormat)
        throw new Error(`No support for editing song metadata in '${pathExt}' format.`);

      const songFile = getSongFileObject(song.path);
      const songMetadata = songFile.tag;

      const songAlbums: SongTags['albums'] =
        song.albums.length > 0
          ? song.albums.map((a) => ({
            title: a.album.title,
            albumId: a.album.id,
            noOfSongs: 0,
            artists: a.album.artists?.map((a) => a.artist.name),
            artworkPath: parseAlbumArtworks(a.album.artworks.map((artwork) => artwork.artwork))
              .artworkPath
          }))
          : songMetadata.album
            ? [
              {
                title: songMetadata.album ?? 'Unknown Album',
                albumId: undefined
              }
            ]
            : undefined;
      const songArtists: SongTags['artists'] = song.artists
        ? song.artists.map((artist) => ({
          name: artist.artist.name,
          artistId: artist.artist.id,
          artworkPath: parseArtistArtworks(artist.artist.artworks.map((aw) => aw.artwork))
            .artworkPath,
          onlineArtworkPaths: parseArtistOnlineArtworks(
            artist.artist.artworks.map((aw) => aw.artwork)
          )
        }))
        : undefined;
      const songAlbumArtists: SongTags['albumArtists'] = song.albums
        .map((album) =>
          album.album.artists.map((artist) => ({
            name: artist.artist.name,
            artistId: artist.artist.id,
            artworkPath: parseArtistArtworks(artist.artist.artworks.map((aw) => aw.artwork))
              .artworkPath,
            onlineArtworkPaths: parseArtistOnlineArtworks(
              artist.artist.artworks.map((aw) => aw.artwork)
            )
          }))
        )
        .flat();
      const songGenres: SongTags['genres'] = song.genres
        ? song.genres.map((genre) => ({
          name: genre.genre.name,
          genreId: genre.genre.id,
          artworkPath: parseGenreArtworks(genre.genre.artworks.map((aw) => aw.artwork))
            .artworkPath
        }))
        : undefined;

      if (songMetadata) {
        const title = song.title ?? songMetadata.title ?? 'Unknown Title';
        const tagArtists =
          songArtists ??
          songMetadata.performers?.map((artist) => ({
            name: artist.trim(),
            artistId: undefined
          }));
        const tagAlbumArtists =
          songAlbumArtists ??
          songMetadata.albumArtists?.map((artist) => ({
            name: artist.trim(),
            artistId: undefined
          }));
        const tagGenres =
          songGenres ??
          songMetadata.genres?.map((genre) => ({ genreId: undefined, name: genre.trim() }));
        const trackNumber =
          song.trackNumber ?? songMetadata.trackCount;
        const artworks = song.artworks.map((a) => a.artwork);

        const res: SongTags = {
          title,
          artists: tagArtists,
          albumArtists: tagAlbumArtists,
          albums: songAlbums,
          genres: tagGenres,
          releasedYear: Number(songMetadata.year) || undefined,
          composer: songMetadata.composers ? songMetadata.composers.join(', ') : undefined,
          // synchronizedLyrics: getSynchronizedLyricsFromSongID3Tags(songMetadata),
          // unsynchronizedLyrics: getUnsynchronizedLyricsFromSongID3Tags(songMetadata),
          artworkPath: parseSongArtworks(artworks).artworkPath,
          duration: parseFloat(song.duration),
          trackNumber,
          isLyricsSavePending: isLyricsSavePending(song.path),
          isMetadataSavePending: isMetadataUpdatesPending(song.path)
        };
        return res;
      }

    }
  } else {
    const songPathWithDefaultUrl = songIdOrPath as string;
    const songPath = removeDefaultAppProtocolFromFilePath(songIdOrPath as string);

    const pathExt = path.extname(songPath).replace(/\W/, '');
    const isASupportedFormat = metadataEditingSupportedExtensions.includes(pathExt);

    if (!isASupportedFormat)
      throw new Error(`No support for editing song metadata in '${pathExt}' format.`);

    try {
      const songsOutsideLibraryData = getSongsOutsideLibraryData();
      for (const songOutsideLibraryData of songsOutsideLibraryData) {
        if (songOutsideLibraryData.path === songPathWithDefaultUrl) {
          const songFile = getSongFileObject(songPath);
          const songMetadata = songFile.tag;

          const res: SongTags = {
            title: songMetadata.title || '',
            artists: songMetadata.performers ? songMetadata.performers.map((performer) => ({ name: performer })) : undefined,
            albums: songMetadata.album
              ? [
                {
                  title: songMetadata.album ?? 'Unknown Album'
                }
              ]
              : undefined,
                genres: songMetadata.genres ? songMetadata.genres.map((genre) => ({ name: genre })) : undefined,
            releasedYear: Number(songMetadata.year) || undefined,
            composer: songMetadata.composers ? songMetadata.composers.join(', ') : undefined,
            // synchronizedLyrics: getSynchronizedLyricsFromSongID3Tags(songTags),
            // unsynchronizedLyrics: getUnsynchronizedLyricsFromSongID3Tags(songTags),
            artworkPath: songOutsideLibraryData.artworkPath,
            duration: songOutsideLibraryData.duration
          };
          return res;
        }
      }
      logger.error(`Song couldn't be found in the songsOutsideLibraryData array.`, { songPath });
      throw new Error(`Song couldn't be found in the songsOutsideLibraryData array.`);
    } catch (error) {
      logger.debug('Failed to send ID3 tags of a song outside the library.', { error, songPath });
      throw new Error('Failed to send ID3 tags of a song outside the library.');
    }
  }
  logger.debug(`Failed to read data.json because it doesn't exist or is empty `);
  throw new Error('DATA_FILE_ERROR' as MessageCodes);
};

export default sendSongMetadata;
