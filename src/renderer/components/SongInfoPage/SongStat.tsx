/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
import { ReactElement } from 'react';

interface SongStatProp {
  title: string;
  value: number | string | ReactElement<any, any>;
}

export default (props: SongStatProp) => {
  return (
    <div className="stat appear-from-bottom">
      <div className="stat-value">{props.value}</div>
      <div className="stat-description">{props.title}</div>
    </div>
  );
};
