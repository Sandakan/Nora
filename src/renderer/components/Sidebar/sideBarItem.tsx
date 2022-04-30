/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable import/prefer-default-export */
// import React from 'react';

interface SideBarItems {
  id: number;
  parentClassName: string;
  childClassName: string;
  content: string;
  handleClick: (id: number) => any;
}

// const makeActive = (event: React.SyntheticEvent) => {
// 	const sideBarItems = document.querySelectorAll('.side-bar > ul > li');
// 	for (let x = 0; x < sideBarItems.length; x++) {
// 		sideBarItems[x].classList.remove('active');
// 	}
// 	event.currentTarget.classList.add('active');
// };

export const SideBarItem = (props: SideBarItems) => {
  return (
    <li
      className={props.parentClassName}
      onClick={() => props.handleClick(props.id)}
    >
      <i className={props.childClassName} /> {props.content}
    </li>
  );
};
