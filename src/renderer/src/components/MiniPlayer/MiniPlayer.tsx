/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
import { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import DefaultSongCover from '../../assets/images/webp/song_cover_default.webp';
import Button from '../Button';
import Img from '../Img';
import UpNextSongPopup from '../SongsControlsContainer/UpNextSongPopup';
import LyricsContainer from './containers/LyricsContainer';
import SeekBarSlider from '../SeekBarSlider';
import TitleBarContainer from './containers/TitleBarContainer';
import VolumeSlider from '../VolumeSlider';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

type MiniPlayerProps = {
  className?: string;
};

export default function MiniPlayer(props: MiniPlayerProps) {
  const isCurrentSongPlaying = useStore(store, (state) => state.player.isCurrentSongPlaying);
  const currentSongData = useStore(store, (state) => state.currentSongData);
  const isMuted = useStore(store, (state) => state.player.volume.isMuted);
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const {
    toggleSongPlayback,
    updatePlayerType,
    handleSkipBackwardClick,
    handleSkipForwardClick,
    toggleIsFavorite,
    toggleMutedState
  } = useContext(AppUpdateContext);

  const { className } = props;

  const { t } = useTranslation();

  const [isNextSongPopupVisible, setIsNextSongPopupVisible] = useState(false);

  const [isLyricsVisible, setIsLyricsVisible] = useState(false);

  const manageKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === 'l') setIsLyricsVisible((prevState) => !prevState);
        if (e.key === 'n') updatePlayerType('normal');
      }
    },
    [updatePlayerType]
  );

  useEffect(() => {
    window.addEventListener('keydown', manageKeyboardShortcuts);
    return () => {
      window.removeEventListener('keydown', manageKeyboardShortcuts);
    };
  }, [manageKeyboardShortcuts]);

  const handleSkipForwardClickWithParams = useCallback(
    () => handleSkipForwardClick('USER_SKIP'),
    [handleSkipForwardClick]
  );

  return (
    <div
      className={`mini-player dark group h-full select-none overflow-hidden !bg-dark-background-color-1 !transition-none delay-100 dark:!bg-dark-background-color-1 ${
        !isCurrentSongPlaying && 'paused'
      } ${
        preferences?.isReducedMotion ? 'reduced-motion' : ''
      } [&:focus-within>.container>.song-controls-container>button]:translate-x-0 [&:focus-within>.container>.song-controls-container>button]:scale-100 [&:focus-within>.container>.song-controls-container]:visible [&:focus-within>.container>.song-controls-container]:opacity-100 [&:hover>.container>.song-controls-container>button]:translate-x-0 [&:hover>.container>.song-controls-container>button]:scale-100 [&:hover>.container>.song-controls-container]:visible [&:hover>.container>.song-controls-container]:opacity-100 ${className}`}
    >
      <div className="background-cover-img-container h-full overflow-hidden">
        <Img
          src={currentSongData.artworkPath}
          fallbackSrc={DefaultSongCover}
          loading="eager"
          alt="Song Cover"
          className={`h-full w-full object-cover transition-[filter] delay-100 duration-200 ease-in-out group-focus-within:blur-[2px] group-focus-within:brightness-75 group-hover:blur-[2px] group-hover:brightness-75 group-focus:blur-[4px] group-focus:brightness-75 ${
            isLyricsVisible ? '!blur-[1rem] !brightness-[.25]' : ''
          } ${!isCurrentSongPlaying ? 'blur-[1rem] brightness-75' : 'blur-0 brightness-100'}`}
        />
      </div>
      <LyricsContainer isLyricsVisible={isLyricsVisible} />
      <div
        className={`container absolute top-0 flex h-full flex-col items-center justify-between overflow-hidden ${
          !isLyricsVisible &&
          'bg-[linear-gradient(180deg,_rgba(2,_0,_36,_0)_0%,_rgba(33,_34,_38,_0.9)_90%)]'
        }`}
      >
        <TitleBarContainer isLyricsVisible={isLyricsVisible} />
        <div
          className={`song-controls-container delay-50 absolute left-1/2 top-[45%] flex h-fit -translate-x-1/2 -translate-y-1/2 items-center justify-center !bg-[transparent] shadow-none transition-[visibility,opacity] dark:!bg-[transparent] ${
            !isCurrentSongPlaying ? 'visible opacity-100' : 'invisible opacity-0'
          }`}
        >
          <Button
            className={`favorite-btn !m-0 h-fit -translate-x-4 cursor-pointer !rounded-none !border-0 !bg-[transparent] !p-0 text-font-color-white outline-1 outline-offset-1 transition-transform after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:bg-font-color-highlight after:opacity-0 after:transition-opacity focus-visible:!outline dark:!bg-[transparent] dark:text-font-color-white dark:after:bg-dark-font-color-highlight ${
              currentSongData.isAFavorite && 'after:opacity-100'
            }`}
            iconClassName={`!text-xl ${
              currentSongData.isAFavorite
                ? 'meterial-icons-round !text-dark-background-color-3'
                : 'material-icons-round-outlined'
            }`}
            isDisabled={!currentSongData.isKnownSource}
            tooltipLabel={
              currentSongData.isKnownSource
                ? t('player.likeDislike')
                : t('player.likeDislikeDisabled')
            }
            clickHandler={() =>
              currentSongData.isKnownSource && toggleIsFavorite(!currentSongData.isAFavorite)
            }
            iconName="favorite"
            removeFocusOnClick
          />
          <Button
            className="skip-backward-btn !mr-0 ml-4 h-fit -translate-x-4 cursor-pointer !rounded-none !border-0 !bg-[transparent] !p-0 text-font-color-white outline-1 outline-offset-1 transition-transform focus-visible:!outline dark:!bg-[transparent] dark:text-font-color-white"
            tooltipLabel={t('player.prevSong')}
            iconClassName="!text-3xl"
            clickHandler={handleSkipBackwardClick}
            iconName="skip_previous"
            removeFocusOnClick
          />
          <Button
            className="play-pause-btn !mx-2 h-fit scale-90 cursor-pointer !rounded-none !border-0 !bg-[transparent] !p-0 text-6xl text-font-color-white outline-1 outline-offset-1 transition-transform focus-visible:!outline dark:!bg-[transparent] dark:text-font-color-white"
            tooltipLabel={t('player.playPause')}
            iconClassName="!text-5xl"
            clickHandler={toggleSongPlayback}
            iconName={isCurrentSongPlaying ? 'pause_circle' : 'play_circle'}
            removeFocusOnClick
          />
          <Button
            className="skip-backward-btn !mr-4 h-fit translate-x-4 cursor-pointer !rounded-none !border-0 !bg-[transparent] !p-0 text-font-color-white outline-1 outline-offset-1 transition-transform focus-visible:!outline dark:!bg-[transparent] dark:text-font-color-white"
            tooltipLabel={t('player.nextSong')}
            iconClassName="!text-3xl"
            clickHandler={handleSkipForwardClickWithParams}
            iconName="skip_next"
            removeFocusOnClick
          />
          <Button
            className={`lyrics-btn !m-0 h-fit translate-x-4 cursor-pointer !rounded-none !border-0 !bg-[transparent] !p-0 text-font-color-white outline-1 outline-offset-1 transition-transform after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:bg-font-color-highlight after:opacity-0 after:transition-opacity focus-visible:!outline dark:!bg-[transparent] dark:text-font-color-white dark:after:bg-dark-font-color-highlight ${
              isLyricsVisible && '!text-dark-background-color-3 after:opacity-100'
            }`}
            iconClassName="!text-xl"
            clickHandler={() => setIsLyricsVisible((prevState) => !prevState)}
            iconName="notes"
            tooltipLabel={t('player.lyrics')}
            removeFocusOnClick
          />
        </div>
        <div
          className={`song-info-container group/info flex h-1/2 w-full flex-col items-center justify-center px-4 text-center text-font-color-white transition-[visibility,opacity] ${
            isLyricsVisible
              ? 'invisible opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100'
              : ''
          } ${!isCurrentSongPlaying ? '!visible !opacity-100' : ''}`}
        >
          <div className="relative flex w-full flex-col items-center justify-center text-font-color-highlight transition-[filter,opacity] delay-200 group-focus-within/info:pointer-events-none group-focus-within/info:opacity-50 group-focus-within/info:blur-sm group-focus-within/info:delay-0 group-hover/info:pointer-events-none group-hover/info:opacity-50 group-hover/info:blur-sm">
            <div
              className="song-title max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xl font-medium"
              title={currentSongData.title}
            >
              {currentSongData.title}
            </div>
            {!isNextSongPopupVisible && (
              <div
                className="song-artists appear-from-bottom text-xs text-font-color-white/80"
                title={currentSongData.artists?.map((artist) => artist.name).join(', ')}
              >
                {currentSongData.songId && Array.isArray(currentSongData.artists)
                  ? currentSongData.artists?.length > 0
                    ? currentSongData.artists.map((artist) => artist.name).join(', ')
                    : t('common.unknownArtist')
                  : ''}
              </div>
            )}
            <UpNextSongPopup
              isSemiTransparent
              onPopupAppears={(isVisible) => setIsNextSongPopupVisible(isVisible)}
            />
          </div>
          <div className="pointer-events-none absolute flex items-center opacity-0 transition-opacity delay-200 group-focus-within/info:pointer-events-auto group-focus-within/info:opacity-100 group-focus-within/info:delay-0 group-hover/info:pointer-events-auto group-hover/info:opacity-100">
            <Button
              className={`volume-btn !mr-2 !rounded-none !border-0 !p-0 outline-1 outline-offset-1 after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:bg-font-color-highlight after:opacity-0 after:transition-opacity focus-visible:!outline dark:after:bg-dark-font-color-highlight ${
                isMuted && 'after:opacity-100'
              }`}
              tooltipLabel={t('player.muteUnmute')}
              iconName={isMuted ? 'volume_off' : 'volume_up'}
              iconClassName={`material-icons-round text-xl text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white ${
                isMuted &&
                '!text-font-color-highlight !opacity-100 dark:!text-dark-font-color-highlight'
              }`}
              clickHandler={() => toggleMutedState(!isMuted)}
              removeFocusOnClick
            />
            <VolumeSlider
              name="mini-player-volume-slider"
              id="volumeSlider"
              className="relative float-left m-0 h-6 w-full appearance-none !bg-[transparent] p-0 outline-none outline-1 outline-offset-1 before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--volume-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-black/50 before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight focus-visible:!outline dark:before:bg-font-color-white/50 dark:hover:before:bg-dark-font-color-highlight"
            />
          </div>
        </div>
        <SeekBarSlider
          name="mini-player-seek-slider"
          id="miniPlayerSeekSlider"
          className="seek-slider absolute bottom-0 float-left m-0 h-fit w-full appearance-none bg-background-color-3/25 p-0 outline-none outline-1 outline-offset-1 backdrop-blur-sm transition-[width,height,transform] ease-in-out before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--seek-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-background-color-3 before:transition-[width,height,transform] before:ease-in-out before:content-[''] focus-visible:!outline group-focus-within:-translate-y-3 group-focus-within:scale-x-95 group-focus-within:before:h-3 group-hover:-translate-y-3 group-hover:scale-x-95 group-hover:before:h-3"
        />
      </div>
    </div>
  );
}
