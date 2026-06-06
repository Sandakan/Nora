import { store } from '@renderer/store/store';
import { useStore } from '@tanstack/react-store';
import { useEffect, useMemo, useRef, useState } from 'react';

import DefaultSongCover from '../../assets/images/webp/song_cover_default.webp';
import useMouseActiveState from '../../hooks/useMouseActiveState';
import Img from '../Img';
import SeekBarSlider from '../SeekBarSlider';
import TitleBar from '../TitleBar/TitleBar';
import LyricsContainer from './containers/LyricsContainer';
import SongInfoContainer from './containers/SongInfoContainer';

const PINNED_STORAGE_KEY = 'fullScreenPlayer.isPinned';

const FullScreenPlayer = () => {
  const isCurrentSongPlaying = useStore(store, (state) => state.player.isCurrentSongPlaying);
  const currentSongData = useStore(store, (state) => state.currentSongData);
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const [isLyricsVisible, setIsLyricsVisible] = useState(false);
  const [isLyricsAvailable, setIsLyricsAvailable] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    try {
      return window.localStorage.getItem(PINNED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [songPos, setSongPos] = useState(0);

  useEffect(() => {
    try {
      window.localStorage.setItem(PINNED_STORAGE_KEY, String(isPinned));
    } catch {
      // localStorage may be unavailable (private mode, quota); ignore.
    }
  }, [isPinned]);

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
    return currentSongData.artworkPath;
  }, [currentSongData?.artworkPath]);

  return (
    <div
      className={`full-screen-player dark bg-dark-background-color-1! relative ${!isCurrentSongPlaying && 'paused'} ${
        preferences?.isReducedMotion ? 'reduced-motion' : ''
      } grid !h-screen w-full grid-rows-[auto_1fr] overflow-y-hidden`}
    >
      <div className="background-cover-img-container absolute top-0 left-0 h-full w-full">
        <Img
          src={imgPath}
          fallbackSrc={DefaultSongCover}
          loading="eager"
          alt="Song Cover"
          className={`h-full w-full object-cover shadow-lg brightness-[.25]! transition-[filter] delay-100 duration-200 ease-in-out blur-[2rem]!`}
        />
      </div>
      <TitleBar />
      <div
        className={`flex max-w-full flex-col justify-end ${(isMouseActive || isPinned) && 'group/fullScreenPlayer'}`}
        ref={fullScreenPlayerContainerRef}
      >
        <LyricsContainer
          isLyricsVisible={isLyricsVisible}
          isPinned={isPinned}
          setIsLyricsAvailable={setIsLyricsAvailable}
        />
        <SongInfoContainer
          songPos={songPos}
          isLyricsVisible={isLyricsVisible}
          setIsLyricsVisible={setIsLyricsVisible}
          isLyricsAvailable={isLyricsAvailable}
          isMouseActive={isMouseActive}
          isPinned={isPinned}
          setIsPinned={setIsPinned}
        />
        <SeekBarSlider
          name="full-screen-player-seek-slider"
          id="fullScreenPlayerSeekSlider"
          sliderOpacity={0.25}
          onSeek={(currentPosition) => setSongPos(currentPosition)}
            (isMouseActive || isPinned) && 'peer-hover/songInfoContainer:before:h-3'
          } ${!isCurrentSongPlaying && isLyricsVisible && '-translate-y-8! scale-x-95!'}`}
        />
      </div>
    </div>
  );
};

export default FullScreenPlayer;
