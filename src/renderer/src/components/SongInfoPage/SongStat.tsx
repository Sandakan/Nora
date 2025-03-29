import { type ReactElement, memo } from 'react';

interface SongStatProp {
  title: string;
  value: number | string | ReactElement;
  className?: string;
}

const SongStat = memo((props: SongStatProp) => {
  const { title, value, className } = props;

  return (
    <div
      className={`stat appear-from-bottom flex max-h-32 min-h-24 w-60 flex-row items-center justify-between rounded-lg bg-background-color-2/70 p-2 text-font-color-black backdrop-blur-md dark:bg-dark-background-color-2/70 dark:text-font-color-white ${className}`}
    >
      <div className="stat-value flex w-1/2 items-center justify-center text-center text-[2.75rem] font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        {value}
      </div>
      <div className="stat-description text-xl">{title}</div>
    </div>
  );
});

SongStat.displayName = 'SongStat';
export default SongStat;
