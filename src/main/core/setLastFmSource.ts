import { db } from '@main/db/db';
import { playlists } from '@main/db/schema';
import { eq } from 'drizzle-orm';

import logger from '../logger';

type LastFmSource = {
  username: string;
  type: 'top' | 'recent' | 'loved';
  period?: string;
  limit?: number;
};

export const setLastFmSource = async (
  playlistId: number,
  source: LastFmSource
): Promise<boolean> => {
  try {
    const playlist = await db.query.playlists.findFirst({
      where: eq(playlists.id, playlistId)
    });

    if (!playlist) {
      logger.warn('setLastFmSource: playlist not found', { playlistId });
      return false;
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

    await db
      .update(playlists)
      .set({ criteria: JSON.stringify(criteria) })
      .where(eq(playlists.id, playlistId));

    logger.info('Set Last.fm source on playlist', { playlistId, source });
    return true;
  } catch (error) {
    logger.error('Failed to set Last.fm source', { playlistId, error });
    return false;
  }
};
