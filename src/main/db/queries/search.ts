import { db } from '@db/db';
import { albums, artists, genres, playlists, songs } from '@db/schema';
import { timeEnd, timeStart } from '@main/utils/measureTimeUsage';
import { asc, ilike, sql } from 'drizzle-orm';

type SearchOptions = { keyword: string; isSimilaritySearchEnabled: boolean };

export const searchSongsByName = async (options: SearchOptions, trx: DB | DBTransaction = db) => {
  const { keyword, isSimilaritySearchEnabled } = options;
  const timer = timeStart();

  const results = await trx.query.songs.findMany({
    where: () => sql`${songs.titleCI} % ${keyword}`, // % operator with citext
    orderBy: () =>
      isSimilaritySearchEnabled
        ? sql`similarity(${songs.titleCI}, ${keyword}) DESC`
        : [asc(songs.title)],
    with: {
      artists: {
        with: {
          artist: {
            columns: { id: true, name: true }
          }
        }
      },
      albums: {
        with: {
          album: {
            columns: { id: true, title: true },
            with: {
              artists: {
                with: {
                  artist: {
                    columns: { id: true, name: true }
                  }
                }
              }
            }
          }
        }
      },
      genres: {
        with: {
          genre: {
            columns: { id: true, name: true }
          }
        }
      },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {}
                }
              }
            }
          }
        }
      },
      playlists: {
        with: {
          playlist: {
            columns: { id: true, name: true }
          }
        }
      }
    }
  });

  timeEnd(timer, 'Search Songs');
  return results;
};

export const searchArtistsByName = async (options: SearchOptions, trx: DB | DBTransaction = db) => {
  const { keyword, isSimilaritySearchEnabled } = options;
  const timer = timeStart();

  const results = await trx.query.artists.findMany({
    where: () => sql`${artists.nameCI} % ${keyword}`, // % operator with citext
    orderBy: () =>
      isSimilaritySearchEnabled
        ? sql`similarity(${artists.nameCI}, ${keyword}) DESC`
        : [asc(artists.name)],
    with: {
      songs: { with: { song: { columns: { id: true, title: true } } } },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {}
                }
              }
            }
          }
        }
      },
      albums: {
        with: {
          album: {
            columns: {
              title: true,
              id: true
            }
          }
        }
      }
    }
  });

  timeEnd(timer, 'Search Artists');
  return results;
};

export const searchAlbumsByName = async (options: SearchOptions, trx: DB | DBTransaction = db) => {
  const { keyword, isSimilaritySearchEnabled } = options;
  const timer = timeStart();

  const results = await trx.query.albums.findMany({
    where: () => sql`${albums.titleCI} % ${keyword}`, // % operator with citext
    orderBy: () =>
      isSimilaritySearchEnabled
        ? sql`similarity(${albums.titleCI}, ${keyword}) DESC`
        : [asc(albums.title)],
    with: {
      artists: {
        with: {
          artist: {
            columns: {
              name: true,
              id: true
            }
          }
        }
      },
      songs: { with: { song: { columns: { id: true, title: true } } } },
      artworks: {
        with: {
          artwork: {}
        }
      }
    }
  });

  timeEnd(timer, 'Search Albums');
  return results;
};

export const searchPlaylistsByName = async (
  options: SearchOptions,
  trx: DB | DBTransaction = db
) => {
  const { keyword, isSimilaritySearchEnabled } = options;
  const timer = timeStart();

  const results = await trx.query.playlists.findMany({
    where: () => sql`${playlists.nameCI} % ${keyword}`, // % operator with citext
    orderBy: () =>
      isSimilaritySearchEnabled
        ? sql`similarity(${playlists.nameCI}, ${keyword}) DESC`
        : [asc(playlists.name)],
    with: {
      songs: { with: { song: { columns: { id: true } } } },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {}
                }
              }
            }
          }
        }
      }
    }
  });

  timeEnd(timer, 'Search Playlists');
  return results;
};

export const searchGenresByName = async (options: SearchOptions, trx: DB | DBTransaction = db) => {
  const { keyword, isSimilaritySearchEnabled } = options;
  const timer = timeStart();

  const results = await trx.query.genres.findMany({
    where: () => sql`${genres.nameCI} % ${keyword}`, // % operator with citext
    orderBy: () =>
      isSimilaritySearchEnabled
        ? sql`similarity(${genres.nameCI}, ${keyword}) DESC`
        : [asc(genres.name)],
    with: {
      songs: { with: { song: { columns: { id: true, title: true } } } },
      artworks: {
        with: {
          artwork: {
            with: {
              palette: {
                columns: { id: true },
                with: {
                  swatches: {}
                }
              }
            }
          }
        }
      }
    }
  });

  timeEnd(timer, 'Search Genres');
  return results;
};

const songSearchPreparedQuery = db
  .selectDistinct({ title: songs.title })
  .from(songs)
  .where(ilike(songs.title, sql.placeholder('query')))
  .limit(sql.placeholder('limit'))
  .prepare('search_songs');
const artistSearchPreparedQuery = db
  .selectDistinct({ name: artists.name })
  .from(artists)
  .where(ilike(artists.name, sql.placeholder('query')))
  .limit(sql.placeholder('limit'))
  .prepare('search_artists');
const albumSearchPreparedQuery = db
  .selectDistinct({ title: albums.title })
  .from(albums)
  .where(ilike(albums.title, sql.placeholder('query')))
  .limit(sql.placeholder('limit'))
  .prepare('search_albums');
const playlistSearchPreparedQuery = db
  .selectDistinct({ name: playlists.name })
  .from(playlists)
  .where(ilike(playlists.name, sql.placeholder('query')))
  .limit(sql.placeholder('limit'))
  .prepare('search_playlists');
const genreSearchPreparedQuery = db
  .selectDistinct({ name: genres.name })
  .from(genres)
  .where(ilike(genres.name, sql.placeholder('query')))
  .limit(sql.placeholder('limit'))
  .prepare('search_genres');

export const searchForAvailableResults = async (query: string, limit = 5) => {
  const likeQuery = `%${query}%`;

  const timer = timeStart();
  const songResults = songSearchPreparedQuery
    .execute({ query: likeQuery, limit })
    .then((x) => x.map((song) => song.title));

  const artistResults = artistSearchPreparedQuery
    .execute({ query: likeQuery, limit })
    .then((x) => x.map((artist) => artist.name));

  const albumResults = albumSearchPreparedQuery
    .execute({ query: likeQuery, limit })
    .then((x) => x.map((album) => album.title));

  const playlistResults = playlistSearchPreparedQuery
    .execute({ query: likeQuery, limit })
    .then((x) => x.map((playlist) => playlist.name));

  const genreResults = genreSearchPreparedQuery
    .execute({ query: likeQuery, limit })
    .then((x) => x.map((genre) => genre.name));

  const results = await Promise.all([
    songResults,
    artistResults,
    albumResults,
    playlistResults,
    genreResults
  ]);

  timeEnd(timer, 'Search Available Results');

  const prepareTimer = timeStart();

  const flattenResults = results.flat();
  const uniqueResults = Array.from(new Set(flattenResults));

  timeEnd(prepareTimer, 'Prepare Unique Results');

  return uniqueResults;
};
