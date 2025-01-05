import logger from '../logger';

const NANOSECONDS_PER_SECOND = 1e9;

export const timeStart = () => {
  const start = process.hrtime();
  return start;
};
export const timeEnd = (start: ReturnType<typeof timeStart>, title?: string) => {
  const [seconds, nanoseconds] = process.hrtime(start);
  const elapsedTime = (seconds + nanoseconds / NANOSECONDS_PER_SECOND).toFixed(3);

  logger.verbose(`Time elapsed${title ? `: ${title}` : ''}`, { elapsedTime });
  return process.hrtime();
};
