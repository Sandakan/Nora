import { getUserData } from '../filesystem';
import log from '../log';
import { Initialize, setDiscordRPC } from './discord';

export const setDiscordRpcActivity = (data: any) => {
  try {
    const userData = getUserData();
    const { enableDiscordRPC } = userData.preferences;

    if (!enableDiscordRPC)
      return log('Discord Rich Presence skipped.', {
        reason: { enableDiscordRPC }
      });
    Initialize();
    setDiscordRPC(data);
    return log('Discord rich presence activity accepted.');
  } catch (error) {
    return log('Failed to set discord rich presence activity.', { error });
  }
};

export const clearDiscordRpcActivity = async () => setDiscordRPC(null);
