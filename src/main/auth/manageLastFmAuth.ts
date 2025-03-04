import { setUserData } from '../filesystem';
import type { LastFMSessionGetResponse } from '../../types/last_fm_api';
import hashText from '../utils/hashText';
import { encrypt } from '../utils/safeStorage';
import { sendMessageToRenderer } from '../main';
import logger from '../logger';

const createLastFmAuthSignature = (token: string, apiKey: string) => {
  const LAST_FM_SHARED_SECRET = import.meta.env.MAIN_VITE_LAST_FM_SHARED_SECRET;
  if (!LAST_FM_SHARED_SECRET) throw new Error('LastFM Shared Secret not found.');

  const sig = `api_key${apiKey}methodauth.getSessiontoken${token}${LAST_FM_SHARED_SECRET}`;
  const utf8EncodedSig = encodeURIComponent(sig);
  const hashedSig = hashText(utf8EncodedSig);
  return hashedSig;
};

const manageLastFmAuth = async (token: string) => {
  try {
    const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;
    if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');

    const sig = createLastFmAuthSignature(token, LAST_FM_API_KEY);

    const url = new URL('http://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'auth.getSession');
    url.searchParams.set('api_key', LAST_FM_API_KEY);
    url.searchParams.set('format', 'json');
    url.searchParams.set('token', token);
    url.searchParams.set('api_sig', sig);

    logger.debug('LastFM Auth url', { url: url.href });

    const res = await fetch(url);
    const json: LastFMSessionGetResponse = await res.json();

    logger.verbose('LastFM JSON result', { json });
    if ('session' in json) {
      const { key, name } = json.session;
      const encryptedKey = encrypt(key);
      logger.info('Successfully retrieved user authentication for LastFM', { name });
      setUserData('lastFmSessionData', { name, key: encryptedKey });
      return sendMessageToRenderer({ messageCode: 'LASTFM_LOGIN_SUCCESS' });
    }

    const errMessage = 'Session not found in LastFM response.';
    logger.error(errMessage, { json });
    throw new Error(errMessage);
  } catch (error) {
    return logger.error('Error occurred when authenticating LastFM user data.', { error });
  }
};

export default manageLastFmAuth;
