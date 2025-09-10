import { db } from '@db/db';
import { playHistory } from '../schema';
import { desc, eq } from 'drizzle-orm';

export const addSongToPlayHistory = async (songId: number, trx: DB | DBTransaction = db) => {
  const data = await trx.insert(playHistory).values({ songId });
  return data;
};

export const getSongPlayHistory = async (songId: number, trx: DB | DBTransaction = db) => {
  const data = await trx
    .select()
    .from(playHistory)
    .where(eq(playHistory.songId, songId))
    .orderBy(desc(playHistory.createdAt));

  return data;
};
