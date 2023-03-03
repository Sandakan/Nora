/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';
import debounce from 'renderer/utils/debounce';
import { getItem } from 'renderer/utils/localStorage';
import DefaultSongCover from '../../../../assets/images/webp/song_cover_default.webp';
import Button from '../Button';
import Img from '../Img';
import LyricLine from '../LyricsPage/LyricLine';

let scrollIncrement = getItem('seekbarScrollInterval');
document.addEventListener('localStorage', () => {
  scrollIncrement = getItem('seekbarScrollInterval');
});

export default function MiniPlayer() {
  const {
    isMiniPlayer,
    currentSongData,
    isCurrentSongPlaying,
    userData,
    isMuted,
    volume,
  } = React.useContext(AppContext);
  const {
    updateMiniPlayerStatus,
    toggleSongPlayback,
    handleSkipBackwardClick,
    handleSkipForwardClick,
    updateUserData,
    updateSongPosition,
    toggleIsFavorite,
    toggleMutedState,
    updateVolume,
  } = React.useContext(AppUpdateContext);

  const { songPosition } = React.useContext(SongPositionContext);
  const [songPos, setSongPos] = React.useState(0);
  const isMouseDownRef = React.useRef(false);
  const isMouseScrollRef = React.useRef(false);
  const seekbarRef = React.useRef(null as HTMLInputElement | null);

  const [isLyricsVisible, setIsLyricsVisible] = React.useState(false);
  const [lyrics, setLyrics] = React.useState<SongLyrics | null | undefined>(
    null
  );

  const volumeSliderRef = React.useRef<HTMLInputElement>(null);

  const volumeBarCssProperties: any = {};
  volumeBarCssProperties['--volume-before-width'] = `${volume}%`;

  React.useEffect(() => {
    if (isLyricsVisible) {
      setLyrics(null);
      window.api
        .getSongLyrics({
          songTitle: currentSongData.title,
          songArtists: Array.isArray(currentSongData.artists)
            ? currentSongData.artists.map((artist) => artist.name)
            : [],
          songPath: currentSongData.path,
          duration: currentSongData.duration,
        })
        .then((res) => setLyrics(res))
        .catch((err) => console.error(err));
    }
  }, [
    currentSongData.artists,
    currentSongData.duration,
    currentSongData.path,
    currentSongData.songId,
    currentSongData.title,
    isLyricsVisible,
  ]);

  const manageKeyboardShortcuts = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === 'l') setIsLyricsVisible((prevState) => !prevState);
        if (e.key === 'n') updateMiniPlayerStatus(!isMiniPlayer);
      }
    },
    [isMiniPlayer, updateMiniPlayerStatus]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', manageKeyboardShortcuts);
    return () => {
      window.removeEventListener('keydown', manageKeyboardShortcuts);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seekBarCssProperties: any = {};

  seekBarCssProperties['--seek-before-width'] = `${
    (songPos / currentSongData.duration) * 100
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

  const lyricsComponents = React.useMemo(() => {
    if (lyrics && lyrics?.lyrics) {
      const { isSynced, lyrics: unsyncedLyrics, syncedLyrics } = lyrics.lyrics;

      if (syncedLyrics) {
        return syncedLyrics.map((lyric, index) => {
          const { text, end, start } = lyric;
          return (
            <LyricLine
              key={index}
              index={index}
              lyric={text}
              syncedLyrics={{ start, end }}
            />
          );
        });
      }
      if (!isSynced) {
        return unsyncedLyrics.map((line, index) => {
          return <LyricLine key={index} index={index} lyric={line} />;
        });
      }
    }
    return [];
  }, [lyrics]);

  const handleSkipForwardClickWithParams = React.useCallback(
    () => handleSkipForwardClick('USER_SKIP'),
    [handleSkipForwardClick]
  );

  return (
    <div
      className={`mini-player dark group h-full select-none overflow-hidden delay-100 ${
        !isCurrentSongPlaying && 'paused'
      } ${
        userData && userData.preferences.isReducedMotion ? 'reduced-motion' : ''
      } [&:hover>.container>.song-controls-container>button]:translate-x-0 [&:hover>.container>.song-controls-container>button]:scale-100 [&:hover>.container>.song-controls-container]:visible [&:hover>.container>.song-controls-container]:opacity-100`}
    >
      <div className="background-cover-img-container h-full overflow-hidden">
        <Img
          src={
            currentSongData.artworkPath
              ? `nora://localFiles/${currentSongData.artworkPath}`
              : DefaultSongCover
          }
          alt="Song Cover"
          className={`h-full w-full object-cover transition-[filter] delay-100 duration-200 ease-in-out group-hover:blur-[2px] group-hover:brightness-75 group-focus:blur-[4px] group-focus:brightness-75 ${
            isLyricsVisible ? '!blur-[2px] !brightness-[.25]' : ''
          } ${
            !isCurrentSongPlaying
              ? 'blur-[2px] brightness-75'
              : 'blur-0 brightness-100'
          }`}
        />
      </div>
      <div
        className={`mini-player-lyrics-container absolute top-0 flex h-full w-full select-none flex-col items-center overflow-hidden py-12 px-2 transition-[filter] group-hover:blur-sm group-hover:brightness-50 ${
          !isCurrentSongPlaying ? 'blur-sm brightness-50' : ''
        }`}
        id="miniPlayerLyricsContainer"
      >
        {isLyricsVisible &&
          lyricsComponents.length > 0 &&
          lyrics &&
          lyrics.lyrics.isSynced &&
          lyricsComponents}
        {lyrics && !lyrics.lyrics.isSynced && (
          <div className="flex h-full w-full items-center justify-center text-font-color-white">
            No Synced Lyrics found.
          </div>
        )}
        {isLyricsVisible && lyrics === undefined && (
          <div className="flex h-full w-full items-center justify-center text-font-color-white">
            No Lyrics found.
          </div>
        )}
      </div>
      <div
        className={`container absolute top-0 flex h-full flex-col items-center justify-between overflow-hidden ${
          !isLyricsVisible &&
          'bg-[linear-gradient(180deg,_rgba(2,_0,_36,_0)_0%,_rgba(33,_34,_38,_0.9)_90%)]'
        }`}
      >
        <div
          className={`mini-player-title-bar z-10 flex h-[15%] max-h-[2.25rem] w-full select-none justify-end opacity-0 transition-[visibility,opacity] group-hover:visible group-hover:opacity-100 ${
            !isCurrentSongPlaying ? 'visible opacity-100' : ''
          }`}
        >
          <div
            className={`special-controls-container flex transition-[visibility,opacity] ${
              isLyricsVisible
                ? 'invisible opacity-0 group-hover:visible group-hover:opacity-100'
                : ''
            } ${!isCurrentSongPlaying ? '!visible !opacity-100' : ''}`}
          >
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
              onClick={() => {
                if (userData && userData.preferences.hideWindowOnClose)
                  window.api.hideApp();
                else window.api.closeApp();
              }}
              title="Close"
            >
              <span className="material-icons-round text-xl">close</span>{' '}
            </span>
          </div>
        </div>
        <div
          className={`song-controls-container delay-50 absolute top-[45%] left-1/2 flex h-fit -translate-x-1/2 -translate-y-1/2 items-center justify-center  bg-[transparent] shadow-none transition-[visibility,opacity] dark:bg-[transparent] ${
            !isCurrentSongPlaying
              ? 'visible opacity-100'
              : 'invisible opacity-0'
          }`}
        >
          <Button
            className="favorite-btn !m-0 h-fit -translate-x-4 cursor-pointer border-none bg-[transparent] !p-0 text-font-color-white transition-transform dark:bg-[transparent] dark:text-font-color-white"
            iconClassName={`!text-2xl ${
              currentSongData.isAFavorite
                ? 'meterial-icons-round !text-dark-background-color-3'
                : 'material-icons-round-outlined'
            }`}
            isDisabled={!currentSongData.isKnownSource}
            tooltipLabel={
              currentSongData.isKnownSource
                ? 'Like/Dislike (Ctrl + H)'
                : `Liking/Disliking songs is disabled because current playing song is from an unknown source and it doesn't support likes.`
            }
            clickHandler={() =>
              currentSongData.isKnownSource &&
              toggleIsFavorite(!currentSongData.isAFavorite)
            }
            iconName="favorite"
          />
          <Button
            className="skip-backward-btn ml-4 !mr-0 h-fit -translate-x-4 cursor-pointer border-none bg-[transparent] !p-0 text-font-color-white transition-transform dark:bg-[transparent] dark:text-font-color-white"
            iconClassName="!text-4xl"
            clickHandler={handleSkipBackwardClick}
            iconName="skip_previous"
          />
          <Button
            className="play-pause-btn !mx-2 h-fit scale-90 cursor-pointer border-none bg-[transparent] !p-0 text-6xl text-font-color-white transition-transform dark:bg-[transparent] dark:text-font-color-white"
            iconClassName="!text-6xl"
            clickHandler={toggleSongPlayback}
            iconName={isCurrentSongPlaying ? 'pause_circle' : 'play_circle'}
          />

          <Button
            className="skip-backward-btn !mr-4 h-fit translate-x-4 cursor-pointer border-none bg-[transparent] !p-0 text-font-color-white transition-transform dark:bg-[transparent] dark:text-font-color-white"
            iconClassName="!text-4xl"
            clickHandler={handleSkipForwardClickWithParams}
            iconName="skip_next"
          />
          <Button
            className={`lyrics-btn !m-0 h-fit translate-x-4 cursor-pointer border-none bg-[transparent] !p-0 text-font-color-white transition-transform dark:bg-[transparent] dark:text-font-color-white ${
              isLyricsVisible && '!text-dark-background-color-3'
            }`}
            iconClassName="!text-2xl"
            clickHandler={() => setIsLyricsVisible((prevState) => !prevState)}
            iconName="notes"
            tooltipLabel="Lyrics (Ctrl + L)"
          />
        </div>
        <div
          className={`song-info-container group/info flex h-1/2 w-full flex-col items-center justify-center px-4 text-center text-font-color-white transition-[visibility,opacity] ${
            isLyricsVisible
              ? 'invisible opacity-0 group-hover:visible group-hover:opacity-100'
              : ''
          } ${!isCurrentSongPlaying ? '!visible !opacity-100' : ''}`}
        >
          <div className="relative flex w-full flex-col items-center justify-center transition-[filter,opacity] group-hover/info:pointer-events-none group-hover/info:opacity-50 group-hover/info:blur-sm">
            <div
              className="song-title max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xl"
              title={currentSongData.title}
            >
              {currentSongData.title}
            </div>
            <div
              className="song-artists text-sm text-font-color-white/80"
              title={currentSongData.artists
                ?.map((artist) => artist.name)
                .join(', ')}
            >
              {currentSongData.songId && Array.isArray(currentSongData.artists)
                ? currentSongData.artists?.length > 0
                  ? currentSongData.artists
                      .map((artist) => artist.name)
                      .join(', ')
                  : 'Unknown Artist'
                : ''}
            </div>
          </div>
          <div className="pointer-events-none absolute flex items-center opacity-0 transition-opacity group-hover/info:pointer-events-auto group-hover/info:opacity-100">
            <span
              title="Mute/Unmute (Ctrl + M)"
              className={`material-icons-round icon mr-4 cursor-pointer text-xl text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white ${
                isMuted &&
                '!text-font-color-highlight !opacity-100 dark:!text-dark-font-color-highlight'
              }`}
              onClick={() => toggleMutedState(!isMuted)}
            >
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
            <input
              type="range"
              id="volumeSlider"
              className="relative float-left m-0 h-6 w-full appearance-none rounded-lg bg-[transparent] p-0 outline-none before:absolute before:top-1/2 before:left-0 before:h-1 before:w-[var(--volume-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-black/50 before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight dark:before:bg-font-color-white/50 dark:hover:before:bg-dark-font-color-highlight"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => updateVolume(Number(e.target.value))}
              aria-label="Volume slider"
              style={volumeBarCssProperties}
              title={Math.round(volume).toString()}
              onWheel={(e) => {
                const incrementValue =
                  e.deltaY > 0 ? -scrollIncrement : scrollIncrement;
                let value = volume + incrementValue;

                if (value > 100) value = 100;
                if (value < 0) value = 0;
                updateVolume(value);
              }}
              ref={volumeSliderRef}
            />
          </div>
        </div>
        <input
          type="range"
          name="mini-player-seek-slider"
          id="miniPlayerSeekSlider"
          className="seek-slider absolute bottom-0 float-left m-0 h-fit w-full appearance-none rounded-lg bg-background-color-3/25 p-0 outline-none backdrop-blur-sm transition-[width,height,transform] ease-in-out before:absolute before:top-1/2 before:left-0 before:h-1 before:w-[var(--seek-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-background-color-3 before:transition-[width,height,transform] before:ease-in-out before:content-[''] group-hover:-translate-y-3 group-hover:scale-x-95 group-hover:before:h-3"
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
          onWheel={(e) => {
            isMouseScrollRef.current = true;

            const max = parseInt(e.currentTarget.max);
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
        />
      </div>
    </div>
  );
}
