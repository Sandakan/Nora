/* eslint-disable camelcase */
// ? SPOTIFY ARTWORKS URL BREAKDOWN
// ? /// COMMON URL /// | /// UNKNOWN VARIABLE ID /// | /// QUALITY /// | //// IMG ID /////
// https://i.scdn.co/image/ | ab67616d0000 | 1e02 | 3bd8eaea54f3e7f41d6a4990
// https://i.scdn.co/image/ | ab67616d0000 | b273 | 3bd8eaea54f3e7f41d6a4990

// ? ARTIST IMAGES
// https://i.scdn.co/image/ ab6761610000 f17800fd80d5a04958c6164785bf

// https://i.scdn.co/image/ ab6761670000 ecd483b611804e9de647b18110be

import log from '../log';
import { SpotifyEmbedApi } from '../../@types/spotify_embed_api';

const SPOTIFY_EMBED_BASE_URL =
  'https://open.spotify.com/oembed?url=https://open.spotify.com/track/';
const SPOTIFY_IMAGE_BASE_URL = 'https://i.scdn.co/image/';
const HIGH_RES = 'b273';
// const LOW_RES = '1e02';

const spotifyImageIdRegex = /(?<=1e02|b273)(\w{24})/gm;
const spotifyReqVarIdRegex = /(?<=\/image\/)(\w{12})(?=1e02|b273)/gm;

const fetchSongArtworksFromSpotify = async (spotifySongId: string) => {
  try {
    const res = await fetch(SPOTIFY_EMBED_BASE_URL + spotifySongId);
    if (res.ok) {
      const { thumbnail_url } = (await res.json()) as SpotifyEmbedApi;

      const spotifyImgIds = thumbnail_url.match(spotifyImageIdRegex);
      const spotifyReqIds = thumbnail_url.match(spotifyReqVarIdRegex);

      if (
        spotifyImgIds &&
        spotifyReqIds &&
        spotifyImgIds[0] &&
        spotifyReqIds[0]
      ) {
        const [spotifyImgId] = spotifyImgIds;
        const [spotifyReqId] = spotifyReqIds;

        const lowResArtworkUrl = thumbnail_url;
        const highResArtworkUrl =
          SPOTIFY_IMAGE_BASE_URL + spotifyReqId + HIGH_RES + spotifyImgId;

        console.log(highResArtworkUrl, lowResArtworkUrl);
        return { highResArtworkUrl, lowResArtworkUrl };
      }
    }
    throw new Error(
      `Error occurred when fetching artwork from url.\nHTTP Error code ${res.status} - ${res.statusText}`
    );
  } catch (error) {
    log(`Error occurred when fetching artwork from url.`, { error }, 'ERROR');
    throw error;
  }
};

export default fetchSongArtworksFromSpotify;
