import { version } from '../../../package.json';
import { INSTRUMENTAL_LYRIC_IDENTIFIER } from '../../common/parseLyrics';
import { getCachedLyrics, updateCachedLyrics } from '../core/getSongLyrics';
import { getLrcLyricsMetadata } from '../core/saveLyricsToLrcFile';
import logger from '../logger';
import { sendMessageToRenderer } from '../main';

type PinyinFn = typeof import('pinyin-pro').pinyin;
type DetectChineseMod = typeof import('@neos21/detect-chinese');

const hasConvertibleCharacter = (
  str: string,
  pinyinFn: PinyinFn,
  detectChineseMod: DetectChineseMod
) => {
  if (!str) return false;
  const detection = detectChineseMod.detect(str);
  if (detection.language === 'cn') return true;
  for (let i = 0; i < str.length; i++) {
    if (pinyinFn(str[i]) != str[i]) return true;
  }
  return false;
};

const convertText = (str: string, pinyinFn: PinyinFn) => {
  const strsToReplace = ['  ', ' ,', ' .', ' ?', ' !', ' ;', ' )', '( '];
  const strsReplace = [' ', ',', '.', '?', '!', ';', ')', '('];
  let convertedText = pinyinFn(str, { nonZh: 'consecutive' });
  for (let j = 0; j < strsToReplace.length; j++)
    convertedText = convertedText.replaceAll(strsToReplace[j], strsReplace[j]);
  return convertedText.trim();
};

const convertLyricsToPinyin = async () => {
  const cachedLyrics = getCachedLyrics();
  try {
    if (!cachedLyrics) return undefined;

    const [{ pinyin }, detectChineseModule] = await Promise.all([
      import('pinyin-pro'),
      import('@neos21/detect-chinese')
    ]);
    const detectChinese: DetectChineseMod =
      'default' in detectChineseModule
        ? (detectChineseModule as { default: DetectChineseMod }).default
        : detectChineseModule;

    const { parsedLyrics } = cachedLyrics.lyrics;
    const lines: (string | SyncedLyricsLineWord[])[] = parsedLyrics.map(
      (line) => line.originalText
    );

    const convertedLyrics: string[][] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (typeof line === 'string') {
        if (!hasConvertibleCharacter(line, pinyin, detectChinese)) convertedLyrics.push([]);
        else convertedLyrics.push([convertText(line, pinyin)]);
      } else {
        const convertedSyncedWords: string[] = [];
        let convertedWordsCount = 0;
        for (let j = 0; j < line.length; j++) {
          const word = line[j];
          if (!hasConvertibleCharacter(word.text, pinyin, detectChinese))
            convertedSyncedWords.push(word.text.trim());
          else {
            convertedSyncedWords.push(convertText(word.text, pinyin));
            convertedWordsCount++;
          }
        }
        if (convertedWordsCount > 0) convertedLyrics.push(convertedSyncedWords);
        else convertedLyrics.push([]);
      }
    }

    const lyricsArr: string[] = [];
    const { title, artist, album, lang, length, offset, copyright } =
      getLrcLyricsMetadata(cachedLyrics);

    lyricsArr.push(`[re:Nora (https://github.com/Sandakan/Nora)]`);
    lyricsArr.push(`[ve:${version}]`);
    lyricsArr.push(`[ti:${title}]`);

    if (artist) lyricsArr.push(`[ar:${artist}]`);
    if (album) lyricsArr.push(`[al:${album}]`);
    if (lang) lyricsArr.push(`[lang:${lang}]`);
    if (length) lyricsArr.push(`[length:${length}]`);
    if (typeof offset === 'number') lyricsArr.push(`[offset:${offset}]`);
    if (copyright) lyricsArr.push(`[copyright:${copyright}]`);

    for (let i = 0; i < parsedLyrics.length; i++) {
      const lyric = parsedLyrics[i];
      const convertedLyric = convertedLyrics.at(i);
      if (!convertedLyric || convertedLyric.length === 0) {
        lyric.romanizedText = '';
        continue;
      }
      if (lyric.isEnhancedSynced) {
        const enhancedLyrics: SyncedLyricsLineWord[] = new Array<SyncedLyricsLineWord>(
          lyric.originalText.length
        );
        for (let j = 0; j < enhancedLyrics.length; j++) {
          const originalEnhancedLyric = lyric.originalText.at(j) as SyncedLyricsLineWord;
          const enhancedLyric = {
            text: convertedLyric[j].trim().replaceAll('\n', ''),
            start: originalEnhancedLyric.start,
            end: originalEnhancedLyric.end,
            unparsedText: originalEnhancedLyric.unparsedText
          };
          enhancedLyrics[j] = enhancedLyric;
        }
        lyric.romanizedText = enhancedLyrics;
      } else {
        const convertedText = convertedLyric[0].trim();
        if (convertedText !== INSTRUMENTAL_LYRIC_IDENTIFIER) lyric.romanizedText = convertedText;
      }
    }
    cachedLyrics.lyrics.isRomanized = true;
    cachedLyrics.lyrics.parsedLyrics = parsedLyrics;

    updateCachedLyrics(() => cachedLyrics);

    sendMessageToRenderer({
      messageCode: 'LYRICS_CONVERT_SUCCESS'
    });
    return cachedLyrics;
  } catch (error) {
    logger.error('Failed to convert lyrics to pinyin.', { error });
    sendMessageToRenderer({
      messageCode: 'LYRICS_CONVERT_FAILED'
    });
  }

  return undefined;
};

export default convertLyricsToPinyin;
