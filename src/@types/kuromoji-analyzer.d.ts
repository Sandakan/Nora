/**
 * Kuromoji based morphological analyzer for kuroshiro
 */

declare class KuromojiAnalyzer {
  /**
   * Constructor
   * @param {Object} [options] JSON object which have key-value pairs settings
   * @param {string} [options.dictPath] Path of the dictionary files
   */
  constructor({ dictPath: string }: { dictPath?: string; } = {});

  /**
   * Initialize the analyzer
   * @returns {Promise} Promise object represents the result of initialization
   */
  init(): Promise<void>;

  /**
   * Parse the given string
   * @param {string} str input string
   * @returns {Promise} Promise object represents the result of parsing
   * @example The result of parsing
   * [{
   *     "surface_form": "黒白",    // 表層形
   *     "pos": "名詞",               // 品詞 (part of speech)
   *     "pos_detail_1": "一般",      // 品詞細分類1
   *     "pos_detail_2": "*",        // 品詞細分類2
   *     "pos_detail_3": "*",        // 品詞細分類3
   *     "conjugated_type": "*",     // 活用型
   *     "conjugated_form": "*",     // 活用形
   *     "basic_form": "黒白",      // 基本形
   *     "reading": "クロシロ",       // 読み
   *     "pronunciation": "クロシロ",  // 発音
   *     "verbose": {                 // Other properties
   *         "word_id": 413560,
   *         "word_type": "KNOWN",
   *         "word_position": 1
   *     }
   * }]
   */
  parse(str: string = ''): Promise<string>;
}

declare module 'kuroshiro-analyzer-kuromoji' {
  export default KuromojiAnalyzer;
}