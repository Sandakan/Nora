import log from '../log';

export const timeStart = () => {
  const start = process.hrtime();
  return start;
};
export const timeEnd = (
  start: ReturnType<typeof timeStart>,
  title?: string,
) => {
  const end = process.hrtime(start);
  log(`${title || 'Time elapsed'}: ${end[0]}s or ${end[1] / 1000000}ms`);
  return process.hrtime();
};
