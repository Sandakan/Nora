/* eslint-disable camelcase */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-async-promise-executor */

import { AppleITunesMusicAPI } from '../../@types/apple_itunes_music_api.d';
import log from '../log';
import { LastFMHitCache, LastFMTrackInfoApi } from '../../@types/last_fm_api';

import {
  GeniusLyricsAPI,
  GeniusSongMetadataResponse,
} from '../../@types/genius_lyrics_api';
import {
  DeezerTrackDataAPI,
  DeezerTrackResultsAPI,
} from '../../@types/deezer_api';
import {
  MusixmatchHitCache,
  MusixmatchLyricsAPI,
} from '../../@types/musixmatch_lyrics_api';
import parseSongMetadataFromMusixmatchApiData from './parseSongMetadataFromMusixmatchApiData';
import { parseMusicmatchDataFromLyrics } from './fetchLyricsFromMusixmatch';

const resultsController = new AbortController();
const metadataController = new AbortController();

const musixmatchHitCache = { id: '' } as MusixmatchHitCache;

const MUSIXMATCH_BASE_URL = 'https://apic-desktop.musixmatch.com/';

async function fetchSongMetadataFromMusixmatch(
  songTitle: string,
  songArtist?: string
) {
  const MUSIXMATCH_USER_TOKEN = process.env.MUSIXMATCH_DEFAULT_USER_TOKEN;
  if (typeof MUSIXMATCH_USER_TOKEN !== 'string') {
    log('undefined MUSIXMATCH_USER_TOKEN.', { MUSIXMATCH_USER_TOKEN }, 'WARN');
    throw new Error('undefined MUSIXMATCH_USER_TOKEN');
  }

  const headers = {
    authority: 'apic-desktop.musixmatch.com',
    cookie: 'x-mxm-token-guid=',
  };

  const url = new URL('/ws/1.1/macro.subtitles.get', MUSIXMATCH_BASE_URL);
  url.searchParams.set('namespace', 'lyrics_richsynched');
  url.searchParams.set('app_id', 'web-desktop-app-v1.0');
  url.searchParams.set('subtitle_format', 'mxm');
  url.searchParams.set('format', 'json');
  url.searchParams.set('usertoken', MUSIXMATCH_USER_TOKEN);
  url.searchParams.set('q_track', songTitle);
  if (songArtist) url.searchParams.set('q_artist', songArtist);

  try {
    const res = await fetch(url, { headers, signal: resultsController.signal });
    if (res.ok) {
      const data = (await res.json()) as MusixmatchLyricsAPI;
      const metadata = await parseSongMetadataFromMusixmatchApiData(data, true);
      const lyrics = await parseMusicmatchDataFromLyrics(data, 'ANY');

      if (metadata) {
        const { title, artist, duration, lang, album, album_artwork_urls } =
          metadata;
        const result: SongMetadataResultFromInternet = {
          title,
          album,
          artworkPaths: album_artwork_urls,
          duration,
          artists: [artist],
          language: lang,
          lyrics: lyrics ? lyrics.lyrics : undefined,
          source: 'MUSIXMATCH',
          // Musixmatch api isn't working as expected to provide searching for multiple hits.
          sourceId: title,
        };

        musixmatchHitCache.id = metadata.title;
        musixmatchHitCache.data = result;

        return [result];
      }
    }
    return [];
  } catch (error) {
    log(
      `Error occurred when fetching song metadata from Musixmatch`,
      { error },
      'ERROR'
    );
    return [];
  }
}

const ITUNES_API_URL = 'https://itunes.apple.com/';
let itunesHitsCache: SongMetadataResultFromInternet[] = [];

