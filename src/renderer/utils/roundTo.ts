export default (value: number, decimalPlaces = 0) => {
  const pow = 10 ** decimalPlaces;
  const val = parseFloat((value * pow).toFixed(decimalPlaces - 1));
  return parseFloat((Math.round(val) / pow).toFixed(decimalPlaces)) * 1;
};
