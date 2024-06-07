/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import { AppContext } from '../../contexts/AppContext';
import Button from '../Button';
import VolumeSlider from '../VolumeSlider';

const OtherSongControlsContainer = () => {
  const { currentlyActivePage, isMuted, volume } = useContext(AppContext);
  const { changeCurrentActivePage, updatePlayerType, toggleMutedState, updateContextMenuData } =
    useContext(AppUpdateContext);
  const { t } = useTranslation();

  const openOtherSettingsContextMenu = useCallback(
    (pageX: number, pageY: number) => {
      updateContextMenuData(
        true,
        [
          {
            label: t('settingsPage.equalizer'),
            iconName: 'graphic_eq',
            iconClassName: 'material-icons-round-outlined mr-2',
            handlerFunction: () =>
              changeCurrentActivePage('Settings', {
                scrollToId: '#equalizer'
              })
          },
          {
            label: t('player.adjustPlaybackSpeed'),
            iconName: 'avg_pace',
            iconClassName: 'material-icons-round-outlined mr-2',
            handlerFunction: () =>
              changeCurrentActivePage('Settings', {
                scrollToId: '#playbackRateInterval'
              })
          },
          {
            label: t('player.showCurrentQueue'),
            iconName: 'table_rows',
            iconClassName: 'material-icons-round-outlined mr-2',
            handlerFunction: () => changeCurrentActivePage('CurrentQueue')
          },
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
    [changeCurrentActivePage, t, updateContextMenuData, updatePlayerType]
  );

  return (
    <div className="other-controls-container flex items-center justify-end">
      <Button
        className={`queue-btn !mr-6 !rounded-none !border-0 bg-transparent !p-0 text-font-color-black text-opacity-60 outline-1 outline-offset-1 after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:bg-font-color-highlight after:opacity-0 after:transition-opacity hover:bg-transparent focus-visible:!outline lg:hidden dark:bg-transparent dark:text-font-color-white dark:after:bg-dark-font-color-highlight dark:hover:bg-transparent ${
          currentlyActivePage.pageTitle === 'CurrentQueue' && 'after:opacity-100'
        }`}
        tooltipLabel={t('player.currentQueue')}
        iconName="table_rows"
        iconClassName={`text-xl text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white ${
          currentlyActivePage.pageTitle === 'CurrentQueue'
            ? '!text-font-color-highlight font-medium !opacity-90 dark:!text-dark-font-color-highlight material-icons-round'
            : 'material-icons-round-outlined'
        } `}
        clickHandler={() =>
          currentlyActivePage.pageTitle === 'CurrentQueue'
            ? changeCurrentActivePage('Home')
            : changeCurrentActivePage('CurrentQueue')
        }
      />

      <Button
        className="mini-player-btn !mr-6 !rounded-none !border-0 bg-transparent !p-0 text-font-color-black text-opacity-60 outline-1 outline-offset-1 hover:bg-transparent focus-visible:!outline lg:hidden dark:bg-transparent dark:text-font-color-white dark:hover:bg-transparent"
        clickHandler={() => updatePlayerType('mini')}
        tooltipLabel={t('player.openInMiniPlayer')}
        iconName="pip"
        iconClassName="material-icons-round-outlined icon cursor-pointer text-xl text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white"
      />

      <Button
        className="full-screen-player-btn !mr-6 !rounded-none !border-0 bg-transparent !p-0 text-font-color-black text-opacity-60 outline-1 outline-offset-1 after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:bg-font-color-highlight after:opacity-0 after:transition-opacity hover:bg-transparent focus-visible:!outline lg:hidden dark:bg-transparent dark:text-font-color-white dark:after:bg-dark-font-color-highlight dark:hover:bg-transparent"
        tooltipLabel={t('player.openInFullScreen')}
        iconName="fullscreen"
        iconClassName="material-icons-round-outlined text-xl text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white"
        clickHandler={() => updatePlayerType('full')}
      />

      <Button
        className={`volume-btn !mr-2 !rounded-none !border-0 bg-transparent !p-0 outline-1 outline-offset-1 after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:bg-font-color-highlight after:opacity-0 after:transition-opacity hover:bg-transparent focus-visible:!outline dark:bg-transparent dark:after:bg-dark-font-color-highlight dark:hover:bg-transparent ${
          isMuted && 'after:opacity-100'
        }`}
        tooltipLabel={t('player.muteUnmute')}
        iconName={isMuted ? 'volume_off' : volume > 50 ? 'volume_up' : 'volume_down_alt'}
        iconClassName={`material-icons-round text-xl text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white ${
          isMuted && '!text-font-color-highlight !opacity-100 dark:!text-dark-font-color-highlight'
        }`}
        clickHandler={() => toggleMutedState(!isMuted)}
      />

      <div className="volume-slider-container mr-4 min-w-[4rem] max-w-[6rem] lg:mr-4">
        <VolumeSlider name="player-volume-slider" id="volumeSlider" />
      </div>
      <div className="other-settings-btn mr-4 flex cursor-pointer items-center justify-center text-font-color-black text-opacity-60 dark:text-font-color-white">
        <span
          title={t('player.otherSettings')}
          className="material-icons-round icon cursor-pointer text-xl text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white"
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
