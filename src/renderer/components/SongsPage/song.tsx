/* eslint-disable react/require-default-props */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable no-console */
/* eslint-disable no-else-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/self-closing-comp */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { calculateTime } from '../../utils/calculateTime';
import DeleteSongFromSystemConfrimPrompt from './DeleteSongFromSystemConfrimPrompt';

interface SongProp {
  songId: string;
  artworkPath?: string;
  title: string;
  artists: string[];
  duration: number;
  path: string;
}

export const Song = (props: SongProp) => {
  const {
    playSong,
    currentSongData,
    updateContextMenuData,
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
      else return false;
    });
  }, [currentSongData, isCurrentSongPlaying, props.songId]);

  const handlePlayBtnClick = () => {
    playSong(props.songId);
  };

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
              },
            },
            {
              label: 'Add to queue',
              iconName: 'queue',
              handlerFunction: () => {
                updateQueueData(
                  undefined,
                  [...queue.queue, currentSongData.songId],
                  false
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
              iconName: 'remove_circle_outline',
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
                  <DeleteSongFromSystemConfrimPrompt
                    songPath={props.path}
                    title={props.title}
                  />
                ),
            },
          ],
          e.pageX,
          e.pageY
        );
      }}
    >
      <div className="song-cover-and-play-btn-container">
        <div className="play-btn-container">
          <span
            className="material-icons-round icon"
            onClick={handlePlayBtnClick}
            style={isSongPlaying ? { color: `hsla(0,0%,100%,1)` } : {}}
          >
            {isSongPlaying ? 'pause_circle' : 'play_circle'}
          </span>
        </div>
        <div className="song-cover-container">
          <img
            src={`otoMusic://localFiles/${props.artworkPath?.replace(
              '.webp',
              '-optimized.webp'
            )}`}
            loading="lazy"
            alt="Song cover"
          />
        </div>
      </div>
      <div className="song-info-container">
        <div className="song-title" title={props.title}>
          {props.title}
        </div>
        <div className="song-artists">
          {props.artists.length > 0 && props.artists[0] !== ''
            ? props.artists.map((artist, index) => (
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
                  {index === props.artists.length - 1 ? '' : ', '}
                </span>
              ))
            : 'Unknown Artist'}
        </div>
        <div className="song-duration">
          {props.duration ? calculateTime(props.duration) : `-- : --`}
        </div>
      </div>
    </div>
  );
};
