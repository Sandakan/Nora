const clamp = (min: number, value: number, max: number) => {
  if (value > max) return max;
  if (value < min) return min;
  return value;
};

export default clamp;