async function fetchSongMetadataResultsFromITunes(
  songTitle: string,
  songArtist?: string
): Promise<SongMetadataResultFromInternet[]> {
  const url = new URL('/search', ITUNES_API_URL);
  url.searchParams.set('media', 'music');
  url.searchParams.set('term', `${songTitle} ${songArtist}`);

  const res = await fetch(url, { signal: resultsController.signal });

  if (res.ok) {
    itunesHitsCache = [];
    const data = (await res.json()) as AppleITunesMusicAPI;
    if (
      !data?.errorMessage &&
      data?.resultCount &&
      data?.resultCount > 0 &&
      data?.results
    ) {
      const { results } = data;
      const outputResults: SongMetadataResultFromInternet[] = [];

      for (let i = 0; i < results.length; i += 1) {
        const result = results[i];

        const metadata: SongMetadataResultFromInternet = {
          title: result.trackName,
          artists: [result.artistName],
          artworkPaths: [result.artworkUrl100],
          genres: [result.primaryGenreName],
          duration: result.trackTimeMillis / 1000,
          releasedYear: new Date(result.releaseDate).getFullYear(),
          source: 'ITUNES',
          sourceId: result.trackId.toString(),
        };
        const highResArtwork = result?.artworkUrl100?.replace(
          /\d+x\d+\w*/,
          '1000x1000bb'
        );
        if (highResArtwork) metadata.artworkPaths.push(highResArtwork);

        outputResults.push(metadata);
      }

      itunesHitsCache = outputResults;
      return outputResults;
    }
    log(`ERROR : ${data?.errorMessage}`, undefined, 'WARN');
  }
  const errStr = `Request to fetch song metadata results from LastFM failed.\nERR_CODE : ${res.status}`;
  log(errStr, undefined, 'WARN');
  return [];
}

const fetchSongMetadataFromItunes = (sourceId: string) => {
  for (let i = 0; i < itunesHitsCache.length; i += 1) {
    const hit = itunesHitsCache[i];
    if (hit.sourceId === sourceId) return hit;
  }
  log(
    `No hit found for the given sourceId '${sourceId}'.`,
    { sourceId },
    'WARN'
  );
  return undefined;
};

const LAST_FM_API_URL = 'http://ws.audioscrobbler.com/2.0/';
const lastFMHitCache = { id: '' } as LastFMHitCache;

async function fetchSongMetadataResultsFromLastFM(
  songTitle: string,
  songArtist?: string
): Promise<SongMetadataResultFromInternet[]> {
  const LAST_FM_API_KEY = process.env.LAST_FM_API_KEY;

  if (typeof LAST_FM_API_KEY !== 'string') {
    log('undefined LAST_FM_API_KEY.', { LAST_FM_API_KEY }, 'WARN');
    throw new Error('undefined LAST_FM_API_KEY');
  }

  const url = new URL(LAST_FM_API_URL);
  url.searchParams.set('method', 'track.getInfo');
  url.searchParams.set('format', 'json');
  url.searchParams.set('api_key', LAST_FM_API_KEY);
  url.searchParams.set('track', songTitle);
  if (songArtist) url.searchParams.set('artist', songArtist);

  const res = await fetch(url, { signal: resultsController.signal });

  if (res.ok) {
    const data = (await res.json()) as LastFMTrackInfoApi;
    if (!data?.error && data?.track) {
      const { track } = data;
      const result: SongMetadataResultFromInternet = {
        title: track.name,
        artists: [track.artist.name],
        artworkPaths: track?.album?.image.map((x) => x['#text']) ?? [],
        album: track?.album?.title || 'Unknown Album Title',
        genres: track?.toptags?.tag
          ? track?.toptags?.tag.map((x) => x.name)
          : [],
        source: 'LAST_FM',
        // LastFM api isn't working as expected to provide searching for multiple hits.
        sourceId: track.name,
      };

      lastFMHitCache.id = track.name;
      lastFMHitCache.data = result;

      return [result];
    }
    log(`ERROR : ${data?.error} : ${data?.message}`, undefined, 'WARN');
  }
  const errStr = `Request to fetch song metadata results from LastFM failed.\nERR_CODE : ${res.status}`;
  log(errStr, undefined, 'WARN');
  return [];
}

const GENIUS_API_BASE_URL = 'https://api.genius.com/';

