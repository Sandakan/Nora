import { TagConstants } from 'node-id3';
// import log from '../log';
import isLyricsSynced, {
  extendedSyncedLyricsLineRegex,
  isAnExtendedSyncedLyricsLine,
  syncedLyricsRegex,
} from '../../common/isLyricsSynced';

export type SyncedLyricsInput = NonNullable<
  NodeID3Tags['synchronisedLyrics']
>[number];

const copyrightMatchRegex = /^\[copyright:(?<copyright>.+)\]$/gm;
const lyricsOffsetRegex = /^\[offset:(?<lyricsOffset>[+-]?\d+)\]$/gm;

const startTimestampMatchRegex =
  /(?<extSyncTimeStamp>\[\d+:\d{1,2}\.\d{1,3}\])/gm;

const getSecondsFromLyricsLine = (lyric: string) => {
  const lyricsStartMatch = lyric.match(syncedLyricsRegex);
  syncedLyricsRegex.lastIndex = 0;
  const replaceRegex = /[[\]]/gm;
  if (Array.isArray(lyricsStartMatch)) {
    const [sec, ms] = lyricsStartMatch[0]
      .replaceAll(replaceRegex, '')
      .split(':');
    replaceRegex.lastIndex = 0;

    return parseInt(sec) * 60 + parseFloat(ms);
  }
  return 0;
};

const getSecondsFromExtendedTimeStamp = (text: string) => {
  // eslint-disable-next-line no-useless-escape
  const extendedReplaceRegex = /[<>\[\]]/gm;

  const [sec, ms] = text.replaceAll(extendedReplaceRegex, '').split(':');
  extendedReplaceRegex.lastIndex = 0;

  return parseInt(sec) * 60 + parseFloat(ms);
};

const getLyricEndTime = (lyricsArr: string[], index: number) => {
  if (lyricsArr.length - 1 === index) return Number.POSITIVE_INFINITY;

  if (lyricsArr[index + 1])
    return getSecondsFromLyricsLine(lyricsArr[index + 1]);

  return 0;
};

const getSecondsFromExtendedMatch = (match: RegExpMatchArray) => {
  const { groups } = match;
  if (groups) {
    if ('extSyncTimeStamp' in groups) {
      return getSecondsFromExtendedTimeStamp(groups.extSyncTimeStamp);
    }
  }
  return 0;
};

const getExtendedMatchEndTime = (
  matches: RegExpMatchArray[],
  index: number,
  lineEndTime: number,
) => {
  if (matches.length - 1 === index) return lineEndTime;

  if (matches[index + 1])
    return getSecondsFromExtendedMatch(matches[index + 1]);

  return 0;
};

const getExtendedSyncedLineInfo = (
  line: string,
  lineEndTime: number,
): string | SyncedLyricsLineText => {
  try {
    const matches = [...line.matchAll(extendedSyncedLyricsLineRegex)];
    extendedSyncedLyricsLineRegex.lastIndex = 0;

    if (matches.length > 0) {
      const extendedSyncLines: SyncedLyricsLineText = matches.map(
        (match, index, arr) => {
          const { groups } = match;
          const res = {
            text: '',
            unparsedText: '',
            start: getSecondsFromExtendedMatch(match),
            end: getExtendedMatchEndTime(arr, index, lineEndTime),
          };

          // if (match.input) res.unparsedText = match.input.trim();
          if (groups) {
            if ('lyric' in groups) {
              res.text = groups.lyric.trim();

              if ('extSyncTimeStamp' in groups)
                res.unparsedText =
                  `${groups.extSyncTimeStamp} ${groups.lyric}`.trim();
            }
          }
          return res;
        },
      );

      return extendedSyncLines;
    }
    return line;
  } catch (error) {
    return line;
  }
};

const parseLyricsText = (
  line: string,
  lineEndTime: number,
): string | SyncedLyricsLineText => {
  const textLine = line.replaceAll(syncedLyricsRegex, '').trim();
  syncedLyricsRegex.lastIndex = 0;

  const isAnExtendedSyncedLine = isAnExtendedSyncedLyricsLine(textLine);

  if (isAnExtendedSyncedLine)
    return getExtendedSyncedLineInfo(line, lineEndTime);

  return textLine;
};

