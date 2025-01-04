import { getCachedLyrics, updateCachedLyrics } from '../core/getSongLyrics';
import logger from '../logger';
import { sendMessageToRenderer } from '../main';

const resetLyrics = () => {
  const cachedLyrics = getCachedLyrics();
  try {
    if (!cachedLyrics) return undefined;
    cachedLyrics.lyrics.isRomanized = false;
    cachedLyrics.lyrics.translatedLanguages = [];
    cachedLyrics.lyrics.isReset = true;
    cachedLyrics.lyrics.isTranslated = false;
    cachedLyrics.lyrics.parsedLyrics.forEach((line) => {
      line.romanizedText = '';
      line.translatedTexts = [];
    });
    updateCachedLyrics(() => cachedLyrics);
    sendMessageToRenderer({
      messageCode: 'RESET_CONVERTED_LYRICS_SUCCESS'
    });
    return cachedLyrics;
  } catch (error) {
    logger.error('Failed to reset converted lyrics.', { error });
    sendMessageToRenderer({
      messageCode: 'RESET_CONVERTED_LYRICS_FAILED'
    });
  }
  return undefined;
};

export default resetLyrics;
