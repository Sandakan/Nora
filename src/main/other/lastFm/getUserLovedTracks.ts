import logger from '../../logger';
import { checkIfConnectedToInternet } from '../../main';

interface LovedTrack {
  name: string;
  artist: string;
  url: string;
}

interface LovedTracksResponse {
  tracks: LovedTrack[];
}

const getUserLovedTracks = async (
  username: string,
  limit: number = 50
): Promise<LovedTracksResponse | undefined> => {
  try {
    const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;
    if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');

    const isOnline = checkIfConnectedToInternet();
    if (!isOnline) throw new Error('App not connected to internet.');

    const url = new URL('http://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'user.getLovedTracks');
    url.searchParams.set('api_key', LAST_FM_API_KEY);
    url.searchParams.set('user', username);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('format', 'json');

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.error) throw new Error(`${data.error} - ${data.message}`);

      const lovedTracks = data.lovedtracks?.track ?? [];
      return {
        tracks: lovedTracks.map((track: { name: string; url: string; artist: { name: string } }) => ({
          name: track.name,
          artist: track.artist.name,
          url: track.url
        }))
      };
    }
    return undefined;
  } catch (error) {
    logger.error('Failed to get loved tracks from LastFM.', { error });
    return undefined;
  }
};

export default getUserLovedTracks;
