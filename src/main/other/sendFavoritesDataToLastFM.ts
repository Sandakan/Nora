/* eslint-disable prefer-destructuring */
import { getUserData } from '../filesystem';
import log from '../log';
import hashText from '../utils/hashText';
import { decrypt } from '../utils/safeStorage';
import {
  AuthData,
  LastFMLoveUnlovePostResponse,
  LoveParams,
} from '../../@types/last_fm_api';
import { checkIfConnectedToInternet } from '../main';

type Method = 'track.love' | 'track.unlove';

const generateApiSignature = (
  method: Method,
  authData: AuthData,
  params: LoveParams,
) => {
  const { LAST_FM_API_KEY, LAST_FM_SHARED_SECRET, SESSION_KEY } = authData;

  const sig = `api_key${LAST_FM_API_KEY}artist${params.artist}method${method}sk${SESSION_KEY}track${params.track}${LAST_FM_SHARED_SECRET}`;

  const hashedSig = hashText(sig);
  return hashedSig;
};

const generateApiResponseBody = (
  method: Method,
  authData: AuthData,
  params: LoveParams,
) => {
  const { LAST_FM_API_KEY, SESSION_KEY, LAST_FM_SHARED_SECRET } = authData;

  const API_SIGNATURE = generateApiSignature(
    method,
    { LAST_FM_API_KEY, LAST_FM_SHARED_SECRET, SESSION_KEY },
    params,
  );

  const body = `method=${method}&api_key=${LAST_FM_API_KEY}&api_sig=${API_SIGNATURE}&sk=${SESSION_KEY}&artist=${encodeURIComponent(
    params.artist,
  )}&track=${encodeURIComponent(params.track)}`;

  return body;
};

const sendFavoritesDataToLastFM = async (
  method: Method,
  title: string,
  artists: string[] = [],
) => {
  try {
    const userData = getUserData();
    const isConnectedToInternet = checkIfConnectedToInternet();

    const encryptedSessionKey = userData.lastFmSessionData?.key;
    const isSendingLoveEnabled =
      encryptedSessionKey && userData.preferences.sendSongFavoritesDataToLastFM;

    if (isSendingLoveEnabled && isConnectedToInternet) {
      const SESSION_KEY = decrypt(encryptedSessionKey);

      const LAST_FM_API_KEY = process.env.LAST_FM_API_KEY;
      const LAST_FM_SHARED_SECRET = process.env.LAST_FM_SHARED_SECRET;
      if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');
      if (!LAST_FM_SHARED_SECRET)
        throw new Error('LastFM shared secret key not found.');

      const url = new URL('http://ws.audioscrobbler.com/2.0/');
      url.searchParams.set('format', 'json');

      const params: LoveParams = {
        track: title,
        artist: artists.join(', '),
      };

      const body = generateApiResponseBody(
        method,
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

      if (res.status === 200) return log('Love/Unlove song request accepted.');
      const json: LastFMLoveUnlovePostResponse = await res.json();

      return log(
        'Failed the request to LastFM about love/unlove song.',
        {
          json,
        },
        'WARN',
      );
    }
    return log('Request to Love/Unlove song ignored', {
      isSendingLoveEnabled,
      isConnectedToInternet,
    });
  } catch (error) {
    return log(
      'Failed to send data about making a song a favorite to LastFM.',
      {
        error,
      },
      'ERROR',
    );
  }
};

export const addAFavoriteToLastFM = (title: string, artists: string[] = []) =>
  sendFavoritesDataToLastFM('track.love', title, artists);
export const removeAFavoriteFromLastFM = (
  title: string,
  artists: string[] = [],
) => sendFavoritesDataToLastFM('track.unlove', title, artists);
