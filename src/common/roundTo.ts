const roundTo = (value: number, decimalPlaces = 1) => {
  if (decimalPlaces === 0) return value;

  const pow = 10 ** decimalPlaces;
  const val = parseFloat((value * pow).toFixed(decimalPlaces - 1));
  return parseFloat((Math.round(val) / pow).toFixed(decimalPlaces)) * 1;
};

export default roundTo;