const isNotALyricsMetadataLine = (line: string) =>
  !/^\[\w+:.{1,}\]$/gm.test(line);

// MAIN FUNCTIONS //
const parseLyrics = (lyricsString: string): LyricsData => {
  const output: LyricsData = {
    isSynced: false,
    lyrics: [],
    unparsedLyrics: lyricsString,
    offset: 0,
  };

  output.isSynced = isLyricsSynced(lyricsString);

  const copyrightMatch = copyrightMatchRegex.exec(lyricsString);
  copyrightMatchRegex.lastIndex = 0;
  output.copyright = copyrightMatch?.groups?.copyright || undefined;

  const lyricsOffsetMatch = lyricsOffsetRegex.exec(lyricsString);
  lyricsOffsetRegex.lastIndex = 0;
  output.offset = Number(lyricsOffsetMatch?.groups?.lyricsOffset || 0) / 1000;

  const lines = lyricsString.split('\n');
  const lyricsLines = lines.filter(
    (line) => line.trim() !== '' && isNotALyricsMetadataLine(line),
  );

  const parsedUnsyncedLyricsLines = lyricsLines.map((line) =>
    line.replaceAll(syncedLyricsRegex, '').trim(),
  );
  output.lyrics = parsedUnsyncedLyricsLines;

  if (output.isSynced) {
    output.syncedLyrics = lyricsLines.map((line, index, lyricsLinesArr) => {
      const start = getSecondsFromLyricsLine(line);
      const end = getLyricEndTime(lyricsLinesArr, index);

      const parsedLine = parseLyricsText(line, end);

      return { text: parsedLine, start, end };
    });
  }

  return output;
};

const parseMetadataFromShortText = (shortText?: string) => {
  const metadata: LyricsMetadataFromShortText = { copyright: undefined };

  if (shortText) {
    try {
      const metaFromShortText = JSON.parse(shortText);
      if ('copyright' in metaFromShortText)
        metadata.copyright = metaFromShortText.copyright;
    } catch (error) {
      // log(
      //   'Error occurred when parsing metadata from shortText attribute in NodeID3 format.',
      //   { error },
      //   'INFO',
      // );
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
  index: number,
) => {
  if (arr.length - 1 === index) return Number.POSITIVE_INFINITY;

  for (let i = 0; i < arr.length - index; i += 1) {
    if (arr[index + i]) {
      const { timeStamp } = arr[index + i];
      if (timeStamp !== start) return timeStamp;
    }
  }
  return 0;
};

export const parseSyncedLyricsFromAudioDataSource = (
  input: SyncedLyricsInput,
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

        const parsedTextLine = parseLyricsText(text, end / 1000);

        // divide by 1000 to convert from milliseconds to seconds.
        return {
          text: parsedTextLine,
          start: timeStamp / 1000,
          end: end / 1000,
        };
      },
    );

    const unparsedLyrics = syncedLyrics
      .map((line) => {
        const { text, start } = line;

        const lyricLine =
          typeof text === 'string'
            ? text
            : text
                .map((x) => {
                  startTimestampMatchRegex.lastIndex = 0;
                  if (startTimestampMatchRegex.test(x.unparsedText))
                    return x.text;
                  return x.unparsedText;
                })
                .join(' ');
        const secs = Math.floor(start % 60);
        const secsStr = secs.toString().length > 1 ? secs : `0${secs}`;
        const mins = Math.floor(start / 60);
        const minsStr = mins.toString().length > 1 ? mins : `0${mins}`;
        const hundredths = start.toString().includes('.')
          ? start.toString().split('.').at(-1) || '00'
          : '00';

        return `[${minsStr}:${secsStr}.${hundredths}] ${lyricLine}`;
      })
      .join('\n');

    return {
      isSynced: true,
      copyright: metadata.copyright,
      lyrics,
      syncedLyrics,
      unparsedLyrics,
      offset: 0,
    };
  }
  return undefined;
};

export default parseLyrics;
