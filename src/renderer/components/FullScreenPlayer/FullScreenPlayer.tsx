/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

import TitleBar from '../TitleBar/TitleBar';
import Img from '../Img';

import DefaultSongCover from '../../../../assets/images/webp/song_cover_default.webp';
import LyricsContainer from './containers/LyricsContainer';
import SongInfoContainer from './containers/SongInfoContainer';

// type Props = {};

const FullScreenPlayer = () =>
  // (props: Props)
  {
    const {
      isDarkMode,
      isCurrentSongPlaying,
      localStorageData,
      currentSongData,
    } = React.useContext(AppContext);

    const [isLyricsVisible, setIsLyricsVisible] = React.useState(true);
    const [isLyricsAvailable, setIsLyricsAvailable] = React.useState(true);

    return (
      <div
        className={`full-screen-player relative dark ${
          isDarkMode ? '!bg-dark-background-color-1' : '!bg-background-color-1'
        } ${!isCurrentSongPlaying && 'paused'} ${
          localStorageData?.preferences?.isReducedMotion ? 'reduced-motion' : ''
        } grid !h-screen w-full grid-rows-[auto_1fr] overflow-y-hidden`}
      >
        <div className="background-cover-img-container h-full w-full absolute top-0 left-0">
          <Img
            src={
              currentSongData.artists?.at(0)?.onlineArtworkPaths?.picture_xl ??
              currentSongData.artists?.at(0)?.onlineArtworkPaths
                ?.picture_small ??
              currentSongData.artworkPath
            }
            fallbackSrc={DefaultSongCover}
            loading="eager"
            alt="Song Cover"
            className="h-full w-full object-cover transition-[filter] delay-100 duration-200 ease-in-out group-focus-within:blur-[2px] group-focus-within:brightness-75 group-hover:blur-[2px] group-hover:brightness-75 group-focus:blur-[4px] group-focus:brightness-75 '!blur-[2px] !brightness-[.3]"
          />
        </div>
        <TitleBar />
        <div className="flex items-end group/fullScreenPlayer">
          <LyricsContainer
            isLyricsVisible={isLyricsVisible}
            setIsLyricsAvailable={setIsLyricsAvailable}
          />
          <SongInfoContainer
            isLyricsVisible={isLyricsVisible}
            setIsLyricsVisible={setIsLyricsVisible}
            isLyricsAvailable={isLyricsAvailable}
          />
        </div>
      </div>
    );
  };

export default FullScreenPlayer;
