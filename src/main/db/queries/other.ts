import { db } from '../db';
import { albums, artists, genres, playlists, songs } from '../schema';

export const getDatabaseMetrics = async (): Promise<DatabaseMetrics> => {
  const [songCount, artistCount, playlistCount, albumCount, genreCount] = await Promise.all([
    db.$count(songs),
    db.$count(artists),
    db.$count(playlists),
    db.$count(albums),
    db.$count(genres)
  ]);

  return {
    songCount,
    artistCount,
    playlistCount,
    albumCount,
    genreCount
  };
};
