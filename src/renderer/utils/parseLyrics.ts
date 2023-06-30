import isLyricsSynced, { syncedLyricsRegex } from 'main/utils/isLyricsSynced';
import { EditingLyricsLineData } from 'renderer/components/LyricsEditingPage/LyricsEditingPage';
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
  if (lyricsArr.length - 1 === index) return Infinity;

  if (lyricsArr[index + 1])
    return getSecondsFromLyricsLine(lyricsArr[index + 1]);

  return 0;
};

const parseLyricsText = (line: string) => {
  const replacedLine = line.replaceAll(syncedLyricsRegex, '');
  syncedLyricsRegex.lastIndex = 0;
  return replacedLine;
};

const parseLyrics = (str: string) => {
  let syncedLyrics: EditingLyricsLineData[] = [];
  let unsyncedLyrics: string[] = [];

  const isSynced = isLyricsSynced(str);

  const splittedLines = str.split('\n');
  const trimmedLines = splittedLines.map((line) => line.trim());
  const filteredLines = trimmedLines.filter(
    (line) => line && isNotALyricsMetadataLine(line)
  );

  if (isSynced) {
    syncedLyrics = filteredLines.map((line, index, lyricsLinesArr) => {
      const start = getSecondsFromLyricsLine(line);
      const end = getLyricEndTime(lyricsLinesArr, index);

      const parsedLine = parseLyricsText(line);

      return { line: parsedLine, start, end };
    });
  }

  unsyncedLyrics = filteredLines.map((line) => parseLyricsText(line));

  return { isSynced, syncedLyrics, unsyncedLyrics };
};

export default parseLyrics;
