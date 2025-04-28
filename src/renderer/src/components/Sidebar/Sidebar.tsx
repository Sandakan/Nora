import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ErrorBoundary from '../ErrorBoundary';
import SideBarItem from './SideBarItem';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';
import { linkOptions } from '@tanstack/react-router';

const Sidebar = memo(() => {
  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);
  // const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);

  const { t } = useTranslation();

  const linkData = useMemo(
    () =>
      linkOptions([
        {
          to: '/main-player/home',
          id: 'Home',
          parentClassName: 'home',
          icon: 'home',
          content: t('sideBar.home'),
          isActive: true
        },
        {
          to: '/main-player/search',
          id: 'Search',
          parentClassName: 'search',
          icon: 'search',
          content: t('sideBar.search'),
          isActive: false
        },
        {
          to: '/main-player/songs',
          id: 'Songs',
          parentClassName: 'songs',
          icon: 'music_note',
          content: t('common.song_other'),
          isActive: false
        },
        {
          to: '/main-player/playlists',
          id: 'Playlists',
          parentClassName: 'playlists',
          icon: 'queue_music',
          content: t('common.playlist_other'),
          isActive: false
        },
        {
          to: '/main-player/folders',
          id: 'Folders',
          parentClassName: 'folders',
          icon: 'folder',
          content: t('common.folder_other'),
          isActive: false
        },
        {
          to: '/main-player/artists',
          id: 'Artists',
          parentClassName: 'artists',
          icon: 'people',
          content: t('common.artist_other'),
          isActive: false
        },
        {
          to: '/main-player/albums',
          id: 'Albums',
          parentClassName: 'albums',
          icon: 'album',
          content: t('common.album_other'),
          isActive: false
        },
        {
          to: '/main-player/genres',
          id: 'Genres',
          parentClassName: 'genres',
          icon: 'track_changes',
          content: t('common.genre_other'),
          isActive: false
        },
        {
          to: '/main-player/settings',
          id: 'Settings',
          parentClassName: 'settings',
          icon: 'settings',
          content: t('settingsPage.settings'),
          isActive: false
        }
      ]),
    [t]
  );

  const [data, setData] = useState<typeof linkData>();

  useEffect(() => {
    setData(linkData);
  }, [linkData]);

  // const addActiveToSidebarItem = useCallback((id: string) => {
  //   setData((prevData) => {
  //     if (prevData)
  //       return prevData.map((link) => {
  //         if (link.content === id) {
  //           return link.parentClassName.includes('active')
  //             ? link
  //             : {
  //                 ...link,
  //                 isActive: true,
  //                 parentClassName: `${link.parentClassName} active`
  //               };
  //         } else {
  //           return {
  //             ...link,
  //             isActive: false,
  //             parentClassName: link.parentClassName.replace('active', '').trim()
  //           };
  //         }
  //       });
  //     return [];
  //   });
  // }, []);

  // const clickHandler = useCallback(
  //   (id: string, pageData?: PageData) => {
  //     changeCurrentActivePage(id as PageTitles, pageData);
  //     // addActiveToSidebarItem(id);
  //   },
  //   [changeCurrentActivePage]
  // );

  // useEffect(() => {
  //   addActiveToSidebarItem(currentlyActivePage.pageTitle);
  // }, [addActiveToSidebarItem, currentlyActivePage]);

  const sideBarItems = useMemo(
    () =>
      data
        ? data.map((link) => (
            <SideBarItem
              to={link.to}
              key={link.id}
              id={link.id}
              parentClassName={link.parentClassName}
              icon={link.icon}
              content={link.content}
              handleClick={() => {}}
              isActive={link.isActive}
            />
          ))
        : [],
    [data]
  );

  return (
    <nav
      className={`side-bar relative z-20 order-1 !h-full w-[30%] !max-w-[18rem] grow rounded-tr-2xl transition-[width] ${
        bodyBackgroundImage
          ? 'bg-side-bar-background/50 dark:bg-dark-background-color-2/50 backdrop-blur-md'
          : 'bg-side-bar-background dark:bg-dark-background-color-2'
      } delay-200 md:hover:w-60 lg:absolute lg:w-14 lg:hover:w-[30%] lg:hover:shadow-2xl`}
    >
      <ErrorBoundary>
        <ul className="relative flex h-full! flex-col gap-1 overflow-x-hidden pt-4 pb-2">
          {sideBarItems}
        </ul>
      </ErrorBoundary>
    </nav>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;

