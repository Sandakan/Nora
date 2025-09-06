import { and, asc, desc, inArray, SQL } from 'drizzle-orm';
import { db } from '@db/db';

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
