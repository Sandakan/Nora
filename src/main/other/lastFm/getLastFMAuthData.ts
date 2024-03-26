/* eslint-disable prefer-destructuring */
import { decrypt } from '../../utils/safeStorage';
import { getUserData } from '../../filesystem';

const getLastFmAuthData = () => {
  const userData = getUserData();

  const encryptedSessionKey = userData.lastFmSessionData?.key;
  if (!encryptedSessionKey) throw new Error('Encrypted LastFM Session Key not found');
  const SESSION_KEY = decrypt(encryptedSessionKey);

  const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;
  if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');

  const LAST_FM_SHARED_SECRET = import.meta.env.MAIN_VITE_LAST_FM_SHARED_SECRET;
  if (!LAST_FM_SHARED_SECRET) throw new Error('LastFM shared secret key not found.');

  return { LAST_FM_API_KEY, SESSION_KEY, LAST_FM_SHARED_SECRET };
};

export default getLastFmAuthData;
