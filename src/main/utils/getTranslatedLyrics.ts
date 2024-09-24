import { translate } from '@vitalets/google-translate-api';
import { getCachedLyrics, updateCachedLyrics } from '../core/getSongLyrics';
import parseLyrics, { INSTRUMENTAL_LYRIC_IDENTIFIER } from '../../common/parseLyrics';
import { sendMessageToRenderer } from '../main';
import { version } from '../../../package.json';
import log from '../log';
import {
  getLrcLyricLinesFromParsedLyrics,
  getLrcLyricsMetadata
} from '../core/saveLyricsToLrcFile';

const getTranslatedLyrics = async (languageCode: string) => {
  const cachedLyrics = getCachedLyrics();

  try {
    if (cachedLyrics) {
      const { parsedLyrics } = cachedLyrics.lyrics;

      const lines = parsedLyrics.map((line) => {
        if (typeof line.originalText === 'string') return line.originalText.trim();
        return line.originalText
          .map((x) => x.text)
          .join(' ')
          .trim();
      });
      const { raw } = await translate(lines.join('\n'), { to: languageCode || 'auto' });
      const translatedLang = languageCode || 'en';

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
      if (copyright)
        lyricsArr.push(`[copyright:${copyright}. Lyrics translated using Google Translate.]`);

      for (let i = 0; i < parsedLyrics.length; i++) {
        const lyric = parsedLyrics[i];
        const translatedLyric = raw.sentences.at(i);

        if (translatedLyric && 'trans' in translatedLyric) {
          const translatedText = translatedLyric.trans.trim();
          if (translatedText !== INSTRUMENTAL_LYRIC_IDENTIFIER)
            lyric.translatedTexts.push({
              lang: translatedLang,
              text: translatedText.replaceAll('\n', '')
            });
        }
      }

      const lrcLyricsLines = getLrcLyricLinesFromParsedLyrics(parsedLyrics);
      lyricsArr.push(...lrcLyricsLines);

      if (cachedLyrics.lyrics.translatedLanguages) {
        if (!cachedLyrics.lyrics.translatedLanguages.includes(translatedLang))
          cachedLyrics.lyrics.translatedLanguages.push(translatedLang);
      } else cachedLyrics.lyrics.translatedLanguages = [translatedLang];
      cachedLyrics.lyrics.isTranslated = true;

      const translatedLyrics = parseLyrics(lyricsArr.join('\n'));
      const romanizedLyrics = cachedLyrics.lyrics.parsedLyrics.map((line) => line.romanizedLyrics);
      cachedLyrics.lyrics = translatedLyrics;
      cachedLyrics.lyrics.parsedLyrics.map((line, index) => {
        line.romanizedLyrics = romanizedLyrics[index];
      });

      updateCachedLyrics(() => cachedLyrics);

      sendMessageToRenderer({
        messageCode: 'LYRICS_TRANSLATION_SUCCESS'
      });
    }
    return cachedLyrics;
  } catch (error) {
    log('Error occurred when translating lyrics.', { error }, 'ERROR');
    sendMessageToRenderer({
      messageCode: 'LYRICS_TRANSLATION_FAILED'
    });
    return undefined;
  }
};

export default getTranslatedLyrics;
