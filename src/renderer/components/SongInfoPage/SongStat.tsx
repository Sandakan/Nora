/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
import React, { ReactElement } from 'react';

interface SongStatProp {
  title: string;
  value: number | string | ReactElement<any, any>;
}

const SongStat = React.memo((props: SongStatProp) => {
  return (
    <div className="stat appear-from-bottom w-64 h-24 mr-4 mt-4 bg-background-color-2 dark:bg-dark-background-color-2 flex flex-row items-center justify-between p-2 text-font-color-black dark:text-font-color-white rounded-lg">
      <div className="stat-value w-1/2 text-[2.75rem] text-center font-medium text-background-color-3 dark:text-dark-background-color-3 flex items-center justify-center">
        {props.value}
      </div>
      <div className="stat-description text-xl">{props.title}</div>
    </div>
  );
});

SongStat.displayName = 'SongStat';
export default SongStat;
