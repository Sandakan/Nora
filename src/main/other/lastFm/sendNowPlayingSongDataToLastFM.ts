/* eslint-disable prefer-destructuring */
/* eslint-disable no-await-in-loop */
import { getSongsData, getUserData } from '../../filesystem';
import log from '../../log';
import {
  LastFMScrobblePostResponse,
  updateNowPlayingParams,
} from '../../../@types/last_fm_api';
import { checkIfConnectedToInternet } from '../../main';
import generateApiRequestBodyForLastFMPostRequests from './generateApiRequestBodyForLastFMPostRequests';
import getLastFmAuthData from './getLastFMAuthData';

const sendNowPlayingSongDataToLastFM = async (songId: string) => {
  try {
    const userData = getUserData();
    const isConnectedToInternet = checkIfConnectedToInternet();

    const isScrobblingEnabled =
      userData.preferences.sendNowPlayingSongDataToLastFM;

    if (isScrobblingEnabled && isConnectedToInternet) {
      const songs = getSongsData();

      for (const song of songs) {
        if (song.songId === songId) {
          const authData = getLastFmAuthData();

          const url = new URL('http://ws.audioscrobbler.com/2.0/');
          url.searchParams.set('format', 'json');

          const params: updateNowPlayingParams = {
            track: song.title,
            artist: song.artists?.map((artist) => artist.name).join(', ') || '',
            album: song.album?.name,
            trackNumber: song.trackNo,
            duration: Math.ceil(song.duration),
          };

          const body = generateApiRequestBodyForLastFMPostRequests({
            method: 'track.updateNowPlaying',
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
            return log(`Now playing song ${songId} accepted.`);

          const json: LastFMScrobblePostResponse = await res.json();
          return log(
            'Failed to send now playing song to LastFM',
            { json },
            'WARN',
          );
        }
      }
    }
    return log('Now playing song request ignored', {
      isScrobblingEnabled,
      isConnectedToInternet,
    });
  } catch (error) {
    return log('Error occurred when sending now playing song data to LastFM.', {
      error,
    });
  }
};

export default sendNowPlayingSongDataToLastFM;
