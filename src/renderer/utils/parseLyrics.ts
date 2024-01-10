import isLyricsSynced, {
  extendedSyncedLyricsLineRegex,
  isAnExtendedSyncedLyricsLine,
  syncedLyricsRegex,
} from 'main/utils/isLyricsSynced';
import roundTo from './roundTo';

const isNotALyricsMetadataLine = (line: string) =>
  !/^\[\w+:.{1,}\]$/gm.test(line);

const getSecondsFromLyricsLine = (lyric: string) => {
  const lyricsStartMatch = lyric.match(syncedLyricsRegex);
  syncedLyricsRegex.lastIndex = 0;
  const replaceRegex = /[[\]]/gm;
  if (Array.isArray(lyricsStartMatch)) {
    const [sec, ms] = lyricsStartMatch[0]
      .replaceAll(replaceRegex, '')
      .split(':');
    replaceRegex.lastIndex = 0;

    return roundTo(parseInt(sec) * 60 + parseFloat(ms), 2);
  }
  return 0;
};

const getLyricEndTime = (lyricsArr: string[], index: number) => {
  if (lyricsArr.length - 1 === index) return Number.POSITIVE_INFINITY;

  if (lyricsArr[index + 1])
    return getSecondsFromLyricsLine(lyricsArr[index + 1]);

  return 0;
};

const getSecondsFromExtendedTimeStamp = (text: string) => {
  // eslint-disable-next-line no-useless-escape
  const extendedReplaceRegex = /[<>\[\]]/gm;

  const [sec, ms] = text.replaceAll(extendedReplaceRegex, '').split(':');
  extendedReplaceRegex.lastIndex = 0;

  return parseInt(sec) * 60 + parseFloat(ms);
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

const parseLyricsText = (line: string, lineEndTime?: number) => {
  const textLine = line.replaceAll(syncedLyricsRegex, '').trim();
  syncedLyricsRegex.lastIndex = 0;

  const isAnExtendedSyncedLine = isAnExtendedSyncedLyricsLine(textLine);

  if (isAnExtendedSyncedLine && lineEndTime !== undefined)
    return getExtendedSyncedLineInfo(line, lineEndTime);
  return textLine;
};

const parseLyrics = (str: string) => {
  let syncedLyrics: SyncedLyricLine[] = [];
  let unsyncedLyrics: string[] = [];

  const isSynced = isLyricsSynced(str);

  const splittedLines = str.split('\n');
  const trimmedLines = splittedLines.map((line) => line.trim());
  const filteredLines = trimmedLines.filter(
    (line) => line && isNotALyricsMetadataLine(line),
  );

  if (isSynced) {
    syncedLyrics = filteredLines.map((line, index, lyricsLinesArr) => {
      const start = getSecondsFromLyricsLine(line);
      const end = getLyricEndTime(lyricsLinesArr, index);

      const parsedLine = parseLyricsText(line, end);

      return { text: parsedLine, start, end };
    });
  }

  unsyncedLyrics = filteredLines.map((line) => parseLyricsText(line) as string);

  return { isSynced, syncedLyrics, unsyncedLyrics };
};

export default parseLyrics;
