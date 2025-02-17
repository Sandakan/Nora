import { TagConstants } from 'node-id3';
// import logger from '../main/logger';
import isLyricsSynced, {
  EXTENDED_SYNCED_LYRICS_LINE_REGEX,
  LYRICS_LINE_REGEX,
  SYNCED_LYRICS_REGEX,
  isAnExtendedSyncedLyricsLine
} from './isLyricsSynced';
import Kuroshiro from '@sglkc/kuroshiro';
import detectChinese from '@neos21/detect-chinese';
import { pinyin } from 'pinyin-pro';
import isHangul from 'romaja/src/hangul/isHangul.js';

export type SyncedLyricsInput = NonNullable<NodeID3Tags['synchronisedLyrics']>[number];

export const INSTRUMENTAL_LYRIC_IDENTIFIER = '♪';
const TITLE_MATCH_REGEX = /^\[ti:(?<title>.+)\]$/gm;
const ARTIST_MATCH_REGEX = /^\[ar:(?<artist>.+)\]$/gm;
const ALBUM_MATCH_REGEX = /^\[al:(?<album>.+)\]$/gm;
const DURATION_MATCH_REGEX = /^\[length:(?<duration>.+)\]$/gm;
const LANG_MATCH_REGEX = /^\[lang:(?<lang>.+)\]$/gm;
const COPYRIGHT_MATCH_REGEX = /^\[copyright:(?<copyright>.+)\]$/gm;
const LYRIC_LINE_LANG_MATCH_REGEX = /\[lang:(?<lang>.+)\](.+)$/gm;
const LYRIC_OFFSET_MATCH_REGEX = /^\[offset:(?<lyricsOffset>[+-]?\d+)\]$/gm;
const START_TIMESTAMP_MATCH_REGEX = /(?<extSyncTimeStamp>\[\d+:\d{1,2}\.\d{1,3}\])/gm;

export const getTitleFromLyricsString = (lyricsString: string) => {
  const titleMatch = TITLE_MATCH_REGEX.exec(lyricsString);
  TITLE_MATCH_REGEX.lastIndex = 0;

  return titleMatch?.groups?.title;
};

export const getArtistFromLyricsString = (lyricsString: string) => {
  const artistMatch = ARTIST_MATCH_REGEX.exec(lyricsString);
  ARTIST_MATCH_REGEX.lastIndex = 0;

  return artistMatch?.groups?.artist;
};

export const getAlbumFromLyricsString = (lyricsString: string) => {
  const albumMatch = ALBUM_MATCH_REGEX.exec(lyricsString);
  ALBUM_MATCH_REGEX.lastIndex = 0;

  return albumMatch?.groups?.album;
};

export const getDurationFromLyricsString = (lyricsString: string) => {
  const durationMatch = DURATION_MATCH_REGEX.exec(lyricsString);
  DURATION_MATCH_REGEX.lastIndex = 0;

  return durationMatch?.groups?.duration;
};

export const getCopyrightInfoFromLyricsString = (lyricsString: string) => {
  const copyrightMatch = COPYRIGHT_MATCH_REGEX.exec(lyricsString);
  COPYRIGHT_MATCH_REGEX.lastIndex = 0;

  return copyrightMatch?.groups?.copyright;
};

export const getLanguageFromLyricsString = (lyricsString: string, regex = LANG_MATCH_REGEX) => {
  const langMatch = regex.exec(lyricsString);
  regex.lastIndex = 0;

  return langMatch?.groups?.lang?.toLowerCase();
};

export const getOffsetFromLyricsString = (lyricsString: string) => {
  const offsetMatch = LYRIC_OFFSET_MATCH_REGEX.exec(lyricsString);
  LYRIC_OFFSET_MATCH_REGEX.lastIndex = 0;

  return Number(offsetMatch?.groups?.lyricsOffset || 0) / 1000;
};

