export default (value: number, digits = 0) => {
  const pow = 10 ** digits;
  const val = parseFloat((value * pow).toFixed(digits - 1));
  return parseFloat((Math.round(val) / pow).toFixed(digits)) * 1;
};
