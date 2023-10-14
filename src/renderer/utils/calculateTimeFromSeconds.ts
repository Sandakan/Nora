const calculateTimeFromSeconds = (secs = 0) => {
  // eslint-disable-next-line no-param-reassign
  if (typeof secs !== 'number' && secs < 0) secs = 0;

  const totalYears = Math.floor(secs / (60 * 60 * 24 * 30 * 12));
  const totalMonths = Math.floor(secs / (60 * 60 * 24 * 30));
  const totalDays = Math.floor(secs / (60 * 60 * 24));
  const totalHours = Math.floor(secs / (60 * 60));
  const totalMinutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);

  const monthsWithoutYears = totalMonths - totalYears * 12;
  const daysWithoutMonths = totalDays - totalMonths * 30;
  const hoursWithoutDays = totalHours - totalDays * 24;
  const minutesWithoutHours = totalMinutes - totalHours * 60;

  const yearsString =
    totalYears >= 1 ? `${totalYears} hour${totalYears === 1 ? '' : 's'} ` : '';
  const monthsString =
    monthsWithoutYears >= 1
      ? `${monthsWithoutYears} hour${monthsWithoutYears === 1 ? '' : 's'} `
      : '';
  const daysString =
    daysWithoutMonths >= 1
      ? `${daysWithoutMonths} day${daysWithoutMonths === 1 ? '' : 's'} `
      : '';
  const hoursString =
    hoursWithoutDays >= 1
      ? `${hoursWithoutDays} hour${hoursWithoutDays === 1 ? '' : 's'} `
      : '';
  const minutesString = `${minutesWithoutHours} minute${
    minutesWithoutHours === 1 ? '' : 's'
  }`;
  const secondsString = ` ${seconds} second${seconds === 1 ? '' : 's'}`;

  const timeString = `${yearsString}${monthsString}${daysString}${hoursString}${minutesString}${secondsString}`;

  return {
    years: totalYears,
    months: monthsWithoutYears,
    days: daysWithoutMonths,
    hours: hoursWithoutDays,
    minutes: minutesWithoutHours,
    seconds,
    timeString,
  };
};

export default calculateTimeFromSeconds;
