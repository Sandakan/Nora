/* eslint-disable no-param-reassign */
const calculateTime = (secs: number) => {
  if (Number.isNaN(secs) || secs < 0) secs = 0;

  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  const secondsWithZero = seconds < 10 ? `0${seconds}` : `${seconds}`;
  const minutesWithZero = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return { minutes: minutesWithZero, seconds: secondsWithZero };
};

export default calculateTime;
