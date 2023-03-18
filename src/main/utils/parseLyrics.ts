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

// const fetchDataFromLyricsString = (lyricsString: string) => {
//   const lyrics: { time: string; lyrics: string[]; lang?: string }[] = [];

//   for (const match of lyricsString.matchAll(syncedLyricsRegex)) {
//     if (
//       match?.groups &&
//       'timestamp' in match.groups &&
//       'lyric' in match.groups
//     ) {
//       const { timestamp, lyric, lang } = match.groups;
//       const isAvailable = !lyrics.some((y) => y.time === timestamp);
//       if (isAvailable)
//         lyrics.push({ time: timestamp, lyrics: [lyric.trim()], lang });
//       else
//         for (let y = 0; y < lyrics.length; y += 1) {
//           if (lyrics[y].time === timestamp) lyrics[y].lyrics.push(lyric.trim());
//         }
//     }
//   }

//   return lyrics;
// };

// MAIN FUNCTIONS //
const parseLyrics = (lyricsString: string): LyricsData => {
  const isSynced = isLyricsSynced(lyricsString);

  const copyrightMatch = /^\[copyright:(?<copyright>.+)\]$/gm.exec(
    lyricsString
  );
  const copyright = copyrightMatch?.groups?.copyright || undefined;
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

        // divide by 1000 to convert from milliseconds to seconds.
        const end =
          (arr.length - 1 === index
            ? Infinity
            : arr[index + 1] !== undefined
            ? arr[index + 1].timeStamp
            : 0) / 1000;

        return { text, start: timeStamp / 1000, end };
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
