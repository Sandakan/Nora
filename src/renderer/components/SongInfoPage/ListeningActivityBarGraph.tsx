import React from 'react';

type Props = {
  listeningData: SongListeningData | undefined;
  className?: string;
};

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function getLastNoOfMonths<T>(
  months: T[],
  start: number,
  requiredNoOfMonths = 6
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

const ListeningActivityBarGraph = (props: Props) => {
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
            7
          );

          const max = Math.max(...lastMonths.map((x) => x.listens));

          return lastMonths.map((month, index) => {
            return (
              <div
                key={month.month}
                className="relative flex h-full flex-col items-center justify-end"
              >
                <div className="flex h-full items-end rounded-2xl bg-background-color-1/50 dark:bg-dark-background-color-1/50">
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
                    title={`${month.listens} listens`}
                  />
                </div>
                <div className="order-2 flex w-full flex-col  pt-1  text-font-color  dark:text-font-color-white">
                  <span className="font-thin">{month.listens}</span>
                  <span className="">{month.month}</span>
                </div>
              </div>
            );
          });
        }
      }
    }
    return [];
  }, [listeningData, currentYear]);

  return (
    <div
      className={`appear-from-bottom mr-4 flex h-full min-h-[18rem] w-[70%] max-w-lg flex-col rounded-md bg-background-color-2/70 pb-2 pt-2 text-center backdrop-blur-md dark:bg-dark-background-color-2/70 ${className}`}
      title="Bar graph about no of listens per day"
    >
      <div className="pb-1 font-thin text-font-color dark:text-font-color-white">
        Listening Activity in the Last 6 Months
      </div>

      <div className="flex h-full flex-row items-center justify-around">
        {lastSixMonthsListeningActivity}
      </div>
    </div>
  );
};

export default ListeningActivityBarGraph;
