/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable react/no-array-index-key */
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import debounce from 'renderer/utils/debounce';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';
import { AppContext } from 'renderer/contexts/AppContext';
import useNetworkConnectivity from 'renderer/hooks/useNetworkConnectivity';

import LyricLine from './LyricLine';
import LyricsSource from './LyricsSource';
import NoLyrics from './NoLyrics';
import MainContainer from '../MainContainer';
import Button from '../Button';

import { appPreferences } from '../../../../package.json';
import { isLyricsEnhancedSynced } from '../SongTagsEditingPage/input_containers/SongLyricsEditorInput';
import { LyricData } from '../LyricsEditingPage/LyricsEditingPage';

const { metadataEditingSupportedExtensions } = appPreferences;

export const syncedLyricsRegex = /^\[\d+:\d{1,2}\.\d{1,3}]/gm;

// substracted 350 milliseconds to keep lyrics in sync with the lyrics line animations.
export const delay = 0.35;

let isScrollingByCode = false;
document.addEventListener('lyrics/scrollIntoView', () => {
  isScrollingByCode = true;
});

const LyricsPage = () => {
  const { songPosition } = React.useContext(SongPositionContext);
  const { currentSongData, localStorageData } = useContext(AppContext);
  const {
    addNewNotifications,
    updateCurrentlyActivePageData,
    changeCurrentActivePage,
    updateSongPosition,
  } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [lyrics, setLyrics] = React.useState(
    null as SongLyrics | undefined | null,
  );

  const lyricsLinesContainerRef = React.useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = React.useState(true);
  // const [isOfflineLyricAvailable, setIsOfflineLyricsAvailable] =
  React.useState(false);
  const { isOnline } = useNetworkConnectivity();

  const copyright = React.useMemo(() => {
    if (lyrics?.copyright) return lyrics.copyright;
    if (lyrics?.lyrics?.copyright) return lyrics?.lyrics?.copyright;
    return undefined;
  }, [lyrics]);

  const skipLyricsLines = React.useCallback(
    (option: 'previous' | 'next' = 'next') => {
      if (lyrics?.lyrics.isSynced) {
        const { syncedLyrics } = lyrics.lyrics;

        if (syncedLyrics) {
          const lyricsLines: typeof syncedLyrics = [
            { start: 0, end: syncedLyrics[0].start, text: '...' },
            ...syncedLyrics,
          ];
          for (let i = 0; i < lyricsLines.length; i += 1) {
            const { start, end } = lyricsLines[i];
            const isInRange =
              songPosition > start - delay && songPosition < end - delay;
            if (isInRange) {
              if (option === 'next' && lyricsLines[i + 1])
                updateSongPosition(lyricsLines[i + 1].start);
              else if (option === 'previous' && lyricsLines[i - 1])
                updateSongPosition(lyricsLines[i - 1].start);
            }
          }
        }
      }
    },
    [lyrics?.lyrics, songPosition, updateSongPosition],
  );

  const manageLyricsPageKeyboardShortcuts = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowUp') skipLyricsLines('previous');
      else if (e.altKey && e.key === 'ArrowDown') skipLyricsLines('next');
    },
    [skipLyricsLines],
  );

  React.useEffect(() => {
    window.addEventListener('keydown', manageLyricsPageKeyboardShortcuts);
    return () => {
      window.removeEventListener('keydown', manageLyricsPageKeyboardShortcuts);
    };
  }, [manageLyricsPageKeyboardShortcuts]);

  const requestedLyricsTitle = React.useRef<string>();

  React.useEffect(() => {
    if (requestedLyricsTitle.current !== currentSongData.title) {
      requestedLyricsTitle.current = currentSongData.title;
      setLyrics(null);
      window.api.lyrics
        .getSongLyrics(
          {
            songTitle: currentSongData.title,
            songArtists: Array.isArray(currentSongData.artists)
              ? currentSongData.artists.map((artist) => artist.name)
              : [],
            songPath: currentSongData.path,
            duration: currentSongData.duration,
          },
          undefined,
          undefined,
          localStorageData.preferences.lyricsAutomaticallySaveState,
        )
        .then((res) => {
          setLyrics(res);

          if (lyricsLinesContainerRef.current)
            lyricsLinesContainerRef.current.scrollTop = 0;
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [
    addNewNotifications,
    currentSongData.artists,
    currentSongData.duration,
    currentSongData.path,
    currentSongData.songId,
    currentSongData.title,
    localStorageData.preferences.lyricsAutomaticallySaveState,
  ]);

  React.useEffect(() => {
    updateCurrentlyActivePageData((prevData) => {
      return { ...prevData, isLowResponseRequired: lyrics?.lyrics.isSynced };
    });
  }, [lyrics?.lyrics.isSynced, updateCurrentlyActivePageData]);

  const lyricsComponents = React.useMemo(() => {
    if (lyrics && lyrics?.lyrics) {
      const {
        isSynced,
        lyrics: unsyncedLyrics,
        syncedLyrics,
        offset = 0,
      } = lyrics.lyrics;

      if (syncedLyrics) {
        const syncedLyricsLines = syncedLyrics.map((lyric, index) => {
          const start = lyric.start + offset;
          const end =
            (lyric.end === Number.POSITIVE_INFINITY
              ? currentSongData.duration
              : lyric.end) + offset;

          return (
            <LyricLine
              key={index}
              index={index}
              lyric={lyric.text}
              syncedLyrics={{ start, end }}
              isAutoScrolling={isAutoScrolling}
            />
          );
        });

        const firstLine = (
          <LyricLine
            key="..."
            index={0}
            lyric="•••"
            syncedLyrics={{
              start: 0,
              end: (syncedLyrics[0]?.start || 0) + offset,
            }}
            isAutoScrolling={isAutoScrolling}
          />
        );

        if ((syncedLyrics[0]?.start || 0) !== 0)
          syncedLyricsLines.unshift(firstLine);
        return syncedLyricsLines;
      }
      if (!isSynced) {
        return unsyncedLyrics.map((line, index) => {
          return (
            <LyricLine
              key={index}
              index={index}
              lyric={line}
              isAutoScrolling={isAutoScrolling}
            />
          );
        });
      }
    }
    return [];
  }, [currentSongData?.duration, isAutoScrolling, lyrics]);

  const showOnlineLyrics = React.useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void,
    ) => {
      setIsDisabled(true);
      setIsPending(true);
      window.api.lyrics
        .getSongLyrics(
          {
            songTitle: currentSongData.title,
            songArtists: Array.isArray(currentSongData.artists)
              ? currentSongData.artists.map((artist) => artist.name)
              : [],
            songPath: currentSongData.path,
            duration: currentSongData.duration,
          },
          'ANY',
          'ONLINE_ONLY',
          'NONE',
        )
        .then((res) => {
          if (res) return setLyrics(res);
          return addNewNotifications([
            {
              id: 'lyricsUpdateFailed',
              content: t('lyricsPage.noOnlineLyrics'),
              iconName: 'warning',
              iconClassName: 'material-icons-round-outlined !text-xl',
            },
          ]);
        })
        .finally(() => {
          setIsDisabled(false);
          setIsPending(false);
        })
        .catch((err) => console.error(err));
    },
    [
      addNewNotifications,
      currentSongData.artists,
      currentSongData.duration,
      currentSongData.path,
      currentSongData.title,
      t,
    ],
  );

  const pathExt = React.useMemo(
    () => window.api.utils.getExtension(currentSongData.path),
    [currentSongData.path],
  );

  const showOfflineLyrics = React.useCallback(
    (_: unknown, setIsDisabled: (state: boolean) => void) => {
      setIsDisabled(true);
      window.api.lyrics
        .getSongLyrics(
          {
            songTitle: currentSongData.title,
            songArtists: Array.isArray(currentSongData.artists)
              ? currentSongData.artists.map((artist) => artist.name)
              : [],
            songPath: currentSongData.path,
            duration: currentSongData.duration,
          },
          'ANY',
          'OFFLINE_ONLY',
          localStorageData.preferences.lyricsAutomaticallySaveState,
        )
        .then((res) => {
          if (res) return setLyrics(res);
          return addNewNotifications([
            {
              id: 'offlineLyricsFetchFailed',
              content: t('lyricsPage.noOfflineLyrics'),
              iconName: 'warning',
              iconClassName: 'material-icons-round-outlined !text-xl',
            },
          ]);
        })
        .finally(() => setIsDisabled(false))
        .catch((err) => console.error(err));
    },
    [
      addNewNotifications,
      currentSongData.artists,
      currentSongData.duration,
      currentSongData.path,
      currentSongData.title,
      localStorageData.preferences.lyricsAutomaticallySaveState,
      t,
    ],
  );

  const saveOnlineLyrics = React.useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void,
    ) => {
      if (lyrics) {
        setIsDisabled(true);
        setIsPending(true);

        window.api.lyrics
          .saveLyricsToSong(currentSongData.path, lyrics)
          .then(() =>
            setLyrics((prevData) => {
              if (prevData) {
                return {
                  ...prevData,
                  source: 'IN_SONG_LYRICS',
                  isOfflineLyricsAvailable: true,
                } as SongLyrics;
              }
              return undefined;
            }),
          )
          .finally(() => {
            setIsPending(false);
            setIsDisabled(false);
          })
          .catch((err) => console.error(err));
      }
    },
    [currentSongData.path, lyrics],
  );

  const refreshOnlineLyrics = React.useCallback(
    (_: unknown, setIsDisabled: (state: boolean) => void) => {
      setIsDisabled(true);
      window.api.lyrics
        .getSongLyrics(
          {
            songTitle: currentSongData.title,
            songArtists: Array.isArray(currentSongData.artists)
              ? currentSongData.artists.map((artist) => artist.name)
              : [],
            songPath: currentSongData.path,
            duration: currentSongData.duration,
          },
          'ANY',
          'ONLINE_ONLY',
        )
        .then((res) => {
          if (res) return setLyrics(res);
          return addNewNotifications([
            {
              id: 'OnlineLyricsRefreshFailed',
              content: t('lyricsPage.onlineLyricsRefreshFailed'),
              iconName: 'warning',
              iconClassName: 'material-icons-round-outlined !text-xl',
            },
          ]);
        })
        .finally(() => setIsDisabled(false))
        .catch((err) => console.error(err));
    },
    [
      addNewNotifications,
      currentSongData.artists,
      currentSongData.duration,
      currentSongData.path,
      currentSongData.title,
      t,
    ],
  );

  const isSaveLyricsBtnDisabled = React.useMemo(
    () => !metadataEditingSupportedExtensions.includes(pathExt),
    [pathExt],
  );

  const isSynchronizedLyricsEnhancedSynced = React.useMemo(
    () =>
      lyrics &&
      lyrics.lyrics.isSynced &&
      isLyricsEnhancedSynced(lyrics?.lyrics.unparsedLyrics),
    [lyrics],
  );

  const goToLyricsEditor = React.useCallback(() => {
    if (lyrics) {
      let lines: LyricData[] = [];
      const { isSynced, syncedLyrics, lyrics: unsyncedLyrics } = lyrics.lyrics;

      if (isSynced && syncedLyrics)
        lines = syncedLyrics.map((lyric) => ({
          ...lyric,
          text: lyric.text,
        }));
      else {
        lines = unsyncedLyrics.map((line) => ({ text: line }));
      }

      changeCurrentActivePage('LyricsEditor', {
        lyrics: lines,
        songId: currentSongData.songId,
        songTitle: currentSongData.title,
        isEditingEnhancedSyncedLyrics:
          isSynced && isSynchronizedLyricsEnhancedSynced,
      });
    }
  }, [
    changeCurrentActivePage,
    currentSongData.songId,
    currentSongData.title,
    isSynchronizedLyricsEnhancedSynced,
    lyrics,
  ]);

  return (
    <MainContainer
      noDefaultStyles
      className={`lyrics-container appear-from-bottom relative flex h-full flex-col ![overflow-anchor:none] ${
        lyrics && isOnline ? 'justify-start' : 'items-center justify-center'
      }`}
    >
      <>
        {isOnline || lyrics ? (
          lyrics && lyrics.lyrics.lyrics.length > 0 ? (
            <>
              <div className="title-container relative flex w-full items-center justify-between py-2 pl-8 pr-2 text-2xl text-font-color-highlight dark:text-dark-font-color-highlight">
                <div className="flex max-w-[40%] items-center">
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {lyrics.source === 'IN_SONG_LYRICS' ? 'Offline' : 'Online'}{' '}
                    {t('lyricsPage.lyricsForSong', {
                      title: currentSongData.title,
                    })}
                  </span>
                  {!lyrics.isOfflineLyricsAvailable && (
                    <span
                      className="material-icons-round-outlined ml-4 cursor-pointer text-base"
                      title="No offline lyrics found in the song."
                    >
                      help
                    </span>
                  )}
                </div>
                <div className="buttons-container flex">
                  <Button
                    key={10}
                    tooltipLabel={t('lyricsPage.editLyrics')}
                    className="edit-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                    iconName="edit"
                    clickHandler={goToLyricsEditor}
                  />

                  {lyrics?.lyrics?.isSynced && (
                    <Button
                      key={5}
                      tooltipLabel={t(
                        `currentQueuePage.${
                          isAutoScrolling
                            ? 'disableAutoScrolling'
                            : 'enableAutoScrolling'
                        }`,
                      )}
                      pendingAnimationOnDisabled
                      className="show-online-lyrics-btn !text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                      iconName={isAutoScrolling ? 'flash_off' : 'flash_on'}
                      clickHandler={() =>
                        setIsAutoScrolling((prevState) => !prevState)
                      }
                    />
                  )}
                  {lyrics && lyrics.source === 'IN_SONG_LYRICS' && (
                    <Button
                      key={3}
                      label={t('lyricsPage.showOnlineLyrics')}
                      className="show-online-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                      iconName="language"
                      isDisabled={!isOnline}
                      tooltipLabel={
                        isOnline ? undefined : t('common.noInternet')
                      }
                      clickHandler={showOnlineLyrics}
                    />
                  )}
                  {lyrics && lyrics.source !== 'IN_SONG_LYRICS' && (
                    <>
                      <Button
                        key={5}
                        tooltipLabel={t('lyricsPage.refreshOnlineLyrics')}
                        pendingAnimationOnDisabled
                        className="refresh-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                        iconName="refresh"
                        clickHandler={refreshOnlineLyrics}
                      />
                      <Button
                        key={3}
                        label={t('lyricsPage.showSavedLyrics')}
                        className="show-online-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                        iconName="visibility"
                        clickHandler={showOfflineLyrics}
                        isDisabled={!lyrics.isOfflineLyricsAvailable}
                        tooltipLabel={
                          !lyrics.isOfflineLyricsAvailable
                            ? t('lyricsPage.noSavedLyrics')
                            : undefined
                        }
                      />
                      <Button
                        key={4}
                        label={t('lyricsEditingPage.saveLyrics')}
                        className="save-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                        iconName="save"
                        isDisabled={isSaveLyricsBtnDisabled}
                        tooltipLabel={
                          isSaveLyricsBtnDisabled
                            ? t(
                                'lyricsEditorSavePrompt.saveLyricsNotSupported',
                                {
                                  format: pathExt,
                                },
                              )
                            : undefined
                        }
                        clickHandler={saveOnlineLyrics}
                      />
                    </>
                  )}
                </div>
              </div>
              <div
                className="lyrics-lines-container flex h-full !w-full flex-col items-center overflow-y-auto px-8 py-[10vh] [scrollbar-gutter:stable]"
                ref={lyricsLinesContainerRef}
                onScroll={() =>
                  debounce(() => {
                    if (isScrollingByCode) {
                      isScrollingByCode = false;
                      console.log('scrolling by code');
                    } else console.log('user scrolling');
                  }, 100)
                }
              >
                {lyricsComponents}
                <LyricsSource
                  source={lyrics.source}
                  link={lyrics.link}
                  copyright={copyright}
                />
              </div>
            </>
          ) : lyrics === undefined || lyrics?.lyrics.lyrics.length === 0 ? (
            <NoLyrics
              iconName="release_alert"
              title={t('lyricsPage.noLyrics')}
              description={t('lyricsPage.noLyricsDescription')}
            />
          ) : (
            <NoLyrics
              iconName="hourglass_empty"
              title={t('lyricsPage.lyricsLoading')}
              description={t('lyricsPage.lyricsLoadingDescription')}
            />
          )
        ) : (
          <NoLyrics
            iconName="wifi_off"
            title={t('lyricsPage.noLyrics')}
            description={t('lyricsPage.noInternetDescription')}
          />
        )}
      </>
    </MainContainer>
  );
};

export default LyricsPage;
