import { LastFmArtistInfoAPI } from '../../../types/last_fm_artist_info_api';
import logger from '../../logger';
import { checkIfConnectedToInternet } from '../../main';

const LAST_FM_BASE_URL = 'http://ws.audioscrobbler.com/2.0/';

const getArtistInfoFromLastFM = async (artistName: string) => {
  const isConnectedToInternet = checkIfConnectedToInternet();
  if (isConnectedToInternet) {
    const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;

    try {
      if (typeof LAST_FM_API_KEY !== 'string') {
        logger.error('LAST_FM_API_KEY not found.', { LAST_FM_API_KEY });
        throw new Error('LAST_FM_API_KEY not found');
      }

      const url = new URL(LAST_FM_BASE_URL);
      url.searchParams.set('method', 'artist.getinfo');
      url.searchParams.set('format', 'json');
      url.searchParams.set('autocorrect', '1');
      url.searchParams.set('artist', artistName.trim());
      url.searchParams.set('api_key', LAST_FM_API_KEY);

      const res = await fetch(url);

      if (res.ok) {
        const data = (await res.json()) as LastFmArtistInfoAPI;

        if ('error' in data) {
          logger.error(`Artist info not found in the internet.`, {
            artistName,
            error: data.error,
            message: data.message
          });
          throw new Error(`Artist info not found in the internet.`);
        }
        return data;
      }

      const errStr = `Failed to fetch artist data from LastFM`;
      logger.warn(errStr, { artistName, status: res.status, statusText: res.statusText });
      throw new Error(errStr);
    } catch (error) {
      logger.error(`Failed to parse fetched artist data from LastFM.`, { error });
      throw new Error(`An error occurred when parsing fetched data. error : ${error}`);
    }
  } else {
    logger.info(
      `Failed to fetch from deezer api about artist information. App is not connected to the internet.`,
      { isConnectedToInternet }
    );
    throw new Error('NO_NETWORK_CONNECTION' as MessageCodes);
  }
};

export default getArtistInfoFromLastFM;
