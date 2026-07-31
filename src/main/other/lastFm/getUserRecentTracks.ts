import logger from '../../logger';
import { checkIfConnectedToInternet } from '../../main';

interface RecentTrack {
  name: string;
  artist: string;
  url: string;
  playedAt: number | null;
  isNowPlaying?: boolean;
}

interface RecentTracksResponse {
  tracks: RecentTrack[];
}

const getUserRecentTracks = async (
  username: string,
  limit: number = 50
): Promise<RecentTracksResponse> => {
  try {
    const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;
    if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');

    const isOnline = checkIfConnectedToInternet();
    if (!isOnline) throw new Error('App not connected to internet.');

    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'user.getRecentTracks');
    url.searchParams.set('api_key', LAST_FM_API_KEY);
    url.searchParams.set('user', username);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('format', 'json');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      throw new Error(`LastFM user.getRecentTracks returned ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(`${data.error} - ${data.message}`);

    const recentTracks = data.recenttracks?.track ?? [];
    return {
      tracks: recentTracks.map(
        (track: {
          name: string;
          url: string;
          artist: { '#text': string };
          date?: { uts: string };
          '@attr'?: { nowplaying: string };
        }) => ({
          name: track.name,
          artist: track.artist['#text'],
          url: track.url,
          isNowPlaying: track['@attr']?.nowplaying === 'true',
          playedAt: track.date ? Number(track.date.uts) : null
        })
      )
    };
  } catch (error) {
    logger.error('Failed to get recent tracks from LastFM.', { error });
    throw error;
  }
};

export default getUserRecentTracks;
