import { getUserData } from '../filesystem';
import log from '../log';
import { Initialize, setDiscordRPC } from './discord';

let dataQueue: any[] = [];

export const setDiscordRpcActivity = (data: any) => {
  try {
    const userData = getUserData();
    const { enableDiscordRPC } = userData.preferences;

    if (!enableDiscordRPC)
      return log('Discord Rich Presence skipped.', {
        reason: { enableDiscordRPC }
      });
    Initialize();
    if (dataQueue.length == 0) {
      setDiscordRPC(data);
      setTimeout(() => {
        if (dataQueue.length > 1) {
          log('Send last activity in the queue.');
          setDiscordRPC(dataQueue.pop());
        }
        log('Clear activity queue.');
        dataQueue = [];
      }, 3000);
      log('Discord rich presence activity accepted.');
    }
    dataQueue.push(data);
    return log('Pushed activity to queue.');
  } catch (error) {
    return log('Failed to set discord rich presence activity.', { error });
  }
};

export const clearDiscordRpcActivity = async () => setDiscordRPC(null);
