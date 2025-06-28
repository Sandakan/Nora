import { db } from '@db/db';
import { and, eq } from 'drizzle-orm';
import { albumsArtists, albums, albumsSongs } from '@db/schema';

export const isAlbumWithIdAvailable = async (albumId: number, trx: DB | DBTransaction = db) => {
  const data = await trx.select({}).from(albums).where(eq(albums.id, albumId));

  return data.length > 0;
};

export const isAlbumWithTitleAvailable = async (title: string, trx: DB | DBTransaction = db) => {
  const data = await trx.select({}).from(albums).where(eq(albums.title, title));

  return data.length > 0;
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
