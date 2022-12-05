/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';
import DefaultSongCover from '../../../../assets/images/png/song_cover_default.png';
import Img from '../Img';

export default function MiniPlayer() {
  const {
    isMiniPlayer,
    currentSongData,
    isCurrentSongPlaying,
    isPlaying,
    userData,
  } = React.useContext(AppContext);
  const {
    updateMiniPlayerStatus,
    toggleSongPlayback,
    handleSkipBackwardClick,
    handleSkipForwardClick,
    updateUserData,
    updateSongPosition,
  } = React.useContext(AppUpdateContext);

  const { songPosition } = React.useContext(SongPositionContext);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`mini-player group h-full overflow-hidden ${
        !isCurrentSongPlaying && 'paused'
      } ${
        userData && userData.preferences.isReducedMotion ? 'reduced-motion' : ''
      } [&:hover>.container>.song-controls-container]:visible [&:hover>.container>.song-controls-container]:opacity-100 [&:hover>.container>.song-controls-container>button]:translate-x-0 [&:hover>.container>.song-controls-container>button]:scale-100`}
    >
      <div className="background-cover-img-container h-full overflow-hidden">
        <Img
          src={
            currentSongData.artworkPath
              ? `nora://localFiles/${currentSongData.artworkPath}`
              : DefaultSongCover
          }
          alt="Song Cover"
          className={`h-full w-full object-cover transition-[filter] duration-200 ease-in-out group-hover:blur-[2px] group-hover:brightness-75 group-focus:blur-[4px] group-focus:brightness-75 ${
            !isCurrentSongPlaying
              ? 'blur-[2px] brightness-75'
              : 'blur-0 brightness-100'
          }`}
        />
      </div>
      <div className="container absolute top-0 flex h-full flex-col items-center justify-between overflow-hidden">
        <div
          className={`title-bar z-10 flex h-[15%] w-full select-none justify-end `}
        >
          <div className="special-controls-container flex">
            <span
              className="go-to-main-player-btn cursor-pointer p-2 text-font-color-white dark:text-font-color-white"
              title="Go to Main Player"
            >
              <span
                className="material-icons-round text-xl"
                onClick={() => updateMiniPlayerStatus(!isMiniPlayer)}
              >
                launch
              </span>
            </span>
            <span
              className={`always-on-top-btn m-1 cursor-pointer rounded-md p-1 text-font-color-white dark:text-font-color-white ${
                userData?.preferences.isMiniPlayerAlwaysOnTop
                  ? 'bg-dark-background-color-2 dark:bg-dark-background-color-2'
                  : ''
              }`}
              title={`Always on top : ${
                userData?.preferences.isMiniPlayerAlwaysOnTop ? 'ON' : 'OFF'
              }`}
            >
              <span
                className="material-icons-round text-xl"
                onClick={() => {
                  if (userData) {
                    const state =
                      !userData?.preferences.isMiniPlayerAlwaysOnTop;
                    return window.api
                      .toggleMiniPlayerAlwaysOnTop(state)
                      .then(() =>
                        updateUserData((prevUserData) => {
                          if (prevUserData?.preferences)
                            prevUserData.preferences.isMiniPlayerAlwaysOnTop =
                              state;
                          return prevUserData as UserData;
                        })
                      );
                  }
                  return undefined;
                }}
              >
                {userData?.preferences &&
                userData.preferences.isMiniPlayerAlwaysOnTop
                  ? 'move_down'
                  : 'move_up'}
              </span>
            </span>
          </div>
          <div className="window-controls-container flex">
            <span
              className="minimize-btn flex cursor-pointer items-center p-2 text-font-color-white hover:bg-dark-background-color-2 dark:text-font-color-white dark:hover:bg-dark-background-color-2"
              onClick={() => window.api.minimizeApp()}
              title="Minimize"
            >
              <span className="material-icons-round text-xl">minimize</span>
            </span>
            <span
              className="close-btn flex cursor-pointer items-center p-2 text-font-color-white hover:bg-font-color-crimson dark:text-font-color-white dark:hover:bg-font-color-crimson"
              onClick={() => window.api.closeApp()}
              title="Close"
            >
              <span className="material-icons-round text-xl">close</span>{' '}
            </span>
          </div>
        </div>
        <div
          className={`song-controls-container absolute top-[50%] left-1/2 flex h-fit -translate-x-1/2 -translate-y-1/2 items-center justify-center  bg-[transparent] shadow-none transition-[visibility,opacity] dark:bg-[transparent] ${
            !isCurrentSongPlaying
              ? 'visible opacity-100'
              : 'invisible opacity-0'
          }`}
        >
          <button
            type="button"
            className="skip-backward-btn h-fit -translate-x-4 cursor-pointer border-none bg-[transparent] text-font-color-white transition-transform dark:bg-[transparent] dark:text-font-color-white"
            onClick={handleSkipBackwardClick}
          >
            <span className="material-icons-round icon text-4xl">
              skip_previous
            </span>
          </button>
          <button
            type="button"
            className="play-pause-btn mx-4 h-fit scale-90 cursor-pointer border-none bg-[transparent] text-6xl text-font-color-white transition-transform dark:bg-[transparent] dark:text-font-color-white"
            onClick={toggleSongPlayback}
          >
            <span className="material-icons-round icon">
              {isPlaying ? 'pause_circle' : 'play_circle'}
            </span>
          </button>
          <button
            type="button"
            className="skip-forward-btn  h-fit translate-x-4 cursor-pointer border-none bg-[transparent] text-font-color-white transition-transform dark:bg-[transparent] dark:text-font-color-white"
            onClick={handleSkipForwardClick}
          >
            <span className="material-icons-round icon text-4xl">
              skip_next
            </span>
          </button>
        </div>
        <div className="song-info-container flex h-1/2 w-full flex-col items-center justify-center px-4 text-center text-font-color-white">
          <div
            className="song-title mt-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xl"
            title={currentSongData.title}
          >
            {currentSongData.title}
          </div>
          <div
            className="song-artists text-sm"
            title={currentSongData.artists
              ?.map((artist) => artist.name)
              .join(', ')}
          >
            {currentSongData.songId
              ? currentSongData.artists
                ? currentSongData.artists.map((artist) => artist.name).join(',')
                : 'Unknown Artist'
              : ''}
          </div>
        </div>
        <input
          type="range"
          name="seek-slider"
          id="seekSlider"
          className="seek-slider absolute bottom-0 float-left m-0 h-fit w-full appearance-none rounded-lg bg-font-color-highlight-2/25 p-0 outline-none backdrop-blur-sm transition-[width,height,transform] ease-in-out before:absolute before:top-1/2 before:left-0 before:h-1 before:w-[var(--seek-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-highlight-2 before:transition-[width,height,transform] before:ease-in-out before:content-[''] group-hover:-translate-y-3 group-hover:scale-x-95 group-hover:before:h-3"
          min={0}
          readOnly
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
    </div>
  );
}
