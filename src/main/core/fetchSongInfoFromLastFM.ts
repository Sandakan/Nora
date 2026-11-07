import type { LastFMTrackInfoApi } from '../../types/last_fm_api';
import logger from '../logger';
import { checkIfConnectedToInternet } from '../main';

const LAST_FM_BASE_URL = 'http://ws.audioscrobbler.com/2.0/';

const fetchSongInfoFromLastFM = async (
  songTitle: string,
  artistNames: string[],
  mbid?: string
): Promise<LastFMTrackInfoApi> => {
  if (checkIfConnectedToInternet()) {
    try {
      const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;
      if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');

      const makeUrl = (useMbid: boolean) => {
        const url = new URL(LAST_FM_BASE_URL);
        url.searchParams.set('method', 'track.getInfo');
        url.searchParams.set('format', 'json');
        url.searchParams.set('autocorrect', '1');
        url.searchParams.set('api_key', LAST_FM_API_KEY);
        if (useMbid && mbid) {
          url.searchParams.set('mbid', mbid.trim());
        } else {
          url.searchParams.set('track', songTitle.trim());
          if (artistNames[0]) {
            url.searchParams.set('artist', artistNames[0].trim());
          }
        }
        return url;
      };

      let res = mbid ? await fetch(makeUrl(true)) : null;
      let data = res && res.ok ? ((await res.json()) as LastFMTrackInfoApi) : null;

      if (!data || ('error' in data && data.error === 6)) {
        // Fallback to track + artist name
        res = await fetch(makeUrl(false));
        if (res.ok) {
          data = (await res.json()) as LastFMTrackInfoApi;
        }
      }

      if (data) {
        if ('error' in data) {
          logger.error(`Failed to fetch data from LastFM API about song information.`, { data });
          throw new Error(
            `An error occurred when fetching data. Error code : ${
              data.error
            }; Reason: ${data.message || 'Unknown reason'}`
          );
        }
        return data;
      }
      const errStr = `Failed to fetch song info from LastFM`;
      logger.error(errStr, { status: res?.status, statusText: res?.statusText });
      throw new Error(errStr);
    } catch (error) {
      logger.error(`Failed to parse fetched data from last-fm api about artists information`, {
        error
      });
      throw new Error(`An error occurred when parsing fetched data. error : ${error}`);
    }
  } else {
    logger.warn(
      `Failed to fetch from deezer api about artist information. App is not connected to the internet.`
    );
    throw new Error('NO_NETWORK_CONNECTION' as MessageCodes);
  }
};

export default fetchSongInfoFromLastFM;
