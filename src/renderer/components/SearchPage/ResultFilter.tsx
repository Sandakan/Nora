/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';

interface ResultFilterProp {
  filterType: string;
  isCurrentActiveFilter: boolean;
  changeActiveFilter: (filterType: string) => void;
}

export const ResultFilter = (props: ResultFilterProp) => {
  return (
    <li
      className={`${props.isCurrentActiveFilter && 'active'}`}
      onClick={() => props.changeActiveFilter(props.filterType)}
    >
      {props.filterType}
    </li>
  );
};
