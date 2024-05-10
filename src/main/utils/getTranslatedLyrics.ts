import { translate } from '@vitalets/google-translate-api';
import { getCachedLyrics, updateCachedLyrics } from '../core/getSongLyrics';
import parseLyrics from './parseLyrics';
import { sendMessageToRenderer } from '../main';
import log from '../log';

const getTranslatedLyrics = async (languageCode: string) => {
  const cachedLyrics = getCachedLyrics();

  try {
    if (cachedLyrics) {
      const { unparsedLyrics } = cachedLyrics.lyrics;

      const { text } = await translate(unparsedLyrics, { to: languageCode || 'auto' });

      // const y = raw.sentences.map((x) => {
      //   if ('trans' in x && 'orig' in x) {
      //       const { orig, trans } = x;

      //   }
      // });
      const lyrics = parseLyrics(text);
      cachedLyrics.lyrics = lyrics;
      cachedLyrics.isTranslated = true;

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
