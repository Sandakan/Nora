/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-else-return */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/self-closing-comp */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/prefer-default-export */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { SideBarItem } from './SideBarItem';

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

export default React.memo(() => {
  const { changeCurrentActivePage, currentlyActivePage } =
    useContext(AppContext);
  const [data, setData] = React.useState(linkData);

  const clickHandler = (id: string) => {
    const arr = data.map((link) => {
      if (link.content === id) {
        changeCurrentActivePage(link.content as PageTitles);
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

  React.useEffect(() => {
    if (linkData.some((x) => x.content === currentlyActivePage.pageTitle))
      clickHandler(currentlyActivePage.pageTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentlyActivePage.pageTitle]);

  const sideBarItems = data.map((link, index) => (
    <SideBarItem
      key={index}
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
});
