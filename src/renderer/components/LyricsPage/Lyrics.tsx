/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';

import OpenLinkConfirmPrompt from '../OpenLinkConfirmPrompt';

interface LyricProp {
  lyric: string;
}

interface NoLyricsProp {
  content: string;
  artworkPath: string;
}

export const Lyric = (props: LyricProp) => {
  return (
    <div className="appear-from-bottom font-['Poppins'] text-4xl text-center mb-5 text-font-color-black dark:text-font-color-white font-medium empty:mb-16">
      {props.lyric}
    </div>
  );
};

export const NoLyrics = (props: NoLyricsProp) => (
  <div className="no-lyrics-container flex flex-col items-center justify-center text-3xl text-center text-[#ccc]">
    <img src={props.artworkPath} className="mb-8 w-60" alt="" />
    {props.content}
  </div>
);

interface LyricsSourceProp {
  lyricsSource: {
    name: string;
    url: string;
    link: string;
  };
}

export const LyricsSource = (props: LyricsSourceProp) => {
  const { userData } = React.useContext(AppContext);
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  return (
    <div className="source-name mt-12 text-[#ccc]">
      Lyrics provided by{' '}
      <span
        className="source-link underline cursor-pointer"
        onClick={() =>
          userData?.preferences.doNotVerifyWhenOpeningLinks
            ? window.api.openInBrowser(
                `https://github.com/Sandakan/Oto-Music-for-Desktop`
              )
            : changePromptMenuData(
                true,
                <OpenLinkConfirmPrompt
                  link={props.lyricsSource.link}
                  title={props.lyricsSource.name}
                />
              )
        }
        title={props.lyricsSource.link}
      >
        {props.lyricsSource.name}
      </span>{' '}
      using SongLyrics.
    </div>
  );
};
