import log from '../log';

const NANOSECONDS_PER_SECOND = 1e9;

export const timeStart = () => {
  const start = process.hrtime();
  return start;
};
export const timeEnd = (
  start: ReturnType<typeof timeStart>,
  title?: string,
) => {
  const [seconds, nanoseconds] = process.hrtime(start);
  const elapsedTime = (seconds + nanoseconds / NANOSECONDS_PER_SECOND).toFixed(
    3,
  );

  log(`${title || 'Time elapsed'}: ${elapsedTime} seconds`);
  return process.hrtime();
};
