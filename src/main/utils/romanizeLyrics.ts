import { getCachedLyrics, updateCachedLyrics } from '../core/getSongLyrics';
import log from '../log';
import { sendMessageToRenderer } from '../main';
import { getLrcLyricsMetadata } from '../core/saveLyricsToLrcFile';
import { version } from '../../../package.json';
import { INSTRUMENTAL_LYRIC_IDENTIFIER } from '../../common/parseLyrics';
import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import Wanakana from 'wanakana';

const kuroshiro = new Kuroshiro();
await kuroshiro.init(new KuromojiAnalyzer());

const hasJapaneseCharacter = (str: string) => {
  if (!str) return false;
  for (const c of str) {
    if (Kuroshiro.Util.isJapanese(c)) return true;
  }
  return false;
};

const romanizeLyrics = async () => {
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

    const romanizedLyrics: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!hasJapaneseCharacter(line)) romanizedLyrics.push('');
      else {
        const strsToReplace = [' , ', ' . ', ' ? ', ' ! ', ' ; ', ' ) ', ' ( '];
        const strsReplace = [', ', '. ', '? ', '! ', '; ', ') ', ' ('];
        // var romanized = ' ' + (await kuroshiro.convert(line, { to: 'romaji', mode: 'spaced' })) + ' ';
        // for (let j = 0; j < strsToReplace.length; j++) {
        //   romanized = romanized.replaceAll(strsToReplace[j], strsReplace[j]);
        // }
        // romanizedLyrics.push(romanized.trim());

        //convert lyrics to katakana then to romaji
        const kana = await kuroshiro.convert(line, { to: 'katakana', mode: 'spaced' });

        let romanized =
          ' ' + Wanakana.toRomaji(kana, { customRomajiMapping: { '「': '「', '」': '」' } }) + ' ';
        for (let j = 0; j < strsToReplace.length; j++) {
          romanized = romanized.replaceAll(strsToReplace[j], strsReplace[j]);
        }
        romanizedLyrics.push(romanized.trim());
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
    if (copyright) lyricsArr.push(`[copyright:${copyright}. Lyrics romanized using Kuroshiro.]`);

    for (let i = 0; i < parsedLyrics.length; i++) {
      const lyric = parsedLyrics[i];
      const romanizedLyric = romanizedLyrics.at(i);

      if (romanizedLyric) {
        const romanizedText = romanizedLyric.trim();
        if (romanizedText !== INSTRUMENTAL_LYRIC_IDENTIFIER)
          lyric.convertedLyrics = romanizedText.replaceAll('\n', '');
      } else lyric.convertedLyrics = '';
    }

    cachedLyrics.lyrics.isConvertedToRomaji = true;
    cachedLyrics.lyrics.isConvertedToPinyin = false;
    cachedLyrics.lyrics.isConvertedToRomaja = false;
    cachedLyrics.lyrics.parsedLyrics = parsedLyrics;

    updateCachedLyrics(() => cachedLyrics);

    sendMessageToRenderer({
      messageCode: 'LYRICS_CONVERT_SUCCESS'
    });
    return cachedLyrics;
  } catch (error) {
    log('Error occurred when converting lyrics.', { error }, 'ERROR');
    sendMessageToRenderer({
      messageCode: 'LYRICS_CONVERT_FAILED'
    });
  }

  return undefined;
};

export default romanizeLyrics;
