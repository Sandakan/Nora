import { scrobbleQueue } from '@main/db/schema';
import { getSongById } from '@main/db/queries/songs';
import {
  claimPendingBatch,
  deleteOldPending,
  markFailed,
  markSent,
  resetStuckSending
} from '@main/db/queries/scrobble_queue';
import { convertToSongData } from '@main/utils/convert';

import type { AuthData, LoveParams, ScrobbleParams } from '../../../types/last_fm_api';
import type { LastFMApi } from './generateApiRequestBodyForLastFMPostRequests';
import logger from '../../logger';
import { checkIfConnectedToInternet } from '../../main';
import generateApiRequestBodyForLastFMPostRequests from './generateApiRequestBodyForLastFMPostRequests';
import getLastFmAuthData from './getLastFMAuthData';
import { LASTFM_REQUEST_TIMEOUT_MS, fetchWithTimeout } from './lastFmUtils';

const FLUSH_BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1500;
let isFlushing = false;

export async function flushScrobbleQueue(): Promise<void> {
  if (isFlushing) return;
  if (!checkIfConnectedToInternet()) return;

  isFlushing = true;

  try {
    const authData = await getLastFmAuthData().catch(() => null);
    if (!authData) {
      logger.debug('Flush skipped - no Last.fm auth data');
      return;
    }

    await resetStuckSending();

    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('format', 'json');

    await deleteOldPending();

    let items = await claimPendingBatch(FLUSH_BATCH_SIZE);

    while (items.length > 0) {
      if (!checkIfConnectedToInternet()) {
        logger.debug('Flush loop exiting - internet dropped during batch delay');
        return;
      }
      for (const item of items) {
        try {
          await processItem(item, authData, url);
          await markSent(item.id);
          logger.debug('Flushed scrobble queue item', { id: item.id, type: item.operationType });
        } catch {
          await markFailed(item.id);
          logger.warn('Failed to flush scrobble queue item', { id: item.id });
        }
      }

      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      items = await claimPendingBatch(FLUSH_BATCH_SIZE);
    }
  } catch (error) {
    logger.error('Flush failed unexpectedly', { error });
  } finally {
    isFlushing = false;
  }
}

async function processItem(
  item: typeof scrobbleQueue.$inferSelect,
  authData: AuthData,
  url: URL
): Promise<void> {
  switch (item.operationType) {
    case 'scrobble': {
      if (item.startTimeSecs == null)
        throw new Error('Missing scrobble timestamp');

      const songData = item.songId != null ? await getSongById(item.songId) : null;
      // If the song was deleted between queue and flush, fall back to the
      // title/artist captured at queue time so the scrobble can still post.
      if (!songData) {
        if (!item.trackTitle || !item.artistNames) {
          throw new Error('Song not found and no fallback metadata available');
        }
        const params: ScrobbleParams = {
          track: item.trackTitle,
          artist: item.artistNames,
          timestamp: item.startTimeSecs
        };
        await postToLastFm(url, authData, 'track.scrobble', params);
        return;
      }
      const song = convertToSongData(songData);
      const params: ScrobbleParams = {
        track: song.title,
        artist: song.artists?.map((a) => a.name).join(', ') || '',
        timestamp: item.startTimeSecs,
        album: song.album?.name,
        albumArtist: song?.albumArtists?.map((a) => a.name).join(', '),
        trackNumber: song.trackNo,
        duration: Math.ceil(song.duration)
      };
      await postToLastFm(url, authData, 'track.scrobble', params);
      return;
    }

    case 'track.love':
    case 'track.unlove': {
      const params: LoveParams = {
        track: item.trackTitle || '',
        artist: item.artistNames || ''
      };
      await postToLastFm(url, authData, item.operationType, params);
      return;
    }

    default:
      throw new Error(`Unknown operation type: ${item.operationType}`);
  }
}

async function postToLastFm<T extends LastFMApi['method']>(
  url: URL,
  authData: AuthData,
  method: T,
  params: Extract<LastFMApi, { method: T }>['params']
): Promise<void> {
  const body = generateApiRequestBodyForLastFMPostRequests({ method, authData, params } as LastFMApi);
  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    },
    LASTFM_REQUEST_TIMEOUT_MS
  );
  if (res.status !== 200) throw new Error(`API returned ${res.status}`);
}
