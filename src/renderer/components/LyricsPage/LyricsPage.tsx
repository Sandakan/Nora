/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable promise/always-return */
/* eslint-disable react/no-array-index-key */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { Lyric, NoLyrics, LyricsSource } from './Lyrics';
import NoLyricsImage from '../../../../assets/images/Sun_Monochromatic.svg';
import FetchingLyricsImage from '../../../../assets/images/Waiting_Monochromatic.svg';

export const LyricsPage = () => {
  const { currentSongData, updateNotificationPanelData } =
    useContext(AppContext);
  const x = null;
  const [lyrics, setLyrics] = React.useState(x as Lyrics | undefined | null);

  React.useEffect(() => {
    setLyrics(null);
    updateNotificationPanelData(
      5000,
      <span>Fetching lyrics for &apos;{currentSongData.title}&apos;...</span>
    );
    window.api
      .getSongLyrics(
        currentSongData.title,
        Array.isArray(currentSongData.artists)
          ? currentSongData.artists.join(', ')
          : currentSongData.artists
      )
      .then((res) => {
        setLyrics(res);
      });
  }, [currentSongData.title]);

  let lyricsComponents;

  if (typeof lyrics === 'object') {
    lyricsComponents = lyrics?.lyrics
      .split('\n')
      .map((lyric, index) => <Lyric key={index} lyric={lyric} />);
  }

  return (
    <div
      className={`main-container lyrics-container ${lyrics && 'lyrics-found'}`}
    >
      {lyricsComponents}
      {lyrics && <LyricsSource lyricsSource={lyrics.source} />}
      {lyrics === undefined && (
        <NoLyrics
          artworkPath={NoLyricsImage}
          content="We couldn't find any lyrics for this song."
        />
      )}
      {lyrics === null && (
        <NoLyrics
          artworkPath={FetchingLyricsImage}
          content="Hang on... We are looking everywhere"
        />
      )}
    </div>
  );
};
