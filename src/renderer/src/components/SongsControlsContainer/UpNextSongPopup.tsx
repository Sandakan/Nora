/* eslint-disable jsx-a11y/no-static-element-interactions */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '../Button';
import { useStore } from '@tanstack/react-store';
import { store } from '../../store/store';
import { useNavigate } from '@tanstack/react-router';

type Props = {
  onPopupAppears: (isVisible: boolean) => void;
  isSemiTransparent?: boolean;
  className?: string;
};

const UpNextSongPopup = (props: Props) => {
  const currentSongData = useStore(store, (state) => state.currentSongData);
  const queue = useStore(store, (state) => state.localStorage.queue);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const { onPopupAppears, isSemiTransparent = false, className } = props;

  const [upNextSongData, setUpNextSongData] = useState<SongData>();
  const upNextSongDataCache = useRef<SongData>(null as unknown as SongData);

  useEffect(() => {
    onPopupAppears(!!upNextSongData);
  }, [onPopupAppears, upNextSongData]);

  const showPopup = useCallback(() => {
    setUpNextSongData(upNextSongDataCache.current);
    setTimeout(() => setUpNextSongData(undefined), 10000);
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let timeIntervalId: NodeJS.Timeout;
    if (queue.songIds.length > 1 && queue.position !== null) {
      setUpNextSongData(undefined);
      const nextSongIndex = queue.songIds[queue.position + 1];

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
  }, [queue.position, queue.songIds, showPopup]);

  const showSongInfoPage = useCallback(
    (songId: number) =>
      currentSongData.isKnownSource
        ? navigate({
            to: '/main-player/songs/$songId',
            params: { songId: String(songId) }
          })
        : undefined,
    [navigate, currentSongData.isKnownSource]
  );

  return upNextSongData ? (
    <div
      className={`next-song appear-from-bottom group/nextSong text-font-color-black dark:text-font-color-white relative flex max-w-full items-center rounded-full px-3 py-1 text-xs ${
        isSemiTransparent
          ? 'bg-background-color-2/75 dark:bg-dark-background-color-2/75 backdrop-blur-xs'
          : 'bg-background-color-2 dark:bg-dark-background-color-2'
      } ${className}`}
    >
      <p className="truncate">
        <span className="text-font-color-highlight dark:text-dark-font-color-highlight font-medium">
          {t('player.upNext')}
        </span>{' '}
        <span
          className="cursor-pointer outline-offset-1 hover:underline focus-visible:outline!"
          onClick={() => showSongInfoPage(upNextSongData.songId)}
          onKeyDown={(e) => e.key === 'Enter' && showSongInfoPage(upNextSongData.songId)}
        >
          {upNextSongData.title}
        </span>
        {upNextSongData.artists && upNextSongData.artists.length > 0 && (
          <>
            {' '}
            <span className="text-font-color-highlight dark:text-dark-font-color-highlight font-medium">
              {t('player.by')}
            </span>{' '}
            <span
              className="cursor-pointer outline-offset-1 hover:underline focus-visible:outline!"
              onClick={() =>
                upNextSongData?.artists![0] &&
                navigate({
                  to: '/main-player/artists/$artistId',
                  params: { artistId: String(upNextSongData.artists[0].artistId) }
                })
              }
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                upNextSongData?.artists![0] &&
                navigate({
                  to: '/main-player/artists/$artistId',
                  params: { artistId: String(upNextSongData.artists[0].artistId) }
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
        className="text-font-color-highlight! dark:text-dark-font-color-highlight! m-0! hidden! border-none! py-0! pr-0! pl-1! text-base! outline-offset-1 group-hover/nextSong:flex! focus-visible:outline!"
        clickHandler={() => setUpNextSongData(undefined)}
      />
    </div>
  ) : undefined;
};

export default UpNextSongPopup;
