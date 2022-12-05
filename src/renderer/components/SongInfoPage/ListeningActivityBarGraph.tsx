import React from 'react';

type Props = { listeningData: SongListeningData | undefined };

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

const ListeningActivityBarGraph = (props: Props) => {
  const { listeningData } = props;

  const { currentYear } = React.useMemo(() => {
    const currentDate = new Date();
    return {
      currentYear: currentDate.getFullYear(),
    };
  }, []);

  const lastSixMonthsListeningActivity = React.useMemo(() => {
    if (listeningData) {
      const { listens } = listeningData;
      for (let i = 0; i < listens.length; i += 1) {
        if (listens[i].year === currentYear) {
          const { months } = listens[i];
          const max = Math.max(
            ...months.map((x) =>
              x.reduce((prevValue, currValue) => prevValue + currValue)
            )
          );

          const lastSixMonths = months
            .map((y, index) => ({
              listens: y.reduce(
                (prevValue, currValue) => prevValue + currValue
              ),
              month: monthNames[index],
            }))
            .slice(new Date().getMonth() - 6, new Date().getMonth() + 1);

          return lastSixMonths.map((month, index) => {
            return (
              <div className=" relative flex h-full flex-col items-center justify-end">
                <div className="flex h-full items-end rounded-2xl bg-background-color-1/50 dark:bg-dark-background-color-1/50">
                  <div
                    className="order-1 w-[10px] rounded-2xl bg-font-color-highlight transition-[height] dark:bg-dark-font-color-highlight"
                    style={{
                      height: `${
                        month.listens === 0
                          ? '10px'
                          : `${(month.listens / max) * 75}%`
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
      className="appear-from-bottom mr-4 flex h-full w-[70%] flex-col rounded-md bg-background-color-2/70 pt-2 pb-2 text-center backdrop-blur-md dark:bg-dark-background-color-2/70"
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
