const HANGUL_CHAR_REGEX = /\p{Script=Hangul}/u;

/** Checks whether a character belongs to the Hangul Unicode script. */
const isHangul = (char: string): boolean => {
  if (!char) return false;
  return HANGUL_CHAR_REGEX.test(char);
};

export default isHangul;
