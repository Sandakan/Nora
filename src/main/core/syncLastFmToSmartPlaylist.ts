import { db } from '@db/db';
import { playlists, playlistsSongs } from '@db/schema';
import { eq } from 'drizzle-orm';

import logger from '../logger';

type LastFmSource = {
  username: string;
  type: 'top' | 'recent' | 'loved';
  period?: string;
  limit?: number;
};

export const syncLastFmToSmartPlaylist = async (
  playlistId: number,
  songIds: number[],
  source: LastFmSource
): Promise<{ success: boolean; count: number }> => {
  logger.debug('Syncing Last.fm data to smart playlist', {
    playlistId,
    songIdsCount: songIds.length,
    source
  });

  try {
    const playlist = await db.query.playlists.findFirst({
      where: eq(playlists.id, playlistId)
    });

    if (!playlist?.isSmart) {
      logger.warn('syncLastFmToSmartPlaylist: playlist is not smart', { playlistId });
      return { success: false, count: 0 };
    }

    let criteria: Record<string, unknown> = {};
    if (playlist.criteria) {
      try {
        criteria = JSON.parse(playlist.criteria);
      } catch {
        // ignore parse errors
      }
    }

    criteria.lastFmSource = source;

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

      await trx
        .update(playlists)
        .set({ criteria: JSON.stringify(criteria) })
        .where(eq(playlists.id, playlistId));
    });

    logger.info('Last.fm sync completed', { playlistId, count: songIds.length });
    return { success: true, count: songIds.length };
  } catch (error) {
    logger.error('Failed to sync Last.fm to smart playlist', { playlistId, error });
    return { success: false, count: 0 };
  }
};
