import i18n from '../i18n';

type ElapsedDateTypes = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';

interface DateRounderResult {
  elapsed: number;
  type: ElapsedDateTypes;
  isFuture: boolean;
  elapsedString: string;
}

const generateElapsedString = (elapsed: number, type: ElapsedDateTypes): string =>
  i18n.t(`elapsedTime.${type}`, { count: elapsed });

const calculateElapsed = (
  currentDateInMs: number,
  elapsedDateInMs: number
): DateRounderResult | undefined => {
  if (currentDateInMs && elapsedDateInMs) {
    const isFuture = elapsedDateInMs > currentDateInMs;
    const milliseconds = Math.abs(currentDateInMs - elapsedDateInMs);

    const elapsedSeconds = Math.floor(milliseconds / 1000);
    const elapsedMinutes = Math.floor(milliseconds / (1000 * 60));
    const elapsedHours = Math.floor(milliseconds / (1000 * 60 * 60));
    const elapsedDays = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const elapsedMonths = Math.floor(milliseconds / (1000 * 60 * 60 * 24 * 30));
    const elapsedYears = Math.floor(milliseconds / (1000 * 60 * 60 * 24 * 30 * 12));

    if (elapsedSeconds < 60)
      return {
        elapsed: elapsedSeconds,
        type: 'second',
        isFuture,
        elapsedString: generateElapsedString(elapsedSeconds, 'second')
      };
    if (elapsedMinutes < 60)
      return {
        elapsed: elapsedMinutes,
        type: 'minute',
        isFuture,
        elapsedString: generateElapsedString(elapsedMinutes, 'minute')
      };
    if (elapsedHours < 24)
      return {
        elapsed: elapsedHours,
        type: 'hour',
        isFuture,
        elapsedString: generateElapsedString(elapsedHours, 'hour')
      };
    if (elapsedDays < 30)
      return {
        elapsed: elapsedDays,
        type: 'day',
        isFuture,
        elapsedString: generateElapsedString(elapsedDays, 'day')
      };
    if (elapsedMonths < 12)
      return {
        elapsed: elapsedMonths,
        type: 'month',
        isFuture,
        elapsedString: generateElapsedString(elapsedMonths, 'month')
      };
    if (elapsedYears > 0)
      return {
        elapsed: elapsedYears,
        type: 'year',
        isFuture,
        elapsedString: generateElapsedString(elapsedYears, 'year')
      };
  }
  return undefined;
};

const calculateElapsedTime = (dateString: string, currDateString = new Date().toUTCString()) => {
  const currentDate = Date.parse(currDateString);
  const elapsedDate = Date.parse(dateString);

  return calculateElapsed(currentDate, elapsedDate);
};

export default calculateElapsedTime;
