import { insertScrobble } from '@main/db/queries/scrobble_queue';
import { getUserSettings } from '@main/db/queries/settings';
import { getSongById } from '@main/db/queries/songs';
import { convertToSongData } from '@main/utils/convert';

import type { LastFMScrobblePostResponse, ScrobbleParams } from '../../../types/last_fm_api';
import logger from '../../logger';
import { checkIfConnectedToInternet } from '../../main';
import generateApiRequestBodyForLastFMPostRequests from './generateApiRequestBodyForLastFMPostRequests';
import getLastFmAuthData from './getLastFMAuthData';

const scrobbleSong = async (songId: number, startTimeSecs: number) => {
  try {
    const { sendSongScrobblingDataToLastFM: isScrobblingEnabled } = await getUserSettings();

    if (!isScrobblingEnabled) {
      return logger.debug('Scrobble song request ignored - scrobbling disabled', {
        isScrobblingEnabled
      });
    }

    const isConnectedToInternet = checkIfConnectedToInternet();

    if (!isConnectedToInternet) {
      await insertScrobble({ songId, startTimeSecs, operationType: 'scrobble' });
      return logger.debug('Scrobble queued for later - offline', { songId });
    }

    const songData = await getSongById(songId);

    if (songData) {
      const song = convertToSongData(songData);
      const authData = await getLastFmAuthData();

      const url = new URL('http://ws.audioscrobbler.com/2.0/');
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

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
      });

      if (res.status === 200)
        return logger.debug(`Scrobbled song accepted.`, { songId: song.songId });

      const json: LastFMScrobblePostResponse = await res.json();
      await insertScrobble({ songId, startTimeSecs, operationType: 'scrobble' });
      return logger.warn('Failed to scrobble song to LastFM, queued for retry', { json });
    }
  } catch (error) {
    await insertScrobble({ songId, startTimeSecs, operationType: 'scrobble' }).catch(() => {});
    return logger.error('Failed to scrobble song data to LastFM, queued for retry.', {
      error
    });
  }
};

export default scrobbleSong;
