/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable promise/always-return */
/* eslint-disable react/no-array-index-key */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { Lyric, NoLyrics, LyricsSource } from './Lyrics';

interface LyricsPageProp {
  songTitle: string;
  songArtists: string | string[];
}

export const LyricsPage = (props: LyricsPageProp) => {
  const x = null;
  const [lyrics, setLyrics] = React.useState(x as Lyrics | undefined | null);
  React.useEffect(() => {
    window.api
      .getSongLyrics(
        props.songTitle,
        Array.isArray(props.songArtists)
          ? props.songArtists.join(', ')
          : props.songArtists
      )
      .then((res) => {
        setLyrics(res);
      });
  }, [props.songTitle]);

  // console.log(lyrics);

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
      {lyrics === undefined && <NoLyrics />}
    </div>
  );
};
