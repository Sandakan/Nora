/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/require-default-props */
/* eslint-disable no-underscore-dangle */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

interface SongCardProp {
  songId: string;
  artworkPath: string;
  path: string;
  title: string;
  artists: string[];
  duration: number;
  palette?: {
    DarkVibrant: {
      _rgb?: any;
      rgb?: any;
    };
    LightVibrant: {
      _rgb?: any;
      rgb?: any;
    };
  };
}

export const SongCard = (props: SongCardProp) => {
  const {
    playSong,
    updateContextMenuData,
    currentSongData,
    currentlyActivePage,
    changeCurrentActivePage,
    updateQueueData,
    queue,
    isCurrentSongPlaying,
  } = React.useContext(AppContext);
  const [isSongPlaying, setIsSongPlaying] = React.useState(
    currentSongData
      ? currentSongData.songId === props.songId && isCurrentSongPlaying
      : false
  );
  React.useEffect(() => {
    setIsSongPlaying(() => {
      if (currentSongData)
        return currentSongData.songId === props.songId && isCurrentSongPlaying;
      return false;
    });
  }, [currentSongData, isCurrentSongPlaying, props.songId]);
  // console.log(props);
  const [r, g, b] = props.palette
    ? props.palette.LightVibrant._rgb || props.palette.LightVibrant.rgb
    : [47, 49, 55];
  const [fr, fg, fb] = props.palette
    ? props.palette.DarkVibrant._rgb || props.palette.DarkVibrant.rgb
    : [222, 220, 217];

  const background = `linear-gradient(90deg,rgba(${r},${g},${b},1) 0%,rgba(${r},${g},${b},1) 50%,rgba(${r},${g},${b},0.6) 70%,rgba(${r},${g},${b},0) 100%)`;
  const fontColor = `rgba(${fr},${fg},${fb},1)`;
  return (
    <div
      className={`song ${props.songId} ${isSongPlaying && 'playing'}`}
      data-song-id={props.songId}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(
          true,
          [
            {
              label: 'Play',
              iconName: 'play_arrow',
              handlerFunction: () => playSong(props.songId),
            },
            {
              label: 'Play Next',
              iconName: 'shortcut',
              handlerFunction: () => {
                const newQueue = queue.queue.filter(
                  (songId) => songId !== props.songId
                );
                newQueue.splice(
                  queue.queue.length - 1 !== queue.currentSongIndex
                    ? queue.currentSongIndex
                      ? queue.currentSongIndex + 1
                      : 0
                    : 0,
                  0,
                  props.songId
                );
                updateQueueData(undefined, newQueue);
              },
            },
            {
              label: 'Reveal in File Explorer',
              class: 'reveal-file-explorer',
              iconName: 'folder_open',
              handlerFunction: () =>
                window.api.revealSongInFileExplorer(props.songId),
            },
          ],
          e.pageX,
          e.pageY
        );
      }}
    >
      <div className="song-cover-container">
        <img
          src={`otoMusic://localFiles/${props.artworkPath}`}
          loading="lazy"
          alt=""
        />
      </div>
      <div
        className="song-info-and-play-btn-container"
        data-song-id={props.songId}
        style={{ background }}
      >
        <div className="song-info-container" style={{ color: fontColor }}>
          <div
            className="song-title"
            title={props.title}
            onClick={() =>
              currentlyActivePage.pageTitle === 'SongInfo' &&
              currentlyActivePage.data &&
              currentlyActivePage.data.songInfo &&
              currentlyActivePage.data.songInfo.songId === props.songId
                ? changeCurrentActivePage('Home')
                : changeCurrentActivePage('SongInfo', {
                    songInfo: { songId: props.songId },
                  })
            }
          >
            {props.title}
          </div>
          <div
            className="song-artists"
            title={props.artists.join(', ')}
            data-song-id={props.songId}
          >
            {props.artists.map((artist, index) => (
              <span
                className="artist"
                key={artist}
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
                {index === props.artists.length - 1 ? '' : ', '}
              </span>
            ))}
          </div>
        </div>
        <div className="play-btn-container">
          <span
            className="material-icons-round icon"
            onClick={() => playSong(props.songId)}
          >
            {isSongPlaying ? 'pause_circle' : 'play_circle'}
          </span>
        </div>
      </div>
    </div>
  );
};
