import { db } from '@db/db';
import { songs } from '@db/schema';
import { eq, inArray } from 'drizzle-orm';

export const addSongsToBlacklist = async (songIs: number[], trx: DB | DBTransaction = db) => {
  const result = await trx
    .update(songs)
    .set({ isBlacklisted: true, isBlacklistedUpdatedAt: new Date() })
    .where(inArray(songs.id, songIs));

  return result;
};

export const restoreSongsFromBlacklist = async (
  songIds: number[],
  trx: DB | DBTransaction = db
) => {
  const result = await trx
    .update(songs)
    .set({ isBlacklisted: false, isBlacklistedUpdatedAt: new Date() })
    .where(inArray(songs.id, songIds));

  return result;
};

export const getBlacklistedSongIds = async (trx: DB | DBTransaction = db) => {
  const result = await trx
    .select({ id: songs.id })
    .from(songs)
    .where(eq(songs.isBlacklisted, true));
  return result.map((row) => row.id);
};
