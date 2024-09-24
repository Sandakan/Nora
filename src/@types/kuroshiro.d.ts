/**
 * Kuroshiro Class
 */
declare class Kuroshiro {
  /**
   * Constructor
   * @constructs Kuroshiro
   */
  constructor();

  /**
   * Initialize Kuroshiro
   * @memberOf Kuroshiro
   * @instance
   * @returns {Promise} Promise object represents the result of initialization
   */
  init(analyzer): Promise<void>;

  /**
   * Convert given string to target syllabary with options available
   * @memberOf Kuroshiro
   * @instance
   * @param {string} str Given String
   * @param {Object} [options] Settings Object
   * @param {string} [options.to="hiragana"] Target syllabary ["hiragana"|"katakana"|"romaji"]
   * @param {string} [options.mode="normal"] Convert mode ["normal"|"spaced"|"okurigana"|"furigana"]
   * @param {string} [options.romajiSystem="hepburn"] Romanization System ["nippon"|"passport"|"hepburn"]
   * @param {string} [options.delimiter_start="("] Delimiter(Start)
   * @param {string} [options.delimiter_end=")"] Delimiter(End)
   * @returns {Promise} Promise object represents the result of conversion
   */
  convert(
    str: string,
    options: {
      to?: 'hiragana' | 'katakana' | 'romaji';
      mode?: 'normal' | 'spaced' | 'okurigana' | 'furigana';
      romajiSystem?: RomanizationSystem;
      delimiter_start?: string;
      delimiter_end?: string;
    }
  ): Promise<string>;
}

declare namespace Kuroshiro {
  export { Util };
}

declare namespace Util {
  export type RomanizationSystem = 'nippon' | 'passport' | 'hepburn';

  /**
   * Get the type of given string
   *
   * @param {string} str Given string
   * @return {number} Type number. 0 for pure kanji, 1 for kanji-kana-mixed, 2 for pure kana, 3 for others
   */
  export function getStrType(str: string): number;
  /**
   * Patch tokens for conversion
   * @param {Object} tokens Given tokens
   * @return {Object} Patched tokens
   */
  export function patchTokens(tokens: any): any;
  /**
   * Check if given char is a hiragana
   *
   * @param {string} ch Given char
   * @return {boolean} if given char is a hiragana
   */
  export function isHiragana(ch: string): boolean;
  /**
   * Check if given char is a katakana
   *
   * @param {string} ch Given char
   * @return {boolean} if given char is a katakana
   */
  export function isKatakana(ch: string): boolean;
  /**
   * Check if given char is a kana
   *
   * @param {string} ch Given char
   * @return {boolean} if given char is a kana
   */
  export function isKana(ch: string): boolean;
  /**
   * Check if given char is a kanji
   *
   * @param {string} ch Given char
   * @return {boolean} if given char is a kanji
   */
  export function isKanji(ch: string): boolean;
  /**
   * Check if given char is a Japanese
   *
   * @param {string} ch Given char
   * @return {boolean} if given char is a Japanese
   */
  export function isJapanese(ch: string): boolean;
  /**
   * Check if given string has hiragana
   *
   * @param {string} str Given string
   * @return {boolean} if given string has hiragana
   */
  export function hasHiragana(str: string): boolean;
  /**
   * Check if given string has katakana
   *
   * @param {string} str Given string
   * @return {boolean} if given string has katakana
   */
  export function hasKatakana(str: string): boolean;
  /**
   * Check if given string has kana
   *
   * @param {string} str Given string
   * @return {boolean} if given string has kana
   */
  export function hasKana(str: string): boolean;
  /**
   * Check if given string has kanji
   *
   * @param {string} str Given string
   * @return {boolean} if given string has kanji
   */
  export function hasKanji(str: string): boolean;
  /**
   * Check if given string has Japanese
   *
   * @param {string} str Given string
   * @return {boolean} if given string has Japanese
   */
  export function hasJapanese(str: string): boolean;
  /**
   * Convert kana to hiragana
   *
   * @param {string} str Given string
   * @return {string} Hiragana string
   */
  export function toRawHiragana(str: string): string;
  /**
   * Convert kana to katakana
   *
   * @param {string} str Given string
   * @return {string} Katakana string
   */
  export function toRawKatakana(str: string): string;
  /**
   * Convert kana to romaji
   *
   * @param {string} str Given string
   * @param {string} system To which romanization system the given string is converted
   * @return {string} Romaji string
   */
  export function toRawRomaji(str: string, system: RomanizationSystem): string;
  /**
   * Convert kana to hiragana
   *
   * @param {string} str Given string
   * @return {string} Hiragana string
   */
  export function kanaToHiragna(str: string): string;
  /**
   * Convert kana to katakana
   *
   * @param {string} str Given string
   * @return {string} Katakana string
   */
  export function kanaToKatakana(str: string): string;
  /**
   * Convert kana to romaji
   *
   * @param {string} str Given string
   * @param {string} system To which romanization system the given string is converted. ["nippon"|"passport"|"hepburn"]
   * @return {string} Romaji string
   */
  export function kanaToRomaji(str: string, system: RomanizationSystem): string;
}

declare module 'kuroshiro' {
  export default Kuroshiro;
}
