import { db } from '@db/db';
import { and, asc, desc, eq, inArray, SQL } from 'drizzle-orm';
import { albumsArtists, albums, albumsSongs } from '@db/schema';

export const isAlbumWithIdAvailable = async (albumId: number, trx: DB | DBTransaction = db) => {
  const data = await trx.select({}).from(albums).where(eq(albums.id, albumId));

  return data.length > 0;
};

export const isAlbumWithTitleAvailable = async (title: string, trx: DB | DBTransaction = db) => {
  const data = await trx.select({}).from(albums).where(eq(albums.title, title));

  return data.length > 0;
};

export type GetAllAlbumsReturnType = Awaited<ReturnType<typeof getAllAlbums>>['data'];
const defaultGetAllAlbumsOptions = {
  albumIds: [] as number[],
  start: 0,
  end: 0,
  sortType: 'aToZ' as AlbumSortTypes
};
export type GetAllAlbumsOptions = Partial<typeof defaultGetAllAlbumsOptions>;
export const getAllAlbums = async (
  options: GetAllAlbumsOptions = defaultGetAllAlbumsOptions,
  trx: DB | DBTransaction = db
) => {
  const { albumIds = [], start = 0, end = 0, sortType = 'aToZ' } = options;

  const limit = end - start === 0 ? undefined : end - start;

  const data = await trx.query.albums.findMany({
    where: (s) => {
      const filters: SQL[] = [];

      // Filter by album IDs
      if (albumIds && albumIds.length > 0) {
        filters.push(inArray(s.id, albumIds));
      }

      return and(...filters);
    },
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
    },
    orderBy: (albums) => {
      if (sortType === 'aToZ') return [asc(albums.title)];
      if (sortType === 'zToA') return [desc(albums.title)];

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

export const getAlbumWithTitle = async (title: string, trx: DB | DBTransaction = db) => {
  const data = await trx.select().from(albums).where(eq(albums.title, title));

  return data[0];
};

export const linkSongToAlbum = async (
  albumId: number,
  songId: number,
  trx: DB | DBTransaction = db
) => {
  return trx.insert(albumsSongs).values({ albumId, songId });
};

export const linkArtistToAlbum = async (
  albumId: number,
  artistId: number,
  trx: DB | DBTransaction = db
) => {
  return trx.insert(albumsArtists).values({ albumId, artistId });
};

export const createAlbum = async (
  album: typeof albums.$inferInsert,
  trx: DB | DBTransaction = db
) => {
  const data = await trx.insert(albums).values(album).returning();

  return data[0];
};

export const getLinkedAlbumSong = async (
  albumId: number,
  songId: number,
  trx: DB | DBTransaction = db
) => {
  const data = await trx
    .select()
    .from(albumsSongs)
    .where(and(eq(albumsSongs.albumId, albumId), eq(albumsSongs.songId, songId)))
    .limit(1);

  return data.at(0);
};
