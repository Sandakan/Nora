/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useEffect, useMemo, useRef } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import useMouseActiveState from 'renderer/hooks/useMouseActiveState';

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

    const fullScreenPlayerContainerRef = useRef<HTMLDivElement>(null);
    const { isMouseActive } = useMouseActiveState(
      fullScreenPlayerContainerRef,
      { idleTimeout: 4000, range: 50, idleOnMouseOut: true },
    );

    useEffect(() => {
      if (
        localStorageData.preferences.allowToPreventScreenSleeping &&
        !localStorageData.preferences.removeAnimationsOnBatteryPower
      )
        window.api.appControls.stopScreenSleeping();
      else window.api.appControls.allowScreenSleeping();
      return () => window.api.appControls.allowScreenSleeping();
    }, [
      localStorageData?.preferences.allowToPreventScreenSleeping,
      localStorageData?.preferences.removeAnimationsOnBatteryPower,
    ]);

    const imgPath = useMemo(() => {
      const selectedArtist = currentSongData?.artists?.find(
        (artist) => !!artist.onlineArtworkPaths?.picture_xl,
      );

      if (selectedArtist) return selectedArtist.onlineArtworkPaths?.picture_xl;
      return currentSongData.artworkPath;
    }, [currentSongData?.artists, currentSongData?.artworkPath]);

    return (
      <div
        className={`full-screen-player dark relative ${
          isDarkMode ? '!bg-dark-background-color-1' : '!bg-background-color-1'
        } ${!isCurrentSongPlaying && 'paused'} ${
          localStorageData?.preferences?.isReducedMotion ? 'reduced-motion' : ''
        } grid !h-screen w-full grid-rows-[auto_1fr] overflow-y-hidden`}
      >
        <div className="background-cover-img-container absolute left-0 top-0 h-full w-full">
          <Img
            src={imgPath}
            fallbackSrc={DefaultSongCover}
            loading="eager"
            alt="Song Cover"
            className="h-full w-full object-cover !blur-[2px] !brightness-[.25] transition-[filter] delay-100 duration-200 ease-in-out"
          />
        </div>
        <TitleBar />
        <div
          className={`flex max-w-full items-end ${
            isMouseActive && 'group/fullScreenPlayer'
          }`}
          ref={fullScreenPlayerContainerRef}
        >
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
