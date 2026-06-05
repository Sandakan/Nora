import { store } from '@renderer/store/store';
import { linkOptions } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { memo, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import ErrorBoundary from '../ErrorBoundary';
import SideBarItem from './SideBarItem';

const Sidebar = memo(() => {
  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);
  // const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);

  const { t } = useTranslation();
  const [isSyncing, setIsSyncing] = useState(false);
  const { addNewNotifications } = useContext(AppUpdateContext);

  const handleResyncClick = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await window.api.audioLibraryControls.resyncSongsLibrary();
    } catch (err) {
      console.error('Failed to resync songs library.', err);
      addNewNotifications([
        {
          id: 'resyncLibraryFailed',
          content: t('notifications.songDataUpdateFailed'),
          iconName: 'error',
          duration: 5000
        }
      ]);
    } finally {
      setIsSyncing(false);
    }
  };

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

  const sideBarItems = useMemo(
    () =>
      data
        ? data.map((link) => (
            <SideBarItem
              to={link.to}
              key={link.id}
              parentClassName={link.parentClassName}
              icon={link.icon}
              content={link.content}
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
        <ul className="relative flex flex-1 min-h-0 flex-col gap-1 overflow-x-hidden overflow-y-auto pt-4 pb-2">
          {sideBarItems}
        </ul>
        <div className="mb-2 flex justify-center px-2">
          <button
            type="button"
            onClick={handleResyncClick}
            disabled={isSyncing}
            aria-label={t('settingsPage.resyncLibrary')}
            className={`flex w-full items-center justify-center gap-2 rounded-lg p-2 text-sm text-font-color-black outline-offset-2 transition-[colors,opacity] duration-200 hover:bg-background-color-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-font-color-white dark:hover:bg-dark-background-color-3 active:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSyncing ? 'animate-pulse' : ''
            }`}
            title={t('settingsPage.resyncLibrary')}
          >
            <span className="material-icons-round icon text-xl">sync</span>
            <span className="sidebar-item-label">{t('settingsPage.resyncLibrary')}</span>
          </button>
        </div>
      </ErrorBoundary>
    </nav>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;
