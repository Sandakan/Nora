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
import React from 'react';
import { calculateTime } from '../../../main/calculateTime';
import DefaultSongCover from '../../../../assets/images/song_cover_default.png';

interface SongControlsContainerProp {
  isStartPlay: boolean;
  currentSongData: AudioData;
  userData?: UserData;
  playSong: (songId: string, startPlay: boolean) => void;
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
  currentlyActivePage: { pageTitle: string; data?: any };
  // queue: Queue;
  // changeQueueCurrentSongIndex: (songIndex: number) => void;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems: any[],
    pageX: number,
    pageY: number
  ) => void;
}

const music = new Audio();

export default (props: SongControlsContainerProp) => {
  const [songSlidervalue, setSongSliderValue] = React.useState(0);
  const [volumeSlidervalue, setVolumeSlidervalue] = React.useState(
    // props.userData ? props.userData?.volume.value / 100 : 50`1
    50
  );
  const [isLiked, setIsLiked] = React.useState(
    props.currentSongData ? props.currentSongData.isAFavorite : false
  );
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isShuffling, setIsShuffling] = React.useState(false);
  const [isRepeating, setIsRepeating] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);

  React.useEffect(() => {
    music.muted = isMuted;
  }, [isMuted]);
  React.useEffect(() => {
    music.volume = volumeSlidervalue / 100;
  }, [volumeSlidervalue]);

  const seekBarCssProperties: any = {};
  const volumeBarCssProperties: any = {};
  seekBarCssProperties['--seek-before-width'] = `${
    (songSlidervalue / music.duration) * 100
  }%`;
  volumeBarCssProperties['--volume-before-width'] = `${volumeSlidervalue}%`;

  React.useEffect(() => {
    if (props.currentSongData.path)
      music.src = `otoMusic://localFiles/${props.currentSongData.path}`;
    const playCurrentSong = () => {
      if (props.isStartPlay) music.play();
    };
    music.addEventListener('canplay', playCurrentSong);
    // ? MEDIA SESSION EVENTS
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: props.currentSongData.title,
        artist: Array.isArray(props.currentSongData.artists)
          ? props.currentSongData.artists.join(', ')
          : props.currentSongData.artists,
        album: props.currentSongData.album || 'Unknown Album',
        artwork: [
          {
            src: `data:;base64,${props.currentSongData.artwork}`,
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
  }, [props.currentSongData.path]);

  React.useEffect(() => {
    if (props.userData?.volume)
      showRangeProgress('volume', props.userData?.volume.value || 50, 100);
    if (
      props.userData?.currentSong &&
      props.userData.currentSong.stoppedPosition
    )
      showRangeProgress(
        'audio',
        props.userData?.currentSong.stoppedPosition || 0,
        music.duration || 0
      );
  }, [props.userData]);

  React.useEffect(() => {
    music.addEventListener('pause', () => {
      setIsPlaying(false);
      document.title = `Oto Music For Desktop`;
      window.api.saveUserData(
        'currentSong.stoppedPosition',
        music.currentTime.toString()
      );
    });

    music.addEventListener('play', () => {
      setIsPlaying(true);
    });

    music.addEventListener('timeupdate', (e) => {
      setSongSliderValue(
        Math.floor((e.target as HTMLAudioElement).currentTime)
      );
    });

    document.addEventListener('keypress', manageSpaceKeyPlayback);
  }, []);

  const handleSongEnd = () => {
    if (isRepeating) {
      music.currentTime = 0;
      music.play();
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      handleSkipForwardClick();
    }
  };

  const addSongTitleToTitleBar = () => {
    if (props.currentSongData.title && props.currentSongData.artists)
      document.title = `${props.currentSongData.title} - ${
        Array.isArray(props.currentSongData.artists)
          ? props.currentSongData.artists.join(', ')
          : props.currentSongData.artists
      }`;
  };
  React.useEffect(() => {
    setIsLiked(props.currentSongData.isAFavorite);
    music.addEventListener('ended', handleSongEnd);
    music.addEventListener('play', addSongTitleToTitleBar);
    return () => {
      music.removeEventListener('ended', handleSongEnd);
      music.removeEventListener('play', addSongTitleToTitleBar);
    };
  }, [props.currentSongData, isRepeating]);

  const handleSongPlayback = () => {
    if (music.paused) {
      music.play();
    } else music.pause();
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
      setSongSliderValue(divisor && divider ? (divider / divisor) * 100 : 0);
    if (sliderType === 'volume')
      setVolumeSlidervalue((divider / divisor) * 100);
  };

  const toggleSongLike = () => {
    window.api
      .toggleLikeSong(props.currentSongData.songId, !isLiked)
      .then((res) => {
        if (res && !res.error) setIsLiked((prevData) => !prevData);
        else console.log(res?.error);
      });
  };

  const handleSkipBackwardClick = () => {
    music.currentTime = 0;
    // const { queue, currentSongIndex } = props.queue;
    // if (music.currentTime > 5) music.currentTime = 0;
    // else {
    //   if (typeof currentSongIndex === 'number') {
    //     if (currentSongIndex === 0)
    //       props.changeQueueCurrentSongIndex(queue.length - 1);
    //     else props.changeQueueCurrentSongIndex(currentSongIndex - 1);
    //   } else props.changeQueueCurrentSongIndex(0);
    // }
  };

  const handleSkipForwardClick = () => {
    // const { queue, currentSongIndex } = props.queue;
    // console.log('isRepeating ', isRepeating);
    // if (isRepeating) {
    //   music.currentTime = 0;
    //   handleSongPlayback();
    // } else {
    //   if (typeof currentSongIndex === 'number') {
    //     if (queue.length - 1 === currentSongIndex)
    //       props.changeQueueCurrentSongIndex(0);
    //     else props.changeQueueCurrentSongIndex(currentSongIndex + 1);
    //   } else props.changeQueueCurrentSongIndex(0);
    // const songId =
    //   props.queue.queue[props.queue.currentSongIndex || 0];
    // props.playSong(songId, true);
    // }
  };

  return (
    <footer className="song-controls-container">
      <div className="current-playing-song-info-container">
        <div className="song-cover-container" id="currentSongCover">
          <img
            src={
              props.currentSongData.artworkPath
                ? `otomusic://localFiles/${props.currentSongData.artworkPath}`
                : DefaultSongCover
            }
            alt="Default song cover"
          />
        </div>
        <div className="song-info-container">
          <div
            className="song-title"
            id="currentSongTitle"
            title={
              props.currentSongData.title ? props.currentSongData.title : ''
            }
            onClick={() =>
              props.currentlyActivePage.pageTitle === 'SongInfo'
                ? props.changeCurrentActivePage('Home')
                : props.changeCurrentActivePage('SongInfo')
            }
          >
            {props.currentSongData.title ? props.currentSongData.title : ''}
          </div>
          <div className="song-artists" id="currentSongArtists">
            {props.currentSongData.artists ? (
              Array.isArray(props.currentSongData.artists) ? (
                props.currentSongData.artists.length > 0 &&
                props.currentSongData.artists[0] !== '' ? (
                  props.currentSongData.artists.map((artist, index) => (
                    // !THIS REACT FRAGMENT GENERATES A KEY PROP ERROR IN CONSOLE
                    <>
                      <span
                        className="artist"
                        key={index}
                        title={artist}
                        onClick={() =>
                          props.currentlyActivePage.pageTitle ===
                            'ArtistInfo' &&
                          props.currentlyActivePage.data.artistName === artist
                            ? props.changeCurrentActivePage('Home')
                            : props.changeCurrentActivePage('ArtistInfo', {
                                artistName: artist,
                              })
                        }
                      >
                        {artist}
                      </span>
                      {props.currentSongData.artists.length === 0 ||
                      props.currentSongData.artists.length - 1 === index
                        ? ''
                        : ', '}
                    </>
                  ))
                ) : (
                  'Unknown Artist'
                )
              ) : (
                <span className="artist" title={props.currentSongData.artists}>
                  {props.currentSongData.artists}
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
              className={`material-icons-round icon ${isLiked && 'liked'}`}
              onClick={toggleSongLike}
            >
              {isLiked ? 'favorite' : 'favorite_border'}
            </span>
          </div>
          <div className={`repeat-btn ${isRepeating && 'active'}`}>
            <span
              title="Repeat"
              className="material-icons-round icon"
              onClick={() => setIsRepeating((prevState) => !prevState)}
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
              props.currentlyActivePage.pageTitle === 'Lyrics' && 'active'
            }`}
          >
            <span
              title="Lyrics"
              className="material-icons-round icon"
              onClick={() =>
                props.currentlyActivePage.pageTitle === 'Lyrics'
                  ? props.changeCurrentActivePage('Home')
                  : props.changeCurrentActivePage('Lyrics')
              }
            >
              notes
            </span>
          </div>
          <div className={`shuffle-btn ${isShuffling && 'active'}`}>
            <span
              title="Shuffle"
              className="material-icons-round icon"
              onClick={() => setIsShuffling((prevState) => !prevState)}
            >
              shuffle
            </span>
          </div>
        </div>
        <div className="seekbar-and-song-durations-container">
          <div className="current-song-duration">
            {calculateTime(songSlidervalue)}
          </div>
          <div className="seek-bar">
            <input
              type="range"
              name="seek-bar-slider"
              id="seek-bar-slider"
              className="seek-bar-slider"
              min="0"
              max={music.duration || 0}
              value={songSlidervalue || 0}
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
            props.currentlyActivePage.pageTitle === 'CurrentQueue' && 'active'
          }`}
        >
          <span
            title="Current Queue"
            className="material-icons-round icon"
            onClick={() =>
              props.currentlyActivePage.pageTitle === 'CurrentQueue'
                ? props.changeCurrentActivePage('Home')
                : props.changeCurrentActivePage('CurrentQueue')
            }
          >
            queue
          </span>
        </div>
        <div className="mini-player-btn">
          <span className="material-icons-round icon">tab</span>
        </div>
        <div className="volume-controller-container">
          <div className="volume-btn">
            <span
              title="Change Volume"
              className="material-icons-round icon"
              onClick={() => setIsMuted((prevState) => !prevState)}
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
              value={volumeSlidervalue}
              onChange={(e) => {
                const vol = Number(e.target.value);
                showRangeProgress('volume', vol, 100);
                window.api.saveUserData('volume.value', `${vol}`);
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