async function searchSongMetadataResultsInGenius(
  songTitle: string,
  songArtists?: string
): Promise<SongMetadataResultFromInternet[]> {
  const GENIUS_API_KEY = process.env.GENIUS_API_KEY;
  if (typeof GENIUS_API_KEY !== 'string') {
    log('unknown GENIUS_API_KEY.', { GENIUS_API_KEY }, 'WARN');
    throw new Error('unknown GENIUS_API_KEY.');
  }

  const query = `${songTitle}${songArtists ? ` ${songArtists}` : ''}`;

  const url = new URL('/search', GENIUS_API_BASE_URL);
  url.searchParams.set('q', query);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GENIUS_API_KEY}`,
    },
    signal: resultsController.signal,
  });

  if (res.ok) {
    const data = (await res.json()) as GeniusLyricsAPI;
    if (data?.meta?.status === 200) {
      const { hits } = data.response;
      const results = [] as SongMetadataResultFromInternet[];
      if (Array.isArray(hits) && hits.length > 0) {
        for (let i = 0; i < hits.length; i += 1) {
          if (hits[i].type === 'song') {
            const {
              id,
              title,
              primary_artist,
              featured_artists,
              header_image_url,
              release_date_components,
              song_art_image_url,
              language,
            } = hits[i].result;
            results.push({
              title: title || 'Unknown Title',
              artists: [
                primary_artist.name,
                ...featured_artists.map((x) => x.name),
              ],
              artworkPaths: [
                header_image_url,
                song_art_image_url,
                primary_artist.image_url,
                ...featured_artists.map((x) => x.image_url),
              ],
              releasedYear: release_date_components?.year,
              language: language || undefined,
              source: 'GENIUS',
              sourceId: id.toString(),
            });
          }
        }
      }
      return results;
    }
    log(
      `Request to fetch song metadata results from Genius failed.\nERR_CODE : ${data?.meta?.status} => ${data.meta.message}`,
      undefined,
      'WARN'
    );
  }
  return [];
}

async function fetchSongMetadataFromGenius(
  geniusSongId: string
): Promise<SongMetadataResultFromInternet | undefined> {
  const GENIUS_API_KEY = process.env.GENIUS_API_KEY;

  if (typeof GENIUS_API_KEY !== 'string') {
    log('undefined GENIUS_API_KEY.', { GENIUS_API_KEY }, 'WARN');
    throw new Error('undefined GENIUS_API_KEY.');
  }

  const url = new URL('/songs', GENIUS_API_BASE_URL);
  url.searchParams.set('q', geniusSongId);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GENIUS_API_KEY}`,
    },
    signal: metadataController.signal,
  });

  if (res.ok) {
    const data = (await res.json()) as GeniusSongMetadataResponse;
    if (data?.meta?.status === 200) {
      const { song } = data.response;

      return {
        title: song.title || 'Unknown Title',
        artists: [
          song.primary_artist.name,
          ...song.featured_artists.map((x) => x.name),
        ],
        artworkPaths: [
          song.header_image_url,
          song.song_art_image_url,
          song.album.cover_art_url,
        ],
        album: song?.album?.name || 'Unknown Album Title',
        releasedYear: song.release_date
          ? new Date(song.release_date).getFullYear()
          : undefined,
        source: 'GENIUS',
        sourceId: song.id.toString(),
      };
    }
    throw new Error(`ERROR : ${data?.meta?.status} : ${data.meta.message}`);
  }
  return undefined;
}

const DEEZER_BASE_URL = 'https://api.deezer.com';

async function searchSongMetadataResultsInDeezer(
  songTitle: string,
  songArtists?: string
): Promise<SongMetadataResultFromInternet[]> {
  const query = `track:"${songTitle}"${
    songArtists ? ` artist:"${songArtists}"` : ''
  }`;

  const url = new URL('/search', DEEZER_BASE_URL);
  url.searchParams.set('q', query);

  const res = await fetch(url, { signal: resultsController.signal });

  if (res.ok) {
    const data = (await res.json()) as DeezerTrackResultsAPI;
    if (data.data.length > 0) {
      const { data: hits } = data;
      const results = [] as SongMetadataResultFromInternet[];
      if (Array.isArray(hits) && hits.length > 0) {
        for (let i = 0; i < hits.length; i += 1) {
          if (hits[i].type === 'track') {
            const { id, title, artist, album, duration } = hits[i];
            results.push({
              title: title || 'Unknown Title',
              artists: artist ? [artist.name] : [],
              artworkPaths: [
                ...[
                  album?.cover,
                  album?.cover_big,
                  album?.cover_medium,
                  album?.cover_small,
                  album?.cover_xl,
                ].filter((x) => x),
                ...[
                  artist?.picture,
                  artist?.picture_big,
                  artist?.picture_medium,
                  artist?.picture_small,
                  artist?.picture_xl,
                ].filter((x) => x),
              ],
              duration,
              source: 'DEEZER',
              sourceId: id.toString(),
            });
          }
        }
      }
      return results;
    }
    throw new Error(`No search results found for the query in Deezer.`);
  }
  return [];
}