const getSecondsFromLyricsLine = (lyric: string) => {
  const lyricsStartMatch = SYNCED_LYRICS_REGEX.exec(lyric);
  SYNCED_LYRICS_REGEX.lastIndex = 0;

  if (lyricsStartMatch && lyricsStartMatch?.groups) {
    const { sec, ms } = lyricsStartMatch.groups;

    return parseInt(sec.trim()) * 60 + parseFloat(ms.trim());
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

  if (lyricsArr[index + 1]) {
    const end = getSecondsFromLyricsLine(lyricsArr[index + 1]);
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
    const matches = [...line.matchAll(EXTENDED_SYNCED_LYRICS_LINE_REGEX)];
    EXTENDED_SYNCED_LYRICS_LINE_REGEX.lastIndex = 0;

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
  const textLine = line.replaceAll(SYNCED_LYRICS_REGEX, '').trim();
  SYNCED_LYRICS_REGEX.lastIndex = 0;

  const isAnExtendedSyncedLine = isAnExtendedSyncedLyricsLine(textLine);

  if (isAnExtendedSyncedLine) return getExtendedSyncedLineInfo(line, lineEndTime);

  return textLine || INSTRUMENTAL_LYRIC_IDENTIFIER;
};

const isNotALyricsMetadataLine = (line: string) => !/^\[\w+:.{1,}\]$/gm.test(line);

const partiallyParseLrcLyricLine = (line: string) => {
  const match = LYRICS_LINE_REGEX.exec(line);
  LYRICS_LINE_REGEX.lastIndex = 0;

  if (match?.groups) {
    const { timestamp, lang, lyric } = match.groups;

    return {
      input: line,
      timestamp,
      lang,
      lyric
    };
  }

  return undefined;
};

const groupOriginalAndTranslatedLyricLines = (lyricsLines: string[], isSynced: boolean) => {
  const partiallyParsedLines = lyricsLines
    .map((line) => partiallyParseLrcLyricLine(line))
    .filter((line) => line !== undefined);

  if (isSynced) {
    const groupedLines: { [key: string]: typeof partiallyParsedLines } = {};

    partiallyParsedLines.forEach((line) => {
      const time = getSecondsFromLyricsLine(line.input).toFixed(2);

      if (!groupedLines[time]) groupedLines[time] = [];
      groupedLines[time].push(line);
    });

    return Object.entries(groupedLines).map(([, lines]) => {
      return {
        original: lines[0],
        translated: lines.length > 1 ? lines.slice(1) : []
      };
    });
  } else {
    const groupedLines: { [key: string]: typeof partiallyParsedLines } = {};
    let lineCount = -1;

    partiallyParsedLines.forEach((line) => {
      if (line.lang === undefined) lineCount++;

      if (!groupedLines[lineCount]) groupedLines[lineCount] = [];
      groupedLines[lineCount].push(line);
    });

    return Object.entries(groupedLines).map(([, lines]) => {
      return {
        original: lines[0],
        translated: lines.length > 1 ? lines.slice(1) : []
      };
    });
  }
};

const parseTranslatedLyricsText = (lines: string[]): TranslatedLyricLine[] => {
  return lines.map((line, i): TranslatedLyricLine => {
    // const start = getSecondsFromLyricsLine(line);
    const end = getLyricEndTime(lines, i);

    return {
      lang: getLanguageFromLyricsString(line, LYRIC_LINE_LANG_MATCH_REGEX) || 'en',
      text: parseLyricsText(line, end)
    };
  });
};

const getPrecentageJP = (str: string) => {
  if (!str) return 0;
  let count = 0;
  for (const c of str) {
    if (Kuroshiro.Util.isJapanese(c)) count++;
  }
  return count / str.length;
};

const getPrecentageCN = (str: string) => {
  if (!str) return 0;
  const detection = detectChinese.detect(str);
  if (detection.language === 'cn') return 1;
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (pinyin(str[i]) != str[i]) count++;
  }
  return count / str.length;
};

const getPrecentageKR = (str: string) => {
  if (!str) return 0;
  str = str.replaceAll(' ', '');
  let count = 0;
  for (const c of str) {
    if (isHangul(c)) count++;
  }
  return count / str.length;
};

// MAIN FUNCTIONS //
const parseLyrics = (lrcString: string): LyricsData => {
  const output: LyricsData = {
    isSynced: isLyricsSynced(lrcString),
    isTranslated: false,
    isRomanized: false,
    isReset: false,
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

  const groupedLines = groupOriginalAndTranslatedLyricLines(lines, output.isSynced);
  const originalLyricsLines = groupedLines.map((line) => line.original.input);

  let plainLyrics = originalLyricsLines.join('');
  if (output.isSynced) {
    plainLyrics = groupedLines
      .map((line) => {
        const lrcLine = parseLyricsText(
          line.original.input,
          getSecondsFromLyricsLine(line.original.input)
        );
        if (typeof lrcLine == 'string') return lrcLine as string;
        else return lrcLine.map((x) => x.text).join('');
      })
      .join('');
  }
  if (!output.originalLanguage) {
    const japanesePercentage = getPrecentageJP(plainLyrics);
    const chinesePercentage = getPrecentageCN(plainLyrics);
    const koreanPercentage = getPrecentageKR(plainLyrics);
    if (koreanPercentage > 0.5) output.originalLanguage = 'ko';
    else if (chinesePercentage > 0 && japanesePercentage > 0) {
      if (chinesePercentage >= japanesePercentage && chinesePercentage > 0.5)
        output.originalLanguage = 'zh';
      else if (japanesePercentage > chinesePercentage && japanesePercentage > 0.5)
        output.originalLanguage = 'ja';
    }
  }

  output.parsedLyrics = groupedLines.map((line, index) => {
    if (output.isSynced) {
      const start = getSecondsFromLyricsLine(line.original.input);
      const end = getLyricEndTime(originalLyricsLines, index);

      const parsedLine = parseLyricsText(line.original.input, end);
      const isEnhancedSynced = typeof parsedLine !== 'string';

      const translatedTexts = parseTranslatedLyricsText(line.translated.map((t) => t.input));
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
        end,
        convertedLyrics: ''
      };
    }

    const translatedTexts = line.translated.map((t) => {
      if (output.translatedLanguages && !output.translatedLanguages.includes(t.lang))
        output.translatedLanguages.push(t.lang);

      return { lang: t.lang, text: t.lyric.trim() };
    });
    if (translatedTexts.length > 0) output.isTranslated = true;

    return {
      originalText: line.original.lyric.trim(),
      translatedTexts,
      isEnhancedSynced: false,
      start: undefined,
      end: undefined,
      convertedLyrics: ''
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
      console.error(
        'Error occurred when parsing metadata from shortText attribute in NodeID3 format.',
        { error }
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
        isEnhancedSynced: typeof parsedTextLine !== 'string',
        convertedLyrics: ''
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
                  START_TIMESTAMP_MATCH_REGEX.lastIndex = 0;
                  if (START_TIMESTAMP_MATCH_REGEX.test(x.unparsedText)) return x.text;
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

    const plainLyrics = lyrics.map((line) => line.originalText).join('');
    let originalLanguage: string | undefined;
    const japanesePercentage = getPrecentageJP(plainLyrics);
    const chinesePercentage = getPrecentageCN(plainLyrics);
    const koreanPercentage = getPrecentageKR(plainLyrics);
    if (koreanPercentage > 0.5) originalLanguage = 'ko';
    else if (chinesePercentage > 0 && japanesePercentage > 0) {
      if (chinesePercentage >= japanesePercentage && chinesePercentage > 0.5)
        originalLanguage = 'zh';
      else if (japanesePercentage > chinesePercentage && japanesePercentage > 0.5)
        originalLanguage = 'ja';
    }
    return {
      isSynced: true,
      isTranslated: false,
      copyright: metadata.copyright,
      parsedLyrics: lyrics,
      unparsedLyrics,
      originalLanguage,
      translatedLanguages: [],
      offset: 0,
      isRomanized: false,
      isReset: false
    };
  }
  return undefined;
};

export default parseLyrics;
