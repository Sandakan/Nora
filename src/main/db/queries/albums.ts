import { db } from '@db/db';
import { and, asc, desc, eq, inArray, type SQL } from 'drizzle-orm';
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

export const getAlbumById = async (albumId: number, trx: DB | DBTransaction = db) => {
  const data = await trx.query.albums.findFirst({
    where: (albums) => eq(albums.id, albumId),
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

  return data;
};

export const getAlbumWithTitle = async (title: string, trx: DB | DBTransaction = db) => {
  const data = await trx.query.albums.findFirst({
    where: (a) => eq(a.titleCI, title) // citext column for case-insensitive match
  });

  return data;
};

export const linkSongToAlbum = async (
  albumId: number,
  songId: number,
  trx: DB | DBTransaction = db
) => {
  return trx.insert(albumsSongs).values({ albumId, songId });
};

/**
 * Unlinks a song from an album by deleting the relationship in the albumsSongs table.
 * This does NOT delete the album or song themselves - only the relationship between them.
 * 
 * @param albumId - The ID of the album
 * @param songId - The ID of the song
 * @param trx - Database transaction instance (defaults to main db connection)
 * @returns Promise that resolves when the relationship is deleted
 */
export const unlinkSongFromAlbum = async (
  albumId: number,
  songId: number,
  trx: DB | DBTransaction = db
) => {
  return trx
    .delete(albumsSongs)
    .where(and(eq(albumsSongs.albumId, albumId), eq(albumsSongs.songId, songId)));
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

export const getAlbumSongIds = async (albumId: number, trx: DB | DBTransaction = db) => {
  const data = await trx
    .select({ songId: albumsSongs.songId })
    .from(albumsSongs)
    .where(eq(albumsSongs.albumId, albumId));

  return data.map((row) => row.songId);
};

/**
 * Deletes an album from the database.
 * 
 * **Cascade Behavior:**
 * - All entries in `albumsSongs` linking this album to songs are automatically deleted (ON DELETE CASCADE)
 * - All entries in `albumsArtists` linking this album to artists are automatically deleted (ON DELETE CASCADE)
 * - All entries in `albumsArtworks` linking this album to artworks are automatically deleted (ON DELETE CASCADE)
 * 
 * **Important:** This function should only be called after verifying the album has no remaining songs.
 * Use `getAlbumSongIds()` to check before deletion to prevent data inconsistency.
 * 
 * @param albumId - The ID of the album to delete
 * @param trx - Database transaction instance (defaults to main db connection)
 * @returns Promise that resolves when the album is deleted
 */
export const deleteAlbum = async (albumId: number, trx: DB | DBTransaction = db) => {
  return trx.delete(albums).where(eq(albums.id, albumId));
};
