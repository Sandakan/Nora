// romanize.d.ts

declare module 'romaja/src/romanize.js' {
  /**
   * Transforms a given string by replacing each Hangul character-containing substring with romaja.
   * @param {string} text - The text to be romanized.
   * @param {Object} [options] - Optional settings for romanization.
   * @param {boolean} [options.ruby] - Whether to include ruby annotations.
   * @returns {string} - The romanized text.
   */
  function romanize(text: string, options?: { ruby?: boolean }): string;

  /**
   * Transform a Hangul encoded string to Roman equivalent.
   * @param {string} word - The word to be romanized.
   * @param {Object} options - Optional settings for romanization.
   * @param {string} [options.method] - The romanization method to use.
   * @param {boolean} [options.hyphenate] - Whether to hyphenate the romanized syllables.
   * @returns {string} - The romanized word.
   */
  function romanizeWord(word: string, options?: { method?: string; hyphenate?: boolean }): string;

  export { romanize, romanizeWord };
}
