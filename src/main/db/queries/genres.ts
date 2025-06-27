import { db } from '@db/db';
import { eq } from 'drizzle-orm';
import { genres, genresSongs } from '@db/schema';

export const isGenreWithIdAvailable = async (genreId: number, trx: DB | DBTransaction = db) => {
  const data = await trx.select({}).from(genres).where(eq(genres.id, genreId));

  return data.length > 0;
};

export const isGenreWithTitleAvailable = async (name: string, trx: DB | DBTransaction = db) => {
  const data = await trx.select({}).from(genres).where(eq(genres.name, name));

  return data.length > 0;
};

export const getGenreWithTitle = async (name: string, trx: DB | DBTransaction = db) => {
  const data = await trx.select().from(genres).where(eq(genres.name, name));

  return data[0];
};

export const linkSongToGenre = async (
  genreId: number,
  songId: number,
  trx: DB | DBTransaction = db
) => {
  return trx.insert(genresSongs).values({ genreId, songId });
};

export const createGenre = async (
  genre: typeof genres.$inferInsert,
  trx: DB | DBTransaction = db
) => {
  const data = await trx.insert(genres).values(genre).returning();

  return data[0];
};
