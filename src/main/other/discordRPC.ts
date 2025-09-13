import { getUserSettings } from '@main/db/queries/settings';
import logger from '../logger';
import { Initialize, setDiscordRPC } from './discord';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dataQueue: any[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setDiscordRpcActivity = async (data: any) => {
  try {
    const { enableDiscordRPC } = await getUserSettings();

    if (!enableDiscordRPC)
      return logger.debug('Discord Rich Presence skipped.', {
        reason: { enableDiscordRPC }
      });
    Initialize();
    if (dataQueue.length == 0) {
      setDiscordRPC(data);
      setTimeout(() => {
        if (dataQueue.length > 1) {
          logger.debug('Send last activity in the queue.');
          setDiscordRPC(dataQueue.pop());
        }
        logger.debug('Clear activity queue.');
        dataQueue = [];
      }, 3000);
      logger.debug('Discord rich presence activity accepted.');
    }
    dataQueue.push(data);
    return logger.debug('Pushed activity to queue.');
  } catch (error) {
    logger.error('Failed to set discord rich presence activity.', { error });
  }
};

export const clearDiscordRpcActivity = async () => setDiscordRPC(null);
