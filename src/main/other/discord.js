import { Client } from 'discord-rpc';
import logger from '../logger';

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
    timestamps: {
      start: Date.now()
      //end: Date.now() + 100000
    },
    details: 'Nora',
    //state: '',
    assets: {
      large_image: 'nora_logo',
      //large_text: 'Nora',
      small_image: 'song_artwork'
      //small_text: ''
    },
    // buttons: [
    //   {
    //     label: '',
    //     url: ''
    //   }
    // ],
    instance: true,
    type: ActivityType.Listening
  }
};

let discord;

let lastPayload;

function Initialize() {
  if (discord) return;
  discord = new Client({ transport: 'ipc' });
  discord.on('ready', async () => {
    discord.request('SET_ACTIVITY', lastPayload ?? defaultPayload);
  });
  discord.on('disconnected', () => {
    setTimeout(() => loginRPC(), 1000).unref();
  });
  loginRPC();
}

function loginRPC() {
  const DISCORD_CLIENT_ID = import.meta.env.MAIN_VITE_DISCORD_CLIENT_ID;
  if (!DISCORD_CLIENT_ID) throw new Error('Discord Client ID not found.');
  discord.login({ clientId: DISCORD_CLIENT_ID }).catch(() => {
    setTimeout(() => loginRPC(), 5000).unref();
  });
}

function setDiscordRPC(data) {
  if (discord.user) {
    var payload = {
      pid: process.pid,
      activity: data
    };
    if (data) {
      data.instance = true;
      data.type = ActivityType.Listening;
    }
    lastPayload = payload;
    logger.trace(JSON.stringify(payload, null, 2));
    discord.request('SET_ACTIVITY', payload); //send raw payload to discord RPC server
  }
}

export { Initialize, setDiscordRPC };
