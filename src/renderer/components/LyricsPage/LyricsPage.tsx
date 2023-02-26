/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable promise/always-return */
/* eslint-disable react/no-array-index-key */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
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

export const syncedLyricsRegex = /^\[\d+:\d{1,2}\.\d{1,3}]/gm;
let isScrollingByCode = false;
document.addEventListener('lyrics/scrollIntoView', () => {
  isScrollingByCode = true;
});

export const LyricsPage = () => {
  const { currentSongData } = useContext(AppContext);
  const { addNewNotifications } = React.useContext(AppUpdateContext);

  const [lyrics, setLyrics] = React.useState(
    null as SongLyrics | undefined | null
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
        delay: 5000,
        content: (
          <span>
            Fetching lyrics for &apos;{currentSongData.title}&apos;...
          </span>
        ),
        icon: (
          <span className="material-icons-round-outlined !text-xl">mic</span>
        ),
      },
    ]);
    window.api
      .getSongLyrics({
        songTitle: currentSongData.title,
        songArtists: Array.isArray(currentSongData.artists)
          ? currentSongData.artists.map((artist) => artist.name)
          : [],
        songId: currentSongData.songId,
        duration: currentSongData.duration,
      })
      .then((res) => {
        // if (res) setIsOfflineLyricsAvailable(true);
        setLyrics(res);
      });
  }, [
    addNewNotifications,
    currentSongData.artists,
    currentSongData.duration,
    currentSongData.songId,
    currentSongData.title,
  ]);

  const lyricsComponents = React.useMemo(() => {
    if (lyrics && lyrics?.lyrics) {
      const { isSynced, lyrics: unsyncedLyrics, syncedLyrics } = lyrics.lyrics;

      if (syncedLyrics) {
        return syncedLyrics.map((lyric, index) => {
          const { text, end, start } = lyric;
          return (
            <LyricLine
              key={index}
              index={index}
              lyric={text}
              syncedLyrics={{ start, end }}
              isAutoScrolling={isAutoScrolling}
            />
          );
        });
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
    (_: unknown, setIsDisabled: (state: boolean) => void) => {
      setIsDisabled(true);
      window.api
        .getSongLyrics(
          {
            songTitle: currentSongData.title,
            songArtists: Array.isArray(currentSongData.artists)
              ? currentSongData.artists.map((artist) => artist.name)
              : [],
            songId: currentSongData.songId,
            duration: currentSongData.duration,
          },
          'ANY',
          'ONLINE_ONLY'
        )
        .then((res) => setLyrics(res))
        .finally(() => setIsDisabled(false));
    },
    [
      currentSongData.artists,
      currentSongData.duration,
      currentSongData.songId,
      currentSongData.title,
    ]
  );

  const showOfflineLyrics = React.useCallback(
    (_: unknown, setIsDisabled: (state: boolean) => void) => {
      setIsDisabled(true);
      window.api
        .getSongLyrics(
          {
            songTitle: currentSongData.title,
            songArtists: Array.isArray(currentSongData.artists)
              ? currentSongData.artists.map((artist) => artist.name)
              : [],
            songId: currentSongData.songId,
            duration: currentSongData.duration,
          },
          'ANY',
          'OFFLINE_ONLY'
        )
        .then((res) => setLyrics(res))
        .finally(() => setIsDisabled(false));
    },
    [
      currentSongData.artists,
      currentSongData.duration,
      currentSongData.songId,
      currentSongData.title,
    ]
  );

  const saveOnlineLyrics = React.useCallback(
    (_: unknown, setIsDisabled: (state: boolean) => void) => {
      if (lyrics) {
        setIsDisabled(true);
        window.api
          .saveLyricsToSong(currentSongData.songId, lyrics)
          .then(() => {
            setLyrics((prevData) => {
              if (prevData) {
                return {
                  ...prevData,
                  source: 'IN_SONG_LYRICS',
                } as SongLyrics;
              }
              return undefined;
            });
            addNewNotifications([
              {
                id: 'lyricsUpdateSuccessful',
                delay: 5000,
                content: <span>Lyrics successfully updated.</span>,
                icon: (
                  <span className="material-icons-round-outlined !text-xl">
                    check
                  </span>
                ),
              },
            ]);
          })
          .finally(() => setIsDisabled(false));
      }
    },
    [addNewNotifications, currentSongData.songId, lyrics]
  );

  const refreshOnlineLyrics = React.useCallback(
    (_: unknown, setIsDisabled: (state: boolean) => void) => {
      setIsDisabled(true);
      window.api
        .getSongLyrics(
          {
            songTitle: currentSongData.title,
            songArtists: Array.isArray(currentSongData.artists)
              ? currentSongData.artists.map((artist) => artist.name)
              : [],
            songId: currentSongData.songId,
            duration: currentSongData.duration,
          },
          'ANY',
          'ONLINE_ONLY'
        )
        .then((res) => setLyrics(res))
        .finally(() => setIsDisabled(false));
    },
    [
      currentSongData.artists,
      currentSongData.duration,
      currentSongData.songId,
      currentSongData.title,
    ]
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
          lyrics ? (
            <>
              <div className="title-container relative flex w-full items-center justify-between py-2 pl-8 pr-2 text-2xl text-font-color-highlight dark:text-dark-font-color-highlight">
                <div className="flex max-w-[40%] items-center">
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {lyrics.source === 'IN_SONG_LYRICS' ? 'Offline' : 'Online'}{' '}
                    Lyrics for '{currentSongData.title}'
                  </span>
                  {lyrics.source !== 'IN_SONG_LYRICS' && (
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
                      pendingAnimationOnDisabled={isOnline}
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
                        tooltipLabel="Refresh Lyrics"
                        pendingAnimationOnDisabled
                        className="refresh-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                        iconName="refresh"
                        clickHandler={refreshOnlineLyrics}
                      />
                      <Button
                        key={3}
                        label="Show saved lyrics"
                        pendingAnimationOnDisabled
                        className="show-online-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                        iconName="visibility"
                        clickHandler={showOfflineLyrics}
                        // isDisabled={!isOfflineLyricAvailable}
                      />
                      <Button
                        key={4}
                        label="Save lyrics"
                        pendingAnimationOnDisabled={
                          currentSongData.isKnownSource
                        }
                        className="save-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                        iconName="save"
                        clickHandler={saveOnlineLyrics}
                        isDisabled={!currentSongData.isKnownSource}
                      />
                    </>
                  )}
                </div>
              </div>
              <div
                className="lyrics-lines-container flex h-full flex-col items-center overflow-y-auto px-8 py-4"
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
          ) : lyrics === undefined ? (
            <NoLyrics
              artworkPath={NoLyricsImage}
              content="We couldn't find any lyrics for this song."
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
