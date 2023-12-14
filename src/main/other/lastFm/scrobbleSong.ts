/* eslint-disable prefer-destructuring */
/* eslint-disable no-await-in-loop */
import { getSongsData, getUserData } from '../../filesystem';
import log from '../../log';
import {
  LastFMScrobblePostResponse,
  ScrobbleParams,
} from '../../../@types/last_fm_api';
import { checkIfConnectedToInternet } from '../../main';
import { generateApiRequestBodyForLastFMPostRequests } from './generateApiRequestBodyForLastFMPostRequests';
import getLastFmAuthData from './getLastFMAuthData';

const scrobbleSong = async (songId: string, startTimeInSecs: number) => {
  try {
    const userData = getUserData();
    const isConnectedToInternet = checkIfConnectedToInternet();

    const isScrobblingEnabled =
      userData.preferences.sendSongScrobblingDataToLastFM;

    if (isScrobblingEnabled && isConnectedToInternet) {
      const songs = getSongsData();

      for (const song of songs) {
        if (song.songId === songId) {
          const authData = getLastFmAuthData();

          const url = new URL('http://ws.audioscrobbler.com/2.0/');
          url.searchParams.set('format', 'json');

          const params: ScrobbleParams = {
            track: song.title,
            artist: song.artists?.map((artist) => artist.name).join(', ') || '',
            timestamp: Math.floor(startTimeInSecs),
            album: song.album?.name,
            albumArtist: song?.albumArtist?.name,
            trackNumber: song.trackNo,
            duration: Math.ceil(song.duration),
          };

          const body = generateApiRequestBodyForLastFMPostRequests({
            method: 'track.scrobble',
            authData,
            params,
          });

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
          });

          if (res.status === 200)
            return log(`Scrobbled song ${songId} accepted.`);

          const json: LastFMScrobblePostResponse = await res.json();
          return log('Failed to scrobble song to LastFM', { json }, 'WARN');
        }
      }
    }
    return log('Scrobble song request ignored', {
      isScrobblingEnabled,
      isConnectedToInternet,
    });
  } catch (error) {
    return log('Error occurred when scrobbling song data to LastFM.', {
      error,
    });
  }
};

export default scrobbleSong;
