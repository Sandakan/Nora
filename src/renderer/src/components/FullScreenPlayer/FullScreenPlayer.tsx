/* eslint-disable react/no-array-index-key */
import { useEffect, useMemo, useRef, useState } from 'react';
import useMouseActiveState from '../../hooks/useMouseActiveState';

import TitleBar from '../TitleBar/TitleBar';
import Img from '../Img';

import DefaultSongCover from '../../assets/images/webp/song_cover_default.webp';
import LyricsContainer from './containers/LyricsContainer';
import SongInfoContainer from './containers/SongInfoContainer';
import SeekBarSlider from '../SeekBarSlider';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

// type Props = {};

const isArtistBackgroundsEnabled = false;

const FullScreenPlayer = () =>
  // (props: Props)
  {
    const isCurrentSongPlaying = useStore(store, (state) => state.player.isCurrentSongPlaying);
    const currentSongData = useStore(store, (state) => state.currentSongData);
    const preferences = useStore(store, (state) => state.localStorage.preferences);

    const [isLyricsVisible, setIsLyricsVisible] = useState(false);
    const [isLyricsAvailable, setIsLyricsAvailable] = useState(false);
    const [songPos, setSongPos] = useState(0);

    const fullScreenPlayerContainerRef = useRef<HTMLDivElement>(null);
    const { isMouseActive } = useMouseActiveState(fullScreenPlayerContainerRef, {
      idleTimeout: 4000,
      range: 50,
      idleOnMouseOut: true
    });

    useEffect(() => {
      if (preferences.allowToPreventScreenSleeping && !preferences.removeAnimationsOnBatteryPower)
        window.api.appControls.stopScreenSleeping();
      else window.api.appControls.allowScreenSleeping();
      return () => window.api.appControls.allowScreenSleeping();
    }, [preferences.allowToPreventScreenSleeping, preferences.removeAnimationsOnBatteryPower]);

    const imgPath = useMemo(() => {
      const selectedArtist = currentSongData?.artists?.find(
        (artist) => !!artist.onlineArtworkPaths?.picture_xl
      );

      if (isArtistBackgroundsEnabled && selectedArtist)
        return selectedArtist.onlineArtworkPaths?.picture_xl;
      return currentSongData.artworkPath;
    }, [currentSongData?.artists, currentSongData?.artworkPath]);

    return (
      <div
        className={`full-screen-player dark relative !bg-dark-background-color-1 ${!isCurrentSongPlaying && 'paused'} ${
          preferences?.isReducedMotion ? 'reduced-motion' : ''
        } grid !h-screen w-full grid-rows-[auto_1fr] overflow-y-hidden`}
      >
        <div className="background-cover-img-container absolute left-0 top-0 h-full w-full">
          <Img
            src={imgPath}
            fallbackSrc={DefaultSongCover}
            loading="eager"
            alt="Song Cover"
            className={`h-full w-full object-cover shadow-lg blur-none !brightness-[.25] transition-[filter] delay-100 duration-200 ease-in-out ${isLyricsVisible ? '!blur-[2rem]' : '!blur-[2rem]'}`}
          />
          {/* <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-black/50 to-black/5"></div> */}
        </div>
        <TitleBar />
        <div
          className={`flex max-w-full flex-col justify-end ${isMouseActive && 'group/fullScreenPlayer'}`}
          ref={fullScreenPlayerContainerRef}
        >
          <LyricsContainer
            isLyricsVisible={isLyricsVisible}
            setIsLyricsAvailable={setIsLyricsAvailable}
          />
          <SongInfoContainer
            songPos={songPos}
            isLyricsVisible={isLyricsVisible}
            setIsLyricsVisible={setIsLyricsVisible}
            isLyricsAvailable={isLyricsAvailable}
            isMouseActive={isMouseActive}
          />
          <SeekBarSlider
            name="full-screen-player-seek-slider"
            id="fullScreenPlayerSeekSlider"
            sliderOpacity={0.25}
            onSeek={(currentPosition) => setSongPos(currentPosition)}
            className={`full-screen-player-seek-slider absolute h-fit w-full appearance-none bg-background-color-3/25 outline-none outline-1 outline-offset-1 transition-[width,height,transform] delay-200 ease-in-out before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--seek-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-background-color-3 before:backdrop-blur-lg before:transition-[width,height,transform] before:delay-200 before:ease-in-out before:content-[''] hover:before:h-3 focus-visible:!outline group-hover/fullScreenPlayer:-translate-y-8 group-hover/fullScreenPlayer:scale-x-95 ${
              isMouseActive && 'peer-hover/songInfoContainer:before:h-3'
            } ${!isCurrentSongPlaying && isLyricsVisible && '!-translate-y-8 !scale-x-95'}`}
          />
        </div>
      </div>
    );
  };

export default FullScreenPlayer;
