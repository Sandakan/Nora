import { db } from '@db/db';
import { eq } from 'drizzle-orm';
import { artists, artistsSongs } from '@db/schema';

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
