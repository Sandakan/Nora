import { db } from '@db/db';
import { albums, artists, genres, playlists, songs } from '@db/schema';
import { timeEnd, timeStart } from '@main/utils/measureTimeUsage';
import { asc, ilike } from 'drizzle-orm';

export const searchSongsByName = async (keyword: string, trx: DB | DBTransaction = db) => {
  const timer = timeStart();

  const results = await trx.query.songs.findMany({
    where: ilike(songs.title, `%${keyword}%`),
    orderBy: [asc(songs.title)],
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
            columns: { id: true, title: true }
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
      blacklist: {
        columns: { songId: true }
      }
    }
  });

  timeEnd(timer, 'Search Songs');
  return results;
};

export const searchArtistsByName = async (keyword: string, trx: DB | DBTransaction = db) => {
  const timer = timeStart();

  const results = await trx.query.artists.findMany({
    where: ilike(artists.name, `%${keyword}%`),
    orderBy: [asc(artists.name)],
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

export const searchAlbumsByName = async (keyword: string, trx: DB | DBTransaction = db) => {
  const timer = timeStart();

  const results = await trx.query.albums.findMany({
    where: ilike(albums.title, `%${keyword}%`),
    orderBy: [asc(albums.title)],
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

export const searchPlaylistsByName = async (keyword: string, trx: DB | DBTransaction = db) => {
  const timer = timeStart();

  const results = await trx.query.playlists.findMany({
    where: ilike(playlists.name, `%${keyword}%`),
    orderBy: [asc(playlists.name)],
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

export const searchGenresByName = async (keyword: string, trx: DB | DBTransaction = db) => {
  const timer = timeStart();

  const results = await trx.query.genres.findMany({
    where: ilike(genres.name, `%${keyword}%`),
    orderBy: [asc(genres.name)],
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
