import { store } from '@renderer/store/store';
import { useNavigate } from '@tanstack/react-router';
import { useSelector } from '@tanstack/react-store';
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { lazy, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import Button from '../Button';
import NavLink from '../NavLink';
import VolumeSlider from '../VolumeSlider';

const AppShortcutsPrompt = lazy(() => import('../SettingsPage/AppShortcutsPrompt'));

const OtherSongControlsContainer = () => {
  const isMuted = useSelector(store, (state) => state.player.volume.isMuted);
  const volume = useSelector(store, (state) => state.player.volume.value);

  const { updatePlayerType, toggleMutedState, updateContextMenuData, changePromptMenuData } =
    useContext(AppUpdateContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const openOtherSettingsContextMenu = useCallback(
    (pageX: number, pageY: number) => {
      updateContextMenuData(
        true,
        [
          {
            label: t('settingsPage.appShortcuts'),
            iconName: 'trail_length_short',
            iconClassName: 'material-icons-round-outlined mr-2',
            handlerFunction: () => changePromptMenuData(true, <AppShortcutsPrompt />)
          },
          { label: '', isContextMenuItemSeperator: true, handlerFunction: () => true },
          {
            label: t('settingsPage.equalizer'),
            iconName: 'graphic_eq',
            iconClassName: 'material-icons-round-outlined mr-2',
            handlerFunction: () =>
              navigate({ to: '/main-player/settings', hash: 'equalizer-settings-container' })
          },
          {
            label: t('player.adjustPlaybackSpeed'),
            iconName: 'avg_pace',
            iconClassName: 'material-icons-round-outlined mr-2',
            handlerFunction: () =>
              navigate({ to: '/main-player/settings', hash: 'audio-playback-settings-container' })
          },
          { label: '', isContextMenuItemSeperator: true, handlerFunction: () => true },
          {
            label: t('player.showCurrentQueue'),
            iconName: 'table_rows',
            iconClassName: 'material-icons-round-outlined mr-2',
            handlerFunction: () => navigate({ to: '/main-player/queue' })
          },
          { label: '', isContextMenuItemSeperator: true, handlerFunction: () => true },
          {
            label: t('player.showMiniPlayer'),
            iconName: 'pip',
            iconClassName: 'material-icons-round-outlined mr-2',
            handlerFunction: () => updatePlayerType('mini')
          },
          {
            label: t('player.openInFullScreen'),
            iconName: 'fullscreen',
            iconClassName: 'material-icons-round-outlined mr-2',
            handlerFunction: () => updatePlayerType('full')
          }
        ],
        pageX,
        pageY
      );
    },
    [changePromptMenuData, navigate, t, updateContextMenuData, updatePlayerType]
  );

  return (
    <div className="other-controls-container flex items-center justify-end">
      <NavLink
        to="/main-player/queue"
        className={`queue-btn text-font-color-black text-opacity-60 after:bg-font-color-highlight dark:text-font-color-white dark:after:bg-dark-font-color-highlight mr-6! rounded-none! border-0! bg-transparent p-0! outline-offset-1 after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:opacity-0 after:transition-opacity hover:bg-transparent focus-visible:outline! lg:hidden dark:bg-transparent dark:hover:bg-transparent`}
        title={t('player.currentQueue')}
      >
        {({ isActive }) => {
          return (
            <span
              className={`${isActive ? 'material-icons-round' : 'material-icons-round-outlined'} group-[.active]:text-font-color-highlight! dark:group-[.active]:text-dark-font-color-highlight! text-[1.3rem] opacity-60 transition-[color,opacity] group-[.active]:opacity-100! hover:opacity-80`}
            >
              table_rows
            </span>
          );
        }}
      </NavLink>

      <NavLink
        to="/mini-player"
        className={`full-screen-player-btn text-font-color-black text-opacity-60 after:bg-font-color-highlight dark:text-font-color-white dark:after:bg-dark-font-color-highlight mr-6! rounded-none! border-0! bg-transparent p-0! outline-offset-1 after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:opacity-0 after:transition-opacity hover:bg-transparent focus-visible:outline! lg:hidden dark:bg-transparent dark:hover:bg-transparent`}
        title={t('player.openInMiniPlayer')}
      >
        {({ isActive }) => {
          return (
            <span
              className={`${isActive ? 'material-icons-round' : 'material-icons-round-outlined'} group-[.active]:text-font-color-highlight! dark:group-[.active]:text-dark-font-color-highlight! text-xl! opacity-60 transition-[color,opacity] group-[.active]:opacity-100! hover:opacity-80`}
            >
              pip
            </span>
          );
        }}
      </NavLink>

      <NavLink
        to="/fullscreen-player"
        className={`full-screen-player-btn text-font-color-black text-opacity-60 after:bg-font-color-highlight dark:text-font-color-white dark:after:bg-dark-font-color-highlight mr-6! rounded-none! border-0! bg-transparent p-0! outline-offset-1 after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:opacity-0 after:transition-opacity hover:bg-transparent focus-visible:outline! lg:hidden dark:bg-transparent dark:hover:bg-transparent`}
        title={t('player.openInFullScreen')}
      >
        {({ isActive }) => {
          return (
            <span
              className={`${isActive ? 'material-icons-round' : 'material-icons-round-outlined'} group-[.active]:text-font-color-highlight! dark:group-[.active]:text-dark-font-color-highlight! text-xl! opacity-60 transition-[color,opacity] group-[.active]:opacity-100! hover:opacity-80`}
            >
              fullscreen
            </span>
          );
        }}
      </NavLink>

      <Button
        className={`volume-btn after:bg-font-color-highlight dark:after:bg-dark-font-color-highlight mr-2! rounded-none! border-0! bg-transparent p-0! outline-offset-1 after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:opacity-0 after:transition-opacity hover:bg-transparent focus-visible:outline! dark:bg-transparent dark:hover:bg-transparent ${
          isMuted && 'after:opacity-100'
        }`}
        tooltipLabel={t('player.muteUnmute')}
        iconName={isMuted ? 'volume_off' : volume > 50 ? 'volume_up' : 'volume_down_alt'}
        iconClassName={`material-icons-round text-xl text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white ${
          isMuted && 'text-font-color-highlight! opacity-100! dark:text-dark-font-color-highlight!'
        }`}
        clickHandler={() => toggleMutedState(!isMuted)}
      />

      <div className="volume-slider-container mr-4 max-w-24 min-w-16 lg:mr-4">
        <VolumeSlider name="player-volume-slider" id="volumeSlider" />
      </div>
      <div className="other-settings-btn text-font-color-black text-opacity-60 dark:text-font-color-white mr-4 flex cursor-pointer items-center justify-center">
        <span
          title={t('player.otherSettings')}
          className="material-icons-round icon text-font-color-black dark:text-font-color-white cursor-pointer text-xl opacity-60 transition-opacity hover:opacity-80"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const element = e.currentTarget;
            const coords = element.getBoundingClientRect();
            openOtherSettingsContextMenu(coords.x, coords.y);
          }}
          onContextMenu={(e) => openOtherSettingsContextMenu(e.pageX, e.pageY)}
        >
          more_horiz
        </span>
      </div>
    </div>
  );
};

export default OtherSongControlsContainer;
