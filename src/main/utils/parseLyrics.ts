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
    const x = lyricsStartMatch[0].replaceAll(/[[\]]/gm, '').split(':');
    return parseInt(x[0], 10) * 60 + parseFloat(x[1]);
  }
  return 0;
};

const getLyricEndTime = (lyricsArr: string[], index: number) => {
  if (lyricsArr.length - 1 === index) return Infinity;

  if (lyricsArr[index + 1])
    return getSecondsFromLyricsLine(lyricsArr[index + 1]);

  return 0;
};

const isALyricsMetadataLine = (line: string) =>
  !/(^\[\w+:.{1,}\]$)/gm.test(line);

// MAIN FUNCTIONS //
const parseLyrics = (lyricsString: string): LyricsData => {
  const isSynced = isLyricsSynced(lyricsString);

  const lines = lyricsString.split('\n');
  const lyricsLines = lines.filter(
    (line) => line.trim() !== '' && isALyricsMetadataLine(line)
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
    };
  }

  return {
    isSynced,
    lyrics: parsedUnsyncedLyricsLines,
    unparsedLyrics: lyricsString,
  };
};

export const parseSyncedLyricsFromAudioDataSource = (
  input: Input
): LyricsData | undefined => {
  const { timeStampFormat, synchronisedText } = input;
  /*
    timeStampFormat
        1: MPEG frames unit
        2: milliseconds unit
 */
  if (timeStampFormat === 2) {
    const lyrics = synchronisedText.map((line) => line.text);

    const syncedLyrics: SyncedLyricLine[] = synchronisedText.map(
      (line, index, arr) => {
        // timeStamp = start of the line
        const { text, timeStamp } = line;

        const end =
          arr.length - 1 === index
            ? Infinity
            : arr[index + 1] !== undefined
            ? arr[index + 1].timeStamp
            : 0;

        return { text, start: timeStamp, end };
      }
    );

    const unparsedLyrics = syncedLyrics
      .map((line) => {
        const { text, start } = line;
        const secs = Math.floor(start % 60);
        const mins = Math.floor(start / 60);
        const hundredths = start.toString().includes('.')
          ? parseInt(start.toString().split('.').at(-1) || '0', 10)
          : 0;
        return `[
        ${mins.toString().length > 1 ? mins : `0${mins}`}
        .${secs.toString().length > 1 ? secs : `0${secs}`}
        .${hundredths}] ${text}`;
      })
      .join('\n');

    return { isSynced: true, lyrics, syncedLyrics, unparsedLyrics };
  }
  return undefined;
};

export default parseLyrics;
