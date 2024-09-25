import { getCachedLyrics, updateCachedLyrics } from '../core/getSongLyrics';
import log from '../log';
import { sendMessageToRenderer } from '../main';

const resetLyrics = () => {
  const cachedLyrics = getCachedLyrics();
  try {
    if (!cachedLyrics) return undefined;
    cachedLyrics.lyrics.isConvertedToPinyin = false;
    cachedLyrics.lyrics.isConvertedToRomaji = false;
    cachedLyrics.lyrics.translatedLanguages = [];
    cachedLyrics.lyrics.isTranslated = false;
    cachedLyrics.lyrics.parsedLyrics.forEach((line) => {
      line.convertedLyrics = '';
      line.translatedTexts = [];
    });
    updateCachedLyrics(() => cachedLyrics);
    sendMessageToRenderer({
      messageCode: 'RESET_CONVERTED_LYRICS_SUCCESS'
    });
    return cachedLyrics;
  }
  catch (error) {
    log('Error occurred when reseting converted lyrics.', { error }, 'ERROR');
    sendMessageToRenderer({
      messageCode: 'RESET_CONVERTED_LYRICS_FAILED'
    });
  }
  return undefined;
}

export default resetLyrics;