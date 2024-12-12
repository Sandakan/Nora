/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable react/no-array-index-key */
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '../../i18n';
import debounce from '../../utils/debounce';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import useNetworkConnectivity from '../../hooks/useNetworkConnectivity';

import LyricLine from './LyricLine';
import LyricsMetadata from './LyricsMetadata';
import NoLyrics from './NoLyrics';
import MainContainer from '../MainContainer';
import Button from '../Button';

import { appPreferences } from '../../../../../package.json';
import { LyricData } from '../LyricsEditingPage/LyricsEditingPage';
import { isLyricsEnhancedSynced } from '../../../../common/isLyricsSynced';
import useSkipLyricsLines from '../../hooks/useSkipLyricsLines';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const { metadataEditingSupportedExtensions } = appPreferences;

// eslint-disable-next-line react-refresh/only-export-components
export const syncedLyricsRegex = /^\[\d+:\d{1,2}\.\d{1,3}]/gm;

// // substracted 350 milliseconds to keep lyrics in sync with the lyrics line animations.
// export const delay = 0.35;

let isScrollingByCode = false;
// document.addEventListener('lyrics/scrollIntoView', () => {
//   isScrollingByCode = true;
// });

const LyricsPage = () => {
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const currentSongData = useStore(store, (state) => state.currentSongData);

  const { addNewNotifications, updateCurrentlyActivePageData, changeCurrentActivePage } =
    useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [lyrics, setLyrics] = useState(null as SongLyrics | undefined | null);

  const lyricsLinesContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  useSkipLyricsLines(lyrics);
  const { isOnline } = useNetworkConnectivity();
  // const [isOfflineLyricAvailable, setIsOfflineLyricsAvailable] = useState(false);

  const copyright = useMemo(() => lyrics?.lyrics?.copyright, [lyrics]);

  const requestedLyricsTitle = useRef<string>();

  useEffect(() => {
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
            album: currentSongData.album?.name,
            songPath: currentSongData.path,
            duration: currentSongData.duration
          },
          undefined,
          undefined,
          preferences.lyricsAutomaticallySaveState
        )
        .then(async (res) => {
          setLyrics(res);
          // console.log(res);

          if (lyricsLinesContainerRef.current) lyricsLinesContainerRef.current.scrollTop = 0;

          if (
            preferences.autoTranslateLyrics &&
            !res?.lyrics.isReset &&
            !res?.lyrics.isTranslated
          ) {
            setLyrics(await window.api.lyrics.getTranslatedLyrics(i18n.language as LanguageCodes));
          }
          if (preferences.autoConvertLyrics && !res?.lyrics.isReset && !res?.lyrics.isRomanized) {
            if (res?.lyrics.originalLanguage == 'zh')
              setLyrics(await window.api.lyrics.convertLyricsToPinyin());
            else if (res?.lyrics.originalLanguage == 'ja')
              setLyrics(await window.api.lyrics.romanizeLyrics());
            else if (res?.lyrics.originalLanguage == 'ko')
              setLyrics(await window.api.lyrics.convertLyricsToRomaja());
          }

          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [
    addNewNotifications,
    currentSongData.album?.name,
    currentSongData.artists,
    currentSongData.duration,
    currentSongData.path,
    currentSongData.songId,
    currentSongData.title,
    preferences.lyricsAutomaticallySaveState,
    preferences.autoTranslateLyrics,
    preferences.autoConvertLyrics
  ]);

  useEffect(() => {
    updateCurrentlyActivePageData((prevData) => {
      return { ...prevData, isLowResponseRequired: lyrics?.lyrics.isSynced };
    });
  }, [lyrics?.lyrics.isSynced, updateCurrentlyActivePageData]);

  const lyricsComponents = useMemo(() => {
    if (lyrics && lyrics?.lyrics) {
      const { isSynced, parsedLyrics, offset = 0 } = lyrics.lyrics;

      if (isSynced && parsedLyrics) {
        const syncedLyricsLines = parsedLyrics.map((lyric, index) => {
          const { originalText } = lyric;
          const start = (lyric?.start || 0) + offset;
          const end =
            (lyric.end === Number.POSITIVE_INFINITY ? currentSongData.duration : lyric.end || 0) +
            offset;

          return (
            <LyricLine
              key={index}
              index={index}
              lyric={originalText}
              translatedLyricLines={lyric.translatedTexts}
              syncedLyrics={{ start, end }}
              isAutoScrolling={isAutoScrolling}
              convertedLyric={lyric.romanizedText}
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
              end: (parsedLyrics[0]?.start || 0) + offset
            }}
            isAutoScrolling={isAutoScrolling}
          />
        );

        if ((parsedLyrics[0]?.start || 0) !== 0) syncedLyricsLines.unshift(firstLine);
        return syncedLyricsLines;
      }

      if (!isSynced) {
        return parsedLyrics.map((line, index) => {
          return (
            <LyricLine
              key={index}
              index={index}
              lyric={line.originalText}
              isAutoScrolling={isAutoScrolling}
              convertedLyric={line.romanizedText}
            />
          );
        });
      }
    }
    return [];
  }, [currentSongData?.duration, isAutoScrolling, lyrics]);

  const showOnlineLyrics = useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void
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
            album: currentSongData.album?.name,
            songPath: currentSongData.path,
            duration: currentSongData.duration
          },
          'ANY',
          'ONLINE_ONLY',
          'NONE'
        )
        .then((res) => {
          if (res) return setLyrics(res);
          return addNewNotifications([
            {
              id: 'lyricsUpdateFailed',
              content: t('lyricsPage.noOnlineLyrics'),
              iconName: 'warning',
              iconClassName: 'material-icons-round-outlined !text-xl'
            }
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
      currentSongData.album?.name,
      currentSongData.artists,
      currentSongData.duration,
      currentSongData.path,
      currentSongData.title,
      t
    ]
  );

  const pathExt = useMemo(
    () => window.api.utils.getExtension(currentSongData.path),
    [currentSongData.path]
  );

  const showOfflineLyrics = useCallback(
    (_: unknown, setIsDisabled: (state: boolean) => void) => {
      setIsDisabled(true);
      window.api.lyrics
        .getSongLyrics(
          {
            songTitle: currentSongData.title,
            songArtists: Array.isArray(currentSongData.artists)
              ? currentSongData.artists.map((artist) => artist.name)
              : [],
            album: currentSongData.album?.name,
            songPath: currentSongData.path,
            duration: currentSongData.duration
          },
          'ANY',
          'OFFLINE_ONLY',
          preferences.lyricsAutomaticallySaveState
        )
        .then((res) => {
          if (res) return setLyrics(res);
          return addNewNotifications([
            {
              id: 'offlineLyricsFetchFailed',
              content: t('lyricsPage.noOfflineLyrics'),
              iconName: 'warning',
              iconClassName: 'material-icons-round-outlined !text-xl'
            }
          ]);
        })
        .finally(() => setIsDisabled(false))
        .catch((err) => console.error(err));
    },
    [
      addNewNotifications,
      currentSongData.album?.name,
      currentSongData.artists,
      currentSongData.duration,
      currentSongData.path,
      currentSongData.title,
      preferences.lyricsAutomaticallySaveState,
      t
    ]
  );

  const saveOnlineLyrics = useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void
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
                  isOfflineLyricsAvailable: true
                } as SongLyrics;
              }
              return undefined;
            })
          )
          .finally(() => {
            setIsPending(false);
            setIsDisabled(false);
          })
          .catch((err) => console.error(err));
      }
    },
    [currentSongData.path, lyrics]
  );

  const refreshOnlineLyrics = useCallback(
    (_: unknown, setIsDisabled: (state: boolean) => void) => {
      setIsDisabled(true);
      window.api.lyrics
        .getSongLyrics(
          {
            songTitle: currentSongData.title,
            songArtists: Array.isArray(currentSongData.artists)
              ? currentSongData.artists.map((artist) => artist.name)
              : [],
            album: currentSongData.album?.name,
            songPath: currentSongData.path,
            duration: currentSongData.duration
          },
          'ANY',
          'ONLINE_ONLY'
        )
        .then((res) => {
          if (res) return setLyrics(res);
          return addNewNotifications([
            {
              id: 'OnlineLyricsRefreshFailed',
              content: t('lyricsPage.onlineLyricsRefreshFailed'),
              iconName: 'warning',
              iconClassName: 'material-icons-round-outlined !text-xl'
            }
          ]);
        })
        .finally(() => setIsDisabled(false))
        .catch((err) => console.error(err));
    },
    [
      addNewNotifications,
      currentSongData.album?.name,
      currentSongData.artists,
      currentSongData.duration,
      currentSongData.path,
      currentSongData.title,
      t
    ]
  );

  const isSaveLyricsBtnDisabled = useMemo(
    () => !metadataEditingSupportedExtensions.includes(pathExt),
    [pathExt]
  );

  const isSynchronizedLyricsEnhancedSynced = useMemo(
    () => lyrics && lyrics.lyrics.isSynced && isLyricsEnhancedSynced(lyrics?.lyrics.unparsedLyrics),
    [lyrics]
  );

  const goToLyricsEditor = useCallback(() => {
    let lines: LyricData[] = [{ text: '' }];
    if (lyrics) {
      const { parsedLyrics } = lyrics.lyrics;

      lines = parsedLyrics.map((lyric) => ({
        ...lyric,
        text: lyric.originalText
      }));
    }

    changeCurrentActivePage('LyricsEditor', {
      lyrics: lines,
      songId: currentSongData.songId,
      songTitle: currentSongData.title,
      isEditingEnhancedSyncedLyrics: lyrics?.lyrics?.isSynced && isSynchronizedLyricsEnhancedSynced
    });
  }, [
    changeCurrentActivePage,
    currentSongData.songId,
    currentSongData.title,
    isSynchronizedLyricsEnhancedSynced,
    lyrics
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
          lyrics && lyrics.lyrics.parsedLyrics.length > 0 ? (
            <>
              <div className="title-container relative flex w-full items-center justify-between py-2 pl-8 pr-2 text-2xl text-font-color-highlight dark:text-dark-font-color-highlight">
                <div className="flex max-w-[40%] items-center">
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                    {t(
                      lyrics.source === 'IN_SONG_LYRICS'
                        ? 'lyricsPage.offlineLyricsForSong'
                        : 'lyricsPage.onlineLyricsForSong',
                      {
                        title: currentSongData.title
                      }
                    )}
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
                        `currentQueuePage.${isAutoScrolling ? 'disableAutoScrolling' : 'enableAutoScrolling'}`
                      )}
                      pendingAnimationOnDisabled
                      className="show-online-lyrics-btn !text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                      iconName={isAutoScrolling ? 'flash_off' : 'flash_on'}
                      clickHandler={() => setIsAutoScrolling((prevState) => !prevState)}
                    />
                  )}
                  {lyrics && !lyrics.lyrics.isTranslated && (
                    <Button
                      key={11}
                      tooltipLabel={t('lyricsPage.translateLyrics')}
                      className="translate-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                      iconName="translate"
                      clickHandler={async () => {
                        const lyricsData = await window.api.lyrics.getTranslatedLyrics(
                          i18n.language as LanguageCodes
                        );
                        setLyrics(lyricsData);
                      }}
                    />
                  )}

                  {lyrics &&
                    !lyrics.lyrics.isRomanized &&
                    lyrics.lyrics.originalLanguage == 'zh' && (
                      <Button
                        key={12}
                        tooltipLabel={t('lyricsPage.convertLyricsToPinyin')}
                        className="convert-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                        iconName="language_chinese_pinyin"
                        clickHandler={async () => {
                          const lyricsData = await window.api.lyrics.convertLyricsToPinyin();
                          setLyrics(lyricsData);
                        }}
                      />
                    )}

                  {lyrics &&
                    !lyrics.lyrics.isRomanized &&
                    lyrics.lyrics.originalLanguage == 'ja' && (
                      <Button
                        key={13}
                        tooltipLabel={t('lyricsPage.romanizeLyrics')}
                        className="convert-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                        iconName="language_japanese_kana"
                        clickHandler={async () => {
                          const lyricsData = await window.api.lyrics.romanizeLyrics();
                          setLyrics(lyricsData);
                        }}
                      />
                    )}

                  {lyrics &&
                    !lyrics.lyrics.isRomanized &&
                    lyrics.lyrics.originalLanguage == 'ko' && (
                      <Button
                        key={14}
                        tooltipLabel={t('lyricsPage.convertLyricsToRomaja')}
                        className="convert-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                        iconName="language_korean_latin"
                        clickHandler={async () => {
                          const lyricsData = await window.api.lyrics.convertLyricsToRomaja();
                          setLyrics(lyricsData);
                        }}
                      />
                    )}

                  {lyrics && (lyrics.lyrics.isTranslated || lyrics.lyrics.isRomanized) && (
                    <Button
                      key={15}
                      tooltipLabel={t('lyricsPage.resetLyrics')}
                      className="reset-converted-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                      iconName="restart_alt"
                      clickHandler={async () => {
                        const lyricsData = await window.api.lyrics.resetLyrics();
                        setLyrics(lyricsData);
                      }}
                    />
                  )}

                  {lyrics && lyrics.source === 'IN_SONG_LYRICS' && (
                    <Button
                      key={3}
                      label={t('lyricsPage.showOnlineLyrics')}
                      className="show-online-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                      iconName="language"
                      isDisabled={!isOnline}
                      tooltipLabel={isOnline ? undefined : t('common.noInternet')}
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
                            ? t('lyricsEditorSavePrompt.saveLyricsNotSupported', {
                                format: pathExt
                              })
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
                      // console.log('scrolling by code');
                    } else console.log('user scrolling');
                  }, 100)
                }
              >
                {lyricsComponents}
                <LyricsMetadata
                  source={lyrics.source}
                  link={lyrics.link}
                  copyright={copyright}
                  isTranslated={lyrics.lyrics.isTranslated}
                />
              </div>
            </>
          ) : lyrics === undefined || lyrics?.lyrics.parsedLyrics.length === 0 ? (
            <NoLyrics
              iconName="release_alert"
              title={t('lyricsPage.noLyrics')}
              description={t('lyricsPage.noLyricsDescription')}
              buttons={[
                {
                  label: t('lyricsPage.refreshOnlineLyrics'),
                  pendingAnimationOnDisabled: true,
                  className:
                    'refresh-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0',
                  iconName: 'refresh',
                  clickHandler: refreshOnlineLyrics
                },
                {
                  label: t('lyricsPage.editLyrics'),
                  className:
                    'edit-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0',
                  iconName: 'edit',
                  clickHandler: goToLyricsEditor
                }
              ]}
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
