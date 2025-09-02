import { db } from '@db/db';
import { and, asc, eq } from 'drizzle-orm';
import { albumsArtists, albums, albumsSongs } from '@db/schema';

export const isAlbumWithIdAvailable = async (albumId: number, trx: DB | DBTransaction = db) => {
  const data = await trx.select({}).from(albums).where(eq(albums.id, albumId));

  return data.length > 0;
};

export const isAlbumWithTitleAvailable = async (title: string, trx: DB | DBTransaction = db) => {
  const data = await trx.select({}).from(albums).where(eq(albums.title, title));

  return data.length > 0;
};

export type GetAllAlbumsReturnType = Awaited<ReturnType<typeof getAllAlbums>>;
export const getAllAlbums = async (trx: DB | DBTransaction = db) => {
  const data = await trx.query.albums.findMany({
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

  return data;
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
