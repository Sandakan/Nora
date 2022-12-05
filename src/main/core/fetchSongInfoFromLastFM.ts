import fetch from 'node-fetch';

import log from '../log';
import { checkIfConnectedToInternet } from '../main';
import { LastFMTrackInfoApi } from '../../@types/last_fm_api';

const fetchSongInfoFromLastFM = async (
  songTitle: string,
  artistNames: string[]
): Promise<LastFMTrackInfoApi> => {
  if (checkIfConnectedToInternet()) {
    try {
      const res = await fetch(
        `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=0aac0c7edaf4797bcc63bd8688b43b30&&artist=${encodeURIComponent(
          artistNames[0].trim()
        )}&track=${encodeURIComponent(
          songTitle.trim()
        )}&format=json&autocorrect=1`
      );
      if (res.ok) {
        const data = (await res.json()) as LastFMTrackInfoApi;
        if (data.error) {
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
      const errStr = `Request to fetch song info from LastFM failed.\nERR_CODE : ${res.status}`;
      log(errStr);
      throw new Error(errStr);
    } catch (error) {
      log(
        `====== ERROR OCCURRED PARSING FETCHED DATA FROM LAST_FM API ABOUT ARTISTS INFORMATION. ======\nERROR : ${error}`
      );
      throw new Error(
        `An error occurred when parsing fetched data. error : ${error}`
      );
    }
  } else {
    log(
      `====== ERROR OCCURRED WHEN TRYING TO FETCH FROM DEEZER API ABOUT ARTIST INFORMATION. APP IS NOT CONNECTED TO THE INTERNET. ======\nERROR : ERR_CONNECTION_FAILED`
    );
    throw new Error('NO_NETWORK_CONNECTION' as MessageCodes);
  }
};

export default fetchSongInfoFromLastFM;
