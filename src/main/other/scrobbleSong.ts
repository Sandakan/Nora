/* eslint-disable prefer-destructuring */
/* eslint-disable no-await-in-loop */
import hashText from '../utils/hashText';
import { getSongsData, getUserData } from '../filesystem';
import log from '../log';
import { decrypt } from '../utils/safeStorage';
import {
  AuthData,
  LastFMScrobblePostResponse,
  ScrobbleParams,
} from '../../@types/last_fm_api';
import { checkIfConnectedToInternet } from '../main';

// const generateApiSignature = (
//   method: LastFMApiMethods,
//   authData: AuthData,
//   params: ParamsData,
// ) => {
//   //   const sig = `api_key${LAST_FM_API_KEY}method${method}sk${SESSION_KEY}track${TRACK_NAME}artist${TRACK_ARTIST}timestamp${TIMESTAMP}${LAST_FM_SHARED_SECRET}`;
//   const { LAST_FM_API_KEY, LAST_FM_SHARED_SECRET, SESSION_KEY } = authData;

//   const sigComponents: string[] = [
//     `method${method}`,
//     `api_key${LAST_FM_API_KEY}`,
//     `sk${SESSION_KEY}`,
//   ];

//   for (const [prop, value] of Object.entries(params)) {
//     if (value !== undefined) sigComponents.push(`${prop}${value}`);
//   }

//   //   Signature parameters should be sorted alphabetically
//   sigComponents.sort();
//   //   Lastly, the SHARED_SECRET should be appended to the end of the signature.
//   sigComponents.push(LAST_FM_SHARED_SECRET);

//   const sig = sigComponents.join('');

//   const utf8EncodedSig = encodeURIComponent(sig);
//   const hashedSig = hashText(utf8EncodedSig);
//   return hashedSig;
// };

// const generateApiResponseBody = (
//   method: LastFMApiMethods,
//   authData: Omit<AuthData & { API_SIGNATURE: string }, 'LAST_FM_SHARED_SECRET'>,
//   params: ScrobbleParams,
// ) => {
//   const { LAST_FM_API_KEY, SESSION_KEY, API_SIGNATURE } = authData;
//   const bodyComponents = [
//     `method${method}`,
//     `api_key${LAST_FM_API_KEY}`,
//     `api_sig=${API_SIGNATURE}`,
//     `sk${SESSION_KEY}`,
//   ];

//   for (const [prop, value] of Object.entries(params)) {
//     if (value !== undefined) bodyComponents.push(`${prop}=${value}`);
//   }

//   const body = bodyComponents.join('&');
//   const utf8EncodedBody = encodeURIComponent(body);
//   return utf8EncodedBody;
// };

const generateApiSignature = (authData: AuthData, params: ScrobbleParams) => {
  const { LAST_FM_API_KEY, LAST_FM_SHARED_SECRET, SESSION_KEY } = authData;
  const method = `track.scrobble`;

  const sig = `api_key${LAST_FM_API_KEY}artist${params.artist}duration${params.duration}method${method}sk${SESSION_KEY}timestamp${params.timestamp}track${params.track}${LAST_FM_SHARED_SECRET}`;

  const hashedSig = hashText(sig);
  return hashedSig;
};

const generateApiResponseBody = (
  authData: AuthData,
  params: ScrobbleParams,
) => {
  const { LAST_FM_API_KEY, SESSION_KEY, LAST_FM_SHARED_SECRET } = authData;

  const API_SIGNATURE = generateApiSignature(
    { LAST_FM_API_KEY, LAST_FM_SHARED_SECRET, SESSION_KEY },
    params,
  );

  const body = `method=track.scrobble&api_key=${LAST_FM_API_KEY}&api_sig=${API_SIGNATURE}&sk=${SESSION_KEY}&timestamp=${
    params.timestamp
  }&artist=${encodeURIComponent(params.artist)}&track=${encodeURIComponent(
    params.track,
  )}&duration=${params.duration}`;

  return body;
};

const scrobbleSong = async (songId: string, startTimeInSecs: number) => {
  try {
    const userData = getUserData();
    const isConnectedToInternet = checkIfConnectedToInternet();

    const encryptedSessionKey = userData.lastFmSessionData?.key;
    const isScrobblingEnabled =
      encryptedSessionKey &&
      userData.preferences.sendSongScrobblingDataToLastFM;

    if (isScrobblingEnabled && isConnectedToInternet) {
      const songs = getSongsData();

      for (const song of songs) {
        if (song.songId === songId) {
          const SESSION_KEY = decrypt(encryptedSessionKey);

          const LAST_FM_API_KEY = process.env.LAST_FM_API_KEY;
          const LAST_FM_SHARED_SECRET = process.env.LAST_FM_SHARED_SECRET;
          if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');
          if (!LAST_FM_SHARED_SECRET)
            throw new Error('LastFM shared secret key not found.');

          const url = new URL('http://ws.audioscrobbler.com/2.0/');
          url.searchParams.set('format', 'json');

          const params: ScrobbleParams = {
            track: song.title,
            artist: song.artists?.map((artist) => artist.name).join(', ') || '',
            timestamp: Math.floor(startTimeInSecs),
            album: song.album?.name,
            trackNumber: song.trackNo,
            duration: Math.ceil(song.duration),
          };

          const body = generateApiResponseBody(
            { LAST_FM_API_KEY, SESSION_KEY, LAST_FM_SHARED_SECRET },
            params,
          );

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
          });

          if (res.status === 200) return log('Scrobbled song accepted.');

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
