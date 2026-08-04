import { insertScrobble } from '@main/db/queries/scrobble_queue';
import { getUserSettings } from '@main/db/queries/settings';
import { getSongById } from '@main/db/queries/songs';
import { convertToSongData } from '@main/utils/convert';

import type { LastFMScrobblePostResponse, ScrobbleParams } from '../../../types/last_fm_api';
import logger from '../../logger';
import { checkIfConnectedToInternet } from '../../main';
import generateApiRequestBodyForLastFMPostRequests from './generateApiRequestBodyForLastFMPostRequests';
import getLastFmAuthData from './getLastFMAuthData';
import { LASTFM_REQUEST_TIMEOUT_MS, fetchWithTimeout } from './lastFmUtils';

const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

const queueScrobbleForRetry = async (
  songId: number,
  startTimeSecs: number,
  trackTitle: string,
  artistNames: string
): Promise<void> => {
  await insertScrobble({
    songId,
    startTimeSecs,
    operationType: 'scrobble',
    trackTitle,
    artistNames
  });
};

const scrobbleSong = async (songId: number, startTimeSecs: number) => {
  let fallbackTrack = '';
  let fallbackArtist = '';

  try {
    const { sendSongScrobblingDataToLastFM: isScrobblingEnabled } = await getUserSettings();

    if (!isScrobblingEnabled) {
      return logger.debug('Scrobble song request ignored - scrobbling disabled', {
        isScrobblingEnabled
      });
    }

    const isConnectedToInternet = checkIfConnectedToInternet();

    // Look up the song row once so we can capture title/artist for the queue
    // fallback regardless of which path we end up on.
    const songData = await getSongById(songId).catch(() => null);
    if (!songData) {
      logger.warn('Scrobble skipped - missing song metadata', { songId });
      return;
    }
    const song = convertToSongData(songData);
    fallbackTrack = song.title ?? '';
    fallbackArtist = song.artists?.map((a) => a.name).join(', ') ?? '';

    if (!isConnectedToInternet) {
      await queueScrobbleForRetry(songId, startTimeSecs, fallbackTrack, fallbackArtist);
      return logger.debug('Scrobble queued for later - offline', { songId });
    }

    {
      const authData = await getLastFmAuthData();

      const url = new URL(LASTFM_BASE_URL);
      url.searchParams.set('format', 'json');

      const params: ScrobbleParams = {
        track: song.title,
        artist: song.artists?.map((artist) => artist.name).join(', ') || '',
        timestamp: Math.floor(startTimeSecs),
        album: song.album?.name,
        albumArtist: song?.albumArtists?.map((artist) => artist.name).join(', '),
        trackNumber: song.trackNo,
        duration: Math.ceil(song.duration)
      };

      const body = generateApiRequestBodyForLastFMPostRequests({
        method: 'track.scrobble',
        authData,
        params
      });

      const res = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body
        },
        LASTFM_REQUEST_TIMEOUT_MS
      );

      const json: LastFMScrobblePostResponse = await res.json().catch(() => ({}));

      const hasError = !res.ok || ('error' in json && Boolean(json.error));
      if (!hasError) {
        return logger.debug(`Scrobbled song accepted.`, { songId: song.songId });
      }

      const errorCode = 'error' in json ? json.error : undefined;
      const isTransient =
        res.status >= 500 || (errorCode !== undefined && [11, 16, 29].includes(errorCode));

      if (isTransient) {
        await queueScrobbleForRetry(songId, startTimeSecs, fallbackTrack, fallbackArtist);
        return logger.warn('Transient failure scrobbling to LastFM, queued for retry', {
          status: res.status,
          json
        });
      }

      return logger.error('Permanent failure scrobbling to LastFM, not queuing for retry', {
        status: res.status,
        json
      });
    }
  } catch (error) {
    if (fallbackTrack && fallbackArtist) {
      await queueScrobbleForRetry(songId, startTimeSecs, fallbackTrack, fallbackArtist).catch(
        () => {}
      );
    }
    return logger.error('Failed to scrobble song data to LastFM, queued for retry.', {
      error
    });
  }
};

export default scrobbleSong;
