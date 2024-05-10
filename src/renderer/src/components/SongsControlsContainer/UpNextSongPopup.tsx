/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import { AppContext } from '../../contexts/AppContext';

import Button from '../Button';

type Props = {
  onPopupAppears: (isVisible: boolean) => void;
  isSemiTransparent?: boolean;
  className?: string;
};

const UpNextSongPopup = (props: Props) => {
  const { queue, currentSongData } = React.useContext(AppContext);
  const {
    changeCurrentActivePage
    // changeUpNextSongData
  } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { onPopupAppears, isSemiTransparent = false, className } = props;

  const [upNextSongData, setUpNextSongData] = React.useState<SongData>();
  const upNextSongDataCache = React.useRef<SongData>();

  React.useEffect(() => {
    onPopupAppears(!!upNextSongData);
  }, [onPopupAppears, upNextSongData]);

  const showPopup = useCallback(() => {
    setUpNextSongData(upNextSongDataCache.current);
    setTimeout(() => setUpNextSongData(undefined), 10000);
  }, []);

  React.useEffect(() => {
    let ctrlPressed = false;
    let lastCtrlPressTime = 0;
    const abortController = new AbortController();

    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Control') {
          const currentTime = new Date().getTime();
          if (currentTime - lastCtrlPressTime < 300 && ctrlPressed) {
            // Double Ctrl key press detected
            console.log('Double Ctrl key press detected');
            // Add your logic here
            showPopup();

            // Reset flag and time for next detection
            ctrlPressed = false;
            lastCtrlPressTime = 0;
          } else {
            // First Ctrl key press or not in quick succession
            ctrlPressed = true;
            lastCtrlPressTime = currentTime;
          }
        }
      },
      { signal: abortController.signal }
    );

    document.addEventListener(
      'keyup',
      (event) => {
        if (event.key === 'Control') {
          // Reset flag on Ctrl key release
          ctrlPressed = false;
          lastCtrlPressTime = 0;
        }
      },
      { signal: abortController.signal }
    );

    return () => {
      abortController.abort();
    };
  }, [showPopup]);

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let timeIntervalId: NodeJS.Timeout;
    if (queue.queue.length > 1 && queue.currentSongIndex !== null) {
      setUpNextSongData(undefined);
      const nextSongIndex = queue.queue[queue.currentSongIndex + 1];

      if (nextSongIndex) {
        timeoutId = setTimeout(
          () =>
            window.api.audioLibraryControls
              .getSongInfo([nextSongIndex])
              .then((res) => {
                if (res && res[0]) {
                  const [nextSongData] = res;
                  upNextSongDataCache.current = nextSongData;
                  // changeUpNextSongData(upNextSongDataCache.current);

                  timeIntervalId = setInterval(showPopup, 40000);
                }

                return undefined;
              })
              .catch((err) => console.error(err)),
          5000
        );
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (timeIntervalId) clearInterval(timeIntervalId);
    };
  }, [queue.currentSongIndex, queue.queue, showPopup]);

  const showSongInfoPage = React.useCallback(
    (songId: string) =>
      currentSongData.isKnownSource
        ? changeCurrentActivePage('SongInfo', {
            songId
          })
        : undefined,
    [changeCurrentActivePage, currentSongData.isKnownSource]
  );

  return upNextSongData ? (
    <div
      className={`next-song appear-from-bottom group/nextSong relative flex max-w-full items-center rounded-full px-3 py-1 text-xs text-font-color-black dark:text-font-color-white ${
        isSemiTransparent
          ? 'bg-background-color-2/75 backdrop-blur-sm dark:bg-dark-background-color-2/75'
          : 'bg-background-color-2 dark:bg-dark-background-color-2'
      } ${className}`}
    >
      <p className="truncate">
        <span className="font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          {t('player.upNext')}
        </span>{' '}
        <span
          className="cursor-pointer outline-1 outline-offset-1 hover:underline focus-visible:!outline"
          onClick={() => showSongInfoPage(upNextSongData.songId)}
          onKeyDown={(e) => e.key === 'Enter' && showSongInfoPage(upNextSongData.songId)}
        >
          {upNextSongData.title}
        </span>
        {upNextSongData.artists && upNextSongData.artists.length > 0 && (
          <>
            {' '}
            <span className="font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
              {t('player.by')}
            </span>{' '}
            <span
              className="cursor-pointer outline-1 outline-offset-1 hover:underline focus-visible:!outline"
              onClick={() =>
                upNextSongData?.artists![0] &&
                changeCurrentActivePage('ArtistInfo', {
                  artistId: upNextSongData.artists[0].artistId
                })
              }
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                upNextSongData?.artists![0] &&
                changeCurrentActivePage('ArtistInfo', {
                  artistId: upNextSongData.artists[0].artistId
                })
              }
            >
              {upNextSongData.artists[0].name}
            </span>
            {upNextSongData.artists.length - 1 > 0 && (
              <span className="opacity-80"> +{upNextSongData.artists.length - 1}</span>
            )}
          </>
        )}
      </p>
      <Button
        iconName="close"
        tooltipLabel={t('player.closeUpNext')}
        className="!m-0 !hidden !border-none !py-0 !pl-1 !pr-0 !text-base !text-font-color-highlight outline-1 outline-offset-1 focus-visible:!outline group-hover/nextSong:!flex dark:!text-dark-font-color-highlight"
        clickHandler={() => setUpNextSongData(undefined)}
      />
    </div>
  ) : undefined;
};

export default UpNextSongPopup;
