/* eslint-disable no-unused-vars */
/* eslint-disable default-param-last */
import NodeID3 from 'node-id3';
import songlyrics from 'songlyrics';

import { getSongsData, getUserData } from '../filesystem';
import log from '../log';
import { checkIfConnectedToInternet, sendMessageToRenderer } from '../main';
import fetchLyricsFromMusixmatch from '../utils/fetchLyricsFromMusixmatch';
import parseLyrics, {
  parseSyncedLyricsFromAudioDataSource,
} from '../utils/parseLyrics';

let cachedLyrics = undefined as SongLyrics | undefined;

export const updateCachedLyrics = (
  callback: (prevLyrics: typeof cachedLyrics) => SongLyrics | undefined
) => {
  const lyrics = callback(cachedLyrics);
  if (lyrics) cachedLyrics = lyrics;
};

const fetchLyricsFromAudioSource = (songId: string, songTitle: string) => {
  const songs = getSongsData();

  if (Array.isArray(songs) && songs.length > 0) {
    for (let i = 0; i < songs.length; i += 1) {
      if (songs[i].songId === songId) {
        const song = songs[i];
        const songData = NodeID3.read(song.path);
        const { unsynchronisedLyrics, synchronisedLyrics } = songData;

        // $ synchronisedLyrics tag skipped due to issues like incorrect timestamps. Could be an issue in the NodeID3.
        if (
          Array.isArray(synchronisedLyrics) &&
          synchronisedLyrics.length > 0
        ) {
          const syncedLyricsData =
            synchronisedLyrics[synchronisedLyrics.length - 1];
          const parsedSyncedLyrics =
            parseSyncedLyricsFromAudioDataSource(syncedLyricsData);

          if (parsedSyncedLyrics) {
            const { isSynced } = parsedSyncedLyrics;

            const lyricsType: LyricsTypes = isSynced ? 'SYNCED' : 'UN_SYNCED';

            cachedLyrics = {
              title: songTitle,
              source: 'IN_SONG_LYRICS',
              lyricsType,
              lyrics: parsedSyncedLyrics,
            };
            return cachedLyrics;
          }
        }

        if (unsynchronisedLyrics) {
          const parsedLyrics = parseLyrics(unsynchronisedLyrics.text);
          const lyricsType: LyricsTypes = parsedLyrics.isSynced
            ? 'SYNCED'
            : 'UN_SYNCED';

          cachedLyrics = {
            title: songTitle,
            source: 'IN_SONG_LYRICS',
            lyricsType,
            lyrics: parsedLyrics,
          };
          return cachedLyrics;
        }
        // No lyrics found on the audio_source.
        break;
      }
    }
  }
  return undefined;
};

const getLyricsFromMusixmatch = async (
  trackInfo: LyricsRequestTrackInfo,
  lyricsType?: LyricsTypes,
  abortControllerSignal?: AbortSignal
) => {
  const { songTitle, songArtists = [], duration } = trackInfo;

  const userData = getUserData();

  const mxmUserToken =
    userData?.customMusixmatchUserToken?.trim() ||
    process.env.MUSIXMATCH_DEFAULT_USER_TOKEN;
  if (mxmUserToken && userData?.preferences?.isMusixmatchLyricsEnabled) {
    // Searching internet for lyrics because none present on audio source.
    try {
      const musixmatchLyrics = await fetchLyricsFromMusixmatch(
        {
          q_track: songTitle,
          q_artist: songArtists[0] || '',
          q_artists: songArtists.join(' '),
          q_duration: duration.toString(),
        },
        mxmUserToken,
        lyricsType,
        abortControllerSignal
      );

      if (musixmatchLyrics) {
        const {
          lyrics,
          metadata,
          lyricsType: lyricsSyncState,
        } = musixmatchLyrics;
        log(`found musixmatch lyrics for '${metadata.title}' song.`);

        const parsedLyrics = parseLyrics(lyrics);

        cachedLyrics = {
          lyrics: parsedLyrics,
          title: songTitle,
          source: 'MUSIXMATCH',
          lang: metadata.lang,
          link: metadata.link,
          lyricsType: lyricsSyncState,
          copyright: metadata.copyright,
        };
        return cachedLyrics;
      }
    } catch (error) {
      log(`Error occurred when trying to fetch lyrics from musixmatch.`, {
        error,
      });
    }
  }
  return undefined;
};

const fetchUnsyncedLyrics = async (
  songTitle: string,
  songArtists: string[]
) => {
  const str = songArtists ? `${songTitle} ${songArtists.join(' ')}` : songTitle;
  // no abort controller support for songLyrics.
  const lyricsData = await songlyrics(str);
  if (lyricsData) {
    const { lyrics, source } = lyricsData;
    log(`Found a lyrics result named '${lyricsData?.source.name}'.`);

    const parsedLyrics = parseLyrics(lyrics);

    cachedLyrics = {
      title: songTitle,
      lyrics: parsedLyrics,
      source: source.name,
      lyricsType: 'UN_SYNCED',
      link: source.url,
    };
    return cachedLyrics;
  }
  log(`No lyrics found in the internet for the requested query.`);
  sendMessageToRenderer(`We couldn't find lyrics for ${songTitle}`);
  return undefined;
};

const getSongLyrics = async (
  trackInfo: LyricsRequestTrackInfo,
  lyricsType: LyricsTypes = 'ANY',
  lyricsRequestType: LyricsRequestTypes = 'ANY',
  abortControllerSignal?: AbortSignal
): Promise<SongLyrics | undefined> => {
  const { songTitle, songArtists = [], songId } = trackInfo;
  const isConnectedToInternet = checkIfConnectedToInternet();

  log(`Fetching lyrics for '${songTitle} - ${songArtists.join(',')}'.`);

  if (lyricsRequestType !== 'ONLINE_ONLY') {
    if (
      lyricsRequestType !== 'OFFLINE_ONLY' &&
      cachedLyrics &&
      cachedLyrics.title === songTitle
    ) {
      log('Serving cached lyrics.');
      return cachedLyrics;
    }

    if (songId) {
      const audioSourceLyrics = fetchLyricsFromAudioSource(songId, songTitle);
      if (audioSourceLyrics) return audioSourceLyrics;
    }
  }

  if (isConnectedToInternet && lyricsRequestType !== 'OFFLINE_ONLY') {
    try {
      const musixmatchLyrics = await getLyricsFromMusixmatch(
        trackInfo,
        lyricsType,
        abortControllerSignal
      );

      if (musixmatchLyrics) return musixmatchLyrics;

      if (lyricsType !== 'SYNCED') {
        const unsyncedLyrics = await fetchUnsyncedLyrics(
          songTitle,
          songArtists
        );
        return unsyncedLyrics;
      }
    } catch (error) {
      log(
        `No lyrics found in the internet for the requested query.\nERROR : ${error}`
      );
      sendMessageToRenderer(`We couldn't find lyrics for ${songTitle}`);
      return undefined;
    }
  }
  return undefined;
};

export default getSongLyrics;
