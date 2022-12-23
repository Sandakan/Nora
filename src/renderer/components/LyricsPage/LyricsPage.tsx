/* eslint-disable promise/always-return */
/* eslint-disable react/no-array-index-key */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React, { useContext } from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import LyricLine from './LyricLine';
import NoLyricsImage from '../../../../assets/images/svg/Sun_Monochromatic.svg';
import FetchingLyricsImage from '../../../../assets/images/svg/Waiting_Monochromatic.svg';
import NoInternetImage from '../../../../assets/images/svg/Network _Monochromatic.svg';
import LyricsSource from './LyricsSource';
import NoLyrics from './NoLyrics';
import MainContainer from '../MainContainer';
import Button from '../Button';

export const syncedLyricsRegex = /^\[\d+:\d{1,2}\.\d{1,3}]/gm;

export const LyricsPage = () => {
  const { currentSongData } = useContext(AppContext);
  const { addNewNotifications } = React.useContext(AppUpdateContext);

  const [lyrics, setLyrics] = React.useState(
    null as SongLyrics | undefined | null
  );
  const [isLyricsSaved, setIsLyricsSaved] = React.useState(false);

  const lyricsLinesContainerRef = React.useRef<HTMLDivElement>(null);

  const copyright = React.useMemo(() => {
    if (lyrics?.copyright) return lyrics.copyright;
    return undefined;
  }, [lyrics]);

  React.useEffect(() => {
    if (navigator.onLine) {
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
        .getSongLyrics(
          currentSongData.title,
          Array.isArray(currentSongData.artists)
            ? currentSongData.artists.map((artist) => artist.name)
            : [],
          currentSongData.songId
        )
        .then((res) => {
          setLyrics(res);
        });
    }
  }, [
    addNewNotifications,
    currentSongData.artists,
    currentSongData.songId,
    currentSongData.title,
  ]);

  const lyricsComponents = React.useMemo(() => {
    if (lyrics && lyrics?.lyrics) {
      const { isSynced, lyrics: unsyncedLyrics, syncedLyrics } = lyrics?.lyrics;

      if (syncedLyrics) {
        return syncedLyrics.map((lyric, index) => {
          const { text, end, start } = lyric;
          return (
            <LyricLine
              key={index}
              index={index}
              lyric={text}
              syncedLyrics={{ start, end }}
            />
          );
        });
      }
      if (!isSynced) {
        return unsyncedLyrics.map((line, index) => {
          return <LyricLine key={index} index={index} lyric={line} />;
        });
      }
    }
    return [];
  }, [lyrics]);

  const showOnlineLyrics = React.useCallback(
    (_: unknown, setIsDisabled: (state: boolean) => void) => {
      setIsDisabled(true);
      window.api
        .getSongLyrics(
          currentSongData.title,
          currentSongData.artists?.map((artist) => artist.name),
          currentSongData.songId,
          'ONLINE_ONLY',
          true
        )
        .then((res) => setLyrics(res))
        .finally(() => setIsDisabled(false));
    },
    [currentSongData.artists, currentSongData.songId, currentSongData.title]
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
                setIsLyricsSaved(true);
                return {
                  ...prevData,
                  source: 'in_song_lyrics',
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

  return (
    <MainContainer
      noDefaultStyles
      className={`lyrics-container relative flex h-full flex-col ${
        lyrics && navigator.onLine
          ? 'justify-start'
          : 'items-center justify-center'
      }`}
    >
      <>
        {navigator.onLine ? (
          lyrics ? (
            <>
              <div className="title-container relative flex w-full items-center justify-between py-2 pl-8 pr-4 text-2xl text-font-color-highlight dark:text-dark-font-color-highlight">
                <div className="flex max-w-[75%] items-center">
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {lyrics.source === 'in_song_lyrics' ? 'Offline' : 'Online'}{' '}
                    Lyrics for '{currentSongData.title}'
                  </span>
                  {lyrics.source !== 'in_song_lyrics' && (
                    <span
                      className="material-icons-round-outlined ml-4 cursor-pointer text-base"
                      title="No offline lyrics found in the song."
                    >
                      help
                    </span>
                  )}
                </div>
                <div className="buttons-container flex">
                  {lyrics &&
                    lyrics.source === 'in_song_lyrics' &&
                    !isLyricsSaved && (
                      <Button
                        key={3}
                        label="Show online lyrics"
                        pendingAnimationOnDisabled
                        className="show-online-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                        iconName="language"
                        clickHandler={showOnlineLyrics}
                      />
                    )}
                  {lyrics && lyrics.source !== 'in_song_lyrics' && (
                    <Button
                      key={4}
                      label="Save lyrics"
                      pendingAnimationOnDisabled
                      className="save-lyrics-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                      iconName="save"
                      clickHandler={saveOnlineLyrics}
                    />
                  )}
                </div>
              </div>
              <div
                className="lyrics-lines-container flex h-full flex-col items-center overflow-y-auto px-8 py-4"
                ref={lyricsLinesContainerRef}
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
            content="You are not connected to the internet."
          />
        )}
      </>
    </MainContainer>
  );
};
