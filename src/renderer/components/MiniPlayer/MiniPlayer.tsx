/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import { AppContext, SongPositionContext } from 'renderer/contexts/AppContext';

export default function MiniPlayer() {
  const {
    isMiniPlayer,
    updateMiniPlayerStatus,
    currentSongData,
    toggleSongPlayback,
    isCurrentSongPlaying,
    handleSkipBackwardClick,
    handleSkipForwardClick,
    isPlaying,
    userData,
  } = React.useContext(AppContext);
  const { songPosition } = React.useContext(SongPositionContext);

  const seekBarCssProperties: any = {};
  seekBarCssProperties['--seek-before-width'] = `${
    (songPosition / currentSongData.duration) * 100
  }%`;

  return (
    <div
      className={`mini-player ${!isCurrentSongPlaying && 'paused'} ${
        userData && userData.preferences.isReducedMotion ? 'reduced-motion' : ''
      }`}
    >
      <div className="background-cover-img-container">
        <img
          src={`otomusic://localFiles/${currentSongData.artworkPath}`}
          alt="Song Cover"
        />
      </div>
      <div className="container">
        <div className="title-bar">
          <div className="special-controls-container">
            <span className="change-theme-btn">
              <i
                className="material-icons-round"
                onClick={() => updateMiniPlayerStatus(!isMiniPlayer)}
              >
                launch
              </i>
            </span>
          </div>
          <div className="window-controls-container">
            <span
              className="minimize-btn"
              onClick={() => window.api.minimizeApp()}
            >
              <span className="material-icons-round">minimize</span>
            </span>
            <span className="close-btn" onClick={() => window.api.closeApp()}>
              <span className="material-icons-round">close</span>{' '}
            </span>
          </div>
        </div>
        <div className="song-controls-container">
          <button
            type="button"
            className="skip-backward-btn"
            onClick={handleSkipBackwardClick}
          >
            <span className="material-icons-round icon">skip_previous</span>
          </button>
          <button
            type="button"
            className="play-pause-btn"
            onClick={toggleSongPlayback}
          >
            <span className="material-icons-round icon">
              {isPlaying ? 'pause_circle' : 'play_circle'}
            </span>
          </button>
          <button
            type="button"
            className="skip-forward-btn"
            onClick={handleSkipForwardClick}
          >
            <span className="material-icons-round icon">skip_next</span>
          </button>
        </div>
        <div className="song-info-container">
          <div className="song-title" title={currentSongData.title}>
            {currentSongData.title}
          </div>
          <div
            className="song-artists"
            title={currentSongData.artists
              ?.map((artist) => artist.name)
              .join(', ')}
          >
            {currentSongData.artists
              ? currentSongData.artists.map((artist) => artist.name).join(',')
              : 'Unknown Artist'}
          </div>
        </div>
        <input
          type="range"
          name="seek-slider"
          id="seekSlider"
          className="seek-slider"
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
