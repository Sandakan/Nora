/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-else-return */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/self-closing-comp */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/prefer-default-export */
import React, { useContext } from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
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
    parentClassName: 'genres',
    icon: 'track_changes',
    content: 'Genres',
  },
  {
    parentClassName: 'settings',
    icon: 'settings',
    content: 'Settings',
  },
];

const Sidebar = React.memo(() => {
  const { currentlyActivePage } = useContext(AppContext);
  const { changeCurrentActivePage } = React.useContext(AppUpdateContext);

  const [data, setData] = React.useState(linkData);

  const clickHandler = React.useCallback(
    (id: string, pageData?: any) => {
      const arr = data.map((link) => {
        if (link.content === id) {
          changeCurrentActivePage(link.content as PageTitles, pageData);
          return link.parentClassName.includes('active')
            ? link
            : {
                ...link,
                parentClassName: `${link.parentClassName} active`,
              };
        } else {
          return {
            ...link,
            parentClassName: link.parentClassName.replace('active', '').trim(),
          };
        }
      });
      setData(arr);
    },
    [changeCurrentActivePage, data]
  );

  React.useEffect(() => {
    clickHandler(currentlyActivePage.pageTitle, currentlyActivePage.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentlyActivePage]);

  const sideBarItems = React.useMemo(
    () =>
      data.map((link, index) => (
        <SideBarItem
          key={index}
          parentClassName={link.parentClassName}
          icon={link.icon}
          content={link.content}
          handleClick={clickHandler}
        ></SideBarItem>
      )),
    [data, clickHandler]
  );

  return (
    <nav className="side-bar flex-grow w-[30%] max-w-80 h-full bg-side-bar-background dark:bg-dark-background-color-2 pt-8 pb-2 rounded-tr-2xl lg:w-14 order-1">
      <ul className="last:relative last:w-full last:h-full [&>.active]:bg-background-color-3 dark:[&>.active]:bg-dark-background-color-3 [&>.active]:text-font-color-black dark:[&>.active]:text-font-color-black [&>li.settings]:absolute [&>li.settings]:bottom-0">
        {sideBarItems}
      </ul>
    </nav>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;
