import path from 'path';
import NodeID3 from 'node-id3';
import songlyrics from 'songlyrics';

import { getUserData } from '../filesystem';
import { removeDefaultAppProtocolFromFilePath } from '../fs/resolveFilePaths';
import log from '../log';
import { checkIfConnectedToInternet, sendMessageToRenderer } from '../main';
import fetchLyricsFromMusixmatch from '../utils/fetchLyricsFromMusixmatch';
import { appPreferences } from '../../../package.json';
import parseLyrics, {
  parseSyncedLyricsFromAudioDataSource,
} from '../utils/parseLyrics';
import saveLyricsToSong from '../saveLyricsToSong';

const { metadataEditingSupportedExtensions } = appPreferences;

let cachedLyrics = undefined as SongLyrics | undefined;

export const updateCachedLyrics = (
  callback: (prevLyrics: typeof cachedLyrics) => SongLyrics | undefined
) => {
  const lyrics = callback(cachedLyrics);
  if (lyrics) cachedLyrics = lyrics;
};

const fetchLyricsFromAudioSource = (songPath: string) => {
  try {
    const songExt = path.extname(songPath).replace('.', '');
    const isSupported = metadataEditingSupportedExtensions.includes(songExt);

    if (isSupported) {
      const songData = NodeID3.read(songPath);
      const { unsynchronisedLyrics, synchronisedLyrics } = songData;

      if (Array.isArray(synchronisedLyrics) && synchronisedLyrics.length > 0) {
        const reversedForLatestLyricsStore = synchronisedLyrics.reverse();

        for (const syncedLyricsData of reversedForLatestLyricsStore) {
          const parsedSyncedLyrics =
            parseSyncedLyricsFromAudioDataSource(syncedLyricsData);

          if (parsedSyncedLyrics) return parsedSyncedLyrics;
        }
      }

      if (unsynchronisedLyrics?.text) {
        const parsedLyrics = parseLyrics(unsynchronisedLyrics.text);
        if (parsedLyrics) return parsedLyrics;
      }
    } else
      log(
        `Nora doesn't support reading lyrics metadata from songs in ${songExt} format.`,
        { songPath },
        'ERROR'
      );
    // No lyrics found on the audio_source.
    return undefined;
  } catch (error) {
    log(
      'Error occurred when trying to fetch lyrics from the audio source.',
      { songPath, error },
      'ERROR'
    );
    return undefined;
  }
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

        return {
          lyrics: parsedLyrics,
          title: songTitle,
          source: 'MUSIXMATCH',
          lang: metadata.lang,
          link: metadata.link,
          lyricsType: lyricsSyncState,
          copyright: metadata.copyright,
        };
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

    return {
      title: songTitle,
      lyrics: parsedLyrics,
      source: source.name,
      lyricsType: 'UN_SYNCED' as LyricsTypes,
      link: source.url,
    };
  }
  log(`No lyrics found in the internet for the requested query.`);
  sendMessageToRenderer(`We couldn't find lyrics for ${songTitle}`);
  return undefined;
};

const saveLyricsAutomaticallyIfAsked = async (
  lyricsType: AutomaticallySaveLyricsTypes,
  songPath: string,
  lyrics: SongLyrics
) => {
  const {
    lyrics: { isSynced },
  } = lyrics;
  if (lyricsType === 'NONE') return undefined;
  if (
    (lyricsType === 'SYNCED' && isSynced) ||
    lyricsType === 'SYNCED_OR_UN_SYNCED'
  ) {
    await saveLyricsToSong(songPath, lyrics);
    return log(
      `Lyrics for '${lyrics.title}' saved successfully.`,
      {
        songPath,
      },
      'INFO',
      { sendToRenderer: 'SUCCESS' }
    );
  }

  return undefined;
};

const getSongLyrics = async (
  trackInfo: LyricsRequestTrackInfo,
  lyricsType: LyricsTypes = 'ANY',
  lyricsRequestType: LyricsRequestTypes = 'ANY',
  saveLyricsAutomatically: AutomaticallySaveLyricsTypes = 'NONE',
  abortControllerSignal?: AbortSignal
): Promise<SongLyrics | undefined> => {
  const {
    songTitle,
    songArtists = [],
    songPath: songPathWithProtocol,
  } = trackInfo;

  const songPath = removeDefaultAppProtocolFromFilePath(songPathWithProtocol);
  const isConnectedToInternet = checkIfConnectedToInternet();
  let isOfflineLyricsAvailable = false;

  log(`Fetching lyrics for '${songTitle} - ${songArtists.join(',')}'.`);

  const audioSourceLyrics = fetchLyricsFromAudioSource(songPath);
  if (audioSourceLyrics) isOfflineLyricsAvailable = true;

  if (lyricsRequestType !== 'ONLINE_ONLY') {
    if (
      lyricsRequestType !== 'OFFLINE_ONLY' &&
      cachedLyrics &&
      cachedLyrics.title === songTitle
    ) {
      log('Serving cached lyrics.');
      return cachedLyrics;
    }

    if (audioSourceLyrics) {
      const { isSynced } = audioSourceLyrics;
      const type: LyricsTypes = isSynced ? 'SYNCED' : 'UN_SYNCED';

      cachedLyrics = {
        title: songTitle,
        source: 'IN_SONG_LYRICS',
        lyricsType: type,
        lyrics: audioSourceLyrics,
        isOfflineLyricsAvailable,
      };
      return cachedLyrics;
    }
  }

  if (isConnectedToInternet && lyricsRequestType !== 'OFFLINE_ONLY') {
    try {
      const musixmatchLyrics = await getLyricsFromMusixmatch(
        trackInfo,
        lyricsType,
        abortControllerSignal
      );

      if (musixmatchLyrics) {
        cachedLyrics = {
          ...musixmatchLyrics,
          isOfflineLyricsAvailable,
        };

        if (saveLyricsAutomatically !== 'NONE')
          await saveLyricsAutomaticallyIfAsked(
            saveLyricsAutomatically,
            trackInfo.songPath,
            cachedLyrics
          );

        return cachedLyrics;
      }

      if (lyricsType !== 'SYNCED') {
        const unsyncedLyrics = await fetchUnsyncedLyrics(
          songTitle,
          songArtists
        );
        if (unsyncedLyrics) {
          cachedLyrics = { ...unsyncedLyrics, isOfflineLyricsAvailable };

          if (saveLyricsAutomatically === 'SYNCED_OR_UN_SYNCED')
            await saveLyricsAutomaticallyIfAsked(
              saveLyricsAutomatically,
              trackInfo.songPath,
              cachedLyrics
            );

          return cachedLyrics;
        }
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
