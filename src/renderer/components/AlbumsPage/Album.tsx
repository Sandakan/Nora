/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

export const Album = (props: Album) => {
  const {
    currentlyActivePage,
    changeCurrentActivePage,
    createQueue,
    updateContextMenuData,
    queue,
    updateQueueData,
  } = React.useContext(AppContext);

  const playAlbum = () => {
    createQueue(
      props.songs.map((song) => song.songId),
      'album',
      props.albumId,
      true
    );
  };

  const showAlbumInfoPage = () =>
    currentlyActivePage.pageTitle === 'AlbumInfo' &&
    currentlyActivePage.data.artistName === props.albumId
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('AlbumInfo', {
          albumId: props.albumId,
        });

  return (
    <div
      className="album"
      onContextMenu={(e) =>
        updateContextMenuData(
          true,
          [
            {
              label: 'Play',
              iconName: 'play_arrow',
              handlerFunction: playAlbum,
            },
            {
              label: 'Add to queue',
              iconName: 'queue',
              handlerFunction: () => {
                // const newQueue = queue.queue.filter(
                //   (songId) =>
                //     !(props.songs.map((song) => song.songId) || []).some(
                //       (id) => id === songId
                //     )
                // );
                queue.queue.push(...props.songs.map((song) => song.songId));
                updateQueueData(undefined, queue.queue, false);
              },
            },
            {
              label: 'Info',
              iconName: 'info',
              handlerFunction: showAlbumInfoPage,
            },
          ],
          e.pageX,
          e.pageY
        )
      }
    >
      <div
        className="album-cover-and-play-btn-container"
        onClick={showAlbumInfoPage}
      >
        <span
          className="material-icons-round icon"
          onClick={(e) => {
            e.stopPropagation();
            playAlbum();
          }}
        >
          play_circle
        </span>
        <div className="album-cover-container">
          <img
            src={`otomusic://localFiles/${props.artworkPath}`}
            loading="lazy"
            alt="Album Cover"
          />
        </div>
      </div>
      <div className="album-info-container">
        <div
          className="album-title"
          title={props.title}
          onClick={showAlbumInfoPage}
        >
          {props.title}
        </div>
        <div className="album-artists" title={props.artists.join(', ')}>
          {props.artists.map((artist, index) => {
            return (
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
                {props.artists.length === 0 ||
                props.artists.length - 1 === index
                  ? ''
                  : ', '}
              </span>
            );
          })}
        </div>
        <div className="album-no-of-songs">{`${props.songs.length} song${
          props.songs.length === 1 ? '' : 's'
        }`}</div>
      </div>
    </div>
  );
};
