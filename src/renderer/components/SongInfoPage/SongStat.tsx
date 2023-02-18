/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
import React, { ReactElement } from 'react';

interface SongStatProp {
  title: string;
  value: number | string | ReactElement<any, any>;
}

const SongStat = React.memo((props: SongStatProp) => {
  return (
    <div className="stat appear-from-bottom mb-4 mr-4 flex h-24 w-60 flex-row items-center justify-between rounded-lg bg-background-color-2/70 p-2 text-font-color-black backdrop-blur-md dark:bg-dark-background-color-2/70 dark:text-font-color-white">
      <div className="stat-value flex w-1/2 items-center justify-center text-center text-[2.75rem] font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        {props.value}
      </div>
      <div className="stat-description text-xl">{props.title}</div>
    </div>
  );
});

SongStat.displayName = 'SongStat';
export default SongStat;
