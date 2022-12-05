const calculateTime = (secs: number) => {
  // eslint-disable-next-line no-param-reassign
  if (Number.isNaN(secs)) secs = 0;

  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  const secondsWithZero = seconds < 10 ? `0${seconds}` : `${seconds}`;
  const minutesWithZero = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return { minutes: minutesWithZero, seconds: secondsWithZero };
};

export default calculateTime;
