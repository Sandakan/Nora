import { isLyricsEnhancedSynced } from '@common/isLyricsSynced';
import Button from '@renderer/components/Button';
import LyricLine from '@renderer/components/LyricsPage/LyricLine';
import LyricsMetadata from '@renderer/components/LyricsPage/LyricsMetadata';
import NoLyrics from '@renderer/components/LyricsPage/NoLyrics';
import MainContainer from '@renderer/components/MainContainer';
import useNetworkConnectivity from '@renderer/hooks/useNetworkConnectivity';
import useSkipLyricsLines from '@renderer/hooks/useSkipLyricsLines';
import { store } from '@renderer/store/store';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appPreferences } from '../../../../../../package.json';
import { lyricsSchema } from '@renderer/utils/zod/lyricsSchema';
import { updateRouteState } from '@renderer/store/routeStateStore';
import { lyricsQuery } from '@renderer/queries/lyrics';
import { queryClient } from '@renderer/index';
import { useMutation, useQuery } from '@tanstack/react-query';

const { metadataEditingSupportedExtensions } = appPreferences;

export const Route = createFileRoute('/main-player/lyrics/')({
  component: LyricsPage,
  validateSearch: lyricsSchema
});

function LyricsPage() {
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const currentSongData = useStore(store, (state) => state.currentSongData);

  const { t } = useTranslation();
  const { isAutoScrolling } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { isOnline } = useNetworkConnectivity();

  const [lyricsType, setLyricsType] = useState<LyricsTypes>('ANY');
  const [lyricsRequestType, setLyricsRequestType] = useState<LyricsRequestTypes>('ANY');

  const { data: lyrics, isPending: isLoadingLyrics } = useQuery({
    ...lyricsQuery.single({
      title: currentSongData.title,
      artists: Array.isArray(currentSongData.artists)
        ? currentSongData.artists.map((artist) => artist.name)
        : [],
      album: currentSongData.album?.name,
      path: currentSongData.path,
      duration: currentSongData.duration,
      lyricsType: lyricsType,
      lyricsRequestType: lyricsRequestType,
      saveLyricsAutomatically: preferences.lyricsAutomaticallySaveState
    }),
    // Put stale time to infinity to prevent refetching after stale time has passed
    staleTime: Infinity
  });

  const { mutate: saveLyricsToSong } = useMutation({
    mutationFn: (data: { songPath: string; songLyrics: SongLyrics }) =>
      window.api.lyrics.saveLyricsToSong(data.songPath, data.songLyrics),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: lyricsQuery.single._def });
    }
  });

  const { mutate: resetLyrics } = useMutation({
    mutationFn: () => window.api.lyrics.resetLyrics(),
    onMutate: () => {
      setLyricsRequestType('ANY');
      setLyricsType('ANY');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: lyricsQuery.single._def });
    }
  });

  const lyricsLinesContainerRef = useRef<HTMLDivElement>(null);
  useSkipLyricsLines(lyrics);
  // const [isOfflineLyricAvailable, setIsOfflineLyricsAvailable] = useState(false);

  const copyright = useMemo(() => lyrics?.lyrics?.copyright, [lyrics]);

  // const requestedLyricsTitle = useRef<string>(undefined);

  // useEffect(() => {
  //   if (requestedLyricsTitle.current !== currentSongData.title) {
  //     requestedLyricsTitle.current = currentSongData.title;
  //     setLyrics(null);
  //     window.api.lyrics
  //       .getSongLyrics(
  //         {
  //           songTitle: currentSongData.title,
  //           songArtists: Array.isArray(currentSongData.artists)
  //             ? currentSongData.artists.map((artist) => artist.name)
  //             : [],
  //           album: currentSongData.album?.name,
  //           songPath: currentSongData.path,
  //           duration: currentSongData.duration
  //         },
  //         undefined,
  //         undefined,
  //         preferences.lyricsAutomaticallySaveState
  //       )
  //       .then(async (res) => {
  //         setLyrics(res);
  //         // console.log(res);

  //         if (lyricsLinesContainerRef.current) lyricsLinesContainerRef.current.scrollTop = 0;

  //         if (
  //           preferences.autoTranslateLyrics &&
  //           !res?.lyrics.isReset &&
  //           !res?.lyrics.isTranslated
  //         ) {
  //           setLyrics(await window.api.lyrics.getTranslatedLyrics(i18n.language as LanguageCodes));
  //         }
  //         if (preferences.autoConvertLyrics && !res?.lyrics.isReset && !res?.lyrics.isRomanized) {
  //           if (res?.lyrics.originalLanguage == 'zh')
  //             setLyrics(await window.api.lyrics.convertLyricsToPinyin());
  //           else if (res?.lyrics.originalLanguage == 'ja')
  //             setLyrics(await window.api.lyrics.romanizeLyrics());
  //           else if (res?.lyrics.originalLanguage == 'ko')
  //             setLyrics(await window.api.lyrics.convertLyricsToRomaja());
  //         }

  //         return undefined;
  //       })
  //       .catch((err) => console.error(err));
  //   }
  // }, [
  //   addNewNotifications,
  //   currentSongData.album?.name,
  //   currentSongData.artists,
  //   currentSongData.duration,
  //   currentSongData.path,
  //   currentSongData.songId,
  //   currentSongData.title,
  //   preferences.lyricsAutomaticallySaveState,
  //   preferences.autoTranslateLyrics,
  //   preferences.autoConvertLyrics
  // ]);

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
  }, [currentSongData.duration, isAutoScrolling, lyrics]);

  // const showOnlineLyrics = useCallback(
  //   (
  //     _: unknown,
  //     setIsDisabled: (state: boolean) => void,
  //     setIsPending: (state: boolean) => void
  //   ) => {
  //     setIsDisabled(true);
  //     setIsPending(true);
  //     window.api.lyrics
  //       .getSongLyrics(
  //         {
  //           songTitle: currentSongData.title,
  //           songArtists: Array.isArray(currentSongData.artists)
  //             ? currentSongData.artists.map((artist) => artist.name)
  //             : [],
  //           album: currentSongData.album?.name,
  //           songPath: currentSongData.path,
  //           duration: currentSongData.duration
  //         },
  //         'ANY',
  //         'ONLINE_ONLY',
  //         'NONE'
  //       )
  //       .then((res) => {
  //         if (res) return setLyrics(res);
  //         return addNewNotifications([
  //           {
  //             id: 'lyricsUpdateFailed',
  //             content: t('lyricsPage.noOnlineLyrics'),
  //             iconName: 'warning',
  //             iconClassName: 'material-icons-round-outlined text-xl!'
  //           }
  //         ]);
  //       })
  //       .finally(() => {
  //         setIsDisabled(false);
  //         setIsPending(false);
  //       })
  //       .catch((err) => console.error(err));
  //   },
  //   [
  //     addNewNotifications,
  //     currentSongData.album?.name,
  //     currentSongData.artists,
  //     currentSongData.duration,
  //     currentSongData.path,
  //     currentSongData.title,
  //     t
  //   ]
  // );

  const pathExt = useMemo(() => {
    if (currentSongData.path) return window.api.utils.getExtension(currentSongData.path);
    return '';
  }, [currentSongData.path]);

  // const showOfflineLyrics = useCallback(
  //   (_: unknown, setIsDisabled: (state: boolean) => void) => {
  //     setIsDisabled(true);
  //     window.api.lyrics
  //       .getSongLyrics(
  //         {
  //           songTitle: currentSongData.title,
  //           songArtists: Array.isArray(currentSongData.artists)
  //             ? currentSongData.artists.map((artist) => artist.name)
  //             : [],
  //           album: currentSongData.album?.name,
  //           songPath: currentSongData.path,
  //           duration: currentSongData.duration
  //         },
  //         'ANY',
  //         'OFFLINE_ONLY',
  //         preferences.lyricsAutomaticallySaveState
  //       )
  //       .then((res) => {
  //         if (res) return setLyrics(res);
  //         return addNewNotifications([
  //           {
  //             id: 'offlineLyricsFetchFailed',
  //             content: t('lyricsPage.noOfflineLyrics'),
  //             iconName: 'warning',
  //             iconClassName: 'material-icons-round-outlined text-xl!'
  //           }
  //         ]);
  //       })
  //       .finally(() => setIsDisabled(false))
  //       .catch((err) => console.error(err));
  //   },
  //   [
  //     addNewNotifications,
  //     currentSongData.album?.name,
  //     currentSongData.artists,
  //     currentSongData.duration,
  //     currentSongData.path,
  //     currentSongData.title,
  //     preferences.lyricsAutomaticallySaveState,
  //     t
  //   ]
  // );

  // const refreshOnlineLyrics = useCallback(
  //   (_: unknown, setIsDisabled: (state: boolean) => void) => {
  //     setIsDisabled(true);
  //     window.api.lyrics
  //       .getSongLyrics(
  //         {
  //           songTitle: currentSongData.title,
  //           songArtists: Array.isArray(currentSongData.artists)
  //             ? currentSongData.artists.map((artist) => artist.name)
  //             : [],
  //           album: currentSongData.album?.name,
  //           songPath: currentSongData.path,
  //           duration: currentSongData.duration
  //         },
  //         'ANY',
  //         'ONLINE_ONLY'
  //       )
  //       .then((res) => {
  //         if (res) return setLyrics(res);
  //         return addNewNotifications([
  //           {
  //             id: 'OnlineLyricsRefreshFailed',
  //             content: t('lyricsPage.onlineLyricsRefreshFailed'),
  //             iconName: 'warning',
  //             iconClassName: 'material-icons-round-outlined text-xl!'
  //           }
  //         ]);
  //       })
  //       .finally(() => setIsDisabled(false))
  //       .catch((err) => console.error(err));
  //   },
  //   [
  //     addNewNotifications,
  //     currentSongData.album?.name,
  //     currentSongData.artists,
  //     currentSongData.duration,
  //     currentSongData.path,
  //     currentSongData.title,
  //     t
  //   ]
  // );

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

    updateRouteState('lyrics-editor', { lyrics: lines, songId: currentSongData.songId });
    navigate({
      to: '/main-player/lyrics/editor/$songId',
      params: { songId: String(currentSongData.songId) },
      search: {
        songTitle: currentSongData.title,
        isEditingEnhancedSyncedLyrics:
          lyrics?.lyrics?.isSynced && (isSynchronizedLyricsEnhancedSynced ?? false)
      }
    });
  }, [
    currentSongData.songId,
    currentSongData.title,
    isSynchronizedLyricsEnhancedSynced,
    lyrics,
    navigate
  ]);

  if (!isOnline && !lyrics)
    return (
      <NoLyrics
        iconName="wifi_off"
        title={t('lyricsPage.noLyrics')}
        description={t('lyricsPage.noInternetDescription')}
      />
    );

  if (isLoadingLyrics)
    return (
      <NoLyrics
        iconName="hourglass_empty"
        title={t('lyricsPage.lyricsLoading')}
        description={t('lyricsPage.lyricsLoadingDescription')}
      />
    );

  return (
    <MainContainer
      noDefaultStyles
      className={`lyrics-container appear-from-bottom relative flex h-full flex-col [overflow-anchor:none]! ${
        lyrics && isOnline ? 'justify-start' : 'items-center justify-center'
      }`}
    >
      <>
        {lyrics && lyrics.lyrics.parsedLyrics.length > 0 ? (
          <>
            <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight relative flex w-full items-center justify-between py-2 pr-2 pl-8 text-2xl">
              <div className="flex max-w-[40%] items-center">
                <span className="overflow-hidden font-medium text-ellipsis whitespace-nowrap">
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
                    className="show-online-lyrics-btn text-sm! md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                    iconName={isAutoScrolling ? 'flash_off' : 'flash_on'}
                    clickHandler={() =>
                      navigate({
                        search: (prev) => ({ ...prev, isAutoScrolling: !isAutoScrolling })
                      })
                    }
                  />
                )}
                {/* {lyrics && !lyrics.lyrics.isTranslated && (
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
                    )} */}

                {lyrics && (lyrics.lyrics.isTranslated || lyrics.lyrics.isRomanized) && (
                  <Button
                    key={15}
                    tooltipLabel={t('lyricsPage.resetLyrics')}
                    className="reset-converted-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                    iconName="restart_alt"
                    clickHandler={() => resetLyrics()}
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
                    clickHandler={() => {
                      setLyricsType('ANY');
                      setLyricsRequestType('ONLINE_ONLY');
                    }}
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
                      clickHandler={() => {
                        setLyricsType('ANY');
                        setLyricsRequestType('ONLINE_ONLY');
                      }}
                    />
                    <Button
                      key={3}
                      label={t('lyricsPage.showSavedLyrics')}
                      className="show-online-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                      iconName="visibility"
                      clickHandler={() => {
                        setLyricsType('ANY');
                        setLyricsRequestType('OFFLINE_ONLY');
                      }}
                      isDisabled={!lyrics.isOfflineLyricsAvailable}
                      tooltipLabel={
                        !lyrics.isOfflineLyricsAvailable ? t('lyricsPage.noSavedLyrics') : undefined
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
                      clickHandler={() =>
                        saveLyricsToSong({ songPath: currentSongData.path, songLyrics: lyrics })
                      }
                    />
                  </>
                )}
              </div>
            </div>
            <div
              className="lyrics-lines-container flex h-full w-full! flex-col items-center overflow-y-auto px-8 py-[10vh] [scrollbar-gutter:stable]"
              ref={lyricsLinesContainerRef}
              // onScroll={() =>
              //   debounce(() => {
              //     if (isScrollingByCode) {
              //       isScrollingByCode = false;
              //       // console.log('scrolling by code');
              //     } else console.log('user scrolling');
              //   }, 100)
              // }
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
        ) : (
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
                clickHandler: () => {
                  setLyricsType('ANY');
                  setLyricsRequestType('ONLINE_ONLY');
                }
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
        )}
      </>
    </MainContainer>
  );
}
