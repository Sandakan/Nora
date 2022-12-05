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
import Lyric from './Lyrics';
import NoLyricsImage from '../../../../assets/images/svg/Sun_Monochromatic.svg';
import FetchingLyricsImage from '../../../../assets/images/svg/Waiting_Monochromatic.svg';
import NoInternetImage from '../../../../assets/images/svg/Summer landscape_Monochromatic.svg';
import LyricsSource from './LyricsSource';
import NoLyrics from './NoLyrics';
import MainContainer from '../MainContainer';

export const LyricsPage = () => {
  const { currentSongData } = useContext(AppContext);
  const { addNewNotifications } = React.useContext(AppUpdateContext);

  const [lyrics, setLyrics] = React.useState(
    null as SongLyrics | undefined | null
  );

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

  let lyricsComponents;

  if (lyrics && lyrics?.lyrics) {
    const { isSynced, lyrics: unsyncedLyrics, syncedLyrics } = lyrics?.lyrics;

    if (syncedLyrics) {
      lyricsComponents = syncedLyrics.map((lyric, index) => {
        const { text, end, start } = lyric;
        return (
          <Lyric
            key={index}
            index={index}
            lyric={text}
            syncLyrics={{ start, end }}
          />
        );
      });
    } else if (!isSynced) {
      lyricsComponents = unsyncedLyrics.map((line, index) => {
        return <Lyric key={index} index={index} lyric={line} />;
      });
    }
  }

  return (
    <MainContainer
      noDefaultStyles
      className={`lyrics-container relative flex min-h-[90%] flex-col items-center justify-center px-8 py-4 ${
        lyrics && 'justify-start'
      }`}
      onScroll={() => console.log('scrolling')}
    >
      <>
        {lyricsComponents}
        {lyrics && (
          <LyricsSource
            source={lyrics.source}
            link={lyrics.link}
            copyright={copyright}
          />
        )}
        {lyrics === undefined && (
          <NoLyrics
            artworkPath={NoLyricsImage}
            content="We couldn't find any lyrics for this song."
          />
        )}
        {lyrics === null && navigator.onLine && (
          <NoLyrics
            artworkPath={FetchingLyricsImage}
            content="Hang on... We are looking everywhere"
          />
        )}
        {!navigator.onLine && (
          <NoLyrics
            artworkPath={NoInternetImage}
            content="You are not connected to the internet."
          />
        )}
      </>
    </MainContainer>
  );
};
