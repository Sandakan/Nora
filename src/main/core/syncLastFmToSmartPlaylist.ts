import { db } from '@db/db';
import { playlists, playlistsSongs } from '@db/schema';
import { eq } from 'drizzle-orm';

import {
  MAX_LASTFM_MATCH_IDS
} from '../db/queries/smartPlaylistConstants';
import { validateLastFmSource } from '../db/queries/validateSmartPlaylistCriteria';
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
  if (typeof playlistId !== 'number' || !Number.isSafeInteger(playlistId) || playlistId <= 0) {
    logger.warn('syncLastFmToSmartPlaylist: invalid playlistId', { playlistId });
    return { success: false, count: 0 };
  }

  if (!Array.isArray(songIds) || songIds.length === 0) {
    logger.warn('syncLastFmToSmartPlaylist: empty songIds', { playlistId });
    return { success: false, count: 0 };
  }

  if (songIds.length > MAX_LASTFM_MATCH_IDS) {
    logger.warn('syncLastFmToSmartPlaylist: songIds exceed bound', {
      playlistId,
      count: songIds.length
    });
    return { success: false, count: 0 };
  }

  const uniqueIds = [
    ...new Set(songIds.filter((id) => typeof id === 'number' && Number.isSafeInteger(id) && id > 0))
  ];
  if (uniqueIds.length === 0) {
    return { success: false, count: 0 };
  }

  if (!source || typeof source !== 'object') {
    logger.warn('syncLastFmToSmartPlaylist: invalid source', { playlistId });
    return { success: false, count: 0 };
  }

  const validation = validateLastFmSource(source);
  if (!validation.success) {
    logger.warn('syncLastFmToSmartPlaylist: invalid source', {
      playlistId,
      reason: validation.reason
    });
    return { success: false, count: 0 };
  }

  const trimmedUsername = validation.source.username;
  const period = validation.source.period;
  const limit = validation.source.limit;

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

    criteria.lastFmSource = {
      username: trimmedUsername,
      type: validation.source.type,
      period,
      limit
    };

    await db.transaction(async (trx) => {
      await trx.delete(playlistsSongs).where(eq(playlistsSongs.playlistId, playlistId));

      if (uniqueIds.length > 0) {
        await trx.insert(playlistsSongs).values(
          uniqueIds.map((songId, idx) => ({
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

    logger.info('Last.fm sync completed', { playlistId, count: uniqueIds.length });
    return { success: true, count: uniqueIds.length };
  } catch (error) {
    logger.error('Failed to sync Last.fm to smart playlist', { playlistId, error });
    return { success: false, count: 0 };
  }
};
