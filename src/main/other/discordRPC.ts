import { getUserSettings } from '@main/db/queries/settings';

import logger from '../logger';
import { Initialize, setDiscordRPC } from './discord';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let latestData: Record<string, unknown> | null = null;

export const setDiscordRpcActivity = async (data: Record<string, unknown>) => {
  try {
    const userSettings = await getUserSettings();
    const { enableDiscordRPC } = userSettings ?? {};

    if (!enableDiscordRPC)
      return logger.debug('Discord Rich Presence skipped.', {
        reason: { enableDiscordRPC }
      });
    Initialize();

    if (debounceTimer) {
      latestData = data;
      return;
    }

    setDiscordRPC(data);

    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const pending = latestData;
      latestData = null;
      if (pending) {
        logger.debug('Send last activity in the queue.');
        setDiscordRPC(pending);
      }
      logger.debug('Clear activity queue.');
    }, 1000);
  } catch (error) {
    logger.error('Failed to set discord rich presence activity.', { error });
  }
};

export const clearDiscordRpcActivity = async () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  latestData = null;
  setDiscordRPC(null);
};