async function fetchSongMetadataFromDeezer(
  deezerSongId: string
): Promise<SongMetadataResultFromInternet | undefined> {
  const url = new URL(`/track/${deezerSongId}`, DEEZER_BASE_URL);

  const res = await fetch(url, { signal: metadataController.signal });

  if (res.ok) {
    const data = (await res.json()) as DeezerTrackDataAPI;
    if (data) {
      const { title, contributors, album, release_date, id } = data;
      return {
        title: title || 'Unknown Title',
        artists: contributors.map((x) => x.name).filter((x) => x),
        artworkPaths: [
          ...[
            album?.cover,
            album?.cover_big,
            album?.cover_medium,
            album?.cover_small,
            album?.cover_xl,
          ].filter((x) => x),
          ...contributors
            .map((contributor) => [
              contributor?.picture,
              contributor?.picture_big,
              contributor?.picture_medium,
              contributor?.picture_small,
              contributor?.picture_xl,
            ])
            .flat(5)
            .filter((x) => x),
        ],
        album: album?.title || 'Unknown Album Title',
        releasedYear: new Date(release_date).getFullYear() || undefined,
        source: 'GENIUS',
        sourceId: id.toString(),
      };
    }
    throw new Error(`Error ocurred when fetching track meta data from Deezer.`);
  }
  return undefined;
}

export const searchSongMetadataResultsInInternet = async (
  songTitle: string,
  songArtsits = [] as string[]
) => {
  // resultsController.abort();
  const itunesHits = fetchSongMetadataResultsFromITunes(
    songTitle,
    songArtsits ? songArtsits.join(' ') : undefined
  ).catch((err) =>
    log(
      `Error ocurred when fetching song metadata hits from itunes api.`,
      { err },
      'WARN'
    )
  );
  const geniusHits = searchSongMetadataResultsInGenius(
    songTitle,
    songArtsits ? songArtsits.join(' ') : undefined
  ).catch((err) =>
    log(
      `Error ocurred when fetching song metadata hits from genius api.`,
      { err },
      'WARN'
    )
  );
  const lastFMHits = fetchSongMetadataResultsFromLastFM(
    songTitle,
    songArtsits ? songArtsits.join(' ') : undefined
  ).catch((err) =>
    log(
      `Error ocurred when fetching song metadata hits from genius api.`,
      { err },
      'WARN'
    )
  );
  const musixmatchHits = fetchSongMetadataFromMusixmatch(
    songTitle,
    songArtsits ? songArtsits.join(' ') : undefined
  ).catch((err) =>
    log(
      `Error ocurred when fetching song metadata hits from genius api.`,
      { err },
      'WARN'
    )
  );
  const deezerHits = searchSongMetadataResultsInDeezer(
    songTitle,
    songArtsits ? songArtsits.join(' ') : undefined
  ).catch((err) =>
    log(
      `Error ocurred when fetching song metadata hits from genius api.;`,
      { err },
      'WARN'
    )
  );

  const hits = await Promise.all([
    itunesHits,
    geniusHits,
    deezerHits,
    lastFMHits,
    musixmatchHits,
  ]);
  const allHits = hits.flat(2);

  if (Array.isArray(allHits) && allHits.length > 0)
    return allHits.filter((x) => x);
  return [];
};

export const fetchSongMetadataFromInternet = async (
  source: SongMetadataSource,
  sourceId: string
): Promise<SongMetadataResultFromInternet | undefined> => {
  // metadataController.abort();
  if (source === 'LAST_FM' && lastFMHitCache.id === sourceId)
    return lastFMHitCache.data;

  if (source === 'MUSIXMATCH' && musixmatchHitCache.id === sourceId)
    return musixmatchHitCache.data;

  if (source === 'ITUNES') {
    const metadata = fetchSongMetadataFromItunes(sourceId);
    if (metadata) return metadata;
    log(
      `Error ocurred when fetching song metadata from itunes api hit cache.`,
      undefined,
      'WARN'
    );
    return undefined;
  }

  if (source === 'GENIUS') {
    const metadata = await fetchSongMetadataFromGenius(sourceId).catch((err) =>
      log(
        `Error ocurred when fetching song metadata from genius api.`,
        { err },
        'WARN'
      )
    );
    if (metadata) return metadata;
    return undefined;
  }

  if (source === 'DEEZER') {
    const metadata = await fetchSongMetadataFromDeezer(sourceId).catch((err) =>
      log(
        `Error ocurred when fetching song metadata from deezer api.`,
        { err },
        'WARN'
      )
    );
    if (metadata) return metadata;
    return undefined;
  }

  return undefined;
};
