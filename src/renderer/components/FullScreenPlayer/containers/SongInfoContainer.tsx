import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { useTranslation } from 'react-i18next';
import calculateTime from 'renderer/utils/calculateTime';

import Button from 'renderer/components/Button';
import Img from 'renderer/components/Img';
import UpNextSongPopup from 'renderer/components/SongsControlsContainer/UpNextSongPopup';
import SeekBarSlider from 'renderer/components/SeekBarSlider';

import DefaultSongCover from '../../../../../assets/images/webp/song_cover_default.webp';

type Props = {
  isLyricsVisible: boolean;
  isLyricsAvailable: boolean;
  setIsLyricsVisible: (callback: (state: boolean) => boolean) => void;
};

const SongInfoContainer = (props: Props) => {
  const { localStorageData, currentSongData, isCurrentSongPlaying } =
    React.useContext(AppContext);
  const {
    toggleIsFavorite,
    handleSkipBackwardClick,
    handleSkipForwardClick,
    toggleSongPlayback,
  } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { isLyricsVisible, setIsLyricsVisible, isLyricsAvailable } = props;

  const [songPos, setSongPos] = React.useState(0);
  const [isNextSongPopupVisible, setIsNextSongPopupVisible] =
    React.useState(false);

  const songDuration =
    localStorageData && localStorageData.preferences.showSongRemainingTime
      ? currentSongData.duration - Math.floor(songPos) >= 0
        ? calculateTime(currentSongData.duration - Math.floor(songPos))
        : calculateTime(0)
      : calculateTime(songPos);

  const songArtistsImages = React.useMemo(() => {
    if (
      currentSongData.songId &&
      Array.isArray(currentSongData.artists) &&
      currentSongData.artists.length > 0
    )
      return currentSongData.artists
        .filter((artist, index) => artist.onlineArtworkPaths && index < 2)
        .map((artist, index) => (
          <Img
            key={artist.artistId}
            src={artist.onlineArtworkPaths?.picture_small}
            fallbackSrc={artist.artworkPath}
            loading="eager"
            className={`absolute aspect-square w-6 rounded-full border-2 border-background-color-1 dark:border-dark-background-color-1 ${
              index === 0 ? 'z-2' : '-translate-x-2'
            }`}
            alt=""
          />
        ));
    return undefined;
  }, [currentSongData.artists, currentSongData.songId]);

  const handleSkipForwardClickWithParams = React.useCallback(
    () => handleSkipForwardClick('USER_SKIP'),
    [handleSkipForwardClick],
  );

  return (
    <div
      className={`song-info-container group flex max-h-80 w-full max-w-full flex-col gap-2 px-12 py-16 transition-[visibility,opacity] delay-200 ${
        isLyricsVisible && isLyricsAvailable
          ? 'invisible opacity-0 group-hover/fullScreenPlayer:visible group-hover/fullScreenPlayer:opacity-100'
          : 'visible opacity-100'
      } ${!isCurrentSongPlaying && isLyricsVisible && '!visible !opacity-100'}`}
    >
      <div className="song-img-controls-and-info-container relative grid grid-cols-[12rem_1fr] flex-row items-center gap-8 text-font-color-white lg:ml-4 lg:w-full">
        <Img
          src={currentSongData.artworkPath}
          fallbackSrc={DefaultSongCover}
          loading="eager"
          alt="Song Cover"
          className="aspect-auto w-full rounded-md object-cover shadow-md"
        />
        <div className="song-controls-and-info-container flex h-full flex-col justify-between">
          <div className="song-controls-container flex h-fit items-center">
            <Button
              className="favorite-btn h-fit cursor-pointer !border-0 !bg-background-color-1/15 !p-3 text-font-color-white outline-1 outline-offset-1 !backdrop-blur-lg transition-[background] hover:!bg-background-color-1/30 focus-visible:!outline dark:text-font-color-white dark:after:bg-dark-font-color-highlight"
              iconClassName={`!text-2xl ${
                currentSongData.isAFavorite
                  ? 'meterial-icons-round'
                  : 'material-icons-round-outlined'
              }`}
              isDisabled={!currentSongData.isKnownSource}
              tooltipLabel={
                currentSongData.isKnownSource
                  ? t('player.likeDislike')
                  : t('player.likeDislikeDisabled')
              }
              clickHandler={() =>
                currentSongData.isKnownSource &&
                toggleIsFavorite(!currentSongData.isAFavorite)
              }
              iconName="favorite"
              removeFocusOnClick
            />
            <Button
              className="skip-backward-btn h-fit cursor-pointer !border-0 !bg-background-color-1/15 !p-2 text-font-color-white outline-1 outline-offset-1 !backdrop-blur-lg transition-[background] hover:!bg-background-color-1/30 focus-visible:!outline dark:text-font-color-white"
              tooltipLabel={t('player.prevSong')}
              iconClassName="!text-3xl material-icons-round-outlined"
              clickHandler={handleSkipBackwardClick}
              iconName="skip_previous"
              removeFocusOnClick
            />
            <Button
              className="play-pause-btn h-fit scale-90 cursor-pointer !border-0 !bg-background-color-1/15 !p-2 text-font-color-white outline-1 outline-offset-1 !backdrop-blur-lg transition-[background] hover:!bg-background-color-1/30 focus-visible:!outline dark:text-font-color-white"
              tooltipLabel={t('player.playPause')}
              iconClassName={`!text-4xl ${
                isCurrentSongPlaying
                  ? 'material-icons-round'
                  : 'material-icons-round-outlined'
              }`}
              clickHandler={toggleSongPlayback}
              iconName={isCurrentSongPlaying ? 'pause' : 'play_arrow'}
              removeFocusOnClick
            />
            <Button
              className="skip-backward-btn h-fit cursor-pointer !border-0 !bg-background-color-1/15 !p-2 text-font-color-white outline-1 outline-offset-1 !backdrop-blur-lg transition-[background] hover:!bg-background-color-1/30 focus-visible:!outline dark:text-font-color-white"
              tooltipLabel={t('player.nextSong')}
              iconClassName="!text-3xl material-icons-round-outlined"
              clickHandler={handleSkipForwardClickWithParams}
              iconName="skip_next"
              removeFocusOnClick
            />
            <Button
              className={`lyrics-btn h-fit cursor-pointer !border-0 !bg-background-color-1/15 !p-3 text-font-color-white outline-1 outline-offset-1 !backdrop-blur-lg transition-[background] after:absolute after:h-1 hover:!bg-background-color-1/30 focus-visible:!outline dark:text-font-color-white  ${
                isLyricsVisible &&
                '!text-dark-background-color-3 after:opacity-100'
              }`}
              iconClassName="!text-2xl"
              clickHandler={() => setIsLyricsVisible((prevState) => !prevState)}
              iconName="notes"
              tooltipLabel={t('player.lyrics')}
              removeFocusOnClick
            />
          </div>
          <div className="song-info-container">
            {currentSongData.title && (
              <div className="song-title relative grid w-full max-w-full items-center">
                <div
                  className="w-fit max-w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap py-2 text-5xl font-medium !text-font-color-white outline-1 outline-offset-1 focus-visible:!outline"
                  id="currentSongTitle"
                  title={currentSongData.title}
                >
                  {currentSongData.title}
                </div>
                {!currentSongData.isKnownSource && (
                  <span
                    className="material-icons-round-outlined ml-2 cursor-pointer text-xl font-light text-font-color-highlight hover:underline dark:text-dark-font-color-highlight"
                    title="You are playing from an unknown source. Some features are disabled."
                  >
                    error
                  </span>
                )}
              </div>
            )}
            {!isNextSongPopupVisible && (
              <div
                className="song-artists appear-from-bottom flex items-center text-lg leading-none text-font-color-white/80"
                title={currentSongData.artists
                  ?.map((artist) => artist.name)
                  .join(', ')}
              >
                {localStorageData?.preferences
                  .showArtistArtworkNearSongControls &&
                  songArtistsImages &&
                  songArtistsImages.length > 0 && (
                    <span
                      className={`relative mr-2 flex h-6 items-center lg:hidden ${
                        songArtistsImages.length === 1 ? 'w-6' : 'w-10'
                      } `}
                    >
                      {songArtistsImages}
                    </span>
                  )}
                {currentSongData.songId &&
                Array.isArray(currentSongData.artists)
                  ? currentSongData.artists?.length > 0
                    ? currentSongData.artists
                        .map((artist) => artist.name)
                        .join(', ')
                    : t('common.unknownArtist')
                  : ''}
              </div>
            )}
            <UpNextSongPopup
              onPopupAppears={(isVisible) =>
                setIsNextSongPopupVisible(isVisible)
              }
              className="!text-md w-fit"
              isSemiTransparent
            />
          </div>
          <div className="song-duration opacity-75">
            {localStorageData &&
            localStorageData.preferences.showSongRemainingTime
              ? '-'
              : ''}
            {songDuration.minutes}:{songDuration.seconds}
          </div>
        </div>
      </div>
      <SeekBarSlider
        name="full-screen-player-seek-slider"
        id="fullScreenPlayerSeekSlider"
        sliderOpacity={0.25}
        onSeek={(currentPosition) => setSongPos(currentPosition)}
        className={`full-screen-player-seek-slider relative h-fit w-full appearance-none bg-transparent py-4 outline-none outline-1 outline-offset-1 transition-[width,height,transform] ease-in-out before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--seek-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-background-color-1/75 before:backdrop-blur-lg before:transition-[width,height,transform] before:ease-in-out before:content-[''] focus-visible:!outline group-hover:before:h-3`}
      />
    </div>
  );
};

export default SongInfoContainer;
