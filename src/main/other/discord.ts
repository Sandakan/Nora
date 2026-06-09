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
  }
};

let discord: DiscordRPCClient | null = null;

let lastPayload: { pid: number; activity: Record<string, unknown> };

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

function loginRPC() {
  const DISCORD_CLIENT_ID = import.meta.env.MAIN_VITE_DISCORD_CLIENT_ID;
  if (!DISCORD_CLIENT_ID) throw new Error('Discord Client ID not found.');
  discord?.login({ clientId: DISCORD_CLIENT_ID }).catch(() => {
    setTimeout(() => loginRPC(), 5000).unref();
  });
}

function setDiscordRPC(data: Record<string, unknown> | null) {
  if (!discord?.user) return;

  const payload = data
    ? {
        pid: process.pid,
        activity: { ...data, instance: true, type: ActivityType.Listening }
      }
    : { pid: process.pid, activity: { ...defaultPayload.activity } };

  lastPayload = payload;

  logger.debug(JSON.stringify(payload));
  discord.request('SET_ACTIVITY', payload).catch((error: unknown) => {
    logger.error('Failed to set Discord activity', { error });
  });
}

export { Initialize, setDiscordRPC };
