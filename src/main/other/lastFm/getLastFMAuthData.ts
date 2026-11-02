import { getUserSettings } from '@main/db/queries/settings';

import logger from '../../logger';
import { sendMessageToRenderer } from '../../main';
import { decrypt } from '../../utils/safeStorage';

export type LastFmSessionStatus = 'CONNECTED' | 'EXPIRED_OR_INVALID' | 'NOT_CONNECTED';

export const getLastFmSessionStatus = async (): Promise<LastFmSessionStatus> => {
  try {
    const { lastFmSessionKey } = await getUserSettings();
    if (!lastFmSessionKey) return 'NOT_CONNECTED';

    try {
      await decrypt(lastFmSessionKey);
      return 'CONNECTED';
    } catch {
      return 'EXPIRED_OR_INVALID';
    }
  } catch (error) {
    logger.error('Failed to get LastFM session status.', { error });
    return 'NOT_CONNECTED';
  }
};

const getLastFmAuthData = async () => {
  const { lastFmSessionKey: encryptedSessionKey } = await getUserSettings();

  if (!encryptedSessionKey) throw new Error('Encrypted LastFM Session Key not found');

  let SESSION_KEY: string;
  try {
    SESSION_KEY = await decrypt(encryptedSessionKey);
  } catch (error) {
    logger.warn('Failed to decrypt LastFM session key. Session may have expired or is invalid.', {
      error
    });
    sendMessageToRenderer({ messageCode: 'LASTFM_SESSION_EXPIRED' });
    throw new Error('LastFM session expired or invalid. Please re-authenticate.');
  }

  const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;
  if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');

  const LAST_FM_SHARED_SECRET = import.meta.env.MAIN_VITE_LAST_FM_SHARED_SECRET;
  if (!LAST_FM_SHARED_SECRET) throw new Error('LastFM shared secret key not found.');

  return { LAST_FM_API_KEY, SESSION_KEY, LAST_FM_SHARED_SECRET };
};

export default getLastFmAuthData;
