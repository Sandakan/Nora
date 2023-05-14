import { TagConstants } from 'node-id3';
import log from '../log';
import isLyricsSynced, { syncedLyricsRegex } from './isLyricsSynced';

type Input = {
  language: string;
  timeStampFormat: number;
  contentType: number;
  shortText?: string | undefined;
  synchronisedText: {
    text: string;
    timeStamp: number;
  }[];
};

const copyrightMatchRegex = /^\[copyright:(?<copyright>.+)\]$/gm;
const lyricsOffsetRegex = /^\[offset:(?<lyricsOffset>[+-]?\d+)\]$/gm;

const getSecondsFromLyricsLine = (lyric: string) => {
  const lyricsStartMatch = lyric.match(syncedLyricsRegex);
  if (Array.isArray(lyricsStartMatch)) {
    const [sec, ms] = lyricsStartMatch[0].replaceAll(/[[\]]/gm, '').split(':');
    return parseInt(sec) * 60 + parseFloat(ms);
  }
  return 0;
};

const getLyricEndTime = (lyricsArr: string[], index: number) => {
  if (lyricsArr.length - 1 === index) return Infinity;

  if (lyricsArr[index + 1])
    return getSecondsFromLyricsLine(lyricsArr[index + 1]);

  return 0;
};

const isNotALyricsMetadataLine = (line: string) =>
  !/^\[\w+:.{1,}\]$/gm.test(line);

// MAIN FUNCTIONS //
const parseLyrics = (lyricsString: string): LyricsData => {
  const isSynced = isLyricsSynced(lyricsString);

  const copyrightMatch = copyrightMatchRegex.exec(lyricsString);
  copyrightMatchRegex.lastIndex = 0;

  const lyricsOffsetMatch = lyricsOffsetRegex.exec(lyricsString);
  lyricsOffsetRegex.lastIndex = 0;

  const copyright = copyrightMatch?.groups?.copyright || undefined;
  const offset = Number(lyricsOffsetMatch?.groups?.lyricsOffset) || undefined;
  const lines = lyricsString.split('\n');
  const lyricsLines = lines.filter(
    (line) => line.trim() !== '' && isNotALyricsMetadataLine(line)
  );

  const parsedUnsyncedLyricsLines = lyricsLines.map((line) =>
    line.replaceAll(syncedLyricsRegex, '').trim()
  );

  if (isSynced) {
    const syncedLyrics: SyncedLyricLine[] = lyricsLines.map(
      (line, index, lyricsLinesArr) => {
        const start = getSecondsFromLyricsLine(line);
        const end = getLyricEndTime(lyricsLinesArr, index);

        const parsedLine = line.replaceAll(syncedLyricsRegex, '').trim();

        return { text: parsedLine, start, end };
      }
    );

    return {
      isSynced,
      lyrics: parsedUnsyncedLyricsLines,
      syncedLyrics,
      unparsedLyrics: lyricsString,
      offset,
      copyright,
    };
  }

  return {
    isSynced,
    lyrics: parsedUnsyncedLyricsLines,
    unparsedLyrics: lyricsString,
    copyright,
  };
};

const parseMetadataFromShortText = (shortText?: string) => {
  const metadata: LyricsMetadataFromShortText = { copyright: undefined };

  if (shortText) {
    try {
      const metaFromShortText = JSON.parse(shortText);
      if ('copyright' in metaFromShortText)
        metadata.copyright = metaFromShortText.copyright;
    } catch (error) {
      log(
        'Error occurred when parsing metadata from shortText attribute in NodeID3 format.',
        { error },
        'INFO'
      );
      return metadata;
    }
  }
  return metadata;
};

const getNextTimestamp = (
  arr: {
    text: string;
    timeStamp: number;
  }[],
  start: number,
  index: number
) => {
  if (arr.length - 1 === index) return Infinity;

  for (let i = 0; i < arr.length - index; i += 1) {
    if (arr[index + i]) {
      const { timeStamp } = arr[index + i];
      if (timeStamp !== start) return timeStamp;
    }
  }
  return 0;
};

export const parseSyncedLyricsFromAudioDataSource = (
  input: Input
): LyricsData | undefined => {
  const { timeStampFormat, synchronisedText, shortText } = input;

  if (timeStampFormat === TagConstants.TimeStampFormat.MILLISECONDS) {
    const lyrics = synchronisedText.map((line) => line.text);
    const metadata = parseMetadataFromShortText(shortText);

    const syncedLyrics: SyncedLyricLine[] = synchronisedText.map(
      (line, index, arr) => {
        // timeStamp = start of the line
        const { text, timeStamp } = line;

        const end = getNextTimestamp(arr, timeStamp, index);

        // divide by 1000 to convert from milliseconds to seconds.
        return { text, start: timeStamp / 1000, end: end / 1000 };
      }
    );

    const unparsedLyrics = syncedLyrics
      .map((line) => {
        const { text, start } = line;
        const secs = Math.floor(start % 60);
        const secsStr = secs.toString().length > 1 ? secs : `0${secs}`;
        const mins = Math.floor(start / 60);
        const minsStr = mins.toString().length > 1 ? mins : `0${mins}`;
        const hundredths = start.toString().includes('.')
          ? parseInt(start.toString().split('.').at(-1) || '0')
          : 0;

        return `[${minsStr}:${secsStr}.${hundredths}] ${text}`;
      })
      .join('\n');

    return {
      isSynced: true,
      copyright: metadata.copyright,
      lyrics,
      syncedLyrics,
      unparsedLyrics,
    };
  }
  return undefined;
};

export default parseLyrics;
