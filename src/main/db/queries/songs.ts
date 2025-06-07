import { db } from '@db/db';
import { songs } from '@db/schema';
import { eq } from 'drizzle-orm';

export const isSongWithPathAvailable = async (path: string) => {
  const song = await db.select({ songId: songs.id }).from(songs).where(eq(songs.path, path));

  return song.length > 0;
};

export const saveSong = async (data: typeof songs.$inferInsert, trx: DB | DBTransaction = db) => {
  const res = await trx.insert(songs).values(data).returning();
  return res[0];
};
