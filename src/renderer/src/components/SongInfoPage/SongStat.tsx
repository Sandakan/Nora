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
      className={`stat appear-from-bottom bg-background-color-2/70 text-font-color-black dark:bg-dark-background-color-2/70 dark:text-font-color-white flex max-h-32 min-h-24 w-60 flex-row items-center justify-between rounded-lg p-2 backdrop-blur-md ${className}`}
    >
      <div className="stat-value text-font-color-highlight dark:text-dark-font-color-highlight flex w-1/2 items-center justify-center text-center text-[2.75rem] font-medium">
        {value}
      </div>
      <div className="stat-description text-xl">{title}</div>
    </div>
  );
});

SongStat.displayName = 'SongStat';
export default SongStat;
