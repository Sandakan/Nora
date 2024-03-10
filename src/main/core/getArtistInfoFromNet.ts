/* eslint-disable no-labels */
/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
import stringSimilarity, { ReturnTypeEnums } from 'didyoumean2';

import { getArtistsData, setArtistsData } from '../filesystem';
import log from '../log';
import generatePalette from '../other/generatePalette';
import { checkIfConnectedToInternet, dataUpdateEvent } from '../main';
import { getArtistArtworkPath } from '../fs/resolveFilePaths';
import getArtistInfoFromLastFM from '../other/lastFm/getArtistInfoFromLastFM';

import { DeezerArtistInfo, DeezerArtistInfoApi } from '../../@types/deezer_api';
import { SimilarArtist } from '../../@types/last_fm_artist_info_api';

const DEEZER_BASE_URL = 'https://api.deezer.com/';

const getArtistInfoFromDeezer = async (artistName: string): Promise<DeezerArtistInfo[]> => {
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
        `ERROR OCCURRED PARSING JSON DATA FETCHED FROM DEEZER API ABOUT ARTISTS ARTWORKS.`,
        { error },
        'ERROR'
      );
      throw new Error(error as string);
    }
  } else {
    log(
      `ERROR OCCURRED WHEN TRYING TO FETCH FROM DEEZER API ABOUT ARTISTS ARTWORKS. APP IS NOT CONNECTED TO THE INTERNET.`,
      undefined,
      'ERROR'
    );
    throw new Error('NO_NETWORK_CONNECTION' as MessageCodes);
  }
};

const validDeezerArtistImageUrlRegex = /\/artist\/\w+\//;

const getAValidDeezerArtistImage = (imageUrl: string) => {
  const isValid = validDeezerArtistImageUrlRegex.test(imageUrl);
  validDeezerArtistImageUrlRegex.lastIndex = 0;

  if (isValid) return imageUrl;
  return undefined;
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
          returnType: ReturnTypeEnums.FIRST_CLOSEST_MATCH
        }
      ) as unknown as DeezerArtistInfo | null;

      if (closestResult) {
        const picture_xl = getAValidDeezerArtistImage(closestResult?.picture_xl);
        const picture_small = getAValidDeezerArtistImage(
          closestResult?.picture_small ||
            closestResult?.picture_medium ||
            closestResult?.picture_big ||
            closestResult?.picture_xl
        );
        const picture_medium = getAValidDeezerArtistImage(
          closestResult?.picture_medium ||
            closestResult?.picture_big ||
            closestResult?.picture_xl ||
            closestResult?.picture_small
        );

        if (picture_small && picture_medium)
          return {
            picture_small,
            picture_medium,
            picture_xl
          };
        log(`Artist artwork for ${artist.artistId} from deezer is a placeholder image.`, {
          images: [
            closestResult?.picture_small,
            closestResult?.picture_medium,
            closestResult?.picture_big,
            closestResult?.picture_xl
          ]
        });
      }
    }
  }
  return undefined;
};

const getArtistDataFromSavableArtistData = (artist: SavableArtist): Artist => {
  const artworkPaths = getArtistArtworkPath(artist.artworkName);
  return { ...artist, artworkPaths };
};

type ArtistInfoPayload = Awaited<ReturnType<typeof getArtistInfoFromLastFM>>;

const getSimilarArtistsFromArtistInfo = (data: ArtistInfoPayload, artists: SavableArtist[]) => {
  const unparsedsimilarArtistData = data.artist?.similar?.artist;
  const availableArtists: SimilarArtist[] = [];
  const unAvailableArtists: SimilarArtist[] = [];

  if (Array.isArray(unparsedsimilarArtistData)) {
    similarArtistLoop: for (const unparsedSimilarArtist of unparsedsimilarArtistData) {
      for (const artist of artists) {
        if (artist.name === unparsedSimilarArtist.name) {
          availableArtists.push({
            name: artist.name,
            url: unparsedSimilarArtist.url,
            artistData: getArtistDataFromSavableArtistData(artist)
          });
          // eslint-disable-next-line no-continue
          continue similarArtistLoop;
        }
      }
      unAvailableArtists.push({
        name: unparsedSimilarArtist.name,
        url: unparsedSimilarArtist.url
      });
    }
  }

  return { availableArtists, unAvailableArtists };
};

const getArtistInfoFromNet = async (artistId: string): Promise<ArtistInfoFromNet> => {
  log(`Requested artist information related to an artist with id ${artistId} from the internet`);
  const artists = getArtistsData();
  if (Array.isArray(artists) && artists.length > 0) {
    for (let x = 0; x < artists.length; x += 1) {
      if (artists[x].artistId === artistId) {
        const artist = artists[x];
        const artistArtworks = await getArtistArtworksFromNet(artist);
        const artistInfo = await getArtistInfoFromLastFM(artist.name);
        if (artistArtworks && artistInfo) {
          const artistPalette = await generatePalette(artistArtworks.picture_medium);
          const similarArtists = getSimilarArtistsFromArtistInfo(artistInfo, artists);

          if (!artist.onlineArtworkPaths) {
            artists[x].onlineArtworkPaths = artistArtworks;
            setArtistsData(artists);
            dataUpdateEvent('artists/artworks');
          }
          return {
            artistArtworks,
            artistBio: artistInfo.artist.bio.summary,
            artistPalette,
            similarArtists,
            tags: artistInfo.artist?.tags?.tag || []
          };
        }
        log(
          `ERROR OCCURRED WHEN FETCHING ARTIST ARTWORKS FROM DEEZER NETWORK OR FETCHING ARTIST INFO FROM LAST_FM NETWORK.`
        );
        throw new Error(
          'ERROR OCCURRED WHEN FETCHING ARTIST ARTWORKS FROM DEEZER NETWORK OR FETCHING ARTIST INFO FROM LAST_FM NETWORK.'
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
