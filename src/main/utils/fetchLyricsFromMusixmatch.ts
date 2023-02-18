/* eslint-disable camelcase */

import {
  MusixmatchLyrics,
  MusixmatchLyricsAPI,
  MusixmatchLyricsLine,
  MusixmatchLyricsMetadata,
} from '../../@types/musixmatch_lyrics_api';
import isLyricsSynced from './isLyricsSynced';
import { repository, version } from '../../../package.json';
import parseSongMetadataFromMusixmatchApiData from './parseSongMetadataFromMusixmatchApiData';

interface TrackInfo {
  q_track: string;
  q_artist: string;
  q_artists: string;
  q_duration: string;
  q_album?: string;
  track_spotify_id?: string;
}

// $ [offset:+/- Overall timestamp adjustment in milliseconds, + shifts time up, - shifts down]

export const parseMusicmatchDataFromLyrics = async (
  data: MusixmatchLyricsAPI,
  lyricsType: LyricsTypes
): Promise<MusixmatchLyrics | undefined> => {
  let metadata = {} as MusixmatchLyricsMetadata;
  const output: string[] = [];

  if (
    data.message.header.status_code === 200 &&
    data.message.body?.macro_calls['matcher.track.get'].message?.body?.track
      ?.has_lyrics
  ) {
    const hasLyrics =
      // here !! transforms 0 or 1 to its respective boolean values.
      !!data.message?.body?.macro_calls['matcher.track.get']?.message?.body
        ?.track?.has_lyrics;
    const hasSyncedLyrics =
      // here !! transforms 0 or 1 to its respective boolean values.
      !!data.message?.body?.macro_calls['matcher.track.get']?.message?.body
        ?.track?.has_subtitles;
    const isInstrumental =
      data.message?.body?.macro_calls['matcher.track.get']?.message?.body?.track
        ?.instrumental ?? false;
    if (!hasLyrics) throw new Error('No lyrics on musixmatch for this song.');
    if (lyricsType === 'SYNCED' && !hasSyncedLyrics)
      throw new Error('No synced lyrics on musixmatch for this song.');

    // ? SONG METADATA IN LRC FORMAT
    const parsedMetadata = await parseSongMetadataFromMusixmatchApiData(data);

    if (parsedMetadata) {
      metadata = parsedMetadata;
      // [ti:Lyrics (song) title]
      // [ar:Lyrics artist]
      output.push(`[ti:${metadata.title}]`, `[ar:${metadata.artist}]`);
      // [al:Album where the song is from]
      if (metadata.album) output.push(`[al:${metadata.album}]`);
      // [length:How long the song is]
      output.push(
        `[length:${Math.floor(metadata.duration / 60)}:${
          metadata.duration % 60
        }]`
      );
    }

    if (lyricsType === 'ANY' && isInstrumental) {
      output.push(`[00:00.00] ♪ Instrumental ♪`);
    } else if (
      lyricsType !== 'UN_SYNCED' &&
      hasLyrics &&
      hasSyncedLyrics &&
      data.message.body.macro_calls['track.subtitles.get'].message.header
        .status_code === 200 &&
      !Array.isArray(
        data.message.body.macro_calls['track.subtitles.get'].message.body
      )
    ) {
      // contains synced lyrics
      const { lyrics_copyright, subtitle_body, subtitle_language, restricted } =
        data.message.body.macro_calls['track.subtitles.get'].message.body
          .subtitle_list[0].subtitle;
      if (restricted !== 1) {
        if (subtitle_language) output.push(`[lang:${subtitle_language}]`);
        if (lyrics_copyright) {
          output.push(
            `[copyright:Musixmatch Lyrics. ${lyrics_copyright.replaceAll(
              '\n',
              ''
            )}]`
          );
          metadata.copyright = lyrics_copyright;
        }

        const lyricsLinesData = JSON.parse(
          subtitle_body
        ) as MusixmatchLyricsLine[];

        for (let i = 0; i < lyricsLinesData.length; i += 1) {
          const { text, time } = lyricsLinesData[i];
          output.push(
            `[${
              time.minutes.toString().length > 1
                ? time.minutes
                : `0${time.minutes}`
            }:${
              time.seconds.toString().length > 1
                ? time.seconds
                : `0${time.seconds}`
            }.${time.hundredths}]${text || '♪'}`
          );
        }
      }
    } else if (
      lyricsType !== 'SYNCED' &&
      hasLyrics &&
      data.message.body.macro_calls['track.lyrics.get'].message.header
        .status_code === 200 &&
      !Array.isArray(
        data.message.body.macro_calls['track.lyrics.get'].message.body
      ) &&
      data.message.body.macro_calls['track.lyrics.get'].message.body.lyrics
        .restricted !== 1
    ) {
      // contains un-synced lyrics
      output.push(
        ...data.message.body.macro_calls[
          'track.lyrics.get'
        ].message.body.lyrics.lyrics_body.split('\n')
      );
      metadata.copyright =
        data.message.body.macro_calls[
          'track.lyrics.get'
        ].message.body.lyrics.lyrics_copyright;
    }
    if (output.length > 0)
      // [by:Creator of the LRC file]
      // [re:The player or editor that created the LRC file]
      // [ve:version of program]
      output.unshift(
        `[by:Implementation from Fashni's MxLRC (https://github.com/fashni/MxLRC)]`,
        `[re:Nora Player (${repository.url})]`,
        `[ve:${version}]`
      );

    const lyrics = output.join('\n');
    const lyricsSyncState: LyricsTypes = isLyricsSynced(lyrics)
      ? 'SYNCED'
      : 'UN_SYNCED';

    return {
      metadata,
      lyrics,
      lyricsType: lyricsSyncState,
    };
  }
  // no lyrics found on Musixmatch for current query
  throw new Error('no lyrics found on Musixmatch for current query');
};

const MUSIXMATCH_BASE_URL = 'https://apic-desktop.musixmatch.com/';

const fetchLyricsFromMusixmatch = async (
  trackInfo: TrackInfo,
  usertoken: string,
  // eslint-disable-next-line default-param-last
  lyricsType: LyricsTypes = 'ANY',
  abortSignal?: AbortSignal
): Promise<MusixmatchLyrics | undefined> => {
  const headers = {
    authority: 'apic-desktop.musixmatch.com',
    cookie: 'x-mxm-token-guid=',
  };

  const url = new URL('/ws/1.1/macro.subtitles.get', MUSIXMATCH_BASE_URL);
  url.searchParams.set('namespace', 'lyrics_richsynched');
  url.searchParams.set('app_id', 'web-desktop-app-v1.0');
  url.searchParams.set('subtitle_format', 'mxm');
  url.searchParams.set('format', 'json');
  url.searchParams.set('usertoken', usertoken);

  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(trackInfo)) {
    if (typeof value === 'string') url.searchParams.set(key, value);
  }

  try {
    const res = await fetch(url, { headers, signal: abortSignal });
    if (res.ok) {
      const data = (await res.json()) as MusixmatchLyricsAPI;
      const lyrics = parseMusicmatchDataFromLyrics(data, lyricsType);

      return lyrics;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('error ocurred', error);
    throw error;
  }
  throw new Error('Error occurred');
};

export default fetchLyricsFromMusixmatch;
