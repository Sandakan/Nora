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
import { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { calculateTime } from '../../../main/calculateTime';
import DefaultSongCover from '../../../../assets/images/song_cover_default.png';

export default () => {
  const {
    currentSongData,
    changeCurrentActivePage,
    currentlyActivePage,
    queue,
    updateQueueData,
    updateMiniPlayerStatus,
    isMiniPlayer,
    isMuted,
    toggleMutedState,
    toggleIsFavorite,
    volume,
    updateVolume,
    songPosition,
    isShuffling,
    toggleShuffling,
    isRepeating,
    toggleRepeat,
    handleSkipForwardClick,
    handleSkipBackwardClick,
    isPlaying,
    toggleSongPlayback,
    updateSongPosition,
  } = useContext(AppContext);

  const seekBarCssProperties: any = {};
  const volumeBarCssProperties: any = {};
  seekBarCssProperties['--seek-before-width'] = `${
    (songPosition / currentSongData.duration) * 100
  }%`;
  volumeBarCssProperties['--volume-before-width'] = `${volume}%`;

  // React.useEffect(() => {
  //   music.addEventListener('pause', () => {
  //     dispatch({ type: 'MUSIC_PLAYBACK_STATE', data: false });
  //     document.title = `Oto Music For Desktop`;
  //     window.api.saveUserData(
  //       'currentSong.stoppedPosition',
  //       music.currentTime.toString()
  //     );
  //   });

  // const handleSongEnd = () => {
  //   if (content.isRepeating) {
  //     music.currentTime = 0;
  //     music.play();
  //     dispatch({ type: 'MUSIC_PLAYBACK_STATE', data: true });
  //   } else {
  //     dispatch({ type: 'MUSIC_PLAYBACK_STATE', data: false });
  //     handleSkipForwardClick();
  //   }
  // };

  // React.useEffect(() => {
  //   dispatch({
  //     type: 'FAVORITE_STATE_CHANGE',
  //     data: currentSongData.isAFavorite,
  //   });
  //   music.addEventListener('ended', handleSongEnd);
  //   music.addEventListener('play', addSongTitleToTitleBar);
  //   return () => {
  //     music.removeEventListener('ended', handleSongEnd);
  //     music.removeEventListener('play', addSongTitleToTitleBar);
  //   };
  // }, [currentSongData, content.isRepeating]);

  const handleQueueShuffle = () => {
    if (!isShuffling)
      updateQueueData(
        undefined,
        queue.queue.sort(() => 0.5 - Math.random())
      );
    toggleShuffling();
  };

  return (
    <footer className="song-controls-container">
      <div className="current-playing-song-info-container">
        <div className="song-cover-container" id="currentSongCover">
          <img
            src={
              currentSongData.artworkPath
                ? `otomusic://localFiles/${currentSongData.artworkPath}`
                : DefaultSongCover
            }
            alt="Default song cover"
          />
        </div>
        <div className="song-info-container">
          <div
            className="song-title"
            id="currentSongTitle"
            title={currentSongData.title ? currentSongData.title : ''}
            onClick={() =>
              currentlyActivePage.pageTitle === 'SongInfo' &&
              currentlyActivePage.data &&
              currentlyActivePage.data.songInfo &&
              currentlyActivePage.data.songInfo.songId ===
                currentSongData.songId
                ? changeCurrentActivePage('Home')
                : changeCurrentActivePage('SongInfo', {
                    songInfo: { songId: currentSongData.songId },
                  })
            }
          >
            {currentSongData.title ? currentSongData.title : ''}
          </div>
          <div className="song-artists" id="currentSongArtists">
            {currentSongData.artists ? (
              Array.isArray(currentSongData.artists) ? (
                currentSongData.artists.length > 0 &&
                currentSongData.artists[0] !== '' ? (
                  currentSongData.artists.map((artist, index) => (
                    // !THIS REACT FRAGMENT GENERATES A KEY PROP ERROR IN CONSOLE
                    <span key={index}>
                      <span
                        className="artist"
                        key={artist}
                        title={artist}
                        onClick={() =>
                          currentlyActivePage.pageTitle === 'ArtistInfo' &&
                          currentlyActivePage.data.artistName === artist
                            ? changeCurrentActivePage('Home')
                            : changeCurrentActivePage('ArtistInfo', {
                                artistName: artist,
                              })
                        }
                      >
                        {artist}
                      </span>
                      {currentSongData.artists.length === 0 ||
                      currentSongData.artists.length - 1 === index
                        ? ''
                        : ', '}
                    </span>
                  ))
                ) : (
                  'Unknown Artist'
                )
              ) : (
                <span className="artist" title={currentSongData.artists}>
                  {currentSongData.artists}
                </span>
              )
            ) : (
              'Unknown Artist'
            )}
          </div>
        </div>
      </div>
      <div className="song-controls-and-seekbar-container">
        <div className="controls-container">
          <div className="like-btn">
            <span
              title="Like"
              className={`material-icons-round icon ${
                currentSongData.isAFavorite && 'liked'
              }`}
              onClick={() => toggleIsFavorite(!currentSongData.isAFavorite)}
            >
              {currentSongData.isAFavorite ? 'favorite' : 'favorite_border'}
            </span>
          </div>
          <div className={`repeat-btn ${isRepeating && 'active'}`}>
            <span
              title="Repeat"
              className="material-icons-round icon"
              onClick={toggleRepeat}
            >
              repeat
            </span>
          </div>
          <div className="skip-back-btn">
            <span
              title="Previous Song"
              className="material-icons-round icon"
              onClick={handleSkipBackwardClick}
            >
              skip_previous
            </span>
          </div>
          <div className="play-pause-btn">
            <span
              title="Play/Pause"
              className="material-icons-round icon"
              onClick={toggleSongPlayback}
            >
              {isPlaying ? 'pause_circle' : 'play_circle'}
            </span>
          </div>
          <div className="skip-forward-btn">
            <span
              title="Next Song"
              className="material-icons-round icon"
              onClick={handleSkipForwardClick}
            >
              skip_next
            </span>
          </div>
          <div
            className={`lyrics-btn ${
              currentlyActivePage.pageTitle === 'Lyrics' && 'active'
            }`}
          >
            <span
              title="Lyrics"
              className="material-icons-round icon"
              onClick={() =>
                currentlyActivePage.pageTitle === 'Lyrics'
                  ? changeCurrentActivePage('Home')
                  : changeCurrentActivePage('Lyrics')
              }
            >
              notes
            </span>
          </div>
          <div className={`shuffle-btn ${isShuffling && 'active'}`}>
            <span
              title="Shuffle"
              className="material-icons-round icon"
              onClick={handleQueueShuffle}
            >
              shuffle
            </span>
          </div>
        </div>
        <div className="seekbar-and-song-durations-container">
          <div className="current-song-duration">
            {!Number.isNaN(songPosition)
              ? calculateTime(songPosition)
              : '--:--'}
          </div>
          <div className="seek-bar">
            <input
              type="range"
              name="seek-bar-slider"
              id="seek-bar-slider"
              className="seek-bar-slider"
              min="0"
              max={currentSongData.duration || 0}
              value={songPosition || 0}
              onChange={(e) =>
                updateSongPosition(Number(e.currentTarget.value))
              }
              style={seekBarCssProperties}
            />
          </div>
          <div className="full-song-duration">
            {currentSongData.duration
              ? calculateTime(currentSongData.duration)
              : '-:-'}
          </div>
        </div>
      </div>
      <div className="other-controls-container">
        <div className="other-settings-btn" style={{ display: 'none' }}>
          <span title="Other Settings" className="material-icons-round icon">
            more_horiz
          </span>
        </div>
        <div
          className={`queue-btn ${
            currentlyActivePage.pageTitle === 'CurrentQueue' && 'active'
          }`}
        >
          <span
            title="Current Queue"
            className="material-icons-round icon"
            onClick={() =>
              currentlyActivePage.pageTitle === 'CurrentQueue'
                ? changeCurrentActivePage('Home')
                : changeCurrentActivePage('CurrentQueue')
            }
          >
            queue
          </span>
        </div>
        <div className="mini-player-btn">
          <span
            className="material-icons-round icon"
            onClick={() => updateMiniPlayerStatus(!isMiniPlayer)}
          >
            tab
          </span>
        </div>
        <div className="volume-controller-container">
          <div className="volume-btn">
            <span
              title="Change Volume"
              className="material-icons-round icon"
              onClick={() => toggleMutedState()}
            >
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
          </div>
          <div className="volume-slider-container">
            <input
              type="range"
              id="volumeSlider"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                const vol = Number(e.target.value);
                window.api
                  .saveUserData('volume.value', `${vol}`)
                  .then(() => updateVolume(vol));
              }}
              aria-label="Volume slider"
              style={volumeBarCssProperties}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
