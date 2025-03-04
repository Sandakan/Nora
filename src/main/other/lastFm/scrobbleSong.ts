import { getSongsData, getUserData } from '../../filesystem';
import logger from '../../logger';
import type { LastFMScrobblePostResponse, ScrobbleParams } from '../../../types/last_fm_api';
import { checkIfConnectedToInternet } from '../../main';
import { generateApiRequestBodyForLastFMPostRequests } from './generateApiRequestBodyForLastFMPostRequests';
import getLastFmAuthData from './getLastFMAuthData';

const scrobbleSong = async (songId: string, startTimeInSecs: number) => {
  try {
    const userData = getUserData();
    const isConnectedToInternet = checkIfConnectedToInternet();

    const isScrobblingEnabled = userData.preferences.sendSongScrobblingDataToLastFM;

    if (isScrobblingEnabled && isConnectedToInternet) {
      const songs = getSongsData();
      const song = songs.find((x) => x.songId === songId);

      if (song) {
        const authData = getLastFmAuthData();

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
