import { getCachedLyrics, updateCachedLyrics } from '../core/getSongLyrics';
import log from '../log';
import { sendMessageToRenderer } from '../main';
import { getLrcLyricsMetadata } from '../core/saveLyricsToLrcFile';
import { version } from '../../../package.json';
import { INSTRUMENTAL_LYRIC_IDENTIFIER } from '../../common/parseLyrics';
import { romanize } from 'romaja/src/romanize.js';
import isHangul from 'romaja/src/hangul/isHangul.js';

const hasKoreanCharacter = (str: string) => {
  if (!str) return false;
  for (const c of str) {
    if (isHangul(c)) return true;
  }
  return false;
}

const convertLyricsToRomaja = () => {
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

    const koreanLyrics: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!hasKoreanCharacter(line)) koreanLyrics.push('');
      else {
        // const strsToReplace = [' , ', ' . ', ' ? ', ' ! ', ' ; ', ' ) ', ' ( '];
        // const strsReplace = [', ', '. ', '? ', '! ', '; ', ') ', ' ('];
        let koreanLyric = romanize(line);
        // for (let j = 0; j < strsToReplace.length; j++) {
        //   koreanLyric = koreanLyric.replaceAll(strsToReplace[j], strsReplace[j]);
        // }
        koreanLyrics.push(koreanLyric);
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
      const koreanLyric = koreanLyrics.at(i);

      if (koreanLyric) {
        const convertedText = koreanLyric.trim();
        if (convertedText !== INSTRUMENTAL_LYRIC_IDENTIFIER)
          lyric.convertedLyrics = convertedText.replaceAll('\n', '');
      }
      else 
        lyric.convertedLyrics = '';
    }

    cachedLyrics.lyrics.isConvertedToRomaja = true;
    cachedLyrics.lyrics.isConvertedToPinyin = false;
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

export default convertLyricsToRomaja;