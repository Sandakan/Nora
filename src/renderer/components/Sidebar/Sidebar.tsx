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

  const addActiveToSidebarItem = React.useCallback((id: string) => {
    setData((prevData) => {
      return prevData.map((link) => {
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
    });
  }, []);

  const clickHandler = React.useCallback(
    (id: string, pageData?: any) => {
      changeCurrentActivePage(id as PageTitles, pageData);
      addActiveToSidebarItem(id);
    },
    [addActiveToSidebarItem, changeCurrentActivePage],
  );

  React.useEffect(() => {
    addActiveToSidebarItem(currentlyActivePage.pageTitle);
  }, [addActiveToSidebarItem, currentlyActivePage]);

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
    [data, clickHandler],
  );

  return (
    <nav
      className={`side-bar relative z-20 order-1 !h-full w-[30%] !max-w-[20rem] flex-grow rounded-tr-2xl transition-[width] ${
        bodyBackgroundImage
          ? 'bg-side-bar-background/50 backdrop-blur-md dark:bg-dark-background-color-2/50'
          : 'bg-side-bar-background dark:bg-dark-background-color-2'
      } delay-200 lg:absolute lg:w-14 lg:hover:w-[30%] lg:hover:shadow-2xl md:hover:w-60`}
    >
      <ErrorBoundary>
        <ul className="relative flex !h-full flex-col overflow-x-hidden pb-2 pt-6">
          {sideBarItems}
        </ul>
      </ErrorBoundary>
    </nav>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;
