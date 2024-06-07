/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-else-return */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/self-closing-comp */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/prefer-default-export */
import { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import { AppContext } from '../../contexts/AppContext';
import { useTranslation } from 'react-i18next';

import ErrorBoundary from '../ErrorBoundary';
import SideBarItem from './SideBarItem';

const Sidebar = memo(() => {
  const { currentlyActivePage, bodyBackgroundImage } = useContext(AppContext);
  const { changeCurrentActivePage } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const linkData = useMemo(
    () => [
      {
        id: 'Home',
        parentClassName: 'home active',
        icon: 'home',
        content: t('sideBar.home'),
        isActive: true
      },
      {
        id: 'Search',
        parentClassName: 'search',
        icon: 'search',
        content: t('sideBar.search'),
        isActive: false
      },
      {
        id: 'Songs',
        parentClassName: 'songs',
        icon: 'music_note',
        content: t('common.song_other'),
        isActive: false
      },
      {
        id: 'Playlists',
        parentClassName: 'playlists',
        icon: 'queue_music',
        content: t('common.playlist_other'),
        isActive: false
      },
      {
        id: 'Folders',
        parentClassName: 'folders',
        icon: 'folder',
        content: t('common.folder_other'),
        isActive: false
      },
      {
        id: 'Artists',
        parentClassName: 'artists',
        icon: 'people',
        content: t('common.artist_other'),
        isActive: false
      },
      {
        id: 'Albums',
        parentClassName: 'albums',
        icon: 'album',
        content: t('common.album_other'),
        isActive: false
      },
      {
        id: 'Genres',
        parentClassName: 'genres',
        icon: 'track_changes',
        content: t('common.genre_other'),
        isActive: false
      },
      {
        id: 'Settings',
        parentClassName: 'settings',
        icon: 'settings',
        content: t('settingsPage.settings'),
        isActive: false
      }
    ],
    [t]
  );

  const [data, setData] = useState<typeof linkData>();

  useEffect(() => {
    setData(linkData);
  }, [linkData]);

  const addActiveToSidebarItem = useCallback((id: string) => {
    setData((prevData) => {
      if (prevData)
        return prevData.map((link) => {
          if (link.content === id) {
            return link.parentClassName.includes('active')
              ? link
              : {
                  ...link,
                  isActive: true,
                  parentClassName: `${link.parentClassName} active`
                };
          } else {
            return {
              ...link,
              isActive: false,
              parentClassName: link.parentClassName.replace('active', '').trim()
            };
          }
        });
      return [];
    });
  }, []);

  const clickHandler = useCallback(
    (id: string, pageData?: PageData) => {
      changeCurrentActivePage(id as PageTitles, pageData);
      addActiveToSidebarItem(id);
    },
    [addActiveToSidebarItem, changeCurrentActivePage]
  );

  useEffect(() => {
    addActiveToSidebarItem(currentlyActivePage.pageTitle);
  }, [addActiveToSidebarItem, currentlyActivePage]);

  const sideBarItems = useMemo(
    () =>
      data
        ? data.map((link) => (
            <SideBarItem
              key={link.id}
              id={link.id}
              parentClassName={link.parentClassName}
              icon={link.icon}
              content={link.content}
              handleClick={clickHandler}
              isActive={link.isActive}
            />
          ))
        : [],
    [data, clickHandler]
  );

  return (
    <nav
      className={`side-bar relative z-20 order-1 !h-full w-[30%] !max-w-[18rem] flex-grow rounded-tr-2xl transition-[width] ${
        bodyBackgroundImage
          ? 'bg-side-bar-background/50 backdrop-blur-md dark:bg-dark-background-color-2/50'
          : 'bg-side-bar-background dark:bg-dark-background-color-2'
      } delay-200 lg:absolute lg:w-14 lg:hover:w-[30%] lg:hover:shadow-2xl md:hover:w-60`}
    >
      <ErrorBoundary>
        <ul className="relative flex !h-full flex-col gap-1 overflow-x-hidden pb-2 pt-4">
          {sideBarItems}
        </ul>
      </ErrorBoundary>
    </nav>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;
