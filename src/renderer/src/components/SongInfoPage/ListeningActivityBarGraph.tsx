import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useResizeObserver from '../../hooks/useResizeObserver';
import i18n from '../../i18n';
import ListeningActivityBar from './ListeningActivityBar';

type Props = {
  listeningData: SongListeningData | undefined;
  className?: string;
};

const monthNames: string[] = [
  i18n.t('month.january'),
  i18n.t('month.february'),
  i18n.t('month.march'),
  i18n.t('month.april'),
  i18n.t('month.may'),
  i18n.t('month.june'),
  i18n.t('month.july'),
  i18n.t('month.august'),
  i18n.t('month.september'),
  i18n.t('month.october'),
  i18n.t('month.november'),
  i18n.t('month.december')
];

function getLastNoOfMonths<T>(months: T[], start: number, requiredNoOfMonths = 6) {
  const arr: T[] = [];
  let count = 0;
  let index = start - requiredNoOfMonths;

  while (count < requiredNoOfMonths) {
    count += 1;
    index += 1;
    const i = index < 0 ? index + months.length : index;
    arr.push(months[i]);
  }
  return arr;
}

const MIN_VISIBLE_NO_OF_MONTHS = 6;
const MIN_MONTH_ACTIVITY_BAR_WIDTH = 70;

const ListeningActivityBarGraph = (props: Props) => {
  const { t } = useTranslation();

  const { listeningData, className } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useResizeObserver(containerRef, 100);

  const visibleNoOfMonths = useMemo(() => {
    const noOfMonths = Math.floor(width / MIN_MONTH_ACTIVITY_BAR_WIDTH);

    if (noOfMonths > 12) return 12;
    if (noOfMonths <= 0) return MIN_VISIBLE_NO_OF_MONTHS;
    return noOfMonths;
  }, [width]);

  const lastSixMonthsListeningActivity = useMemo(() => {
    if (listeningData) {
      const listensData = listeningData.listens.map((listen) => listen.listens).flat();
      const monthsWithNames: { listens: number; month: string }[] = [];

      for (let i = 0; i < monthNames.length; i += 1) {
        const listens = listensData
          .map((x) => {
            const [date, noOfListens] = x;
            const month = new Date(date).getMonth();

            if (i === month) return noOfListens;
            return 0;
          })
          .reduce((prevValue, currValue) => prevValue + currValue, 0);

        monthsWithNames.push({ listens, month: monthNames[i] });
      }

      const lastMonths = getLastNoOfMonths(
        monthsWithNames,
        new Date().getMonth(),
        visibleNoOfMonths
      );

      const max = Math.max(...lastMonths.map((x) => x.listens));

      return lastMonths.map((month, index) => {
        return (
          <ListeningActivityBar
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            index={index}
            monthName={month.month}
            noOfListens={month.listens}
            maxNoOfListens={max}
          />
        );
      });
    }
    return [];
  }, [listeningData, visibleNoOfMonths]);

  return (
    <div
      className={`appear-from-bottom flex h-full min-h-[18rem] w-fit max-w-[60rem] flex-col rounded-md bg-background-color-2/70 py-2 text-center backdrop-blur-md dark:bg-dark-background-color-2/70 ${className}`}
      title="Bar graph about no of listens per day"
    >
      <div className="px-2 pb-1 font-thin text-font-color dark:text-font-color-white">
        {t('songInfoPage.listeningActivityInLastMonths', {
          count: visibleNoOfMonths
        })}
      </div>

      <div
        style={{
          gridTemplateColumns: `repeat(${visibleNoOfMonths}, minmax(0, 1fr))`
        }}
        className="grid h-full items-center justify-around"
        ref={containerRef}
      >
        {lastSixMonthsListeningActivity}
      </div>
    </div>
  );
};

export default ListeningActivityBarGraph;
