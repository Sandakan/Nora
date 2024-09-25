// isHangul.d.ts

declare module 'romaja/src/hangul/isHangul.js' {
  /**
   * Check whether a provided character belongs to a Hangul Unicode block.
   * @param {string} char - The character to check.
   * @param {Array<[string, [number, number]]>} [blocks] - Optional blocks to check against.
   * @returns {null|string|false} - Returns the block name if the character belongs to a Hangul block, null if the input is not a string, or false otherwise.
   */
  export default function isHangul(char: string, blocks?: Array<[string, [number, number]]>): null | string | false;
}