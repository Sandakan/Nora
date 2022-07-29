/* eslint-disable react/no-array-index-key */
/* eslint-disable no-lonely-if */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-nested-ternary */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react/require-default-props */
/* eslint-disable no-return-assign */
/* eslint-disable no-console */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-else-return */
/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/self-closing-comp */
import React, { useContext } from 'react';
import {
  AppContext,
  AppUpdateContext,
  SongPositionContext,
} from 'renderer/contexts/AppContext';
import { calculateTime } from '../../../main/calculateTime';
import DefaultSongCover from '../../../../assets/images/song_cover_default.png';
import SongArtist from '../SongsPage/SongArtist';

const SongControlsContainer = () => {
  const {
    currentSongData,
    currentlyActivePage,
    queue,
    isMiniPlayer,
    isMuted,
    volume,
    isShuffling,
    isRepeating,
    isPlaying,
  } = useContext(AppContext);
  const {
    changeCurrentActivePage,
    updateQueueData,
    updateMiniPlayerStatus,
    toggleMutedState,
    toggleIsFavorite,
    updateVolume,
    toggleRepeat,
    toggleShuffling,
    handleSkipForwardClick,
    handleSkipBackwardClick,
    toggleSongPlayback,
    updateSongPosition,
    updateContextMenuData,
  } = useContext(AppUpdateContext);

  const { songPosition } = useContext(SongPositionContext);

  const seekBarCssProperties: any = {};
  const volumeBarCssProperties: any = {};
  seekBarCssProperties['--seek-before-width'] = `${
    (songPosition / currentSongData.duration) * 100
  }%`;
  volumeBarCssProperties['--volume-before-width'] = `${volume}%`;

  const handleQueueShuffle = () => {
    if (!isShuffling) updateQueueData(undefined, queue.queue, true);
    toggleShuffling();
  };

  const showSongInfoPage = () =>
    currentlyActivePage.pageTitle === 'SongInfo' &&
    currentlyActivePage.data &&
    currentlyActivePage.data.songInfo &&
    currentlyActivePage.data.songInfo.songId === currentSongData.songId
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('SongInfo', {
          songInfo: { songId: currentSongData.songId },
        });

  const songArtists = React.useMemo(
    () =>
      currentSongData.songId
        ? currentSongData.artists
          ? Array.isArray(currentSongData.artists) &&
            (currentSongData.artists.length > 0
              ? currentSongData.artists.map((artist, index) => (
                  <span key={index}>
                    <SongArtist
                      key={index}
                      artistId={artist.artistId}
                      name={artist.name}
                    />
                    {currentSongData.artists &&
                    currentSongData.artists.length - 1 !== index
                      ? ', '
                      : ''}
                  </span>
                ))
              : 'Unknown Artist')
          : 'Unknown Artist'
        : '',
    [currentSongData.artists, currentSongData.songId]
  );

  return (
    <footer className="song-controls-container w-full h-[6rem] bg-background-color-1 dark:bg-dark-background-color-1 flex flex-row justify-between relative bottom-0 overflow-hidden shadow-[0px_-10px_25px_7px_rgba(0,0,0,0.2)] text-font-color-black dark:text-font-color-white">
      <div className="current-playing-song-info-container w-1/4 flex items-center content-center relative">
        <div
          className="song-cover-container w-[30%] h-full overflow-hidden flex items-center justify-center relative p-2 mr-2 lg:hidden"
          id="currentSongCover"
        >
          <img
            className="max-w-full object-cover rounded-lg"
            src={
              currentSongData.artworkPath
                ? `otomusic://localFiles/${currentSongData.artworkPath}`
                : DefaultSongCover
            }
            alt="Default song cover"
            onContextMenu={(e) => {
              e.stopPropagation();
              updateContextMenuData(
                true,
                [
                  {
                    label: 'Info',
                    iconName: 'info',
                    handlerFunction: showSongInfoPage,
                  },
                ],
                e.pageX,
                e.pageY
              );
            }}
          />
        </div>
        <div className="song-info-container w-[65%] h-full flex flex-col items-start justify-center lg:ml-4">
          <div
            className="song-title w-full text-2xl font-medium overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:underline"
            id="currentSongTitle"
            title={currentSongData.title}
            onClick={showSongInfoPage}
            onContextMenu={(e) => {
              e.stopPropagation();
              updateContextMenuData(
                true,
                [
                  {
                    label: 'Info',
                    iconName: 'info',
                    handlerFunction: showSongInfoPage,
                  },
                ],
                e.pageX,
                e.pageY
              );
            }}
          >
            {currentSongData.title}
          </div>
          <div
            className="song-artists text-xs font-normal overflow-hidden text-ellipsis whitespace-nowrap w-[90%] cursor-pointer"
            id="currentSongArtists"
          >
            {songArtists}
          </div>
        </div>
      </div>
      <div className="song-controls-and-seekbar-container w-[40%] flex flex-col items-center justify-between py-2">
        <div className="controls-container w-[80%] flex items-center justify-around px-2 [&>div.active_span.icon]:text-foreground-color-1 dark:[&>div.active_span.icon]:text-foreground-color-1 [&>div.active_span.icon]:opacity-90">
          <div
            className={`like-btn flex ${
              currentSongData.isAFavorite && 'active'
            }`}
          >
            <span
              title="Like (Ctrl + H)"
              className={`${
                currentSongData.isAFavorite
                  ? 'material-icons-round'
                  : 'material-icons-round-outlined'
              } icon cursor-pointer text-3xl text-font-color-black dark:text-font-color-white opacity-75 transition-opacity hover:opacity-100`}
              onClick={() => toggleIsFavorite(!currentSongData.isAFavorite)}
            >
              favorite
            </span>
          </div>
          <div
            className={`repeat-btn flex ${isRepeating !== 'false' && 'active'}`}
          >
            <span
              title="Repeat (Ctrl + T)"
              className="material-icons-round icon cursor-pointer text-3xl text-font-color-black dark:text-font-color-white opacity-75 transition-opacity hover:opacity-100"
              onClick={() => toggleRepeat()}
            >
              {isRepeating === 'false' || isRepeating === 'repeat'
                ? 'repeat'
                : 'repeat_one'}
            </span>
          </div>
          <div className="skip-back-btn flex">
            <span
              title="Previous Song (Ctrl + Left Arrow)"
              className="material-icons-round icon cursor-pointer text-3xl text-font-color-black dark:text-font-color-white opacity-75 transition-opacity hover:opacity-100"
              onClick={handleSkipBackwardClick}
            >
              skip_previous
            </span>
          </div>
          <div className="play-pause-btn flex">
            <span
              title="Play/Pause (Space)"
              className="material-icons-round icon cursor-pointer text-6xl text-font-color-black dark:text-font-color-white opacity-75 transition-opacity hover:opacity-100"
              onClick={toggleSongPlayback}
            >
              {isPlaying ? 'pause_circle' : 'play_circle'}
            </span>
          </div>
          <div className="skip-forward-btn flex">
            <span
              title="Next Song (Ctrl + Right Arrow)"
              className="material-icons-round icon cursor-pointer text-3xl text-font-color-black dark:text-font-color-white opacity-75 transition-opacity hover:opacity-100"
              onClick={handleSkipForwardClick}
            >
              skip_next
            </span>
          </div>
          <div
            className={`lyrics-btn flex ${
              currentlyActivePage.pageTitle === 'Lyrics' && 'active'
            }`}
          >
            <span
              title="Lyrics (Ctrl + L)"
              className="material-icons-round icon cursor-pointer text-3xl text-font-color-black dark:text-font-color-white opacity-75 transition-opacity hover:opacity-100"
              onClick={() =>
                currentlyActivePage.pageTitle === 'Lyrics'
                  ? changeCurrentActivePage('Home')
                  : changeCurrentActivePage('Lyrics')
              }
            >
              notes
            </span>
          </div>
          <div className={`shuffle-btn flex ${isShuffling && 'active'}`}>
            <span
              title="Shuffle (Ctrl + S)"
              className="material-icons-round icon cursor-pointer text-3xl text-font-color-black dark:text-font-color-white opacity-75 transition-opacity hover:opacity-100"
              onClick={handleQueueShuffle}
            >
              shuffle
            </span>
          </div>
        </div>
        <div className="seekbar-and-song-durations-container w-full h-1/3 flex flex-row items-center justify-between">
          <div className="current-song-duration w-fit">
            {!Number.isNaN(songPosition)
              ? calculateTime(songPosition)
              : '--:--'}
          </div>
          <div className="seek-bar w-4/5 h-fit rounded-md relative flex items-center">
            <input
              type="range"
              name="seek-bar-slider"
              id="seek-bar-slider"
              className="seek-bar-slider relative appearance-none w-full m-0 p-0 h-6 float-left outline-none bg-[transparent] rounded-lg before:absolute before:content-[''] before:top-1/2 before:left-0 before:w-[var(--seek-before-width)] before:h-1 before:bg-foreground-color-1 before:cursor-pointer before:rounded-3xl before:-translate-y-1/2"
              min="0"
              max={currentSongData.duration || 0}
              value={songPosition || 0}
              onChange={(e) =>
                updateSongPosition(Number(e.currentTarget.value))
              }
              style={seekBarCssProperties}
              title={Math.round(songPosition).toString()}
            />
          </div>
          <div className="full-song-duration w-fit">
            {currentSongData.duration
              ? calculateTime(currentSongData.duration)
              : '-:-'}
          </div>
        </div>
      </div>
      <div className="other-controls-container w-1/4 flex items-center justify-end">
        <div
          className="other-settings-btn mr-8 cursor-pointer flex items-center justify-center text-font-color-black dark:text-font-color-white text-opacity-75"
          style={{ display: 'none' }}
        >
          <span
            title="Other Settings"
            className="material-icons-round icon cursor-pointer text-xl text-font-color-black dark:text-font-color-white opacity-75 transition-opacity hover:opacity-100"
          >
            more_horiz
          </span>
        </div>
        <div
          className={`queue-btn mr-8 cursor-pointer flex items-center justify-center text-font-color-black dark:text-font-color-white text-opacity-75 ${
            currentlyActivePage.pageTitle === 'CurrentQueue' && 'active'
          }`}
        >
          <span
            title="Current Queue (Ctrl + Q)"
            className="material-icons-round icon cursor-pointer text-xl text-font-color-black dark:text-font-color-white opacity-75 transition-opacity hover:opacity-100"
            onClick={() =>
              currentlyActivePage.pageTitle === 'CurrentQueue'
                ? changeCurrentActivePage('Home')
                : changeCurrentActivePage('CurrentQueue')
            }
          >
            segment
          </span>
        </div>
        <div className="mini-player-btn mr-8 cursor-pointer flex items-center justify-center text-font-color-black dark:text-font-color-white text-opacity-75">
          <span
            title="Open in Mini player (Ctrl + N)"
            className="material-icons-round icon cursor-pointer text-xl text-font-color-black dark:text-font-color-white opacity-75 transition-opacity hover:opacity-100"
            onClick={() => updateMiniPlayerStatus(!isMiniPlayer)}
          >
            tab_unselected
          </span>
        </div>
        <div className="volume-controller-container mr-8 flex items-center justify-center text-font-color-black dark:text-font-color-white text-opacity-75">
          <div className="volume-btn cursor-pointer flex items-center justify-center mr-3">
            <span
              title="Mute/Unmute (Ctrl + M)"
              className="material-icons-round icon cursor-pointer text-xl text-font-color-black dark:text-font-color-white opacity-75 transition-opacity hover:opacity-100"
              onClick={() => toggleMutedState()}
            >
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
          </div>
          <div className="volume-slider-container">
            <input
              type="range"
              id="volumeSlider"
              className="relative appearance-none w-full m-0 p-0 h-6 float-left outline-none bg-[transparent] rounded-lg before:absolute before:content-[''] before:top-1/2 before:left-0 before:w-[var(--volume-before-width)] before:h-1 before:bg-foreground-color-1 before:cursor-pointer before:rounded-3xl before:-translate-y-1/2"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => updateVolume(Number(e.target.value))}
              aria-label="Volume slider"
              style={volumeBarCssProperties}
              title={Math.round(volume).toString()}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

SongControlsContainer.displayName = 'SongControlsContainer';
export default SongControlsContainer;
