import discordRPC from 'discord-rpc-revamp';
import { getUserData } from '../filesystem';
import log from '../log';

let client: discordRPC.Client;

type ArtAssetKeys =
  | 'nora_logo'
  | 'song_artwork'
  | 'album_artwork'
  | 'favorites_artwork'
  | 'genre_artwork'
  | 'playlist_artwork';

interface DiscordRpcActivityOptions extends discordRPC.Presence {
  largeImageKey?: ArtAssetKeys;
  smallImageKey?: ArtAssetKeys;
}

export const initializeDiscordRPC = async () => {
  try {
    if (client) return { initialized: true };

    // eslint-disable-next-line prefer-destructuring
    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    if (!DISCORD_CLIENT_ID) throw new Error('Discord Client ID not found.');

    client = new discordRPC.Client();
    await client.connect({ clientId: DISCORD_CLIENT_ID });
    return { initialized: true };
  } catch (error) {
    log(`Failed to initialize Discord Rich Presence.`, { error });
    return { initialized: false };
  }
};

export const setDiscordRpcActivity = async (
  options: DiscordRpcActivityOptions,
) => {
  try {
    const userData = getUserData();
    const { enableDiscordRPC } = userData.preferences;

    if (!enableDiscordRPC)
      return log('Discord Rich Presence skipped.', {
        reason: { enableDiscordRPC },
      });

    const { initialized } = await initializeDiscordRPC();

    if (initialized) {
      await client.setActivity({ ...options });
      return log('Discord rich presence activity accepted.');
    }
    throw new Error('Discord Rich Presence initialization failed');
  } catch (error) {
    return log('Failed to set discord rich presence activity.', { error });
  }
};

export const clearDiscordRpcActivity = async () => client?.clearActivity();
