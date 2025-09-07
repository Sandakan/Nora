import { and, asc, desc, eq, inArray, SQL } from 'drizzle-orm';
import { db } from '@db/db';
import { playlistsSongs } from '../schema';
import { timeEnd, timeStart } from '@main/utils/measureTimeUsage';

export type GetAllPlaylistsReturnType = Awaited<ReturnType<typeof getAllPlaylists>>;
const defaultGetAllPlaylistsOptions = {
  playlistIds: [] as number[],
  start: 0,
  end: 0,
  sortType: 'aToZ' as PlaylistSortTypes
};
export type GetAllPlaylistsOptions = Partial<typeof defaultGetAllPlaylistsOptions>;

export const getAllPlaylists = async (
  options: GetAllPlaylistsOptions,
  trx: DB | DBTransaction = db
) => {
  const { playlistIds = [], start = 0, end = 0, sortType = 'aToZ' } = options;

  const limit = end - start === 0 ? undefined : end - start;

  const data = await trx.query.playlists.findMany({
    where: (s) => {
      const filters: SQL[] = [];

      // Filter by playlist IDs
      if (playlistIds && playlistIds.length > 0) {
        filters.push(inArray(s.id, playlistIds));
      }

      return and(...filters);
    },
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
    },
    orderBy: (playlists) => {
      if (sortType === 'aToZ') return [asc(playlists.name)];
      if (sortType === 'zToA') return [desc(playlists.name)];

      return [];
    },
    limit,
    offset: start
  });

  return {
    data,
    sortType,
    start,
    end
  };
};

export const getFavoritesPlaylist = async (trx: DB | DBTransaction = db) => {
  const timer = timeStart();
  const data = await trx.query.playlists.findFirst({
    where: (s) => eq(s.name, 'Favorites'),
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
  timeEnd(timer, 'Time taken to fetch favorites playlist');

  return data;
};

export const getHistoryPlaylist = async (trx: DB | DBTransaction = db) => {
  const timer = timeStart();
  const data = await trx.query.playlists.findFirst({
    where: (s) => eq(s.name, 'History'),
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
  timeEnd(timer, 'Time taken to fetch history playlist');

  return data;
};

export const linkSongsWithPlaylist = async (
  songIds: number[],
  playlistId: number,
  trx: DB | DBTransaction = db
) => {
  const records = songIds.map((songId) => ({
    playlistId: playlistId,
    songId: songId
  }));

  await trx.insert(playlistsSongs).values(records);
};

export const unlinkSongsFromPlaylist = async (
  songIds: number[],
  playlistId: number,
  trx: DB | DBTransaction = db
) => {
  await trx
    .delete(playlistsSongs)
    .where(and(inArray(playlistsSongs.songId, songIds), eq(playlistsSongs.playlistId, playlistId)));
};
