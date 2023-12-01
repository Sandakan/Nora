import i18n from 'renderer/i18n';

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

  const timeArr: string[] = [];

  if (totalYears >= 1) timeArr.push(i18n.t('time.year', { count: totalYears }));
  if (monthsWithoutYears >= 1)
    timeArr.push(i18n.t('time.month', { count: monthsWithoutYears }));
  if (daysWithoutMonths >= 1)
    timeArr.push(i18n.t('time.day', { count: daysWithoutMonths }));
  if (hoursWithoutDays >= 1)
    timeArr.push(i18n.t('time.hour', { count: hoursWithoutDays }));
  if (minutesWithoutHours >= 1)
    timeArr.push(i18n.t('time.minute', { count: minutesWithoutHours }));
  timeArr.push(i18n.t('time.second', { count: seconds }));

  const timeString = timeArr.join(' ');

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
