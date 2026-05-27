import logger from '../../logger';
import { checkIfConnectedToInternet } from '../../main';

interface RecentTrack {
  name: string;
  artist: string;
  url: string;
  playedAt: number;
}

interface RecentTracksResponse {
  tracks: RecentTrack[];
}

const getUserRecentTracks = async (
  username: string,
  limit: number = 50
): Promise<RecentTracksResponse | undefined> => {
  try {
    const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;
    if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');

    const isOnline = checkIfConnectedToInternet();
    if (!isOnline) throw new Error('App not connected to internet.');

    const url = new URL('http://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'user.getRecentTracks');
    url.searchParams.set('api_key', LAST_FM_API_KEY);
    url.searchParams.set('user', username);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('format', 'json');

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.error) throw new Error(`${data.error} - ${data.message}`);

      const recentTracks = data.recenttracks?.track ?? [];
      return {
        tracks: recentTracks.map((track: { name: string; url: string; artist: { '#text': string }; date?: { uts: string } }) => ({
          name: track.name,
          artist: track.artist['#text'],
          url: track.url,
          playedAt: track.date ? Number(track.date.uts) : 0
        }))
      };
    }
    return undefined;
  } catch (error) {
    logger.error('Failed to get recent tracks from LastFM.', { error });
    return undefined;
  }
};

export default getUserRecentTracks;
