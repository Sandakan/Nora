/* eslint-disable no-await-in-loop */
import stringSimilarity, { ReturnTypeEnums } from 'didyoumean2';

import { DeezerArtistInfo, DeezerArtistInfoApi } from '../../@types/deezer_api';
import { getArtistsData, setArtistsData } from '../filesystem';
import log from '../log';
import { LastFMArtistDataApi } from '../../@types/last_fm_api';
import generatePalette from '../other/generatePalette';
import { checkIfConnectedToInternet, dataUpdateEvent } from '../main';

const DEEZER_BASE_URL = 'https://api.deezer.com/';

const getArtistInfoFromDeezer = async (
  artistName: string
): Promise<DeezerArtistInfo[]> => {
  const isConnectedToInternet = checkIfConnectedToInternet();
  if (isConnectedToInternet) {
    try {
      const url = new URL('/search/artist', DEEZER_BASE_URL);
      url.searchParams.set('q', encodeURIComponent(artistName.trim()));

      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as DeezerArtistInfoApi;
        if (data.total > 0) return data.data;
        const errStr = `No artists results found on internet with the name '${artistName}'.`;
        log(errStr);
        throw new Error(errStr);
      }
      const errStr = `Request to fetch artist info from Deezer failed.\nERR_CODE : ${res.status}`;
      log(errStr);
      throw new Error(errStr);
    } catch (error) {
      log(
        `====== ERROR OCCURRED PARSING JSON DATA FETCHED FROM DEEZER API ABOUT ARTISTS ARTWORKS. ======\nERROR : ${error}`
      );
      throw new Error(error as string);
    }
  } else {
    log(
      `====== ERROR OCCURRED WHEN TRYING TO FETCH FROM DEEZER API ABOUT ARTISTS ARTWORKS. APP IS NOT CONNECTED TO THE INTERNET. ======\nERROR : ERR_CONNECTION_FAILED`
    );
    throw new Error('NO_NETWORK_CONNECTION' as MessageCodes);
  }
};

const LAST_FM_BASE_URL = 'http://ws.audioscrobbler.com/2.0/';

const getArtistInfoFromLastFM = async (
  artistName: string
): Promise<LastFMArtistDataApi> => {
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
      url.searchParams.set('artist', artistName.trim());
      url.searchParams.set('api_key', LAST_FM_API_KEY);

      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as LastFMArtistDataApi;
        if (data.error) {
          log(
            `Artist info of '${artistName}' not found in the internet.\nRESPONSE : ${data.error} => ${data.message}`
          );
          throw new Error(
            `Artist info of '${artistName}' not found in the internet.`
          );
        }
        return data;
      }
      const errStr = `Request to fetch artist data from LastFM failed.\nERR_CODE : ${res.status} - ${res.statusText}`;
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

const getArtistArtworksFromNet = async (artist: SavableArtist) => {
  if (artist.onlineArtworkPaths) return artist.onlineArtworkPaths;
  const isConnectedToInternet = checkIfConnectedToInternet();

  if (isConnectedToInternet) {
    const info = await getArtistInfoFromDeezer(artist.name);
    if (info.length > 0) {
      const closestResult = stringSimilarity(
        artist.name,
        info as unknown as Record<string, unknown>[],
        {
          caseSensitive: false,
          matchPath: ['name'],
          returnType: ReturnTypeEnums.FIRST_CLOSEST_MATCH,
        }
      ) as DeezerArtistInfo | null;

      if (closestResult) {
        return {
          picture_small:
            closestResult?.picture_small ||
            closestResult?.picture_medium ||
            closestResult.picture_big ||
            closestResult.picture_xl,
          picture_medium:
            closestResult?.picture_medium ||
            closestResult.picture_big ||
            closestResult.picture_xl ||
            closestResult?.picture_small,
        };
      }
    }
  }
  return undefined;
};

const getArtistInfoFromNet = async (
  artistId: string
): Promise<ArtistInfoFromNet> => {
  log(
    `Requested artist information related to an artist with id ${artistId} from the internet`
  );
  const artists = getArtistsData();
  if (Array.isArray(artists) && artists.length > 0) {
    for (let x = 0; x < artists.length; x += 1) {
      if (artists[x].artistId === artistId) {
        const artist = artists[x];
        const artistArtworks = await getArtistArtworksFromNet(artist);
        const artistInfo = await getArtistInfoFromLastFM(artist.name);
        if (artistArtworks && artistInfo) {
          const artistPalette = await generatePalette(
            artistArtworks.picture_medium
          );
          if (!artist.onlineArtworkPaths) {
            artists[x].onlineArtworkPaths = {
              picture_medium: artistArtworks.picture_medium,
              picture_small: artistArtworks.picture_small,
            };
            setArtistsData(artists);
            dataUpdateEvent('artists/artworks');
          }
          return {
            artistArtworks,
            artistBio: artistInfo.artist.bio.summary,
            artistPalette,
          } as ArtistInfoFromNet;
        }
        log(
          `====== ERROR OCCURRED WHEN FETCHING ARTIST ARTWORKS FORM DEEZER NETWORK OR FETCHING ARTIST INFO FROM LAST_FM NETWORK. ======`
        );
        throw new Error(
          'ERROR OCCURRED WHEN FETCHING ARTIST ARTWORKS FORM DEEZER NETWORK OR FETCHING ARTIST INFO FROM LAST_FM NETWORK.'
        );
      }
    }
    log(
      `No artists found with the given name ${artistId} when trying to fetch artist info from the internet.`
    );
    throw new Error(`no artists found with the given name ${artistId}`);
  }
  log(
    `ERROR OCCURRED WHEN SEARCHING FOR ARTISTS IN getArtistInfoFromNet FUNCTION. ARTISTS ARRAY IS EMPTY.`
  );
  throw new Error('NO_ARTISTS_FOUND' as MessageCodes);
};

export default getArtistInfoFromNet;
