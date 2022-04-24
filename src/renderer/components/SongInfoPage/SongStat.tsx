/* eslint-disable react/destructuring-assignment */
import React from 'react';

interface SongStatProp {
  title: string;
  value: number | string;
}

export default (props: SongStatProp) => {
  return (
    <div className="stat">
      <div className="stat-value">{props.value}</div>
      <div className="stat-description">{props.title}</div>
    </div>
  );
};
