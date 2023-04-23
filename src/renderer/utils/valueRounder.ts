const round = (value: number, precision: number) => {
  const multiplier = 10 ** (precision || 0);
  return Math.round(value * multiplier) / multiplier;
};

export const valueRounder = (val: number, precision = 2) => {
  if (!Number.isNaN(Number(val)) && val !== null) {
    const value = Number(val);
    if (value >= 0 && value < 1_000) {
      return value;
    }
    if (value > 1_000 && value < 1_000_000) {
      return `${round(value / 1_000, precision)} K`;
    }
    if (value > 1_000_000 && value < 1_000_000_000) {
      return `${round(value / 1_000_000, precision)} M`;
    }
    if (value > 1_000_000_000 && value < 1_000_000_000_000) {
      return `${round(value / 1_000_000_000, precision)} B`;
    }
    if (value > 1_000_000_000_000 && value < 1_000_000_000_000_000) {
      return `${round(value / 1_000_000_000_000, precision)} T`;
    }
    return value.toString();
  }
  console.error('Entered value is not a number. value :', val);
  return NaN;
};
