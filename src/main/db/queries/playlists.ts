import { asc } from 'drizzle-orm';
import { playlists } from '../schema';
import { db } from '@db/db';

export type GetAllPlaylistsReturnType = Awaited<ReturnType<typeof getAllPlaylists>>;
export const getAllPlaylists = async (trx: DB | DBTransaction = db) => {
  const data = await trx.query.playlists.findMany({
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

  return data;
};
