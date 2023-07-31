/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable react/no-array-index-key */
import React, { useContext } from 'react';
import debounce from 'renderer/utils/debounce';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import useNetworkConnectivity from 'renderer/hooks/useNetworkConnectivity';

import LyricLine from './LyricLine';
import NoLyricsImage from '../../../../assets/images/svg/Sun_Monochromatic.svg';
import FetchingLyricsImage from '../../../../assets/images/svg/Waiting_Monochromatic.svg';
import NoInternetImage from '../../../../assets/images/svg/Network _Monochromatic.svg';
import LyricsSource from './LyricsSource';
import NoLyrics from './NoLyrics';
import MainContainer from '../MainContainer';
import Button from '../Button';

import { appPreferences } from '../../../../package.json';

const { metadataEditingSupportedExtensions } = appPreferences;

export const syncedLyricsRegex = /^\[\d+:\d{1,2}\.\d{1,3}]/gm;
let isScrollingByCode = false;
document.addEventListener('lyrics/scrollIntoView', () => {
  isScrollingByCode = true;
});

const LyricsPage = () => {
  const { currentSongData, localStorageData } = useContext(AppContext);
  const { addNewNotifications, updateCurrentlyActivePageData } =
    React.useContext(AppUpdateContext);

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

  React.useEffect(() => {
    setLyrics(null);
    addNewNotifications([
      {
        id: 'fetchLyrics',
        content: `Fetching lyrics for '${currentSongData.title}'...`,
        iconName: 'mic',
        iconClassName: 'material-icons-round-outlined !text-xl',
      },
    ]);
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
      .then((res) => setLyrics(res))
      .catch((err) => console.error(err));
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
          const { text, end, start } = lyric;
          return (
            <LyricLine
              key={index}
              index={index}
              lyric={text}
              syncedLyrics={{ start: start + offset, end: end + offset }}
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
  }, [isAutoScrolling, lyrics]);

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
              content: `No Online Lyrics Found.`,
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
              content: `No Offline Lyrics Found.`,
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
          .then(() => {
            setLyrics((prevData) => {
              if (prevData) {
                return {
                  ...prevData,
                  source: 'IN_SONG_LYRICS',
                  isOfflineLyricsAvailable: true,
                } as SongLyrics;
              }
              return undefined;
            });
            return addNewNotifications([
              {
                id: 'lyricsUpdateSuccessful',
                content: `Lyrics successfully updated.`,
                iconName: 'check',
                iconClassName: 'material-icons-round-outlined !text-xl',
              },
            ]);
          })
          .finally(() => {
            setIsPending(false);
            setIsDisabled(false);
          })
          .catch((err) => console.error(err));
      }
    },
    [addNewNotifications, currentSongData.path, lyrics],
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
              content: `Failed to refresh Online Lyrics.`,
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
    ],
  );

  const isSaveLyricsBtnDisabled = React.useMemo(
    () => !metadataEditingSupportedExtensions.includes(pathExt),
    [pathExt],
  );

  return (
    <MainContainer
      noDefaultStyles
      className={`lyrics-container relative flex h-full flex-col ${
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
                    Lyrics for '{currentSongData.title}'
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
                  {lyrics?.lyrics?.isSynced && (
                    <Button
                      key={5}
                      label={
                        lyrics && lyrics.source === 'IN_SONG_LYRICS'
                          ? isAutoScrolling
                            ? 'Stop Auto Scrolling'
                            : 'Enable auto scrolling'
                          : undefined
                      }
                      tooltipLabel={
                        lyrics && lyrics.source !== 'IN_SONG_LYRICS'
                          ? isAutoScrolling
                            ? 'Stop Auto Scrolling'
                            : 'Enable auto scrolling'
                          : undefined
                      }
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
                      label="Show online lyrics"
                      className="show-online-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                      iconName="language"
                      isDisabled={!isOnline}
                      tooltipLabel={
                        isOnline
                          ? undefined
                          : 'You are not connected to internet.'
                      }
                      clickHandler={showOnlineLyrics}
                    />
                  )}
                  {lyrics && lyrics.source !== 'IN_SONG_LYRICS' && (
                    <>
                      <Button
                        key={5}
                        tooltipLabel="Refresh Online Lyrics"
                        pendingAnimationOnDisabled
                        className="refresh-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                        iconName="refresh"
                        clickHandler={refreshOnlineLyrics}
                      />
                      <Button
                        key={3}
                        label="Show saved lyrics"
                        className="show-online-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                        iconName="visibility"
                        clickHandler={showOfflineLyrics}
                        isDisabled={!lyrics.isOfflineLyricsAvailable}
                        tooltipLabel={
                          !lyrics.isOfflineLyricsAvailable
                            ? 'No saved lyrics found.'
                            : undefined
                        }
                      />
                      <Button
                        key={4}
                        label="Save lyrics"
                        className="save-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                        iconName="save"
                        isDisabled={isSaveLyricsBtnDisabled}
                        tooltipLabel={
                          isSaveLyricsBtnDisabled
                            ? `Nora currently doesn't support saving lyrics to songs in '${pathExt}' audio format.`
                            : undefined
                        }
                        clickHandler={saveOnlineLyrics}
                      />
                    </>
                  )}
                </div>
              </div>
              <div
                className="lyrics-lines-container flex h-full !w-full flex-col items-center overflow-y-auto px-8 py-[10vh]"
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
              artworkPath={NoLyricsImage}
              content="We couldn't find any lyrics for this song."
              // buttons={[
              //   {
              //     label: 'Show Saved Lyrics',
              //     iconName: 'visibility',
              //     clickHandler: showOfflineLyrics,
              //   },
              // ]}
            />
          ) : (
            <NoLyrics
              artworkPath={FetchingLyricsImage}
              content="Hang on... We are looking everywhere"
            />
          )
        ) : (
          <NoLyrics
            artworkPath={NoInternetImage}
            content="There are no offline lyrics for this song. You need an internet connection to check for online lyrics."
          />
        )}
      </>
    </MainContainer>
  );
};

export default LyricsPage;
