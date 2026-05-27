import { store } from '@renderer/store/store';
import { useStore } from '@tanstack/react-store';
import { useCallback, useContext, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import DefaultSongCover from '../../assets/images/webp/song_cover_default.webp';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import useMouseActiveState from '../../hooks/useMouseActiveState';
import Button from '../Button';
import Img from '../Img';
import NavLink from '../NavLink';
import SeekBarSlider from '../SeekBarSlider';

const DisplayModePlayer = () => {
  const isCurrentSongPlaying = useStore(store, (state) => state.player.isCurrentSongPlaying);
  const currentSongData = useStore(store, (state) => state.currentSongData);
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const {
    toggleSongPlayback,
    handleSkipBackwardClick,
    handleSkipForwardClick
  } = useContext(AppUpdateContext);

  const { t } = useTranslation();

  const containerRef = useRef<HTMLDivElement>(null);
  const { isMouseActive } = useMouseActiveState(containerRef, {
    idleTimeout: preferences?.displayModeIdleTimeout ?? 4000,
    range: 50,
    idleOnMouseOut: true
  });

  const handleSkipForwardClickWithParams = useCallback(
    () => handleSkipForwardClick('USER_SKIP'),
    [handleSkipForwardClick]
  );

  const imgPath = useMemo(() => {
    const selectedArtist = currentSongData?.artists?.find(
      (artist) => !!artist.onlineArtworkPaths?.picture_xl
    );
    return selectedArtist?.onlineArtworkPaths?.picture_xl ?? currentSongData.artworkPath;
  }, [currentSongData?.artists, currentSongData?.artworkPath]);

  const showSongTitle = preferences?.showSongTitleInDisplayMode !== false;
  const showArtistName = preferences?.showArtistNameInDisplayMode !== false;
  const showControls = preferences?.showControlsInDisplayMode !== false;

  return (
    <div
      className={`display-mode-player dark bg-dark-background-color-1! relative grid h-screen w-full grid-rows-[1fr_auto] overflow-y-hidden ${
        !isCurrentSongPlaying && 'paused'
      } ${preferences?.isReducedMotion ? 'reduced-motion' : ''}`}
      ref={containerRef}
    >
      <div className="background-cover-img-container absolute inset-0">
        <Img
          src={imgPath}
          fallbackSrc={DefaultSongCover}
          loading="eager"
          alt="Song Cover"
          className="h-full w-full object-cover blur-[2rem] brightness-[.25]"
        />
      </div>

      <div
        className={`z-10 flex flex-col items-center justify-center gap-8 transition-opacity duration-500 ${
          isMouseActive ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex h-[50vh] max-h-[70vh] w-[50vh] max-w-[70vw] items-center justify-center">
          <Img
            src={currentSongData.artworkPath}
            fallbackSrc={DefaultSongCover}
            loading="eager"
            alt="Song Cover"
            className="h-full w-full rounded-2xl object-cover shadow-2xl"
          />
        </div>

        {showSongTitle && currentSongData.title && (
          <div
            className="text-font-color-highlight max-w-[80vw] overflow-hidden text-center text-7xl font-bold text-ellipsis whitespace-nowrap"
            title={currentSongData.title}
          >
            {currentSongData.title}
          </div>
        )}

        {showArtistName && currentSongData.artists && currentSongData.artists.length > 0 && (
          <div className="text-font-color-white/80 max-w-[80vw] overflow-hidden text-center text-3xl text-ellipsis whitespace-nowrap">
            {currentSongData.artists.map((artist) => artist.name).join(', ')}
          </div>
        )}
      </div>

      <div
        className={`z-10 flex items-center justify-center gap-4 pb-8 transition-opacity duration-500 ${
          showControls && isMouseActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Button
          className="skip-backward-btn bg-background-color-3/15! text-font-color-white hover:bg-background-color-3/30! h-fit cursor-pointer border-0! p-2! outline-offset-1 backdrop-blur-lg focus-visible:outline!"
          tooltipLabel={t('player.prevSong')}
          iconClassName="text-4xl! material-icons-round-outlined"
          clickHandler={handleSkipBackwardClick}
          iconName="skip_previous"
          removeFocusOnClick
        />
        <Button
          className="play-pause-btn bg-background-color-3/15! text-font-color-white hover:bg-background-color-3/30! h-fit scale-90 cursor-pointer border-0! p-2! outline-offset-1 backdrop-blur-lg focus-visible:outline!"
          tooltipLabel={t('player.playPause')}
          iconClassName={`text-6xl! ${
            isCurrentSongPlaying ? 'material-icons-round' : 'material-icons-round-outlined'
          }`}
          clickHandler={toggleSongPlayback}
          iconName={isCurrentSongPlaying ? 'pause_circle' : 'play_circle'}
          removeFocusOnClick
        />
        <Button
          className="skip-forward-btn bg-background-color-3/15! text-font-color-white hover:bg-background-color-3/30! h-fit cursor-pointer border-0! p-2! outline-offset-1 backdrop-blur-lg focus-visible:outline!"
          tooltipLabel={t('player.nextSong')}
          iconClassName="text-4xl! material-icons-round-outlined"
          clickHandler={handleSkipForwardClickWithParams}
          iconName="skip_next"
          removeFocusOnClick
        />
      </div>

      <SeekBarSlider
        name="display-mode-seek-slider"
        id="displayModeSeekSlider"
        sliderOpacity={0.25}
        className={`absolute bottom-0 z-10 h-fit w-full bg-background-color-3/25 before:bg-background-color-3 outline-offset-1 before:absolute before:top-1/2 before:left-0 before:h-1 before:w-[var(--seek-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:content-[''] focus-visible:outline! ${
          isMouseActive ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <NavLink
        to="/main-player/home"
        className="absolute top-4 right-4 z-20 cursor-pointer rounded-full bg-background-color-3/15 p-2 text-white backdrop-blur-lg transition-opacity hover:bg-background-color-3/30 focus-visible:outline!"
        title={t('player.backToPlayer')}
      >
        <span className="material-icons-round text-2xl">close_fullscreen</span>
      </NavLink>
    </div>
  );
};

export default DisplayModePlayer;
