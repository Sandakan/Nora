import log from '../log';
import { checkIfConnectedToInternet } from '../main';
import { LastFMTrackInfoApi } from '../../@types/last_fm_api';

const LAST_FM_BASE_URL = 'http://ws.audioscrobbler.com/2.0/';

const fetchSongInfoFromLastFM = async (
  songTitle: string,
  artistNames: string[]
): Promise<LastFMTrackInfoApi> => {
  if (checkIfConnectedToInternet()) {
    try {
      // eslint-disable-next-line prefer-destructuring
      const LAST_FM_API_KEY = import.meta.env.MAIN_VITE_LAST_FM_API_KEY;
      if (!LAST_FM_API_KEY) throw new Error('LastFM api key not found.');

      const url = new URL(LAST_FM_BASE_URL);
      url.searchParams.set('method', 'track.getInfo');
      url.searchParams.set('format', 'json');
      url.searchParams.set('autocorrect', '1');
      url.searchParams.set('api_key', LAST_FM_API_KEY);
      url.searchParams.set('track', songTitle.trim());
      url.searchParams.set('artist', artistNames[0].trim());

      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as LastFMTrackInfoApi;
        if ('error' in data) {
          log(
            `====== ERROR OCCURRED FETCHING DATA FROM LAST_FM API ABOUT SONG INFORMATION. ======\nERROR : ${data.error} => ${data.message}`
          );
          throw new Error(
            `An error occurred when fetching data. Error code : ${
              data.error
            }; Reason: ${data.message || 'Unknown reason'}`
          );
        }
        return data;
      }
      const errStr = `Request to fetch song info from LastFM failed.\nERR_CODE : ${res.status} - ${res.statusText}`;
      log(errStr);
      throw new Error(errStr);
    } catch (error) {
      log(
        `====== ERROR OCCURRED PARSING FETCHED DATA FROM LAST_FM API ABOUT ARTISTS INFORMATION. ======\nERROR : ${error}`
      );
      throw new Error(`An error occurred when parsing fetched data. error : ${error}`);
    }
  } else {
    log(
      `====== ERROR OCCURRED WHEN TRYING TO FETCH FROM DEEZER API ABOUT ARTIST INFORMATION. APP IS NOT CONNECTED TO THE INTERNET. ======\nERROR : ERR_CONNECTION_FAILED`
    );
    throw new Error('NO_NETWORK_CONNECTION' as MessageCodes);
  }
};

export default fetchSongInfoFromLastFM;
