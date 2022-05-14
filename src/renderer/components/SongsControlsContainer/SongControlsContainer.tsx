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
import { AppContext } from 'renderer/contexts/AppContext';
import { calculateTime } from '../../../main/calculateTime';
import DefaultSongCover from '../../../../assets/images/song_cover_default.png';

const music = new Audio();

interface SongControlsContainerReducer {
  currentSongPosition: number;
  volume: number;
  isAFavorite: boolean;
  isShuffling: boolean;
  isRepeating: boolean;
  isMuted: boolean;
  isPlaying: boolean;
}

type SongControlsContainerReducerActionTypes =
  | 'VOLUME_CHANGE'
  | 'SONG_POSITION_CHANGE'
  | 'FAVORITE_STATE_CHANGE'
  | 'SHUFFLE_sTATE_CHANGE'
  | 'REPEAT_STATE_CHANGE'
  | 'MUTE_STATE_CHANGE'
  | 'MUSIC_PLAYBACK_STATE';

const reducer = (
  state: SongControlsContainerReducer,
  action: { type: SongControlsContainerReducerActionTypes; data?: any }
): SongControlsContainerReducer => {
  switch (action.type) {
    case 'SONG_POSITION_CHANGE':
      return { ...state, currentSongPosition: Math.floor(Number(action.data)) };
    case 'VOLUME_CHANGE':
      return { ...state, volume: Math.floor(Number(action.data)) };
    case 'MUSIC_PLAYBACK_STATE':
      return {
        ...state,
        isPlaying: action.data !== undefined ? action.data : !state.isPlaying,
      };
    case 'FAVORITE_STATE_CHANGE':
      return {
        ...state,
        isAFavorite:
          action.data !== undefined ? action.data : !state.isAFavorite,
      };
    case 'MUTE_STATE_CHANGE':
      return {
        ...state,
        isMuted: action.data !== undefined ? action.data : !state.isMuted,
      };
    case 'REPEAT_STATE_CHANGE':
      return {
        ...state,
        isRepeating:
          action.data !== undefined ? action.data : !state.isRepeating,
      };
    case 'SHUFFLE_sTATE_CHANGE':
      return {
        ...state,
        isShuffling:
          action.data !== undefined ? action.data : !state.isShuffling,
      };
    default:
      return state;
  }
};

