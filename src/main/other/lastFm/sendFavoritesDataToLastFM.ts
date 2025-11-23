import logger from '../../logger';
import hashText from '../../utils/hashText';
import type {
  AuthData,
  LastFMLoveUnlovePostResponse,
  LoveParams
} from '../../../types/last_fm_api';
import { checkIfConnectedToInternet } from '../../main';
import getLastFmAuthData from './getLastFMAuthData';
import { getUserSettings } from '@main/db/queries/settings';

type Method = 'track.love' | 'track.unlove';

const generateApiSignature = (method: Method, authData: AuthData, params: LoveParams) => {
  const { LAST_FM_API_KEY, LAST_FM_SHARED_SECRET, SESSION_KEY } = authData;

  const sig = `api_key${LAST_FM_API_KEY}artist${params.artist}method${method}sk${SESSION_KEY}track${params.track}${LAST_FM_SHARED_SECRET}`;

  const hashedSig = hashText(sig);
  return hashedSig;
};

const generateApiResponseBody = (method: Method, authData: AuthData, params: LoveParams) => {
  const { LAST_FM_API_KEY, SESSION_KEY, LAST_FM_SHARED_SECRET } = authData;

  const API_SIGNATURE = generateApiSignature(
    method,
    { LAST_FM_API_KEY, LAST_FM_SHARED_SECRET, SESSION_KEY },
    params
  );

  const body = `method=${method}&api_key=${LAST_FM_API_KEY}&api_sig=${API_SIGNATURE}&sk=${SESSION_KEY}&artist=${encodeURIComponent(
    params.artist
  )}&track=${encodeURIComponent(params.track)}`;

  return body;
};

const sendFavoritesDataToLastFM = async (method: Method, title: string, artists: string[] = []) => {
  try {
    const { sendSongFavoritesDataToLastFM: isSendingLoveEnabled } = await getUserSettings();
    const isConnectedToInternet = checkIfConnectedToInternet();

    if (isSendingLoveEnabled && isConnectedToInternet) {
      const authData = await getLastFmAuthData();

      const url = new URL('http://ws.audioscrobbler.com/2.0/');
      url.searchParams.set('format', 'json');

      const params: LoveParams = {
        track: title,
        artist: artists.join(', ')
      };

      const body = generateApiResponseBody(method, authData, params);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
      });

      if (res.status === 200)
        return logger.debug('Love/Unlove song request accepted.', { method, title, artists });

      const json: LastFMLoveUnlovePostResponse = await res.json();

      return logger.warn('Failed the request to LastFM about love/unlove song.', {
        json,
        method,
        title,
        artists
      });
    }
    return logger.debug('Request to Love/Unlove song ignored', {
      isSendingLoveEnabled,
      isConnectedToInternet
    });
  } catch (error) {
    return logger.error('Failed to send data about making a song a favorite to LastFM.', {
      error,
      method,
      title,
      artists
    });
  }
};

export const addAFavoriteToLastFM = (title: string, artists: string[] = []) =>
  sendFavoritesDataToLastFM('track.love', title, artists);

export const removeAFavoriteFromLastFM = (title: string, artists: string[] = []) =>
  sendFavoritesDataToLastFM('track.unlove', title, artists);
