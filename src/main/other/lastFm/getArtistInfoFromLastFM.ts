import { LastFmArtistInfoAPI } from '../../../@types/last_fm_artist_info_api';
import log from '../../log';
import { checkIfConnectedToInternet } from '../../main';

const LAST_FM_BASE_URL = 'http://ws.audioscrobbler.com/2.0/';

const getArtistInfoFromLastFM = async (artistName: string) => {
  const isConnectedToInternet = checkIfConnectedToInternet();
  if (isConnectedToInternet) {
    // eslint-disable-next-line prefer-destructuring
    const LAST_FM_API_KEY = process.env.LAST_FM_API_KEY;
    try {
      if (typeof LAST_FM_API_KEY !== 'string') {
        log('undefined LAST_FM_API_KEY.', { LAST_FM_API_KEY }, 'WARN');
        throw new Error('undefined LAST_FM_API_KEY');
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
          log(
            `Artist info of '${artistName}' not found in the internet.\nRESPONSE : ${data.error} => ${data.message}`,
          );
          throw new Error(
            `Artist info of '${artistName}' not found in the internet.`,
          );
        }
        return data;
      }
      const errStr = `Request to fetch artist data from LastFM failed.\nERR_CODE : ${res.status} - ${res.statusText}`;
      log(errStr);
      throw new Error(errStr);
    } catch (error) {
      log(
        `ERROR OCCURRED PARSING FETCHED DATA FROM LAST_FM API ABOUT ARTISTS INFORMATION.`,
        { error },
        'ERROR',
      );
      throw new Error(
        `An error occurred when parsing fetched data. error : ${error}`,
      );
    }
  } else {
    log(
      `ERROR OCCURRED WHEN TRYING TO FETCH FROM DEEZER API ABOUT ARTIST INFORMATION. APP IS NOT CONNECTED TO THE INTERNET.`,
      undefined,
      'ERROR',
    );
    throw new Error('NO_NETWORK_CONNECTION' as MessageCodes);
  }
};

export default getArtistInfoFromLastFM;
