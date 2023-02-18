/* eslint-disable no-await-in-loop */
import NodeID3 from 'node-id3';
import { parseSyncedLyricsFromAudioDataSource } from '../utils/parseLyrics';
import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getSongsData,
} from '../filesystem';
import { getSongArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';

const getSongId3Tags = (songPath: string) =>
  NodeID3.Promise.read(songPath, { noRaw: true });

const getLyricsFromSongID3Tags = (songID3Tags: NodeID3.Tags) => {
  const { unsynchronisedLyrics, synchronisedLyrics } = songID3Tags;

  if (Array.isArray(synchronisedLyrics) && synchronisedLyrics.length > 0) {
    const syncedLyricsData = synchronisedLyrics[synchronisedLyrics.length - 1];
    // console.log(
    //   'unparsed synchronised lyrics',
    //   JSON.stringify(syncedLyricsData)
    // );

    const parsedSyncedLyrics =
      parseSyncedLyricsFromAudioDataSource(syncedLyricsData);
    // console.log(
    //   'parsed synchronised lyrics',
    //   JSON.stringify(parsedSyncedLyrics)
    // );
    return parsedSyncedLyrics?.unparsedLyrics;
  }
  if (unsynchronisedLyrics) return unsynchronisedLyrics.text;
  return undefined;
};

const sendSongID3Tags = async (songId: string): Promise<SongTags> => {
  log(`Requested song ID3 tags for the song -${songId}-`);
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
        throw new Error('ERROR OCCURRED WHEN PARSING THE SONG TO GET METADATA');
      }
    }
    throw new Error('SONG_NOT_FOUND' as MessageCodes);
  }
  log(
    `====== ERROR OCCURRED WHEN TRYING TO READ DATA FROM data.json. FILE IS INACCESSIBLE, CORRUPTED OR EMPTY. ======`
  );
  throw new Error('DATA_FILE_ERROR' as MessageCodes);
};

export default sendSongID3Tags;
