import { insertScrobble } from '@main/db/queries/scrobble_queue';
import { getUserSettings } from '@main/db/queries/settings';
import { getSongById } from '@main/db/queries/songs';
import { convertToSongData } from '@main/utils/convert';

import type {
  LastFMScrobblePostResponse,
  updateNowPlayingParams
} from '../../../types/last_fm_api';
import logger from '../../logger';
import { checkIfConnectedToInternet } from '../../main';
import generateApiRequestBodyForLastFMPostRequests from './generateApiRequestBodyForLastFMPostRequests';
import getLastFmAuthData from './getLastFMAuthData';

const sendNowPlayingSongDataToLastFM = async (songId: number) => {
  try {
    const { sendNowPlayingSongDataToLastFM: isScrobblingEnabled } = await getUserSettings();

    if (!isScrobblingEnabled) {
      return logger.debug('Now playing request ignored - scrobbling disabled');
    }

    const isConnectedToInternet = checkIfConnectedToInternet();

    if (!isConnectedToInternet) {
      await insertScrobble({ songId, operationType: 'now_playing' });
      return logger.debug('Now playing queued for later - offline', { songId });
    }

    const songData = await getSongById(songId);

    if (songData) {
      const song = convertToSongData(songData);
      const authData = await getLastFmAuthData();

      const url = new URL('http://ws.audioscrobbler.com/2.0/');
      url.searchParams.set('format', 'json');

      const params: updateNowPlayingParams = {
        track: song.title,
        artist: song.artists?.map((artist) => artist.name).join(', ') || '',
        album: song.album?.name,
        albumArtist: song?.albumArtists?.map((artist) => artist.name).join(', '),
        trackNumber: song?.trackNo,
        duration: Math.ceil(song.duration)
      };

      const body = generateApiRequestBodyForLastFMPostRequests({
        method: 'track.updateNowPlaying',
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
        return logger.debug(`Now playing song data accepted in LastFM.`, { songId });

      const json: LastFMScrobblePostResponse = await res.json();
      await insertScrobble({ songId, operationType: 'now_playing' });
      return logger.warn('Failed to send now playing song to LastFM, queued for retry', { json, songId });
    }
  } catch (error) {
    await insertScrobble({ songId, operationType: 'now_playing' }).catch(() => {});
        return logger.error('Failed to send now playing song data to LastFM, queued for retry.', {
      error
    });
  }
};

export default sendNowPlayingSongDataToLastFM;
