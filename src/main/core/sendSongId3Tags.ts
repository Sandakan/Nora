/* eslint-disable no-await-in-loop */
import NodeID3 from 'node-id3';
import { parseSyncedLyricsFromAudioDataSource } from '../utils/parseLyrics';
import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getSongsData,
} from '../filesystem';
import {
  getSongArtworkPath,
  removeDefaultAppProtocolFromFilePath,
} from '../fs/resolveFilePaths';
import log from '../log';
import { getSongsOutsideLibraryData } from '../main';

const getSongId3Tags = (songPath: string) =>
  NodeID3.Promise.read(songPath, { noRaw: true });

const getLyricsFromSongID3Tags = (songID3Tags: NodeID3.Tags) => {
  const { unsynchronisedLyrics, synchronisedLyrics } = songID3Tags;

  if (Array.isArray(synchronisedLyrics) && synchronisedLyrics.length > 0) {
    const syncedLyricsData = synchronisedLyrics[synchronisedLyrics.length - 1];
    const parsedSyncedLyrics =
      parseSyncedLyricsFromAudioDataSource(syncedLyricsData);

    return parsedSyncedLyrics?.unparsedLyrics;
  }
  if (unsynchronisedLyrics) return unsynchronisedLyrics.text;
  return undefined;
};

const sendSongID3Tags = async (
  songIdOrPath: string,
  isKnownSource = true
): Promise<SongTags> => {
  log(
    `Requested song ID3 tags for the song -${songIdOrPath}- ${
      isKnownSource ? 'from the library' : 'outside the library'
    }.`
  );
  if (isKnownSource) {
    const songId = songIdOrPath;

    const songs = getSongsData();
    const artists = getArtistsData();
    const albums = getAlbumsData();
    const genres = getGenresData();
    if (songs.length > 0) {
      for (let i = 0; i < songs.length; i += 1) {
        if (songs[i].songId === songId) {
          const song = songs[i];
          const songAlbum = albums.find(
            (val) => val.albumId === song.album?.albumId
          );
          const songArtists = song.artists
            ? artists.filter((artist) =>
                song.artists?.some((x) => x.artistId === artist.artistId)
              )
            : undefined;
          const songGenres = song.genres
            ? genres.filter((artist) =>
                song.genres?.some((x) => x.genreId === artist.genreId)
              )
            : undefined;
          const songTags = await getSongId3Tags(song.path);
          if (songTags) {
            const title = song.title ?? songTags.title ?? 'Unknown Title';
            const tagArtists =
              songArtists ??
              songTags.artist?.split(',').map((artist) => ({
                name: artist.trim(),
                artistId: undefined,
              }));
            const tagGenres =
              songGenres ??
              songTags.genre
                ?.split(',')
                .map((genre) => ({ genreId: undefined, name: genre.trim() }));

            const res: SongTags = {
              title,
              artists: tagArtists,
              album: songAlbum
                ? {
                    ...songAlbum,
                    noOfSongs: songAlbum?.songs.length,
                    artists: songAlbum?.artists?.map((x) => x.name),
                  }
                : songTags.album
                ? {
                    title: songTags.album ?? 'Unknown Album',
                    albumId: undefined,
                  }
                : undefined,
              genres: tagGenres,
              releasedYear: Number(songTags.year) || undefined,
              composer: songTags.composer,
              lyrics: getLyricsFromSongID3Tags(songTags),
              artworkPath: getSongArtworkPath(
                song.songId,
                song.isArtworkAvailable
              ).artworkPath,
              duration: song.duration,
            };
            return res;
          }
          log(
            `====== ERROR OCCURRED WHEN PARSING THE SONG TO GET METADATA ======`
          );
          throw new Error(
            'ERROR OCCURRED WHEN PARSING THE SONG TO GET METADATA'
          );
        }
      }
      throw new Error('SONG_NOT_FOUND' as MessageCodes);
    }
  } else {
    const songPathWithDefaultUrl = songIdOrPath;
    const songPath = removeDefaultAppProtocolFromFilePath(songIdOrPath);

    try {
      const songsOutsideLibraryData = getSongsOutsideLibraryData();
      for (const songOutsideLibraryData of songsOutsideLibraryData) {
        if (songOutsideLibraryData.path === songPathWithDefaultUrl) {
          const songTags = await getSongId3Tags(songPath);

          const res: SongTags = {
            title: songTags.title || '',
            artists: songTags.artist ? [{ name: songTags.artist }] : undefined,
            album: songTags.album
              ? {
                  title: songTags.album ?? 'Unknown Album',
                }
              : undefined,
            genres: songTags.genre ? [{ name: songTags.genre }] : undefined,
            releasedYear: Number(songTags.year) || undefined,
            composer: songTags.composer,
            lyrics: getLyricsFromSongID3Tags(songTags),
            artworkPath: songOutsideLibraryData.artworkPath,
            duration: songOutsideLibraryData.duration,
          };
          return res;
        }
      }
      throw new Error(
        `Song couldn't be found in the songsOutsideLibraryData array.`
      );
    } catch (error) {
      log(
        'Error occurred when trying to send ID3 tags of a song outside the library.',
        { error },
        'ERROR'
      );
      throw new Error(
        'Error occurred when trying to send ID3 tags of a song outside the library.'
      );
    }
  }
  log(
    `====== ERROR OCCURRED WHEN TRYING TO READ DATA FROM data.json. FILE IS INACCESSIBLE, CORRUPTED OR EMPTY. ======`
  );
  throw new Error('DATA_FILE_ERROR' as MessageCodes);
};

export default sendSongID3Tags;
