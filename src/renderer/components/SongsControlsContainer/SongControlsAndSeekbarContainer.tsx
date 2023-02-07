/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';
import calculateTime from 'renderer/utils/calculateTime';

const SongControlsAndSeekbarContainer = () => {
  const {
    currentSongData,
    currentlyActivePage,
    queue,
    isShuffling,
    isRepeating,
    isPlaying,
    userData,
    isPlayerStalled,
  } = useContext(AppContext);
  const {
    changeCurrentActivePage,
    updateQueueData,
    toggleIsFavorite,
    toggleRepeat,
    toggleShuffling,
    toggleSongPlayback,
    handleSkipForwardClick,
    handleSkipBackwardClick,
    updateSongPosition,
  } = useContext(AppUpdateContext);
  const { songPosition } = useContext(SongPositionContext);

  const [songPos, setSongPos] = React.useState(0);
  const isMouseDownRef = React.useRef(false);
  const seekbarRef = React.useRef(null as HTMLInputElement | null);

  const seekBarCssProperties: any = {};

  seekBarCssProperties['--seek-before-width'] = `${
    (songPos / currentSongData.duration) * 100
  }%`;

  React.useEffect(() => {
    if (seekbarRef.current && !isMouseDownRef.current) {
      setSongPos(songPosition);
    }
  }, [songPosition]);

  React.useEffect(() => {
    if (seekbarRef.current) {
      const handleSeekbarMouseDown = () => {
        isMouseDownRef.current = true;
      };
      const handleSeekbarMouseUp = () => {
        isMouseDownRef.current = false;
        updateSongPosition(seekbarRef.current?.valueAsNumber ?? 0);
      };
      seekbarRef.current.addEventListener('mousedown', () =>
        handleSeekbarMouseDown()
      );
      seekbarRef.current.addEventListener('mouseup', () =>
        handleSeekbarMouseUp()
      );
      return () => {
        seekbarRef?.current?.removeEventListener(
          'mouseup',
          handleSeekbarMouseUp
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
        seekbarRef?.current?.removeEventListener(
          'mousedown',
          handleSeekbarMouseDown
        );
      };
    }
    return undefined;
  }, []);

  const handleQueueShuffle = () => {
    if (isShuffling) {
      const newQueue: string[] = [];
      if (
        Array.isArray(queue.queueBeforeShuffle) &&
        queue.queueBeforeShuffle.length > 0
      ) {
        for (let i = 0; i < queue.queueBeforeShuffle.length; i += 1) {
          newQueue.push(queue.queue[queue.queueBeforeShuffle[i]]);
        }
      }
      updateQueueData(
        undefined,
        newQueue.length > 0 ? newQueue : queue.queue,
        true,
        undefined,
        true
      );
    }
    toggleShuffling();
  };

  const currentSongPosition = calculateTime(songPosition);
  const songDuration =
    userData && userData.preferences.showSongRemainingTime
      ? calculateTime(currentSongData.duration - Math.floor(songPosition))
      : calculateTime(currentSongData.duration);

  return (
    <div className="song-controls-and-seekbar-container flex w-[40%] min-w-[20rem] flex-col items-center justify-center py-2">
      <div className="controls-container flex w-2/3 items-center justify-around px-2 lg:w-4/5 lg:p-0 [&>div.active_span.icon]:opacity-100">
        <div
          className={`like-btn flex h-8 w-8 items-center justify-center rounded-full ${
            currentSongData.isAFavorite && 'active'
          } ${!currentSongData.isKnownSource && '!cursor-none brightness-50'}`}
        >
          <span
            title={
              currentSongData.isKnownSource
                ? 'Like/Dislike (Ctrl + H)'
                : `Liking/Disliking songs is disabled because current playing song is from an unknown source and it doesn't support likes.`
            }
            className={`${
              currentSongData.isAFavorite
                ? 'material-icons-round'
                : 'material-icons-round-outlined'
            } icon cursor-pointer text-2xl leading-none text-font-color-black opacity-60 transition-opacity hover:opacity-100 dark:text-font-color-white`}
            onClick={() =>
              currentSongData.isKnownSource &&
              toggleIsFavorite(!currentSongData.isAFavorite)
            }
          >
            favorite
          </span>
        </div>
        <div className={`shuffle-btn flex ${isShuffling && 'active'}`}>
          <span
            title="Shuffle (Ctrl + S)"
            className="material-icons-round icon cursor-pointer text-2xl text-font-color-black opacity-60 transition-opacity hover:opacity-100 dark:text-font-color-white"
            onClick={handleQueueShuffle}
          >
            shuffle
          </span>
        </div>
        <div className="skip-back-btn flex">
          <span
            title="Previous Song (Ctrl + Left Arrow)"
            className="material-icons-round icon cursor-pointer text-2xl text-font-color-black opacity-60 transition-opacity hover:opacity-100 dark:text-font-color-white"
            onClick={handleSkipBackwardClick}
          >
            skip_previous
          </span>
        </div>
        <div
          className={`play-pause-btn relative flex items-center justify-center ${
            isPlayerStalled &&
            `after:absolute after:h-5 after:w-5 after:animate-spin-ease after:rounded-full after:border-2 after:border-[transparent] after:border-t-font-color-black after:content-[''] dark:after:border-t-font-color-white`
          }`}
        >
          <span
            title="Play/Pause (Space)"
            className={`material-icons-round icon cursor-pointer text-5xl text-font-color-black opacity-80 transition-opacity hover:opacity-100 dark:text-font-color-white ${
              isPlayerStalled && '!opacity-10'
            }`}
            onClick={!isPlayerStalled ? toggleSongPlayback : undefined}
          >
            {isPlaying ? 'pause_circle' : 'play_circle'}
          </span>
        </div>
        <div className="skip-forward-btn flex">
          <span
            title="Next Song (Ctrl + Right Arrow)"
            className="material-icons-round icon cursor-pointer text-2xl text-font-color-black opacity-60 transition-opacity hover:opacity-100 dark:text-font-color-white"
            onClick={handleSkipForwardClick}
          >
            skip_next
          </span>
        </div>
        <div
          className={`repeat-btn flex ${isRepeating !== 'false' && 'active'}`}
        >
          <span
            title="Repeat (Ctrl + T)"
            className="material-icons-round icon cursor-pointer text-2xl text-font-color-black opacity-60 transition-opacity hover:opacity-100 dark:text-font-color-white"
            onClick={() => toggleRepeat()}
          >
            {isRepeating === 'false' || isRepeating === 'repeat'
              ? 'repeat'
              : 'repeat_one'}
          </span>
        </div>
        <div
          className={`lyrics-btn flex ${
            currentlyActivePage.pageTitle === 'Lyrics' && 'active'
          }`}
        >
          <span
            title="Lyrics (Ctrl + L)"
            className="material-icons-round icon cursor-pointer text-2xl text-font-color-black opacity-60 transition-opacity hover:opacity-100 dark:text-font-color-white"
            onClick={() =>
              currentlyActivePage.pageTitle === 'Lyrics'
                ? changeCurrentActivePage('Home')
                : changeCurrentActivePage('Lyrics')
            }
          >
            notes
          </span>
        </div>
      </div>
      <div className="seekbar-and-song-durations-container flex h-1/3 w-full flex-row items-center justify-between text-sm">
        <div className="current-song-duration w-16 text-center font-light">
          {currentSongPosition.minutes}:{currentSongPosition.seconds}
        </div>
        <div className="seek-bar relative flex h-fit w-4/5 items-center rounded-md">
          <input
            type="range"
            name="seek-bar-slider"
            id="seek-bar-slider"
            className="seek-bar-slider relative float-left m-0 h-6 w-full appearance-none rounded-lg bg-[transparent] p-0 outline-none before:absolute before:top-1/2 before:left-0 before:h-1 before:w-[var(--seek-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-black/50 before:transition-[width] before:content-[''] dark:before:bg-font-color-white/50"
            min={0}
            max={currentSongData.duration || 0}
            value={songPos || 0}
            onChange={(e) => {
              setSongPos(e.currentTarget.valueAsNumber ?? 0);
            }}
            ref={seekbarRef}
            style={seekBarCssProperties}
            title={Math.round(songPosition).toString()}
          />
        </div>
        <div className="full-song-duration w-16 text-center text-sm font-light">
          {userData && userData.preferences.showSongRemainingTime ? '-' : ''}
          {songDuration.minutes}:{songDuration.seconds}
        </div>
      </div>
    </div>
  );
};

export default SongControlsAndSeekbarContainer;
