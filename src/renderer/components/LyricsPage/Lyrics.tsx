/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
// import React from 'react';

interface LyricProp {
  lyric: string;
}

export const Lyric = (props: LyricProp) => {
  return <div className="lyrics-line">{props.lyric}</div>;
};

export const NoLyrics = () => (
  <div className="no-lyrics-container">
    We couldn't find any lyrics for your song.
  </div>
);

interface LyricsSourceProp {
  lyricsSource: {
    name: string;
    url: string;
    link: string;
  };
}

const openInBrowser = (url: string) => window.api.openInBrowser(url);

export const LyricsSource = (props: LyricsSourceProp) => (
  <div className="source-name">
    Lyrics provided by{' '}
    <span
      className="source-link"
      onClick={() => openInBrowser(props.lyricsSource.link)}
    >
      {props.lyricsSource.name}
    </span>{' '}
    using SongLyrics.
  </div>
);