import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'renderer/i18n';

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
  i18n.t('month.december'),
];

function getLastNoOfMonths<T>(
  months: T[],
  start: number,
  requiredNoOfMonths = 6,
) {
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

const VISIBLE_NO_OF_MONTHS = 7;

const ListeningActivityBarGraph = (props: Props) => {
  const { t } = useTranslation();

  const { listeningData, className } = props;

  const { currentYear } = React.useMemo(() => {
    const currentDate = new Date();
    return {
      currentYear: currentDate.getFullYear(),
    };
  }, []);

  const lastSixMonthsListeningActivity = React.useMemo(() => {
    if (listeningData) {
      for (const listen of listeningData.listens) {
        if (listen.year === currentYear) {
          const monthsWithNames: { listens: number; month: string }[] = [];

          for (let i = 0; i < monthNames.length; i += 1) {
            const listens = listen.listens
              .map((x) => {
                const [now, noOfListens] = x;
                const month = new Date(now).getMonth();

                if (i === month) return noOfListens;
                return 0;
              })
              .reduce((prevValue, currValue) => prevValue + currValue, 0);

            monthsWithNames.push({ listens, month: monthNames[i] });
          }

          const lastMonths = getLastNoOfMonths(
            monthsWithNames,
            new Date().getMonth(),
            VISIBLE_NO_OF_MONTHS,
          );

          const max = Math.max(...lastMonths.map((x) => x.listens));

          return lastMonths.map((month, index) => {
            return (
              <div
                key={month.month}
                className="relative flex h-full flex-col items-center justify-end"
              >
                <div className="flex h-full items-end rounded-2xl bg-background-color-1/25 dark:bg-dark-background-color-1/25">
                  <div
                    className="order-1 w-[10px] rounded-2xl bg-font-color-highlight transition-[height] dark:bg-dark-font-color-highlight"
                    style={{
                      height: `${
                        month.listens === 0
                          ? '10px'
                          : `${(month.listens / max) * 90}%`
                      }`,
                      transitionDelay: `${index * 50 + 500}`,
                    }}
                    title={t('songInfoPage.listensCount', {
                      count: month.listens,
                    })}
                  />
                </div>
                <div className="order-2 flex w-full grow-0 flex-col pt-1 text-font-color  dark:text-font-color-white">
                  <span className="font-thin">{month.listens}</span>
                  <span className="truncate px-2">{month.month}</span>
                </div>
              </div>
            );
          });
        }
      }
    }
    return [];
  }, [listeningData, currentYear, t]);

  return (
    <div
      className={`appear-from-bottom flex h-full min-h-[18rem] w-full max-w-lg flex-col rounded-md bg-background-color-2/70 py-2 text-center backdrop-blur-md dark:bg-dark-background-color-2/70 ${className}`}
      title="Bar graph about no of listens per day"
    >
      <div className="pb-1 font-thin text-font-color dark:text-font-color-white">
        {t('songInfoPage.listeningActivityInLastMonths', {
          count: VISIBLE_NO_OF_MONTHS,
        })}
      </div>

      <div
        style={{
          gridTemplateColumns: `repeat(${VISIBLE_NO_OF_MONTHS}, minmax(0, 1fr))`,
        }}
        className="grid h-full items-center justify-around"
      >
        {lastSixMonthsListeningActivity}
      </div>
    </div>
  );
};

export default ListeningActivityBarGraph;
