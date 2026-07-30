import { db } from '@main/db/db';
import { playlistsSongs } from '@main/db/schema';
import { eq } from 'drizzle-orm';

import logger from '../logger';

export const replaceSmartPlaylistMembership = async (
  playlistId: number,
  songIds: number[]
): Promise<{ success: boolean; count: number }> => {
  logger.debug(`Replacing smart playlist membership`, { playlistId, songIdsCount: songIds.length });

  try {
    await db.transaction(async (trx) => {
      await trx.delete(playlistsSongs).where(eq(playlistsSongs.playlistId, playlistId));

      if (songIds.length > 0) {
        await trx.insert(playlistsSongs).values(
          songIds.map((songId, idx) => ({
            playlistId,
            songId,
            createdAt: new Date(Date.now() + idx),
            updatedAt: new Date(Date.now() + idx)
          }))
        );
      }
    });

    logger.info(`Smart playlist membership replaced`, { playlistId, count: songIds.length });
    return { success: true, count: songIds.length };
  } catch (error) {
    logger.error(`Failed to replace smart playlist membership`, { playlistId, error });
    return { success: false, count: 0 };
  }
};
