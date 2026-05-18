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

import type { AuthData, LoveParams, ScrobbleParams, updateNowPlayingParams } from '../../../types/last_fm_api';
import logger from '../../logger';
import { checkIfConnectedToInternet } from '../../main';
import generateApiRequestBodyForLastFMPostRequests from './generateApiRequestBodyForLastFMPostRequests';
import getLastFmAuthData from './getLastFMAuthData';

const FLUSH_BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1500;

export async function flushScrobbleQueue(): Promise<void> {
  if (!checkIfConnectedToInternet()) return;

  const authData = await getLastFmAuthData().catch(() => null);
  if (!authData) {
    logger.debug('Flush skipped - no Last.fm auth data');
    return;
  }

  await resetStuckSending();

  const url = new URL('http://ws.audioscrobbler.com/2.0/');
  url.searchParams.set('format', 'json');

  await deleteOldPending();

  let items = await claimPendingBatch(FLUSH_BATCH_SIZE);

  while (items.length > 0) {
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
}

async function processItem(
  item: typeof scrobbleQueue.$inferSelect,
  authData: AuthData,
  url: URL
): Promise<void> {
  switch (item.operationType) {
    case 'scrobble': {
      if (!item.songId || !item.startTimeSecs) throw new Error('Missing scrobble params');
      const songData = await getSongById(item.songId);
      if (!songData) throw new Error('Song not found');
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

    case 'now_playing': {
      if (!item.songId) throw new Error('Missing now_playing params');
      const songData = await getSongById(item.songId);
      if (!songData) throw new Error('Song not found');
      const song = convertToSongData(songData);
      const params: updateNowPlayingParams = {
        track: song.title,
        artist: song.artists?.map((a) => a.name).join(', ') || '',
        album: song.album?.name,
        albumArtist: song?.albumArtists?.map((a) => a.name).join(', '),
        trackNumber: song.trackNo,
        duration: Math.ceil(song.duration)
      };
      await postToLastFm(url, authData, 'track.updateNowPlaying', params);
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

async function postToLastFm(
  url: URL,
  authData: AuthData,
  method: 'track.scrobble' | 'track.updateNowPlaying' | 'track.love' | 'track.unlove',
  params: ScrobbleParams | updateNowPlayingParams | LoveParams
): Promise<void> {
  const body = generateApiRequestBodyForLastFMPostRequests({ method, authData, params } as any);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (res.status !== 200) throw new Error(`API returned ${res.status}`);
}
