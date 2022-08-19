/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import {
  AppContext,
  AppUpdateContext,
  SongPositionContext,
} from 'renderer/contexts/AppContext';
import DefaultSongCover from '../../../../assets/images/png/song_cover_default.png';

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
  } = React.useContext(AppUpdateContext);

  const { songPosition } = React.useContext(SongPositionContext);
  const [localUserData, setLocalUserData] = React.useState(userData);
  const localUserDataRef = React.useRef(localUserData);

  const seekBarCssProperties: any = {};
  seekBarCssProperties['--seek-before-width'] = `${
    (songPosition / currentSongData.duration) * 100
  }%`;

  const updateLocalUserData = (
    callback: (prevData: UserData | undefined) => UserData
  ) => {
    setLocalUserData((data) => {
      const updatedData = callback(data);
      localUserDataRef.current = updatedData;
      return updatedData;
    });
  };

  return (
    <div
      className={`mini-player h-full overflow-hidden group ${
        !isCurrentSongPlaying && 'paused'
      } ${
        localUserDataRef.current &&
        localUserDataRef.current.preferences.isReducedMotion
          ? 'reduced-motion'
          : ''
      } [&:hover>.container>.song-controls-container]:visible [&:hover>.container>.song-controls-container]:opacity-100 [&:hover>.container>.song-controls-container>button]:translate-x-0 [&:hover>.container>.song-controls-container>button]:scale-100`}
    >
      <div className="background-cover-img-container overflow-hidden h-full">
        <img
          src={
            currentSongData.artworkPath
              ? `otomusic://localFiles/${currentSongData.artworkPath}`
              : DefaultSongCover
          }
          alt="Song Cover"
          className={`w-full h-full object-cover group-hover:blur-[2px] group-hover:brightness-75 group-focus:blur-[2px] group-focus:brightness-75 transition-[filter] duration-200 ease-in-out ${
            !isCurrentSongPlaying
              ? 'blur-[2px] brightness-75'
              : 'blur-0 brightness-100'
          }`}
        />
      </div>
      <div className="container h-full absolute top-0 flex flex-col items-center justify-between overflow-hidden">
        <div
          className={`title-bar w-full h-[15%] flex justify-end z-10 select-none `}
        >
          <div className="special-controls-container flex">
            <span className="go-to-main-player-btn text-font-color-white dark:text-font-color-white p-2 cursor-pointer">
              <span
                className="material-icons-round text-xl"
                onClick={() => updateMiniPlayerStatus(!isMiniPlayer)}
              >
                launch
              </span>
            </span>
            <span className="always-on-top-btn text-font-color-white dark:text-font-color-white p-2 cursor-pointer">
              <span
                className="material-icons-round text-xl"
                onClick={() => {
                  if (localUserDataRef.current) {
                    return window.api
                      .toggleMiniPlayerAlwaysOnTop(
                        !localUserDataRef.current?.preferences
                          .isMiniPlayerAlwaysOnTop
                      )
                      .then(() =>
                        updateLocalUserData((prevUserData) => {
                          const data = prevUserData;
                          if (data?.preferences)
                            data.preferences.isMiniPlayerAlwaysOnTop =
                              !data?.preferences.isMiniPlayerAlwaysOnTop;
                          return data as UserData;
                        })
                      );
                  }
                  return undefined;
                }}
              >
                {localUserDataRef.current?.preferences &&
                localUserDataRef.current.preferences.isMiniPlayerAlwaysOnTop
                  ? 'move_down'
                  : 'move_up'}
              </span>
            </span>
          </div>
          <div className="window-controls-container flex">
            <span
              className="minimize-btn text-font-color-white dark:text-font-color-white p-2 flex items-center cursor-pointer hover:bg-dark-background-color-2 dark:hover:bg-dark-background-color-2"
              onClick={() => window.api.minimizeApp()}
            >
              <span className="material-icons-round text-xl">minimize</span>
            </span>
            <span
              className="close-btn text-font-color-white dark:text-font-color-white p-2 flex items-center cursor-pointer hover:bg-foreground-color-1 dark:hover:bg-foreground-color-1"
              onClick={() => window.api.closeApp()}
            >
              <span className="material-icons-round text-xl">close</span>{' '}
            </span>
          </div>
        </div>
        <div
          className={`song-controls-container h-fit bg-[transparent] dark:bg-[transparent] shadow-none absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2  flex items-center justify-center transition-[visibility,opacity] ${
            !isCurrentSongPlaying
              ? 'visible opacity-100'
              : 'invisible opacity-0'
          }`}
        >
          <button
            type="button"
            className="skip-backward-btn bg-[transparent] dark:bg-[transparent] h-fit text-font-color-white dark:text-font-color-white border-none cursor-pointer -translate-x-4 transition-transform"
            onClick={handleSkipBackwardClick}
          >
            <span className="material-icons-round icon text-4xl">
              skip_previous
            </span>
          </button>
          <button
            type="button"
            className="play-pause-btn mx-4 bg-[transparent] dark:bg-[transparent] h-fit text-6xl text-font-color-white dark:text-font-color-white border-none cursor-pointer scale-90 transition-transform"
            onClick={toggleSongPlayback}
          >
            <span className="material-icons-round icon">
              {isPlaying ? 'pause_circle' : 'play_circle'}
            </span>
          </button>
          <button
            type="button"
            className="skip-forward-btn  bg-[transparent] dark:bg-[transparent] h-fit text-font-color-white dark:text-font-color-white border-none cursor-pointer translate-x-4 transition-transform"
            onClick={handleSkipForwardClick}
          >
            <span className="material-icons-round icon text-4xl">
              skip_next
            </span>
          </button>
        </div>
        <div className="song-info-container text-font-color-white w-full h-1/2 flex flex-col items-center justify-center px-4 text-center">
          <div
            className="song-title max-w-full overflow-hidden whitespace-nowrap text-ellipsis text-xl mt-2"
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
          className="seek-slider absolute appearance-none w-full m-0 p-0 h-fit float-left outline-none bg-[transparent] rounded-lg before:absolute before:content-[''] before:top-1/2 before:left-0 before:w-[var(--seek-before-width)] before:h-1 before:bg-foreground-color-1 before:cursor-pointer before:rounded-3xl before:-translate-y-1/2 bottom-0 before:transition-[width] before:ease-in-out"
          min={0}
          readOnly
          max={currentSongData.duration}
          value={songPosition}
          style={seekBarCssProperties}
        />
      </div>
    </div>
  );
}
