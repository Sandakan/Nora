/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useContext } from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';

const OtherSongControlsContainer = () => {
  const { currentlyActivePage, isMiniPlayer, isMuted, volume } =
    useContext(AppContext);
  const {
    changeCurrentActivePage,
    updateMiniPlayerStatus,
    toggleMutedState,
    updateVolume,
    updateContextMenuData,
  } = useContext(AppUpdateContext);
  const volumeSliderRef = React.useRef<HTMLInputElement>(null);

  const volumeBarCssProperties: any = {};

  volumeBarCssProperties['--volume-before-width'] = `${volume}%`;

  const openOtherSettingsContextMenu = React.useCallback(
    (pageX: number, pageY: number) => {
      updateContextMenuData(
        true,
        [
          {
            label: 'Show Current Queue',
            iconName: 'table_rows',
            iconClassName: '!material-icons-round-outlined',
            handlerFunction: () =>
              currentlyActivePage.pageTitle === 'CurrentQueue'
                ? changeCurrentActivePage('Home')
                : changeCurrentActivePage('CurrentQueue'),
          },
          {
            label: 'Open Mini Player',
            iconName: 'tab',
            iconClassName: '!material-icons-round-outlined',
            handlerFunction: () => updateMiniPlayerStatus(!isMiniPlayer),
          },
        ],
        pageX,
        pageY
      );
    },
    [
      changeCurrentActivePage,
      currentlyActivePage.pageTitle,
      isMiniPlayer,
      updateContextMenuData,
      updateMiniPlayerStatus,
    ]
  );

  // const scrollOnVolume = React.useCallback(() => {
  //   if (volumeSliderRef.current) updateVolume(window.scrollY);
  // }, []);

  return (
    <div className="other-controls-container flex w-[30%] items-center justify-end">
      <div className="queue-btn mr-6 flex cursor-pointer items-center justify-center text-font-color-black text-opacity-60 dark:text-font-color-white lg:hidden">
        <span
          title="Current Queue (Ctrl + Q)"
          className={`material-icons-round-outlined icon cursor-pointer text-xl text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white ${
            currentlyActivePage.pageTitle === 'CurrentQueue' &&
            '!text-font-color-highlight !opacity-90 dark:!text-dark-font-color-highlight'
          } `}
          onClick={() =>
            currentlyActivePage.pageTitle === 'CurrentQueue'
              ? changeCurrentActivePage('Home')
              : changeCurrentActivePage('CurrentQueue')
          }
        >
          table_rows
        </span>
      </div>
      <div className="mini-player-btn mr-6 flex cursor-pointer items-center justify-center text-font-color-black text-opacity-60 dark:text-font-color-white lg:hidden">
        <span
          title="Open in Mini player (Ctrl + N)"
          className="material-icons-round-outlined icon cursor-pointer text-xl text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white"
          onClick={() => updateMiniPlayerStatus(!isMiniPlayer)}
        >
          tab
        </span>
      </div>

      <div className="volume-btn mr-2 flex cursor-pointer items-center justify-center">
        <span
          title="Mute/Unmute (Ctrl + M)"
          className={`material-icons-round icon cursor-pointer text-xl text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white ${
            isMuted &&
            '!text-font-color-highlight !opacity-100 dark:!text-dark-font-color-highlight'
          }`}
          onClick={() => toggleMutedState(!isMuted)}
        >
          {isMuted ? 'volume_off' : 'volume_up'}
        </span>
      </div>
      <div className="volume-slider-container mr-6 min-w-[4rem] max-w-[6rem] lg:mr-4">
        <input
          type="range"
          id="volumeSlider"
          className="relative float-left m-0 h-6 w-full appearance-none rounded-lg bg-[transparent] p-0 outline-none before:absolute before:top-1/2 before:left-0 before:h-1 before:w-[var(--volume-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-black/50 before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight dark:before:bg-font-color-white/50 dark:hover:before:bg-dark-font-color-highlight"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => updateVolume(Number(e.target.value))}
          aria-label="Volume slider"
          style={volumeBarCssProperties}
          title={Math.round(volume).toString()}
          // onMouseOver={() =>
          //   window.addEventListener('scroll', () => {
          //     console.log(true);
          //   })
          // }
          // onMouseOut={() =>
          //   window.removeEventListener('scroll', () => {
          //     console.log(true);
          //   })
          // }
          ref={volumeSliderRef}
        />
      </div>
      <div className="other-settings-btn mr-3 hidden cursor-pointer items-center justify-center text-font-color-black text-opacity-60 dark:text-font-color-white lg:flex">
        <span
          title="Other Settings"
          className="material-icons-round icon cursor-pointer text-xl text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const element = e.currentTarget || e.target;
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
