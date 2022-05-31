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
import DeleteSongPrompt from './DeleteSongFromSystemConfrimPrompt';

interface SongCardProp {
  songId: string;
  artworkPath: string;
  path: string;
  title: string;
  artists?: { name: string; artistId: string }[];
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
    updateNotificationPanelData,
    changePromptMenuData,
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

  const handlePlayBtnClick = () => {
    playSong(props.songId);
  };

  return (
    <div
      className={`song song-card ${props.songId} ${
        currentSongData.songId === props.songId && 'current-song'
      } ${isSongPlaying && 'playing'}`}
      data-song-id={props.songId}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(
          true,
          [
            {
              label: 'Play',
              handlerFunction: handlePlayBtnClick,
              iconName: 'play_arrow',
            },
            {
              label: 'Play Next',
              iconName: 'shortcut',
              handlerFunction: () => {
                const newQueue = queue.queue.filter(
                  (songId) => songId !== props.songId
                );
                newQueue.splice(
                  queue.queue.indexOf(currentSongData.songId) + 1 || 0,
                  1,
                  props.songId
                );
                updateQueueData(undefined, newQueue);
                updateNotificationPanelData(
                  5000,
                  <span>&apos;{props.title}&apos; will be played next.</span>,
                  <span className="material-icons-round">shortcut</span>
                );
              },
            },
            {
              label: 'Reveal in File Explorer',
              class: 'reveal-file-explorer',
              iconName: 'folder_open',
              handlerFunction: () =>
                window.api.revealSongInFileExplorer(props.songId),
            },
            {
              label: 'Info',
              class: 'info',
              iconName: 'info_outline',
              handlerFunction: () =>
                changeCurrentActivePage('SongInfo', {
                  songInfo: { songId: props.songId },
                }),
            },
            {
              label: 'Remove from Library',
              iconName: 'block',
              handlerFunction: () =>
                window.api
                  .removeSongFromLibrary(props.path)
                  .then(
                    (res) =>
                      res.success &&
                      updateNotificationPanelData(
                        5000,
                        <span>
                          &apos;{props.title}&apos; song removed from the
                          library.
                        </span>,
                        <span className="material-icons-round">
                          delete_outline
                        </span>
                      )
                  ),
            },
            {
              label: 'Delete from System',
              iconName: 'delete',
              handlerFunction: () =>
                changePromptMenuData(
                  true,
                  <DeleteSongPrompt songPath={props.path} title={props.title} />
                ),
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
          alt="Song cover"
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
            title={props.artists ? props.artists.join(', ') : 'Unknown Artist'}
            data-song-id={props.songId}
          >
            {props.artists ? (
              props.artists.map((artist, index) => (
                <span
                  className="artist"
                  key={artist.artistId}
                  onClick={() =>
                    currentlyActivePage.pageTitle === 'ArtistInfo' &&
                    currentlyActivePage.data.artistName === artist
                      ? changeCurrentActivePage('Home')
                      : changeCurrentActivePage('ArtistInfo', {
                          artistName: artist.name,
                          artistId: artist.artistId,
                        })
                  }
                >
                  {artist.name}
                  {props.artists
                    ? index === props.artists.length - 1
                      ? ''
                      : ', '
                    : ''}
                </span>
              ))
            ) : (
              <span>Unknown Artist</span>
            )}
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
