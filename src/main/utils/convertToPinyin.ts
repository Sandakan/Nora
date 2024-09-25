import { getCachedLyrics, updateCachedLyrics } from '../core/getSongLyrics';
import log from '../log';
import { sendMessageToRenderer } from '../main';
import { getLrcLyricsMetadata } from '../core/saveLyricsToLrcFile';
import { version } from '../../../package.json';
import { INSTRUMENTAL_LYRIC_IDENTIFIER } from '../../common/parseLyrics';
import pinyin from "pinyin";
import detectChinese from '@neos21/detect-chinese';

const isChineseString = async (str: string) => {
  if (!str) return false;
  var detection = detectChinese.detect(str);
  if (detection.language === 'cn')
    return true;
  for (let i = 0; i < str.length; i++) {
    if (pinyin.pinyin(str[i])[0][0] != str[i])
      return true;
  }
  return false;
}

export const convertLyricsToPinyin = () => {
  const cachedLyrics = getCachedLyrics();
  try {
    if (!cachedLyrics) return undefined;
    const { parsedLyrics } = cachedLyrics.lyrics;
    const lines = parsedLyrics.map((line) => {
      if (typeof line.originalText === 'string') return line.originalText.trim();
      return line.originalText
        .map((x) => x.text)
        .join(' ')
        .trim();
    });

    const pinyinLyrics: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!isChineseString(line)) pinyinLyrics.push('');
      else {
        const strsToReplace = [' , ', ' . ', ' ? ', ' ! ', ' ; ', ' ) ', ' ( '];
        const strsReplace = [', ', '. ', '? ', '! ', '; ', ') ', ' ('];
        let pinyinLyric = pinyin.pinyin(line).map(s => s[0]).join(' ');
        for (let j = 0; j < strsToReplace.length; j++) {
          pinyinLyric = pinyinLyric.replaceAll(strsToReplace[j], strsReplace[j]);
        }
        pinyinLyrics.push(pinyinLyric);
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
      const pinyinLyric = pinyinLyrics.at(i);

      if (pinyinLyric) {
        const convertedText = pinyinLyric.trim();
        if (convertedText !== INSTRUMENTAL_LYRIC_IDENTIFIER)
          lyric.convertedLyrics = convertedText.replaceAll('\n', '');
      }
      else 
        lyric.convertedLyrics = '';
    }

    cachedLyrics.lyrics.isConvertedToPinyin = true;
    cachedLyrics.lyrics.isConvertedToRomaji = false;
    cachedLyrics.lyrics.parsedLyrics = parsedLyrics;

    updateCachedLyrics(() => cachedLyrics);

    sendMessageToRenderer({
      messageCode: 'LYRICS_CONVERT_SUCCESS'
    });
    return cachedLyrics;
  }
  catch (error) {
    log('Error occurred when converting lyrics.', { error }, 'ERROR');
    sendMessageToRenderer({
      messageCode: 'LYRICS_CONVERT_FAILED'
    });
  }
  return undefined;
}