import { db } from '@db/db';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { albumsArtists, artists, artistsSongs } from '@db/schema';

export const isArtistWithNameAvailable = async (name: string, trx: DB | DBTransaction = db) => {
  const data = await trx.select({}).from(artists).where(eq(artists.name, name)).limit(1);

  return data.length > 0;
};

export const getArtistWithName = async (name: string, trx: DB | DBTransaction = db) => {
  const data = await trx.select().from(artists).where(eq(artists.name, name)).limit(1);

  return data.at(0);
};
export const linkSongToArtist = async (
  artistId: number,
  songId: number,
  trx: DB | DBTransaction = db
) => {
  return trx.insert(artistsSongs).values({ artistId, songId }).returning();
};

export const createArtist = async (
  artist: typeof artists.$inferInsert,
  trx: DB | DBTransaction = db
) => {
  const data = await trx.insert(artists).values(artist).returning();

  return data[0];
};

export const getLinkedAlbumArtist = async (
  albumId: number,
  artistId: number,
  trx: DB | DBTransaction = db
) => {
  const data = await trx
    .select()
    .from(albumsArtists)
    .where(and(eq(albumsArtists.albumId, albumId), eq(albumsArtists.artistId, artistId)))
    .limit(1);

  return data.at(0);
};

export const getLinkedSongArtist = async (
  songId: number,
  artistId: number,
  trx: DB | DBTransaction = db
) => {
  const data = await trx
    .select()
    .from(artistsSongs)
    .where(and(eq(artistsSongs.songId, songId), eq(artistsSongs.artistId, artistId)))
    .limit(1);

  return data.at(0);
};

export type GetAllArtistsReturnType = Awaited<ReturnType<typeof getAllArtists>>['data'];
const defaultGetAllArtistsOptions = {
  artistIds: [] as number[],
  start: 0,
  end: 0,
  filterType: 'notSelected' as ArtistFilterTypes,
  sortType: 'aToZ' as ArtistSortTypes
};
export type GetAllArtistsOptions = Partial<typeof defaultGetAllArtistsOptions>;

export const getAllArtists = async (
  options: GetAllArtistsOptions,
  trx: DB | DBTransaction = db
) => {
  const {
    artistIds = [],
    start = 0,
    end = 0,
    filterType = 'notSelected',
    sortType = 'aToZ'
  } = options;
  const limit = end - start === 0 ? undefined : end - start;

  const data = await trx.query.artists.findMany({
    where: (s) => {
      if (artistIds && artistIds.length > 0) {
        return inArray(s.id, artistIds);
      }
      return undefined;
    },
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
    },
    limit,
    offset: start,
    orderBy: (artists) => {
      if (sortType === 'aToZ') return [asc(artists.name)];
      if (sortType === 'zToA') return [desc(artists.name)];

      return [];
    }
  });

  return {
    data,
    sortType,
    filterType,
    start,
    end
  };
};
