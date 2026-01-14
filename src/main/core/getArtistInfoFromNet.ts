import { default as stringSimilarity, ReturnTypeEnums } from 'didyoumean2';

import logger from '../logger';
import generatePalette from '../other/generatePalette';
import { checkIfConnectedToInternet, dataUpdateEvent } from '../main';
import getArtistInfoFromLastFM from '../other/lastFm/getArtistInfoFromLastFM';

import type { DeezerArtistInfo, DeezerArtistInfoApi } from '../../types/deezer_api';
import type { SimilarArtist } from '../../types/last_fm_artist_info_api';
import { getArtistById, getArtistsByName } from '@main/db/queries/artists';
import { convertToArtist } from '../utils/convert';
import { linkArtworksToArtist, saveArtworks } from '@main/db/queries/artworks';
import { db } from '@main/db/db';

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

        logger.info('No matching artists results on Deezer', { artistName });
        return [];
      }
      logger.warn('Failed to fetch artist info from Deezer', {
        status: res.status,
        statusText: res.statusText
      });
      return [];
    } catch (error) {
      logger.error(`Failed to parse json data fetched from deezer api about artists artworks.`, {
        error
      });
      return [];
    }
  } else {
    logger.warn(
      `Failed to fetch from deezer api about artists artworks. App is not connected to the internet.`,
      { isConnectedToInternet }
    );
    return [];
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
        logger.debug(`Artist artwork for ${artist.artistId} from deezer is a placeholder image.`, {
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

type ArtistInfoPayload = Awaited<ReturnType<typeof getArtistInfoFromLastFM>>;

const getSimilarArtistsFromArtistInfo = async (data: ArtistInfoPayload) => {
  const unparsedSimilarArtistData = data.artist?.similar?.artist || [];

  const names = unparsedSimilarArtistData.map((a) => a.name);

  const similarArtists = await getArtistsByName(names);

  const groupedArtistsByAvailability = Object.groupBy(unparsedSimilarArtistData, (a) =>
    similarArtists?.some((b) => b.name === a.name) ? 'available' : 'unavailable'
  );

  const { available = [], unavailable = [] } = groupedArtistsByAvailability;

  const availableArtists: SimilarArtist[] = available.map((a) => {
    const data = similarArtists.find((similarArtist) => similarArtist.name === a.name)!;

    return {
      name: a.name,
      url: a.url,
      artistData: convertToArtist(data)
    };
  });
  const unAvailableArtists: SimilarArtist[] = unavailable.map((a) => ({
    name: a.name,
    url: a.url
  }));

  return { availableArtists, unAvailableArtists };
};

const saveArtistOnlineArtworks = async (artistId: number, artistArtworks: OnlineArtistArtworks) => {
  const artworks: { path: string; width: number; height: number }[] = [];

  if (artistArtworks.picture_small) {
    artworks.push({
      path: artistArtworks.picture_small,
      width: 56,
      height: 56
    });
  }

  if (artistArtworks.picture_medium) {
    artworks.push({
      path: artistArtworks.picture_medium,
      width: 250,
      height: 250
    });
  }

  if (artistArtworks.picture_xl) {
    artworks.push({
      path: artistArtworks.picture_xl,
      width: 1000,
      height: 1000
    });
  }

  await db.transaction(async (trx) => {
    const savedArtworks = await saveArtworks(
      artworks.map((artwork) => ({ ...artwork, source: 'REMOTE' })),
      trx
    );

    await linkArtworksToArtist(
      savedArtworks.map((artwork) => ({
        artistId: Number(artistId),
        artworkId: artwork.id
      })),
      trx
    );
  });
};

const getArtistInfoFromNet = async (artistId: number): Promise<ArtistInfoFromNet> => {
  logger.debug(
    `Requested artist information related to an artist with id ${artistId} from the internet`
  );
  const artistData = await getArtistById(artistId);

  if (!artistData) {
    logger.error(`Artist with id of ${artistId} not found in the database.`);
    throw new Error('ARTIST_NOT_FOUND' as MessageCodes);
  }

  const artist = convertToArtist(artistData);

  const [artistArtworks, artistInfo] = await Promise.all([
    getArtistArtworksFromNet(artist),
    getArtistInfoFromLastFM(artist.name)
  ]);

  if (artistArtworks && artistInfo) {
    const artistPalette = await generatePalette(artistArtworks.picture_medium);
    const similarArtists = await getSimilarArtistsFromArtistInfo(artistInfo);

    if (!artist.onlineArtworkPaths) {
      await saveArtistOnlineArtworks(artistId, artistArtworks);
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

  const errMessage = `Failed to fetch artist info or artworks from deezer network from last-fm network.`;
  logger.error(errMessage, { artistId, artistInfo, artistArtworks });
  throw new Error(errMessage);
};

export default getArtistInfoFromNet;
