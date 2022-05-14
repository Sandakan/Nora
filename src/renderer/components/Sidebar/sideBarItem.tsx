/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable import/prefer-default-export */
// import React from 'react';

interface SideBarItems {
  parentClassName: string;
  icon: string;
  content: string;
  handleClick: (id: string) => any;
}

export const SideBarItem = (props: SideBarItems) => {
  return (
    <li
      className={props.parentClassName}
      onClick={() => props.handleClick(props.content)}
    >
      <span className="icon material-icons-round">{props.icon}</span>{' '}
      {props.content}
    </li>
  );
};
