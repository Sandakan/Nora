import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from 'renderer/components/Button';
import Img from 'renderer/components/Img';
import UpNextSongPopup from 'renderer/components/SongsControlsContainer/UpNextSongPopup';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';
import calculateTime from 'renderer/utils/calculateTime';

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
  const { songPosition } = React.useContext(SongPositionContext);
  const { t } = useTranslation();

  const { isLyricsVisible, setIsLyricsVisible, isLyricsAvailable } = props;

  const [isNextSongPopupVisible, setIsNextSongPopupVisible] =
    React.useState(false);

  const songDuration =
    localStorageData && localStorageData.preferences.showSongRemainingTime
      ? currentSongData.duration - Math.floor(songPosition) >= 0
        ? calculateTime(currentSongData.duration - Math.floor(songPosition))
        : calculateTime(0)
      : calculateTime(songPosition);

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
      className={`song-img-controls-and-info-container flex py-16 px-12 h-80 w-full flex-row transition-[visibility,opacity] items-center gap-8 delay-200 lg:ml-4 lg:w-full text-font-color-white ${
        isLyricsVisible && isLyricsAvailable
          ? 'invisible opacity-0 group-hover/fullScreenPlayer:visible group-hover/fullScreenPlayer:opacity-100'
          : 'visible opacity-100'
      } ${!isCurrentSongPlaying && isLyricsVisible && '!visible !opacity-100'}`}
    >
      <Img
        src={currentSongData.artworkPath}
        fallbackSrc={DefaultSongCover}
        loading="eager"
        alt="Song Cover"
        className="h-full rounded-md aspect-auto object-cover shadow-md"
      />
      <div className="song-controls-and-info-container h-full flex flex-col justify-between">
        <div className="song-controls-container flex h-fit items-center">
          <Button
            className="favorite-btn h-fit cursor-pointer !border-0 !p-3 text-font-color-white outline-1 outline-offset-1 transition-[background] focus-visible:!outline dark:text-font-color-white dark:after:bg-dark-font-color-highlight !bg-background-color-1/15 hover:!bg-background-color-1/30 !backdrop-blur-lg"
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
            className="skip-backward-btn h-fit cursor-pointer !border-0 !p-2 text-font-color-white outline-1 outline-offset-1 transition-[background] focus-visible:!outline dark:text-font-color-white !bg-background-color-1/15 hover:!bg-background-color-1/30 !backdrop-blur-lg"
            tooltipLabel={t('player.prevSong')}
            iconClassName="!text-3xl material-icons-round-outlined"
            clickHandler={handleSkipBackwardClick}
            iconName="skip_previous"
            removeFocusOnClick
          />
          <Button
            className="play-pause-btn h-fit scale-90 cursor-pointer !border-0 !p-2 text-font-color-white outline-1 outline-offset-1 transition-[background] focus-visible:!outline dark:text-font-color-white !bg-background-color-1/15 hover:!bg-background-color-1/30 !backdrop-blur-lg"
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
            className="skip-backward-btn h-fit cursor-pointer !border-0 !p-2 text-font-color-white outline-1 outline-offset-1 transition-[background] focus-visible:!outline dark:text-font-color-white !bg-background-color-1/15 hover:!bg-background-color-1/30 !backdrop-blur-lg"
            tooltipLabel={t('player.nextSong')}
            iconClassName="!text-3xl material-icons-round-outlined"
            clickHandler={handleSkipForwardClickWithParams}
            iconName="skip_next"
            removeFocusOnClick
          />
          <Button
            className={`lyrics-btn h-fit cursor-pointer !border-0 !p-3 text-font-color-white outline-1 outline-offset-1 transition-[background] focus-visible:!outline dark:text-font-color-white after:absolute after:h-1 !bg-background-color-1/15 hover:!bg-background-color-1/30 !backdrop-blur-lg  ${
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
            <div className="song-title relative flex w-full items-center">
              <div
                className="w-fit max-w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-5xl py-2 font-medium outline-1 outline-offset-1 focus-visible:!outline !text-font-color-white"
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
              className="song-artists appear-from-bottom text-lg text-font-color-white/80 leading-none"
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
              {currentSongData.songId && Array.isArray(currentSongData.artists)
                ? currentSongData.artists?.length > 0
                  ? currentSongData.artists
                      .map((artist) => artist.name)
                      .join(', ')
                  : t('common.unknownArtist')
                : ''}
            </div>
          )}
          <UpNextSongPopup
            onPopupAppears={(isVisible) => setIsNextSongPopupVisible(isVisible)}
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
  );
};

export default SongInfoContainer;
