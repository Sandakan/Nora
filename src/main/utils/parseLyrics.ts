import { TagConstants } from 'node-id3';
// import log from '../log';
import isLyricsSynced, {
  extendedSyncedLyricsLineRegex,
  isAnExtendedSyncedLyricsLine,
  syncedLyricsRegex
} from '../../common/isLyricsSynced';

export type SyncedLyricsInput = NonNullable<NodeID3Tags['synchronisedLyrics']>[number];

export const INSTRUMENTAL_LYRIC_IDENTIFIER = '♪';
const titleMatchRegex = /^\[ti:(?<title>.+)\]$/gm;
const artistMatchRegex = /^\[ar:(?<artist>.+)\]$/gm;
const albumMatchRegex = /^\[al:(?<album>.+)\]$/gm;
const durationMatchRegex = /^\[length:(?<duration>.+)\]$/gm;
const langMatchRegex = /^\[lang:(?<lang>.+)\]$/gm;
const copyrightMatchRegex = /^\[copyright:(?<copyright>.+)\]$/gm;
const lyricLinelangMatchRegex = /\[lang:(?<lang>.+)\](.+)$/gm;
const lyricsOffsetRegex = /^\[offset:(?<lyricsOffset>[+-]?\d+)\]$/gm;

const startTimestampMatchRegex = /(?<extSyncTimeStamp>\[\d+:\d{1,2}\.\d{1,3}\])/gm;

export const getTitleFromLyricsString = (lyricsString: string) => {
  const titleMatch = titleMatchRegex.exec(lyricsString);
  titleMatchRegex.lastIndex = 0;

  return titleMatch?.groups?.title;
};

export const getArtistFromLyricsString = (lyricsString: string) => {
  const artistMatch = artistMatchRegex.exec(lyricsString);
  artistMatchRegex.lastIndex = 0;

  return artistMatch?.groups?.artist;
};

export const getAlbumFromLyricsString = (lyricsString: string) => {
  const albumMatch = albumMatchRegex.exec(lyricsString);
  albumMatchRegex.lastIndex = 0;

  return albumMatch?.groups?.album;
};

export const getDurationFromLyricsString = (lyricsString: string) => {
  const durationMatch = durationMatchRegex.exec(lyricsString);
  durationMatchRegex.lastIndex = 0;

  return durationMatch?.groups?.duration;
};

export const getCopyrightInfoFromLyricsString = (lyricsString: string) => {
  const copyrightMatch = copyrightMatchRegex.exec(lyricsString);
  copyrightMatchRegex.lastIndex = 0;

  return copyrightMatch?.groups?.copyright;
};

export const getLanguageFromLyricsString = (lyricsString: string, regex = langMatchRegex) => {
  const langMatch = regex.exec(lyricsString);
  regex.lastIndex = 0;

  return langMatch?.groups?.lang?.toLowerCase();
};

export const getOffsetFromLyricsString = (lyricsString: string) => {
  const offsetMatch = lyricsOffsetRegex.exec(lyricsString);
  lyricsOffsetRegex.lastIndex = 0;

  return Number(offsetMatch?.groups?.lyricsOffset || 0) / 1000;
};

