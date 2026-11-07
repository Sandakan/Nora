import { db } from '@db/db';
import { asc, desc, eq, max } from 'drizzle-orm';

import { playHistory } from '../schema';

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

  const isRecentPlayOrder =
    !sortType ||
    sortType === 'addedOrder' ||
    sortType === 'dateAddedDescending' ||
    sortType === 'dateAddedAscending';

  if (isRecentPlayOrder) {
    const isAscending = sortType === 'dateAddedAscending';
    const baseQuery = trx
      .select({
        songId: playHistory.songId,
        lastPlayed: max(playHistory.createdAt).as('last_played')
      })
      .from(playHistory)
      .groupBy(playHistory.songId)
      .orderBy(isAscending ? asc(max(playHistory.createdAt)) : desc(max(playHistory.createdAt)));

    const withLimit = typeof limit === 'number' ? baseQuery.limit(limit) : baseQuery;
    const withOffset = typeof start === 'number' && start > 0 ? withLimit.offset(start) : withLimit;

    const recentHistory = await withOffset;

    const orderedSongIds = recentHistory
      .map((r) => r.songId)
      .filter((id): id is number => typeof id === 'number');

    if (orderedSongIds.length === 0) {
      return {
        data: [],
        sortType,
        filterType: 'notSelected',
        start,
        end
      };
    }

    const songsData = await trx.query.songs.findMany({
      where: (songs, { inArray }) => inArray(songs.id, orderedSongIds),
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

    const songMap = new Map(songsData.map((s) => [s.id, s]));
    const data = orderedSongIds
      .map((id) => songMap.get(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    return {
      data,
      sortType,
      filterType: 'notSelected',
      start,
      end
    };
  }

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
      if (sortType === 'mostSkipped') return [desc(songs.skipCount), asc(songs.title)];
      if (sortType === 'leastSkipped') return [asc(songs.skipCount), asc(songs.title)];
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

export const clearFullSongHistory = async (trx: DB | DBTransaction = db) => {
  const data = await trx.delete(playHistory);
  return data;
};
