import logger from '../../logger';
import { checkIfConnectedToInternet } from '../../main';

interface TopTrack {
  name: string;
  artist: string;
  url: string;
  playCount: number;
}

interface TopTracksResponse {
  tracks: TopTrack[];
}

const getUserTopTracks = async (
  username: string,
  period: 'overall' | '7day' | '1month' | '3month' | '6month' | '12month' = 'overall',
  limit: number = 50
): Promise<TopTracksResponse | undefined> => {
  try {
    const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;
    if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');

    const isOnline = checkIfConnectedToInternet();
    if (!isOnline) throw new Error('App not connected to internet.');

    const url = new URL('http://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'user.getTopTracks');
    url.searchParams.set('api_key', LAST_FM_API_KEY);
    url.searchParams.set('user', username);
    url.searchParams.set('period', period);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('format', 'json');

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.error) throw new Error(`${data.error} - ${data.message}`);

      const topTracks = data.toptracks?.track ?? [];
      return {
        tracks: topTracks.map((track: { name: string; url: string; artist: { name: string }; playcount: string }) => ({
          name: track.name,
          artist: track.artist.name,
          url: track.url,
          playCount: Number(track.playcount)
        }))
      };
    }
    return undefined;
  } catch (error) {
    logger.error('Failed to get top tracks from LastFM.', { error });
    return undefined;
  }
};

export default getUserTopTracks;