const getSecondsFromLyricsLine = (lyric: string) => {
  const lyricsStartMatch = lyric.match(syncedLyricsRegex);
  syncedLyricsRegex.lastIndex = 0;
  const replaceRegex = /[[\]]/gm;
  if (Array.isArray(lyricsStartMatch)) {
    const [sec, ms] = lyricsStartMatch[0].replaceAll(replaceRegex, '').split(':');
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

const getLyricEndTime = (lyricsArr: string[], index: number, start: number) => {
  if (lyricsArr.length - 1 === index) return Number.POSITIVE_INFINITY;

  if (lyricsArr[index + 1]) {
    const end = getSecondsFromLyricsLine(lyricsArr[index + 1]);

    if (start === end && lyricsArr[index + 2])
      return getSecondsFromLyricsLine(lyricsArr[index + 2]);
    return end;
  }

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
  lineEndTime: number
) => {
  if (matches.length - 1 === index) return lineEndTime;

  if (matches[index + 1]) return getSecondsFromExtendedMatch(matches[index + 1]);

  return 0;
};

const getExtendedSyncedLineInfo = (
  line: string,
  lineEndTime: number
): string | SyncedLyricsLineWord[] => {
  try {
    const matches = [...line.matchAll(extendedSyncedLyricsLineRegex)];
    extendedSyncedLyricsLineRegex.lastIndex = 0;

    if (matches.length > 0) {
      const extendedSyncLines: SyncedLyricsLineWord[] = matches.map((match, index, arr) => {
        const { groups } = match;
        const res = {
          text: '',
          unparsedText: '',
          start: getSecondsFromExtendedMatch(match),
          end: getExtendedMatchEndTime(arr, index, lineEndTime)
        };

        // if (match.input) res.unparsedText = match.input.trim();
        if (groups) {
          if ('lyric' in groups) {
            res.text = groups.lyric.trim();

            if ('extSyncTimeStamp' in groups)
              res.unparsedText = `${groups.extSyncTimeStamp} ${groups.lyric}`.trim();
          }
        }
        return res;
      });

      return extendedSyncLines;
    }
    return line;
  } catch (error) {
    return line;
  }
};

const parseLyricsText = (line: string, lineEndTime: number): string | SyncedLyricsLineWord[] => {
  const textLine = line.replaceAll(syncedLyricsRegex, '').trim();
  syncedLyricsRegex.lastIndex = 0;

  const isAnExtendedSyncedLine = isAnExtendedSyncedLyricsLine(textLine);

  if (isAnExtendedSyncedLine) return getExtendedSyncedLineInfo(line, lineEndTime);

  return textLine || INSTRUMENTAL_LYRIC_IDENTIFIER;
};

const isNotALyricsMetadataLine = (line: string) => !/^\[\w+:.{1,}\]$/gm.test(line);
const groupLyricsByTime = (lyricsLines: string[]) => {
  const groupedLines: { [key: string]: string[] } = {};
  lyricsLines.forEach((line) => {
    const time = getSecondsFromLyricsLine(line).toString();
    if (!groupedLines[time]) groupedLines[time] = [];
    groupedLines[time].push(line);
  });

  return Object.entries(groupedLines).map(([start, lines]) => {
    return {
      start,
      originalText: lines[0],
      translatedText: lines.length > 1 ? lines.slice(1) : []
    };
  });
};

const parseTranslatedLyricsText = (lines: string[]): TranslatedLyricLine[] => {
  return lines.map((line, i): TranslatedLyricLine => {
    const start = getSecondsFromLyricsLine(line);
    const end = getLyricEndTime(lines, i, start);

    return {
      lang: getLanguageFromLyricsString(line, lyricLinelangMatchRegex) || 'en',
      text: parseLyricsText(line, end)
    };
  });
};

// MAIN FUNCTIONS //
const parseLyrics = (lrcString: string): LyricsData => {
  const output: LyricsData = {
    isSynced: isLyricsSynced(lrcString),
    isTranslated: false,
    parsedLyrics: [],
    unparsedLyrics: lrcString,
    copyright: getCopyrightInfoFromLyricsString(lrcString),
    originalLanguage: getLanguageFromLyricsString(lrcString),
    translatedLanguages: [],
    offset: getOffsetFromLyricsString(lrcString)
  };

  const lines = lrcString
    .split('\n')
    .filter((line) => line.trim() !== '' && isNotALyricsMetadataLine(line));

  const groupedLines = groupLyricsByTime(lines);
  const originalLyricsLines = groupedLines.map((line) => line.originalText);

  output.parsedLyrics = groupedLines.map((line, index) => {
    const start = getSecondsFromLyricsLine(line.originalText);
    const end = getLyricEndTime(originalLyricsLines, index, start);

    const parsedLine = parseLyricsText(line.originalText, end);
    const isEnhancedSynced = typeof parsedLine !== 'string';

    const translatedTexts = parseTranslatedLyricsText(line.translatedText);
    if (translatedTexts.length > 0) output.isTranslated = true;

    translatedTexts.forEach((t) => {
      if (output.translatedLanguages && !output.translatedLanguages.includes(t.lang))
        output.translatedLanguages.push(t.lang);
    });

    return {
      originalText: parsedLine,
      translatedTexts,
      isEnhancedSynced,
      start,
      end
    };
  });

  return output;
};
const parseMetadataFromShortText = (shortText?: string) => {
  const metadata: LyricsMetadataFromShortText = { copyright: undefined };

  if (shortText) {
    try {
      const metaFromShortText = JSON.parse(shortText);
      if ('copyright' in metaFromShortText) metadata.copyright = metaFromShortText.copyright;
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
  index: number
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
  input: SyncedLyricsInput
): LyricsData | undefined => {
  const { timeStampFormat, synchronisedText, shortText } = input;

  if (timeStampFormat === TagConstants.TimeStampFormat.MILLISECONDS) {
    const metadata = parseMetadataFromShortText(shortText);

    const lyrics: LyricLine[] = synchronisedText.map((line, index, arr) => {
      // timeStamp = start of the line
      const { text, timeStamp } = line;

      const end = getNextTimestamp(arr, timeStamp, index);

      const parsedTextLine = parseLyricsText(text, end / 1000);

      // divide by 1000 to convert from milliseconds to seconds.
      return {
        originalText: parsedTextLine,
        translatedTexts: [],
        start: timeStamp / 1000,
        end: end / 1000,
        isEnhancedSynced: typeof parsedTextLine !== 'string'
      };
    });

    const unparsedLyrics = lyrics
      .map((line) => {
        const { originalText: text, start = 0 } = line;

        const lyricLine =
          typeof text === 'string'
            ? text
            : text
                .map((x) => {
                  startTimestampMatchRegex.lastIndex = 0;
                  if (startTimestampMatchRegex.test(x.unparsedText)) return x.text;
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
      isTranslated: false,
      copyright: metadata.copyright,
      parsedLyrics: lyrics,
      unparsedLyrics,
      offset: 0
    };
  }
  return undefined;
};

export default parseLyrics;
