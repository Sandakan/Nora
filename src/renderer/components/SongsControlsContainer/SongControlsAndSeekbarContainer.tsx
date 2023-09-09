import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';
import calculateTime from 'renderer/utils/calculateTime';
import debounce from 'renderer/utils/debounce';
import Button from '../Button';

const SongControlsAndSeekbarContainer = () => {
  const {
    currentSongData,
    currentlyActivePage,
    queue,
    isShuffling,
    isRepeating,
    isCurrentSongPlaying,
    isPlayerStalled,
    localStorageData,
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
  const isMouseScrollRef = React.useRef(false);
  const seekbarRef = React.useRef(null as HTMLInputElement | null);

  const seekBarCssProperties: any = {};

  seekBarCssProperties['--seek-before-width'] = `${
    (songPos /
      ((currentSongData.duration || 0) >= songPos
        ? currentSongData.duration || 0
        : songPos)) *
    100
  }%`;

  React.useEffect(() => {
    if (
      seekbarRef.current &&
      !isMouseDownRef.current &&
      !isMouseScrollRef.current
    ) {
      setSongPos(songPosition);
    }
  }, [songPosition]);

  React.useEffect(() => {
    const seekBar = seekbarRef.current;

    if (seekbarRef.current) {
      const handleSeekbarMouseDown = () => {
        isMouseDownRef.current = true;
      };
      const handleSeekbarMouseUp = () => {
        isMouseDownRef.current = false;
        updateSongPosition(seekbarRef.current?.valueAsNumber ?? 0);
      };
      seekbarRef.current.addEventListener('mousedown', () =>
        handleSeekbarMouseDown(),
      );
      seekbarRef.current.addEventListener('mouseup', () =>
        handleSeekbarMouseUp(),
      );
      return () => {
        seekBar?.removeEventListener('mouseup', handleSeekbarMouseUp);
        seekBar?.removeEventListener('mousedown', handleSeekbarMouseDown);
      };
    }
    return undefined;
  }, [updateSongPosition]);

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
        true,
      );
    }
    toggleShuffling();
  };

  const currentSongPosition = calculateTime(songPos);
  const songDuration =
    localStorageData && localStorageData.preferences.showSongRemainingTime
      ? currentSongData.duration - Math.floor(songPosition) >= 0
        ? calculateTime(currentSongData.duration - Math.floor(songPosition))
        : calculateTime(0)
      : calculateTime(currentSongData.duration);

  return (
    <div className="song-controls-and-seekbar-container flex flex-col items-center justify-center py-2">
      <div className="controls-container flex w-2/3 max-w-sm items-center justify-around px-2 lg:w-4/5 lg:p-0 [&>div.active_span.icon]:!text-font-color-highlight [&>div.active_span.icon]:opacity-100 dark:[&>div.active_span.icon]:!text-dark-font-color-highlight">
        <Button
          className={`like-btn !mr-0 !rounded-none !border-0 !p-0 outline-1 outline-offset-1 after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:bg-font-color-highlight after:opacity-0 after:transition-opacity focus-visible:!outline dark:after:bg-dark-font-color-highlight ${
            currentSongData.isAFavorite && 'active after:opacity-100'
          } ${!currentSongData.isKnownSource && '!cursor-none brightness-50'}`}
          tooltipLabel={
            currentSongData.isKnownSource
              ? 'Like/Dislike (Ctrl + H)'
              : `Liking/Disliking songs is disabled because current playing song is from an unknown source and it doesn't support likes.`
          }
          iconName="favorite"
          iconClassName={`${
            currentSongData.isAFavorite
              ? 'material-icons-round !text-font-color-highlight dark:!text-dark-font-color-highlight !opacity-100'
              : 'material-icons-round-outlined'
          } icon cursor-pointer !text-2xl leading-none text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white`}
          clickHandler={() =>
            currentSongData.isKnownSource &&
            toggleIsFavorite(!currentSongData.isAFavorite)
          }
        />

        <Button
          className={`shuffle-btn !m-0 flex items-center justify-center !rounded-none !border-0 !p-0 outline-1 outline-offset-1 after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:bg-font-color-highlight after:opacity-0 after:transition-opacity focus-visible:!outline dark:after:bg-dark-font-color-highlight ${
            isShuffling && 'active after:opacity-100'
          }`}
          tooltipLabel="Shuffle (Ctrl + S)"
          iconName="shuffle"
          iconClassName={`material-icons-round icon !text-2xl opacity-60 transition-opacity hover:opacity-80 ${
            isShuffling &&
            '!text-font-color-highlight dark:!text-dark-font-color-highlight !opacity-100'
          }`}
          clickHandler={handleQueueShuffle}
        />

        <Button
          className="skip-back-btn !m-0 !rounded-none !border-0 !p-0 outline-1 outline-offset-1 focus-visible:!outline"
          tooltipLabel="Previous Song (Ctrl + Left Arrow)"
          iconName="skip_previous"
          iconClassName="material-icons-round !text-2xl opacity-60 transition-opacity hover:opacity-80"
          clickHandler={handleSkipBackwardClick}
        />

        <Button
          className={`play-pause-btn relative !m-0 !rounded-none !border-0 !p-0 outline-1 outline-offset-1 focus-visible:!outline ${
            isPlayerStalled &&
            `after:absolute after:h-5 after:w-5 after:animate-spin-ease after:rounded-full after:border-2 after:border-[transparent] after:border-t-font-color-black after:content-[''] dark:after:border-t-font-color-white`
          }`}
          tooltipLabel="Play/Pause (Space)"
          iconName={isCurrentSongPlaying ? 'pause_circle' : 'play_circle'}
          iconClassName={`material-icons-round !text-5xl opacity-80 transition-opacity hover:opacity-80 ${
            isPlayerStalled && '!opacity-10'
          }`}
          clickHandler={() => !isPlayerStalled && toggleSongPlayback()}
        />

        <Button
          className="skip-forward-btn !m-0 flex !rounded-none !border-0 !p-0 outline-1 outline-offset-1 focus-visible:!outline"
          tooltipLabel="Next Song (Ctrl + Right Arrow)"
          iconName="skip_next"
          iconClassName="material-icons-round !text-2xl opacity-60 transition-opacity hover:opacity-80"
          clickHandler={() => handleSkipForwardClick('USER_SKIP')}
        />

        <Button
          className={`repeat-btn !m-0 !rounded-none !border-0 !p-0 outline-1 outline-offset-1 after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:bg-font-color-highlight after:opacity-0 after:transition-opacity focus-visible:!outline dark:after:bg-dark-font-color-highlight ${
            isRepeating !== 'false' && 'active after:opacity-100'
          }`}
          tooltipLabel="Repeat (Ctrl + T)"
          iconName={
            isRepeating === 'false' || isRepeating === 'repeat'
              ? 'repeat'
              : 'repeat_one'
          }
          iconClassName={`material-icons-round !text-2xl opacity-60 transition-opacity hover:opacity-80 ${
            isRepeating !== 'false' &&
            '!text-font-color-highlight dark:!text-dark-font-color-highlight !opacity-100'
          }`}
          clickHandler={() => toggleRepeat()}
        />

        <Button
          className={`lyrics-btn !m-0 !rounded-none !border-0 !p-0 outline-1 outline-offset-1 after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:bg-font-color-highlight after:opacity-0 after:transition-opacity focus-visible:!outline dark:after:bg-dark-font-color-highlight ${
            currentlyActivePage.pageTitle === 'Lyrics' &&
            'active after:opacity-100'
          }`}
          tooltipLabel="Lyrics (Ctrl + L)"
          iconName="notes"
          iconClassName={`material-icons-round !text-2xl opacity-60 transition-opacity hover:opacity-80 ${
            currentlyActivePage.pageTitle === 'Lyrics' &&
            '!text-font-color-highlight dark:!text-dark-font-color-highlight !opacity-100'
          }`}
          clickHandler={() =>
            currentlyActivePage.pageTitle === 'Lyrics'
              ? changeCurrentActivePage('Home')
              : changeCurrentActivePage('Lyrics')
          }
        />
      </div>
      <div className="seekbar-and-song-durations-container flex h-1/3 w-full max-w-xl flex-row items-center justify-between text-sm">
        <div className="current-song-duration w-16 text-center font-light">
          {currentSongPosition.minutes}:{currentSongPosition.seconds}
        </div>
        <div className="seek-bar relative flex h-fit w-4/5 items-center rounded-md">
          <input
            type="range"
            name="seek-bar-slider"
            id="seek-bar-slider"
            className="seek-bar-slider relative float-left m-0 h-6 w-full appearance-none bg-[transparent] p-0 outline-none outline-1 outline-offset-1 before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--seek-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-black/50 before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight focus-visible:!outline dark:before:bg-font-color-white/50 dark:hover:before:bg-dark-font-color-highlight"
            min={0}
            max={
              (currentSongData.duration || 0) >= songPos
                ? currentSongData.duration || 0
                : songPos
            }
            value={songPos || 0}
            onChange={(e) => {
              setSongPos(e.currentTarget.valueAsNumber ?? 0);
            }}
            onWheel={(e) => {
              isMouseScrollRef.current = true;

              const max = parseInt(e.currentTarget.max);
              const scrollIncrement =
                localStorageData.preferences.seekbarScrollInterval;

              const incrementValue =
                e.deltaY > 0 ? -scrollIncrement : scrollIncrement;
              let value = (songPos || 0) + incrementValue;

              if (value > max) value = max;
              if (value < 0) value = 0;
              setSongPos(value);

              debounce(() => {
                isMouseScrollRef.current = false;
                updateSongPosition(value ?? 0);
              }, 250);
            }}
            ref={seekbarRef}
            style={seekBarCssProperties}
            title={`${currentSongPosition.minutes}:${currentSongPosition.seconds}`}
          />
        </div>
        <div className="full-song-duration w-16 text-center text-sm font-light">
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

export default SongControlsAndSeekbarContainer;
