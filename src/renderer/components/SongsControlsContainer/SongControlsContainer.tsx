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
import { AppContext, SongPositionContext } from 'renderer/contexts/AppContext';
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
    isShuffling,
    toggleShuffling,
    isRepeating,
    toggleRepeat,
    handleSkipForwardClick,
    handleSkipBackwardClick,
    isPlaying,
    toggleSongPlayback,
    updateSongPosition,
    updateContextMenuData,
  } = useContext(AppContext);
  const { songPosition } = useContext(SongPositionContext);

  const seekBarCssProperties: any = {};
  const volumeBarCssProperties: any = {};
  seekBarCssProperties['--seek-before-width'] = `${
    (songPosition / currentSongData.duration) * 100
  }%`;
  volumeBarCssProperties['--volume-before-width'] = `${volume}%`;

  const handleQueueShuffle = () => {
    if (!isShuffling)
      updateQueueData(
        undefined,
        queue.queue.sort(() => 0.5 - Math.random())
      );
    toggleShuffling();
  };

  const showArtistInfoPage = (artistName: string, artistId: string) =>
    currentSongData.artists &&
    (currentlyActivePage.pageTitle === 'ArtistInfo' &&
    currentlyActivePage.data.artistName === artistName
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('ArtistInfo', {
          artistName,
          artistId,
        }));

  const showSongInfoPage = () =>
    currentlyActivePage.pageTitle === 'SongInfo' &&
    currentlyActivePage.data &&
    currentlyActivePage.data.songInfo &&
    currentlyActivePage.data.songInfo.songId === currentSongData.songId
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('SongInfo', {
          songInfo: { songId: currentSongData.songId },
        });

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
        <div className="song-info-container">
          <div
            className="song-title"
            id="currentSongTitle"
            title={currentSongData.title ? currentSongData.title : ''}
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
            {currentSongData.title ? currentSongData.title : ''}
          </div>
          <div className="song-artists" id="currentSongArtists">
            {currentSongData.artists ? (
              Array.isArray(currentSongData.artists) ? (
                currentSongData.artists.length > 0 ? (
                  currentSongData.artists.map((artist, index) => (
                    <span key={index}>
                      <span
                        className="artist"
                        key={artist.artistId}
                        title={artist.name}
                        onClick={() =>
                          showArtistInfoPage(artist.name, artist.artistId)
                        }
                        onContextMenu={(e) => {
                          e.stopPropagation();
                          updateContextMenuData(
                            true,
                            [
                              {
                                label: 'Info',
                                iconName: 'info',
                                handlerFunction: () =>
                                  showArtistInfoPage(
                                    artist.name,
                                    artist.artistId
                                  ),
                              },
                            ],
                            e.pageX,
                            e.pageY
                          );
                        }}
                      >
                        {artist.name}
                      </span>
                      {currentSongData.artists &&
                      currentSongData.artists.length - 1 !== index
                        ? ', '
                        : ''}
                    </span>
                  ))
                ) : (
                  'Unknown Artist'
                )
              ) : (
                <span
                  className="artist"
                  title={currentSongData.artists[0]}
                  onClick={() => {
                    if (currentSongData.artists)
                      showArtistInfoPage(
                        currentSongData.artists[0].name,
                        currentSongData.artists[0].artistId
                      );
                  }}
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    updateContextMenuData(
                      true,
                      [
                        {
                          label: 'Info',
                          iconName: 'info',
                          handlerFunction: () => {
                            if (currentSongData.artists)
                              showArtistInfoPage(
                                currentSongData.artists[0].name,
                                currentSongData.artists[0].artistId
                              );
                          },
                        },
                      ],
                      e.pageX,
                      e.pageY
                    );
                  }}
                >
                  {currentSongData.artists[0]}
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
              title="Like (Ctrl + H)"
              className={`material-icons-round icon ${
                currentSongData.isAFavorite && 'liked'
              }`}
              onClick={() => toggleIsFavorite(!currentSongData.isAFavorite)}
            >
              {currentSongData.isAFavorite ? 'favorite' : 'favorite_border'}
            </span>
          </div>
          <div className={`repeat-btn ${isRepeating !== 'false' && 'active'}`}>
            <span
              title="Repeat (Ctrl + T)"
              className="material-icons-round icon"
              onClick={() => toggleRepeat()}
            >
              {isRepeating === 'false' || isRepeating === 'repeat'
                ? 'repeat'
                : 'repeat_one'}
            </span>
          </div>
          <div className="skip-back-btn">
            <span
              title="Previous Song (Ctrl + Left Arrow)"
              className="material-icons-round icon"
              onClick={handleSkipBackwardClick}
            >
              skip_previous
            </span>
          </div>
          <div className="play-pause-btn">
            <span
              title="Play/Pause (Space)"
              className="material-icons-round icon"
              onClick={toggleSongPlayback}
            >
              {isPlaying ? 'pause_circle' : 'play_circle'}
            </span>
          </div>
          <div className="skip-forward-btn">
            <span
              title="Next Song (Ctrl + Right Arrow)"
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
              title="Lyrics (Ctrl + L)"
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
              title="Shuffle (Ctrl + S)"
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
              title={Math.round(songPosition).toString()}
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
            title="Current Queue (Ctrl + Q)"
            className="material-icons-round icon"
            onClick={() =>
              currentlyActivePage.pageTitle === 'CurrentQueue'
                ? changeCurrentActivePage('Home')
                : changeCurrentActivePage('CurrentQueue')
            }
          >
            segment
          </span>
        </div>
        <div className="mini-player-btn">
          <span
            title="Open in Mini player (Ctrl + N)"
            className="material-icons-round icon"
            onClick={() => updateMiniPlayerStatus(!isMiniPlayer)}
          >
            tab_unselected
          </span>
        </div>
        <div className="volume-controller-container">
          <div className="volume-btn">
            <span
              title="Mute/Unmute (Ctrl + M)"
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
                  .saveUserData('volume.value', vol)
                  .then(() => updateVolume(vol));
              }}
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
