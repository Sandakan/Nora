import { useTranslation } from 'react-i18next';

type Props = {
  monthName: string;
  noOfListens: number;
  maxNoOfListens: number;
  index: number;
};

const ListeningActivityBar = (props: Props) => {
  const { monthName, noOfListens, maxNoOfListens, index } = props;
  const { t } = useTranslation();

  return (
    <div className="relative flex h-full flex-col items-center justify-end">
      <div className="flex h-full items-end rounded-2xl bg-background-color-1/25 dark:bg-dark-background-color-1/25">
        <div
          className="order-1 w-[10px] rounded-2xl bg-font-color-highlight transition-[height] delay-200 duration-300 ease-in-out dark:bg-dark-font-color-highlight"
          style={{
            height: `${noOfListens === 0 ? '10px' : `${(noOfListens / maxNoOfListens) * 90}%`}`,
            transitionDelay: `${index * 50 + 500}`
          }}
          title={t('songInfoPage.listensCount', {
            count: noOfListens
          })}
        />
      </div>
      <div className="order-2 flex w-full grow-0 flex-col pt-1 text-font-color  dark:text-font-color-white">
        <span className="font-thin">{noOfListens}</span>
        <span className="truncate px-2">{monthName}</span>
      </div>
    </div>
  );
};

export default ListeningActivityBar;
