/* eslint-disable prefer-destructuring */
/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/naming-convention */
import fetch from 'node-fetch';
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

async function fetchSongMetadataFromMusixmatch(
  songTitle: string,
  songArtist?: string
) {
  const MUSIXMATCH_USER_TOKEN = process.env.MUSIXMATCH_DEFAULT_USER_TOKEN;
  if (typeof MUSIXMATCH_USER_TOKEN !== 'string') {
    log('undefined MUSIXMATCH_USER_TOKEN.', { MUSIXMATCH_USER_TOKEN }, 'WARN');
    throw new Error('undefined MUSIXMATCH_USER_TOKEN');
  }

  const baseUrl =
    'https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get?format=json&namespace=lyrics_richsynched&subtitle_format=mxm&app_id=web-desktop-app-v1.0&';
  const headers = {
    authority: 'apic-desktop.musixmatch.com',
    cookie: 'x-mxm-token-guid=',
  };
  const query = new URLSearchParams({
    q_track: songTitle,
    q_artist: songArtist ?? '',
    usertoken: MUSIXMATCH_USER_TOKEN,
  });
  try {
    const res = await fetch(baseUrl + query.toString(), {
      headers,
      signal: resultsController.signal,
    });
    if (res.ok) {
      const data = (await res.json()) as MusixmatchLyricsAPI;
      const metadata = parseSongMetadataFromMusixmatchApiData(data, true);
      const lyrics = parseMusicmatchDataFromLyrics(data, 'ANY');

      if (metadata) {
        const { title, artist, duration, lang, album, album_artwork_url } =
          metadata;
        const result: SongMetadataResultFromInternet = {
          title,
          album,
          artworkPaths: [album_artwork_url],
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

const LAST_FM_API_URL = 'http://ws.audioscrobbler.com/2.0/';
const lastFMHitCache = { id: '' } as LastFMHitCache;

function fetchSongMetadataResultsFromLastFM(
  songTitle: string,
  songArtist?: string
): Promise<SongMetadataResultFromInternet[]> {
  return new Promise(async (resolve, reject) => {
    const LAST_FM_API_KEY = process.env.LAST_FM_API_KEY;
    try {
      if (typeof LAST_FM_API_KEY !== 'string') {
        log('undefined LAST_FM_API_KEY.', { LAST_FM_API_KEY }, 'WARN');
        throw new Error('undefined LAST_FM_API_KEY');
      }
      const res = await fetch(
        encodeURI(
          `${LAST_FM_API_URL}?method=track.getInfo&format=json&track=${songTitle}${
            songArtist ? `&artist=${songArtist}` : ''
          }&api_key=${LAST_FM_API_KEY}`
        ),
        { signal: resultsController.signal }
      );

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

          return resolve([result]);
        }
        log(`ERROR : ${data?.error} : ${data?.message}`, undefined, 'WARN');
      }
      const errStr = `Request to fetch song metadata results from LastFM failed.\nERR_CODE : ${res.status}`;
      log(errStr, undefined, 'WARN');
      return resolve([]);
    } catch (error) {
      return reject(error);
    }
  });
}

const GENIUS_API_BASE_URL = 'https://api.genius.com';

function searchSongMetadataResultsInGenius(
  songTitle: string,
  songArtists?: string
): Promise<SongMetadataResultFromInternet[]> {
  return new Promise(async (resolve, reject) => {
    const GENIUS_API_KEY = process.env.GENIUS_API_KEY;
    try {
      if (typeof GENIUS_API_KEY !== 'string') {
        log('undefined GENIUS_API_KEY.', { GENIUS_API_KEY }, 'WARN');
        throw new Error('undefined GENIUS_API_KEY.');
      }
      const res = await fetch(
        encodeURI(
          `${GENIUS_API_BASE_URL}/search?q=${songTitle}${
            songArtists ? ` ${songArtists}` : ''
          }`
        ),
        {
          headers: {
            Authorization: `Bearer ${GENIUS_API_KEY}`,
          },
          signal: resultsController.signal,
        }
      );
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
          return resolve(results);
        }
        log(
          `Request to fetch song metadata results from Genius failed.\nERR_CODE : ${data?.meta?.status} => ${data.meta.message}`,
          undefined,
          'WARN'
        );
      }
      return [];
    } catch (error) {
      return reject(error);
    }
  });
}

function fetchSongMetadataFromGenius(
  geniusSongId: string
): Promise<SongMetadataResultFromInternet> {
  return new Promise(async (resolve, reject) => {
    const GENIUS_API_KEY = process.env.GENIUS_API_KEY;

    try {
      if (typeof GENIUS_API_KEY !== 'string') {
        log('undefined GENIUS_API_KEY.', { GENIUS_API_KEY }, 'WARN');
        throw new Error('undefined GENIUS_API_KEY.');
      }
      const res = await fetch(
        encodeURI(`${GENIUS_API_BASE_URL}/songs?q=${geniusSongId}`),
        {
          headers: {
            Authorization: `Bearer ${GENIUS_API_KEY}`,
          },
          signal: metadataController.signal,
        }
      );
      if (res.ok) {
        const data = (await res.json()) as GeniusSongMetadataResponse;
        if (data?.meta?.status === 200) {
          const { song } = data.response;

          return resolve({
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
          });
        }
        reject(
          new Error(`ERROR : ${data?.meta?.status} : ${data.meta.message}`)
        );
      }
      return [];
    } catch (error) {
      return reject(error);
    }
  });
}

const DEEZER_BASE_URL = 'https://api.deezer.com';

function searchSongMetadataResultsInDeezer(
  songTitle: string,
  songArtists?: string
): Promise<SongMetadataResultFromInternet[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        encodeURI(
          `${DEEZER_BASE_URL}/search?q=track:"${songTitle}"${
            songArtists ? ` artist:"${songArtists}"` : ''
          }`
        ),
        { signal: resultsController.signal }
      );
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
          return resolve(results);
        }
        reject(new Error(`No search results found for the query in Deezer.`));
      }
      return [];
    } catch (error) {
      return reject(error);
    }
  });
}

function fetchSongMetadataFromDeezer(
  deezerSongId: string
): Promise<SongMetadataResultFromInternet> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(
        encodeURI(`${DEEZER_BASE_URL}/track/${deezerSongId}`),
        { signal: metadataController.signal }
      );
      if (res.ok) {
        const data = (await res.json()) as DeezerTrackDataAPI;
        if (data) {
          const { title, contributors, album, release_date, id } = data;
          return resolve({
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
          });
        }
        reject(
          new Error(`Error ocurred when fetching track meta data from Deezer.`)
        );
      }
      return [];
    } catch (error) {
      return reject(error);
    }
  });
}

export const searchSongMetadataResultsInInternet = async (
  songTitle: string,
  songArtsits = [] as string[]
) => {
  // resultsController.abort();
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
