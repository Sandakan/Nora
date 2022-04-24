/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-else-return */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/self-closing-comp */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { SideBarItem } from './sideBarItem';

interface SidebarProp {
  changeCurrentActivePage: (pageTitle: string) => void;
  currentlyActivePage: string;
}

const linkData = [
  {
    parentClassName: 'home active',
    childClassName: 'fa solid fa-house',
    content: 'Home',
  },
  {
    parentClassName: 'search',
    childClassName: 'fa solid fa-magnifying-glass',
    content: 'Search',
  },
  {
    parentClassName: 'songs',
    childClassName: 'fa solid fa-music',
    content: 'Songs',
  },
  {
    parentClassName: 'playlists',
    childClassName: 'fa solid fa-play',
    content: 'Playlists',
  },
  {
    parentClassName: 'artists',
    childClassName: 'fa solid fa-user',
    content: 'Artists',
  },
  {
    parentClassName: 'albums',
    childClassName: 'fa solid fa-compact-disc',
    content: 'Albums',
  },
  {
    parentClassName: 'settings',
    childClassName: 'fa solid fa-gear',
    content: 'Settings',
  },
];

export const SideBar = (props: SidebarProp) => {
  const [data, setData] = React.useState(linkData);

  const clickHandler = (id: number) => {
    const arr = data.map((link, index) => {
      if (index === id) {
        props.changeCurrentActivePage(link.content);
        return link.parentClassName.includes('active')
          ? link
          : { ...link, parentClassName: `${link.parentClassName} active` };
      } else {
        return {
          ...link,
          parentClassName: link.parentClassName.replace('active', '').trim(),
        };
      }
    });
    setData(arr);
  };

  const sideBarItems = data.map((link, index) => (
    <SideBarItem
      key={index}
      id={index}
      parentClassName={link.parentClassName}
      childClassName={link.childClassName}
      content={link.content}
      handleClick={clickHandler}
    ></SideBarItem>
  ));

  return (
    <nav className="side-bar">
      <ul>{sideBarItems}</ul>
    </nav>
  );
};
