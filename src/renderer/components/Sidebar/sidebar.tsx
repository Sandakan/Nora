/* eslint-disable @typescript-eslint/no-explicit-any */
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
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
  currentlyActivePage: { pageTitle: string; data?: any };
}

const linkData = [
  {
    parentClassName: 'home active',
    icon: 'home',
    content: 'Home',
  },
  {
    parentClassName: 'search',
    icon: 'search',
    content: 'Search',
  },
  {
    parentClassName: 'songs',
    icon: 'music_note',
    content: 'Songs',
  },
  {
    parentClassName: 'playlists',
    icon: 'queue_music',
    content: 'Playlists',
  },
  {
    parentClassName: 'artists',
    icon: 'people',
    content: 'Artists',
  },
  {
    parentClassName: 'albums',
    icon: 'album',
    content: 'Albums',
  },
  {
    parentClassName: 'settings',
    icon: 'settings',
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
      icon={link.icon}
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
