import path from 'path';
import NodeID3 from 'node-id3';
import { parseSyncedLyricsFromAudioDataSource } from '../../common/parseLyrics';
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
import { getSongByIdForSongID3Tags } from '@main/db/queries/songs';

const { metadataEditingSupportedExtensions } = appPreferences;

const getSongId3Tags = (songPath: string) => NodeID3.Promise.read(songPath, { noRaw: true });

const getUnsynchronizedLyricsFromSongID3Tags = (songID3Tags: NodeID3.Tags) => {
  const { unsynchronisedLyrics } = songID3Tags;

  if (unsynchronisedLyrics) return unsynchronisedLyrics.text;

  return undefined;
};

const getSynchronizedLyricsFromSongID3Tags = (songID3Tags: NodeID3.Tags) => {
  const { synchronisedLyrics } = songID3Tags;

  if (Array.isArray(synchronisedLyrics) && synchronisedLyrics.length > 0) {
    const syncedLyricsData = synchronisedLyrics[synchronisedLyrics.length - 1];
    const parsedSyncedLyrics = parseSyncedLyricsFromAudioDataSource(syncedLyricsData);

    return parsedSyncedLyrics?.unparsedLyrics;
  }
  return undefined;
};

const sendSongID3Tags = async (songIdOrPath: string, isKnownSource = true): Promise<SongTags> => {
  logger.debug(`Requested song ID3 tags for a song`, { songIdOrPath, isKnownSource });

  if (isKnownSource) {
    const songId = songIdOrPath;
    const song = await getSongByIdForSongID3Tags(Number(songId));

    if (song) {
      const pathExt = path.extname(song.path).replace(/\W/, '');
      const isASupporedFormat = metadataEditingSupportedExtensions.includes(pathExt);

      if (!isASupporedFormat)
        throw new Error(`No support for editing song metadata in '${pathExt}' format.`);

      const songTags = await getSongId3Tags(song.path);

      const songAlbums: SongTags['albums'] =
        song.albums.length > 0
          ? song.albums.map((a) => ({
              title: a.album.title,
              albumId: String(a.album.id),
              noOfSongs: 0,
              artists: a.album.artists?.map((a) => a.artist.name),
              artworkPath: parseAlbumArtworks(a.album.artworks.map((artwork) => artwork.artwork))
                .artworkPath
            }))
          : songTags.album
            ? [
                {
                  title: songTags.album ?? 'Unknown Album',
                  albumId: undefined
                }
              ]
            : undefined;
      const songArtists: SongTags['artists'] = song.artists
        ? song.artists.map((artist) => ({
            name: artist.artist.name,
            artistId: String(artist.artist.id),
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
            artistId: String(artist.artist.id),
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
            genreId: String(genre.genre.id),
            artworkPath: parseGenreArtworks(genre.genre.artworks.map((aw) => aw.artwork))
              .artworkPath
          }))
        : undefined;

      if (songTags) {
        const title = song.title ?? songTags.title ?? 'Unknown Title';
        const tagArtists =
          songArtists ??
          songTags.artist?.split(',').map((artist) => ({
            name: artist.trim(),
            artistId: undefined
          }));
        const tagAlbumArtists =
          songAlbumArtists ??
          songTags.performerInfo?.split(',').map((artist) => ({
            name: artist.trim(),
            artistId: undefined
          }));
        const tagGenres =
          songGenres ??
          songTags.genre?.split(',').map((genre) => ({ genreId: undefined, name: genre.trim() }));
        const trackNumber =
          song.trackNumber ?? (Number(songTags.trackNumber?.split('/').shift()) || undefined);
        const artworks = song.artworks.map((a) => a.artwork);

        const res: SongTags = {
          title,
          artists: tagArtists,
          albumArtists: tagAlbumArtists,
          albums: songAlbums,
          genres: tagGenres,
          releasedYear: Number(songTags.year) || undefined,
          composer: songTags.composer,
          synchronizedLyrics: getSynchronizedLyricsFromSongID3Tags(songTags),
          unsynchronizedLyrics: getUnsynchronizedLyricsFromSongID3Tags(songTags),
          artworkPath: parseSongArtworks(artworks).artworkPath,
          duration: parseFloat(song.duration),
          trackNumber,
          isLyricsSavePending: isLyricsSavePending(song.path),
          isMetadataSavePending: isMetadataUpdatesPending(song.path)
        };
        return res;
      }
      logger.debug(`Failed parse song metadata`, { songIdOrPath, isKnownSource });
      throw new Error('Failed parse song metadata');
    }
  } else {
    const songPathWithDefaultUrl = songIdOrPath;
    const songPath = removeDefaultAppProtocolFromFilePath(songIdOrPath);

    const pathExt = path.extname(songPath).replace(/\W/, '');
    const isASupportedFormat = metadataEditingSupportedExtensions.includes(pathExt);

    if (!isASupportedFormat)
      throw new Error(`No support for editing song metadata in '${pathExt}' format.`);

    try {
      const songsOutsideLibraryData = getSongsOutsideLibraryData();
      for (const songOutsideLibraryData of songsOutsideLibraryData) {
        if (songOutsideLibraryData.path === songPathWithDefaultUrl) {
          const songTags = await getSongId3Tags(songPath);

          const res: SongTags = {
            title: songTags.title || '',
            artists: songTags.artist ? [{ name: songTags.artist }] : undefined,
            albums: songTags.album
              ? [
                  {
                    title: songTags.album ?? 'Unknown Album'
                  }
                ]
              : undefined,
            genres: songTags.genre ? [{ name: songTags.genre }] : undefined,
            releasedYear: Number(songTags.year) || undefined,
            composer: songTags.composer,
            synchronizedLyrics: getSynchronizedLyricsFromSongID3Tags(songTags),
            unsynchronizedLyrics: getUnsynchronizedLyricsFromSongID3Tags(songTags),
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

export default sendSongID3Tags;
