import roundTo from '../../../common/roundTo';

const calculateTime = (secs: number = 0, roundOutput = true) => {
  if (typeof secs !== 'number' || Number.isNaN(secs) || secs < 0) secs = 0;

  const minutes = Math.floor(secs / 60);
  const seconds = roundOutput ? Math.floor(secs % 60) : roundTo(secs % 60, 2);
  const secondsWithZero = seconds < 10 ? `0${seconds}` : `${seconds}`;
  const minutesWithZero = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return { minutes: minutesWithZero, seconds: secondsWithZero };
};

export default calculateTime;
