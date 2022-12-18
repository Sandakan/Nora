/* eslint-disable @typescript-eslint/naming-convention */
import fetch from 'node-fetch';

import {
  MusixmatchLyrics,
  MusixmatchLyricsAPI,
  MusixmatchLyricsLine,
  MusixmatchLyricsMetadata,
} from '../../@types/musixmatch_lyrics_api';
import isLyricsSynced from './isLyricsSynced';
import parseSongMetadataFromMusixmatchApiData from './parseSongMetadataFromMusixmatchApiData';

interface TrackInfo {
  q_track: string;
  q_artist: string;
  // q_album?: string;
  // q_duration?: number;
  // track_spotify_id?: string;
}

export const parseMusicmatchDataFromLyrics = (
  data: MusixmatchLyricsAPI,
  lyricsType: LyricsRequestTypes
): MusixmatchLyrics | undefined => {
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

    const parsedMetadata = parseSongMetadataFromMusixmatchApiData(data);

    if (parsedMetadata) {
      metadata = parsedMetadata;
      output.push(`[tr:${metadata.title}]`);
      output.push(`[ar:${metadata.artist}]`);
      if (metadata.album) output.push(`[al:${metadata.album}]`);
      output.push(
        `[al:${Math.floor(metadata.duration / 60)}:${metadata.duration % 60}]`
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
          output.push(`[copyright:${lyrics_copyright.replaceAll('\n', '')}]`);
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
      output.unshift(
        `[by:Implementation from Fashni's MxLRC (https://github.com/fashni/MxLRC)]`
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

const fetchLyricsFromMusixmatch = async (
  trackInfo: TrackInfo,
  usertoken: string,
  lyricsType = 'ANY' as LyricsRequestTypes,
  abortSignal?: AbortSignal
): Promise<MusixmatchLyrics | undefined> => {
  // if there is a pending request, abort it.
  const baseUrl =
    'https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get?format=json&namespace=lyrics_richsynched&subtitle_format=mxm&app_id=web-desktop-app-v1.0&';
  const headers = {
    authority: 'apic-desktop.musixmatch.com',
    cookie: 'x-mxm-token-guid=',
  };

  const query = new URLSearchParams({ ...trackInfo, usertoken });

  try {
    const res = await fetch(baseUrl + query.toString(), {
      headers,
      signal: abortSignal,
    });
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
