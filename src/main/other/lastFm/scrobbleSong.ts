import logger from '../../logger';
import type { LastFMScrobblePostResponse, ScrobbleParams } from '../../../types/last_fm_api';
import { checkIfConnectedToInternet } from '../../main';
import generateApiRequestBodyForLastFMPostRequests from './generateApiRequestBodyForLastFMPostRequests';
import getLastFmAuthData from './getLastFMAuthData';
import { getSongById } from '@main/db/queries/songs';
import { convertToSongData } from '@main/utils/convert';
import { getUserSettings } from '@main/db/queries/settings';

const scrobbleSong = async (songId: number, startTimeInSecs: number) => {
  try {
    const { sendSongScrobblingDataToLastFM: isScrobblingEnabled } = await getUserSettings();
    const isConnectedToInternet = checkIfConnectedToInternet();

    if (isScrobblingEnabled && isConnectedToInternet) {
      const songData = await getSongById(songId);

      if (songData) {
        const song = convertToSongData(songData);
        const authData = await getLastFmAuthData();

        const url = new URL('http://ws.audioscrobbler.com/2.0/');
        url.searchParams.set('format', 'json');

        const params: ScrobbleParams = {
          track: song.title,
          artist: song.artists?.map((artist) => artist.name).join(', ') || '',
          timestamp: Math.floor(startTimeInSecs),
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
        return logger.warn('Failed to scrobble song to LastFM', { json });
      }
    }

    return logger.debug('Scrobble song request ignored', {
      isScrobblingEnabled,
      isConnectedToInternet
    });
  } catch (error) {
    return logger.error('Failed to scrobble song data to LastFM.', {
      error
    });
  }
};

export default scrobbleSong;
