/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';
import debounce from 'renderer/utils/debounce';
import DefaultSongCover from '../../../../assets/images/webp/song_cover_default.webp';
import Button from '../Button';
import Img from '../Img';
import LyricLine from '../LyricsPage/LyricLine';

type MiniPlayerProps = {
  className?: string;
};

export default function MiniPlayer(props: MiniPlayerProps) {
  const {
    isMiniPlayer,
    currentSongData,
    isCurrentSongPlaying,
    userData,
    isMuted,
    volume,
    localStorageData,
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

  const { className } = props;

  const { songPosition } = React.useContext(SongPositionContext);
  const [songPos, setSongPos] = React.useState(0);
  const isMouseDownRef = React.useRef(false);
  const isMouseScrollRef = React.useRef(false);
  const seekbarRef = React.useRef(null as HTMLInputElement | null);

  const [isLyricsVisible, setIsLyricsVisible] = React.useState(false);
  const [lyrics, setLyrics] = React.useState<SongLyrics | null | undefined>(
    null,
  );

  const volumeSliderRef = React.useRef<HTMLInputElement>(null);

  const volumeBarCssProperties: any = {};
  volumeBarCssProperties['--volume-before-width'] = `${volume}%`;

  React.useEffect(() => {
    if (isLyricsVisible) {
      setLyrics(null);
      window.api.lyrics
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
    [isMiniPlayer, updateMiniPlayerStatus],
  );

  React.useEffect(() => {
    window.addEventListener('keydown', manageKeyboardShortcuts);
    return () => {
      window.removeEventListener('keydown', manageKeyboardShortcuts);
    };
  }, [manageKeyboardShortcuts]);

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
    const seekBar = seekbarRef?.current;
    if (seekBar) {
      const handleSeekbarMouseDown = () => {
        isMouseDownRef.current = true;
      };
      const handleSeekbarMouseUp = () => {
        isMouseDownRef.current = false;
        updateSongPosition(seekBar?.valueAsNumber ?? 0);
      };
      seekBar.addEventListener('mousedown', () => handleSeekbarMouseDown());
      seekBar.addEventListener('mouseup', () => handleSeekbarMouseUp());
      return () => {
        seekBar?.removeEventListener('mouseup', handleSeekbarMouseUp);
        seekBar?.removeEventListener('mousedown', handleSeekbarMouseDown);
      };
    }
    return undefined;
  }, [updateSongPosition]);

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
    [handleSkipForwardClick],
  );

  const toggleAlwaysOnTop = React.useCallback(() => {
    if (userData) {
      const state = !userData?.preferences.isMiniPlayerAlwaysOnTop;
      return window.api.miniPlayer.toggleMiniPlayerAlwaysOnTop(state).then(() =>
        updateUserData((prevUserData) => {
          if (prevUserData?.preferences)
            prevUserData.preferences.isMiniPlayerAlwaysOnTop = state;
          return prevUserData as UserData;
        }),
      );
    }
    return undefined;
  }, [updateUserData, userData]);

  return (
    <div
      className={`mini-player dark group h-full select-none overflow-hidden delay-100 ${
        !isCurrentSongPlaying && 'paused'
      } ${
        localStorageData?.preferences?.isReducedMotion ? 'reduced-motion' : ''
      } [&:focus-within>.container>.song-controls-container>button]:translate-x-0 [&:focus-within>.container>.song-controls-container>button]:scale-100 [&:focus-within>.container>.song-controls-container]:visible [&:focus-within>.container>.song-controls-container]:opacity-100 [&:hover>.container>.song-controls-container>button]:translate-x-0 [&:hover>.container>.song-controls-container>button]:scale-100 [&:hover>.container>.song-controls-container]:visible [&:hover>.container>.song-controls-container]:opacity-100 ${className}`}
    >
      <div className="background-cover-img-container h-full overflow-hidden">
        <Img
          src={currentSongData.artworkPath}
          fallbackSrc={DefaultSongCover}
          loading="eager"
          alt="Song Cover"
          className={`h-full w-full object-cover transition-[filter] delay-100 duration-200 ease-in-out group-focus-within:blur-[2px] group-focus-within:brightness-75 group-hover:blur-[2px] group-hover:brightness-75 group-focus:blur-[4px] group-focus:brightness-75 ${
            isLyricsVisible ? '!blur-[2px] !brightness-[.25]' : ''
          } ${
            !isCurrentSongPlaying
              ? 'blur-[2px] brightness-75'
              : 'blur-0 brightness-100'
          }`}
        />
      </div>
      <div
        className={`mini-player-lyrics-container absolute top-0 flex h-full w-full select-none flex-col items-center overflow-hidden px-2 py-12 transition-[filter] group-focus-within:blur-sm group-focus-within:brightness-50 group-hover:blur-sm group-hover:brightness-50 ${
          !isCurrentSongPlaying ? 'blur-sm brightness-50' : ''
        }`}
        id="miniPlayerLyricsContainer"
      >
        {isLyricsVisible &&
          lyricsComponents.length > 0 &&
          lyrics &&
          lyrics.lyrics.isSynced &&
          lyricsComponents}
        {isLyricsVisible && lyrics && !lyrics.lyrics.isSynced && (
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
          className={`mini-player-title-bar z-10 flex h-[15%] max-h-[2.25rem] w-full select-none justify-end opacity-0 transition-[visibility,opacity] group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${
            !isCurrentSongPlaying ? 'visible opacity-100' : ''
          }`}
        >
          <div
            className={`special-controls-container flex transition-[visibility,opacity] ${
              isLyricsVisible
                ? 'invisible opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100'
                : ''
            } ${!isCurrentSongPlaying ? '!visible !opacity-100' : ''}`}
          >
            <Button
              className="go-to-main-player-btn !mr-0 !mt-1 !rounded-md !border-0 !p-2 text-font-color-white outline-1 outline-offset-1 focus-visible:!outline dark:text-font-color-white"
              tooltipLabel="Go to Main Player (Ctrl + N)"
              iconName="pip_exit"
              iconClassName="material-icons-round-outlined !text-xl"
              clickHandler={() => updateMiniPlayerStatus(!isMiniPlayer)}
              removeFocusOnClick
            />
            <Button
              className={`always-on-top-btn !mr-0 !mt-1 !rounded-md !border-0 !p-2 text-font-color-white outline-1 outline-offset-1 focus-visible:!outline dark:text-font-color-white ${
                userData?.preferences.isMiniPlayerAlwaysOnTop
                  ? 'bg-dark-background-color-2 dark:bg-dark-background-color-2'
                  : ''
              }`}
              iconName={
                userData?.preferences &&
                userData.preferences.isMiniPlayerAlwaysOnTop
                  ? 'move_down'
                  : 'move_up'
              }
              iconClassName="material-icons-round text-xl"
              tooltipLabel={`Always on top : ${
                userData?.preferences.isMiniPlayerAlwaysOnTop ? 'ON' : 'OFF'
              }`}
              removeFocusOnClick
              clickHandler={toggleAlwaysOnTop}
            />
          </div>
          <div className="window-controls-container flex">
            <Button
              className="minimize-btn !m-0 flex h-full items-center justify-center !rounded-none !border-0 !px-2 text-center text-xl outline-1 -outline-offset-2 transition-[background] ease-in-out hover:!bg-[hsla(0deg,0%,80%,0.5)] focus-visible:!outline"
              clickHandler={() => window.api.windowControls.minimizeApp()}
              tooltipLabel="Minimize"
              iconName="minimize"
              iconClassName="material-icons-round icon flex h-fit cursor-pointer items-center justify-center text-center text-xl !font-light transition-[background] ease-in-out"
              removeFocusOnClick
            />
            <Button
              className="close-btn !m-0 flex h-full items-center justify-center !rounded-none !border-0 !px-2 text-center text-xl outline-1 -outline-offset-2 transition-[background] ease-in-out hover:!bg-font-color-crimson hover:!text-font-color-white focus-visible:!outline"
              clickHandler={() => {
                if (userData && userData.preferences.hideWindowOnClose)
                  window.api.windowControls.hideApp();
                else window.api.windowControls.closeApp();
              }}
              tooltipLabel="Close"
              iconName="close"
              iconClassName="material-icons-round icon flex h-fit  cursor-pointer items-center justify-center text-center text-xl !font-light transition-[background] ease-in-out"
              removeFocusOnClick
            />
          </div>
        </div>
        <div
          className={`song-controls-container delay-50 absolute left-1/2 top-[45%] flex h-fit -translate-x-1/2 -translate-y-1/2 items-center justify-center  bg-[transparent] shadow-none transition-[visibility,opacity] dark:bg-[transparent] ${
            !isCurrentSongPlaying
              ? 'visible opacity-100'
              : 'invisible opacity-0'
          }`}
        >
          <Button
            className="favorite-btn !m-0 h-fit -translate-x-4 cursor-pointer !rounded-none !border-0 bg-[transparent] !p-0 text-font-color-white outline-1 outline-offset-1 transition-transform focus-visible:!outline dark:bg-[transparent] dark:text-font-color-white"
            iconClassName={`!text-xl ${
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
            removeFocusOnClick
          />
          <Button
            className="skip-backward-btn !mr-0 ml-4 h-fit -translate-x-4 cursor-pointer !rounded-none !border-0 bg-[transparent] !p-0 text-font-color-white outline-1 outline-offset-1 transition-transform focus-visible:!outline dark:bg-[transparent] dark:text-font-color-white"
            tooltipLabel="Previous Song (Ctrl + Left Arrow)"
            iconClassName="!text-3xl"
            clickHandler={handleSkipBackwardClick}
            iconName="skip_previous"
            removeFocusOnClick
          />
          <Button
            className="play-pause-btn !mx-2 h-fit scale-90 cursor-pointer !rounded-none !border-0 bg-[transparent] !p-0 text-6xl text-font-color-white outline-1 outline-offset-1 transition-transform focus-visible:!outline dark:bg-[transparent] dark:text-font-color-white"
            tooltipLabel="Play/Pause (Space)"
            iconClassName="!text-5xl"
            clickHandler={toggleSongPlayback}
            iconName={isCurrentSongPlaying ? 'pause_circle' : 'play_circle'}
            removeFocusOnClick
          />

          <Button
            className="skip-backward-btn !mr-4 h-fit translate-x-4 cursor-pointer !rounded-none !border-0 bg-[transparent] !p-0 text-font-color-white outline-1 outline-offset-1 transition-transform focus-visible:!outline dark:bg-[transparent] dark:text-font-color-white"
            tooltipLabel="Next Song (Ctrl + Right Arrow)"
            iconClassName="!text-3xl"
            clickHandler={handleSkipForwardClickWithParams}
            iconName="skip_next"
            removeFocusOnClick
          />
          <Button
            className={`lyrics-btn !m-0 h-fit translate-x-4 cursor-pointer !rounded-none !border-0 bg-[transparent] !p-0 text-font-color-white outline-1 outline-offset-1 transition-transform focus-visible:!outline dark:bg-[transparent] dark:text-font-color-white ${
              isLyricsVisible && '!text-dark-background-color-3'
            }`}
            iconClassName="!text-xl"
            clickHandler={() => setIsLyricsVisible((prevState) => !prevState)}
            iconName="notes"
            tooltipLabel="Lyrics (Ctrl + L)"
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
          <div className="relative flex w-full flex-col items-center justify-center transition-[filter,opacity] delay-200 group-focus-within/info:pointer-events-none group-focus-within/info:opacity-50 group-focus-within/info:blur-sm group-focus-within/info:delay-0 group-hover/info:pointer-events-none group-hover/info:opacity-50 group-hover/info:blur-sm">
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
          <div className="pointer-events-none absolute flex items-center opacity-0 transition-opacity delay-200 group-focus-within/info:pointer-events-auto group-focus-within/info:opacity-100 group-focus-within/info:delay-0 group-hover/info:pointer-events-auto group-hover/info:opacity-100">
            <Button
              className={`volume-btn !mr-2 !rounded-none !border-0 !p-0 outline-1 outline-offset-1 after:absolute after:h-1 after:w-1 after:translate-y-4 after:rounded-full after:bg-font-color-highlight after:opacity-0 after:transition-opacity focus-visible:!outline dark:after:bg-dark-font-color-highlight ${
                isMuted && 'after:opacity-100'
              }`}
              tooltipLabel="Mute/Unmute (Ctrl + M)"
              iconName={isMuted ? 'volume_off' : 'volume_up'}
              iconClassName={`material-icons-round text-xl text-font-color-black opacity-60 transition-opacity hover:opacity-80 dark:text-font-color-white ${
                isMuted &&
                '!text-font-color-highlight !opacity-100 dark:!text-dark-font-color-highlight'
              }`}
              clickHandler={() => toggleMutedState(!isMuted)}
              removeFocusOnClick
            />
            <input
              type="range"
              id="volumeSlider"
              className="relative float-left m-0 h-6 w-full appearance-none bg-[transparent] p-0 outline-none outline-1 outline-offset-1 before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--volume-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-font-color-black/50 before:transition-[width,background] before:content-[''] hover:before:bg-font-color-highlight focus-visible:!outline dark:before:bg-font-color-white/50 dark:hover:before:bg-dark-font-color-highlight"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => updateVolume(Number(e.target.value))}
              aria-label="Volume slider"
              style={volumeBarCssProperties}
              title={Math.round(volume).toString()}
              onWheel={(e) => {
                const scrollIncrement =
                  localStorageData.preferences.seekbarScrollInterval;
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
          className="seek-slider absolute bottom-0 float-left m-0 h-fit w-full appearance-none bg-background-color-3/25 p-0 outline-none outline-1 outline-offset-1 backdrop-blur-sm transition-[width,height,transform] ease-in-out before:absolute before:left-0 before:top-1/2 before:h-1 before:w-[var(--seek-before-width)] before:-translate-y-1/2 before:cursor-pointer before:rounded-3xl before:bg-background-color-3 before:transition-[width,height,transform] before:ease-in-out before:content-[''] focus-visible:!outline group-focus-within:-translate-y-3 group-focus-within:scale-x-95 group-focus-within:before:h-3 group-hover:-translate-y-3 group-hover:scale-x-95 group-hover:before:h-3"
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
        />
      </div>
    </div>
  );
}
