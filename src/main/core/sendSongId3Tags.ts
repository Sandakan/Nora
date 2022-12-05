import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getSongsData,
} from '../filesystem';
import { getSongArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import { getSongId3Tags } from '../updateSongId3Tags';

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
        // eslint-disable-next-line no-await-in-loop
        const songTags = await getSongId3Tags(song.path);
        if (songTags) {
          const res: SongTags = {
            title: song.title ?? songTags.title ?? 'Unknown Title',
            artists:
              songArtists ??
              songTags.artist?.split(',').map((artist) => ({
                name: artist.trim(),
                artistId: undefined,
              })),
            // eslint-disable-next-line no-nested-ternary
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
            genres:
              songGenres ??
              songTags.genre
                ?.split(',')
                .map((genre) => ({ genreId: undefined, name: genre.trim() })),
            releasedYear: Number(songTags.year) || undefined,
            composer: songTags.composer,
            lyrics: songTags.unsynchronisedLyrics?.text,
            artworkPath: getSongArtworkPath(
              song.songId,
              song.isArtworkAvailable
            ).artworkPath,
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
