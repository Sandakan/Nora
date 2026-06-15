import { Client } from 'discord-rpc';

import logger from '../logger';

interface DiscordRPCClient {
  user?: { id: string };
  on(event: string, handler: (...args: unknown[]) => void): void;
  login(options: { clientId: string }): Promise<void>;
  request(cmd: string, args: Record<string, unknown>): Promise<unknown>;
}

const ActivityType = {
  Game: 0,
  Streaming: 1,
  Listening: 2,
  Watching: 3,
  Custom: 4,
  Competing: 5
};

const defaultPayload = {
  pid: process.pid,
  activity: {
    details: 'Nora',
    assets: {
      large_image: 'nora_logo',
      small_image: 'song_artwork'
    },
    instance: true,
    type: ActivityType.Listening
  } as DiscordActivity
};

let discord: DiscordRPCClient | null = null;

let lastPayload: { pid: number; activity: DiscordActivity };

/**
 * Initializes the Discord RPC client and begins the login/reconnect lifecycle.
 *
 * Creates an IPC Discord RPC client (if one does not already exist), registers handlers to set the last-known activity when the client becomes ready and to retry login on disconnection, and then starts the initial login attempt.
 */
function Initialize() {
  if (discord) return;
  discord = new Client({ transport: 'ipc' }) as unknown as DiscordRPCClient;
  discord.on('ready', () => {
    discord?.request('SET_ACTIVITY', lastPayload ?? defaultPayload).catch((error: unknown) => {
      logger.error('Failed to set initial activity on ready', { error });
    });
  });
  discord.on('disconnected', () => {
    setTimeout(() => loginRPC(), 1000).unref();
  });
  loginRPC();
}

/**
 * Attempts to log the IPC Discord RPC client using MAIN_VITE_DISCORD_CLIENT_ID and schedules a retry if login fails.
 *
 * @throws Error - If `MAIN_VITE_DISCORD_CLIENT_ID` is not defined in `import.meta.env`.
 */
function loginRPC() {
  const DISCORD_CLIENT_ID = import.meta.env.MAIN_VITE_DISCORD_CLIENT_ID;
  if (!DISCORD_CLIENT_ID) throw new Error('Discord Client ID not found.');
  discord?.login({ clientId: DISCORD_CLIENT_ID }).catch(() => {
    setTimeout(() => loginRPC(), 5000).unref();
  });
}

/**
 * Updates the cached Discord activity payload and sends it to the connected RPC client.
 *
 * If `data` is an object, its properties are merged into the activity payload; `instance` is set to `true` and `type` is set to `ActivityType.Listening`. If `data` is `null`, the activity is reset to the module's default activity. The constructed payload is stored as `lastPayload` and dispatched via the Discord RPC `SET_ACTIVITY` request; failures are logged.
 *
 * @param data - Activity fields to apply to the current presence, or `null` to restore the default activity
 */
function setDiscordRPC(data: DiscordActivity | null) {
  if (!discord?.user) return;

  const payload = data
    ? {
        pid: process.pid,
        activity: { ...data, instance: true, type: ActivityType.Listening } as DiscordActivity
      }
    : { pid: process.pid, activity: { ...defaultPayload.activity } };

  lastPayload = payload;

  logger.debug(JSON.stringify(payload));
  discord.request('SET_ACTIVITY', payload).catch((error: unknown) => {
    logger.error('Failed to set Discord activity', { error });
  });
}

export { Initialize, setDiscordRPC };
