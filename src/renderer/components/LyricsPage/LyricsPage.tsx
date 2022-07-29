/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable promise/always-return */
/* eslint-disable react/no-array-index-key */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React, { useContext } from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import { Lyric, NoLyrics, LyricsSource } from './Lyrics';
import NoLyricsImage from '../../../../assets/images/Sun_Monochromatic.svg';
import FetchingLyricsImage from '../../../../assets/images/Waiting_Monochromatic.svg';
import NoInternetImage from '../../../../assets/images/Summer landscape_Monochromatic.svg';

export const LyricsPage = () => {
  const { currentSongData } = useContext(AppContext);
  const { updateNotificationPanelData } = React.useContext(AppUpdateContext);

  const [lyrics, setLyrics] = React.useState(null as Lyrics | undefined | null);

  React.useEffect(() => {
    if (navigator.onLine) {
      setLyrics(null);
      updateNotificationPanelData(
        5000,
        <span>Fetching lyrics for &apos;{currentSongData.title}&apos;...</span>
      );
      window.api
        .getSongLyrics(
          currentSongData.title,
          Array.isArray(currentSongData.artists)
            ? currentSongData.artists.map((artist) => artist.name)
            : []
        )
        .then((res) => {
          setLyrics(res);
        });
    }
  }, [currentSongData.title, navigator.onLine]);

  let lyricsComponents;

  if (typeof lyrics === 'object') {
    lyricsComponents = lyrics?.lyrics
      .split('\n')
      .map((lyric, index) => <Lyric key={index} lyric={lyric} />);
  }

  return (
    <div
      className={`main-container lyrics-container flex flex-col items-center justify-center px-8 py-4 relative min-h-[90%] ${
        lyrics && 'justify-start'
      }`}
    >
      {lyricsComponents}
      {lyrics && lyrics.lyrics !== '' && (
        <LyricsSource lyricsSource={lyrics.source} />
      )}
      {(lyrics === undefined || lyrics?.lyrics === '') && (
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
    </div>
  );
};