export default () => {
  const {
    isStartPlay,
    currentSongData,
    userData,
    changeCurrentActivePage,
    currentlyActivePage,
    queue,
    changeQueueCurrentSongIndex,
    updateQueueData,
    isCurrentSongPlaying,
    updateCurrentSongPlaybackState,
    updateMiniPlayerStatus,
    isMiniPlayer,
  } = useContext(AppContext);

  const [content, dispatch] = React.useReducer(reducer, {
    currentSongPosition: 0,
    volume: 50,
    isAFavorite: currentSongData ? currentSongData.isAFavorite : false,
    isShuffling: false,
    isRepeating: false,
    isMuted: false,
    isPlaying: false,
  });

  React.useEffect(() => {
    music.muted = content.isMuted;
  }, [content.isMuted]);
  React.useEffect(() => {
    music.volume = content.volume / 100;
  }, [content.volume]);
  React.useEffect(() => {
    isCurrentSongPlaying !== content.isPlaying &&
      updateCurrentSongPlaybackState(content.isPlaying);
  }, [content.isPlaying]);

  const seekBarCssProperties: any = {};
  const volumeBarCssProperties: any = {};
  seekBarCssProperties['--seek-before-width'] = `${
    (content.currentSongPosition / music.duration) * 100
  }%`;
  volumeBarCssProperties['--volume-before-width'] = `${content.volume}%`;

  React.useEffect(() => {
    if (currentSongData.path)
      music.src = `otoMusic://localFiles/${currentSongData.path}`;
    const playCurrentSong = () => {
      if (isStartPlay) music.play();
    };
    music.addEventListener('canplay', playCurrentSong);
    // ? MEDIA SESSION EVENTS
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSongData.title,
        artist: Array.isArray(currentSongData.artists)
          ? currentSongData.artists.join(', ')
          : currentSongData.artists,
        album: currentSongData.album || 'Unknown Album',
        artwork: [
          {
            src: `data:;base64,${currentSongData.artwork}`,
            sizes: '300x300',
            type: 'image/png',
          },
        ],
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        music.pause();
      });
      navigator.mediaSession.setActionHandler('play', () => {
        music.play();
      });
      navigator.mediaSession.setActionHandler(
        'previoustrack',
        handleSkipBackwardClick
      );
      navigator.mediaSession.setActionHandler(
        `nexttrack`,
        handleSkipForwardClick
      );
    }
    return () => music.removeEventListener('canplay', playCurrentSong);
  }, [currentSongData.path]);

  React.useEffect(() => {
    if (userData?.volume)
      showRangeProgress('volume', userData?.volume.value || 50, 100);
    if (userData?.currentSong && userData.currentSong.stoppedPosition)
      showRangeProgress(
        'audio',
        userData?.currentSong.stoppedPosition || 0,
        music.duration || 0
      );
  }, [userData]);

  React.useEffect(() => {
    music.addEventListener('pause', () => {
      dispatch({ type: 'MUSIC_PLAYBACK_STATE', data: false });
      document.title = `Oto Music For Desktop`;
      window.api.saveUserData(
        'currentSong.stoppedPosition',
        music.currentTime.toString()
      );
    });

    music.addEventListener('play', () => {
      dispatch({ type: 'MUSIC_PLAYBACK_STATE', data: true });
    });

    music.addEventListener('timeupdate', (e) => {
      dispatch({
        type: 'SONG_POSITION_CHANGE',
        data: Math.floor((e.target as HTMLAudioElement).currentTime),
      });
    });

    document.addEventListener('keypress', manageSpaceKeyPlayback);
    return () => {
      document.removeEventListener('keypress', manageSpaceKeyPlayback);
    };
  }, []);

  const handleSongEnd = () => {
    if (content.isRepeating) {
      music.currentTime = 0;
      music.play();
      dispatch({ type: 'MUSIC_PLAYBACK_STATE', data: true });
    } else {
      dispatch({ type: 'MUSIC_PLAYBACK_STATE', data: false });
      handleSkipForwardClick();
    }
  };

  const addSongTitleToTitleBar = () => {
    if (currentSongData.title && currentSongData.artists)
      document.title = `${currentSongData.title} - ${
        Array.isArray(currentSongData.artists)
          ? currentSongData.artists.join(', ')
          : currentSongData.artists
      }`;
  };
  React.useEffect(() => {
    dispatch({
      type: 'FAVORITE_STATE_CHANGE',
      data: currentSongData.isAFavorite,
    });
    music.addEventListener('ended', handleSongEnd);
    music.addEventListener('play', addSongTitleToTitleBar);
    return () => {
      music.removeEventListener('ended', handleSongEnd);
      music.removeEventListener('play', addSongTitleToTitleBar);
    };
  }, [currentSongData, content.isRepeating]);

  const handleSongPlayback = () => {
    if (music.readyState > 0) {
      if (music.paused) {
        music.play();
      } else music.pause();
    }
  };

  const manageSpaceKeyPlayback = (e: KeyboardEvent) => {
    e.preventDefault();
    if (e.code === 'Space') handleSongPlayback();
  };

  const showRangeProgress = (
    sliderType: 'audio' | 'volume',
    divider: number,
    divisor: number
  ) => {
    if (sliderType === 'audio')
      dispatch({
        type: 'SONG_POSITION_CHANGE',
        data: divisor && divider ? (divider / divisor) * 100 : 0,
      });
    if (sliderType === 'volume')
      dispatch({
        type: 'VOLUME_CHANGE',
        data: (divider / divisor) * 100,
      });
  };

  const toggleSongLike = () => {
    window.api
      .toggleLikeSong(currentSongData.songId, !content.isAFavorite)
      .then((res) => {
        if (res && !res.error) dispatch({ type: 'FAVORITE_STATE_CHANGE' });
        else console.log(res?.error);
      });
  };

  const handleSkipBackwardClick = () => {
    // music.currentTime = 0;
    const { currentSongIndex } = queue;
    if (music.currentTime > 5) music.currentTime = 0;
    else {
      if (typeof currentSongIndex === 'number') {
        if (currentSongIndex === 0)
          changeQueueCurrentSongIndex(queue.queue.length - 1);
        else changeQueueCurrentSongIndex(currentSongIndex - 1);
      } else changeQueueCurrentSongIndex(0);
    }
  };

  const handleSkipForwardClick = () => {
    const { currentSongIndex } = queue;
    console.log('isRepeating ', content.isRepeating);
    if (content.isRepeating) {
      music.currentTime = 0;
      handleSongPlayback();
    } else {
      if (typeof currentSongIndex === 'number') {
        if (queue.queue.length - 1 === currentSongIndex)
          changeQueueCurrentSongIndex(0);
        else changeQueueCurrentSongIndex(currentSongIndex + 1);
      } else changeQueueCurrentSongIndex(0);
    }
  };

  const handleQueueShuffle = () => {
    updateQueueData(
      undefined,
      queue.queue.sort(() => 0.5 - Math.random())
    );
    dispatch({
      type: 'SHUFFLE_sTATE_CHANGE',
      data: !content.isShuffling,
    });
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
                    <>
                      <span
                        className="artist"
                        key={index}
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
                    </>
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
                content.isAFavorite && 'liked'
              }`}
              onClick={toggleSongLike}
            >
              {content.isAFavorite ? 'favorite' : 'favorite_border'}
            </span>
          </div>
          <div className={`repeat-btn ${content.isRepeating && 'active'}`}>
            <span
              title="Repeat"
              className="material-icons-round icon"
              onClick={() =>
                dispatch({
                  type: 'REPEAT_STATE_CHANGE',
                  data: !content.isRepeating,
                })
              }
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
              onClick={handleSongPlayback}
            >
              {content.isPlaying ? 'pause_circle' : 'play_circle'}
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
          <div className={`shuffle-btn ${content.isShuffling && 'active'}`}>
            <span
              title="Shuffle"
              className="material-icons-round icon"
              onClick={() => handleQueueShuffle()}
            >
              shuffle
            </span>
          </div>
        </div>
        <div className="seekbar-and-song-durations-container">
          <div className="current-song-duration">
            {!Number.isNaN(content.currentSongPosition)
              ? calculateTime(content.currentSongPosition)
              : '--:--'}
          </div>
          <div className="seek-bar">
            <input
              type="range"
              name="seek-bar-slider"
              id="seek-bar-slider"
              className="seek-bar-slider"
              min="0"
              max={music.duration || 0}
              value={content.currentSongPosition || 0}
              onChange={(e) => {
                music.currentTime = Number(e.target.value);
                showRangeProgress(
                  'audio',
                  Number(e.target.value),
                  music.duration
                );
              }}
              style={seekBarCssProperties}
            />
          </div>
          <div className="full-song-duration">
            {music.duration ? calculateTime(music.duration) : '-:-'}
          </div>
        </div>
      </div>
      <div className="other-controls-container">
        <div className="other-settings-btn">
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
              onClick={() =>
                dispatch({
                  type: 'MUTE_STATE_CHANGE',
                  data: !content.isMuted,
                })
              }
            >
              {content.isMuted ? 'volume_off' : 'volume_up'}
            </span>
          </div>
          <div className="volume-slider-container">
            <input
              type="range"
              id="volumeSlider"
              min="0"
              max="100"
              value={content.volume}
              onChange={(e) => {
                const vol = Number(e.target.value);
                window.api
                  .saveUserData('volume.value', `${vol}`)
                  .then(() => showRangeProgress('volume', vol, 100));
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
