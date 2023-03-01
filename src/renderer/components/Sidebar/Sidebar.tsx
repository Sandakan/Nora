/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-else-return */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/self-closing-comp */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/prefer-default-export */
import React, { useContext } from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import ErrorBoundary from '../ErrorBoundary';
import SideBarItem from './SideBarItem';

const linkData = [
  {
    parentClassName: 'home active',
    icon: 'home',
    content: 'Home',
    isActive: true,
  },
  {
    parentClassName: 'search',
    icon: 'search',
    content: 'Search',
    isActive: false,
  },
  {
    parentClassName: 'songs',
    icon: 'music_note',
    content: 'Songs',
    isActive: false,
  },
  {
    parentClassName: 'playlists',
    icon: 'queue_music',
    content: 'Playlists',
    isActive: false,
  },
  {
    parentClassName: 'folders',
    icon: 'folder',
    content: 'Folders',
    isActive: false,
  },
  {
    parentClassName: 'artists',
    icon: 'people',
    content: 'Artists',
    isActive: false,
  },
  {
    parentClassName: 'albums',
    icon: 'album',
    content: 'Albums',
    isActive: false,
  },
  {
    parentClassName: 'genres',
    icon: 'track_changes',
    content: 'Genres',
    isActive: false,
  },
  {
    parentClassName: 'settings',
    icon: 'settings',
    content: 'Settings',
    isActive: false,
  },
];

const Sidebar = React.memo(() => {
  const { currentlyActivePage, bodyBackgroundImage } = useContext(AppContext);
  const { changeCurrentActivePage } = React.useContext(AppUpdateContext);

  const [data, setData] = React.useState(linkData);

  const addActiveToSidebarItem = React.useCallback(
    (id: string) => {
      const arr = data.map((link) => {
        if (link.content === id) {
          return link.parentClassName.includes('active')
            ? link
            : {
                ...link,
                isActive: true,
                parentClassName: `${link.parentClassName} active`,
              };
        } else {
          return {
            ...link,
            isActive: false,
            parentClassName: link.parentClassName.replace('active', '').trim(),
          };
        }
      });
      setData(arr);
    },
    [data]
  );

  const clickHandler = React.useCallback(
    (id: string, pageData?: any) => {
      changeCurrentActivePage(id as PageTitles, pageData);
      addActiveToSidebarItem(id);
    },
    [addActiveToSidebarItem, changeCurrentActivePage]
  );

  React.useEffect(() => {
    addActiveToSidebarItem(currentlyActivePage.pageTitle);
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
          isActive={link.isActive}
        />
      )),
    [data, clickHandler]
  );

  return (
    <nav
      className={`side-bar max-w-80 z-20 order-1 h-full w-[30%] flex-grow rounded-tr-2xl transition-[width] ${
        bodyBackgroundImage
          ? 'bg-side-bar-background/50 backdrop-blur-md dark:bg-dark-background-color-2/50'
          : 'bg-side-bar-background dark:bg-dark-background-color-2'
      } delay-200 lg:absolute lg:w-14 lg:hover:w-[30%] lg:hover:shadow-2xl`}
    >
      <ErrorBoundary>
        <ul className="relative overflow-x-hidden pt-6 pb-2 last:relative last:h-full last:w-full">
          {sideBarItems}
        </ul>
      </ErrorBoundary>
    </nav>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;
