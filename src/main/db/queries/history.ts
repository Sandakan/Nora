import { db } from '@db/db';
import { playHistory } from '../schema';
import { asc, desc, eq } from 'drizzle-orm';

export const addSongToPlayHistory = async (songId: number, trx: DB | DBTransaction = db) => {
  const data = await trx.insert(playHistory).values({ songId });
  return data;
};

export const getSongPlayHistory = async (songId: number, trx: DB | DBTransaction = db) => {
  const data = await trx
    .select()
    .from(playHistory)
    .where(eq(playHistory.songId, songId))
    .orderBy(desc(playHistory.createdAt));

  return data;
};

export const getAllSongsInHistory = async (
  sortType?: SongSortTypes,
  paginatingData?: PaginatingData,
  trx: DB | DBTransaction = db
) => {
  const { start = 0, end = 0 } = paginatingData || {};

  const limit = end - start === 0 ? undefined : end - start;

  const data = await trx.query.songs.findMany({
    where: (songs, { exists }) =>
      exists(trx.select().from(playHistory).where(eq(playHistory.songId, songs.id))),
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
    },
    orderBy: (songs) => {
      // Apply sorting based on sortType parameter
      if (sortType === 'aToZ') return [asc(songs.title)];
      if (sortType === 'zToA') return [desc(songs.title)];
      // Add other sort types as needed
      return [desc(songs.createdAt)]; // Default sorting
    },
    limit: limit,
    offset: start
  });

  return {
    data,
    sortType,
    filterType: 'notSelected',
    start,
    end
  };
};
