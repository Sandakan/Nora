/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';

interface AlbumProp extends Album {
  // eslint-disable-next-line react/no-unused-prop-types
  index: number;
}

export const Album = (props: AlbumProp) => {
  const { currentlyActivePage, queue } = React.useContext(AppContext);

  const {
    changeCurrentActivePage,
    createQueue,
    updateContextMenuData,
    updateQueueData,
    addNewNotifications,
  } = React.useContext(AppUpdateContext);

  const playAlbum = React.useCallback(
    (isShuffle = false) => {
      createQueue(
        props.songs.map((song) => song.songId),
        'album',
        isShuffle,
        props.albumId,
        true
      );
    },
    [createQueue, props.albumId, props.songs]
  );

  const showAlbumInfoPage = () =>
    currentlyActivePage.pageTitle === 'AlbumInfo' &&
    currentlyActivePage.data.artistName === props.albumId
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('AlbumInfo', {
          albumId: props.albumId,
        });

  return (
    <div
      // style={{ animationDelay: `${50 * (props.index + 1)}ms` }}
      className="album appear-from-bottom group h-60 overflow-hidden w-40 flex flex-col justify-between mr-14 mb-10"
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
                queue.queue.push(...props.songs.map((song) => song.songId));
                updateQueueData(undefined, queue.queue);
                addNewNotifications([
                  {
                    id: 'newSongsToQueue',
                    delay: 5000,
                    content: (
                      <span>
                        Added {props.songs.length} song
                        {props.songs.length === 1 ? '' : 's'} to the queue.
                      </span>
                    ),
                  },
                ]);
              },
            },
            {
              label: 'Shuffle and Play',
              iconName: 'shuffle',
              handlerFunction: () => playAlbum(true),
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
        className="album-cover-and-play-btn-container relative h-[70%] overflow-hidden cursor-pointer"
        onClick={showAlbumInfoPage}
      >
        <span
          className="material-icons-round icon text-5xl text-font-color-white text-opacity-0 absolute bottom-[5%] right-[5%] cursor-pointer group-hover:text-opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            playAlbum();
          }}
        >
          play_circle
        </span>
        <div className="album-cover-container h-full overflow-hidden rounded-lg">
          <img
            src={`otomusic://localFiles/${props.artworkPath}`}
            loading="lazy"
            alt="Album Cover"
            className="max-h-full h-full w-full object-center object-cover"
          />
        </div>
      </div>
      <div className="album-info-container h-fit w-full pl-2 text-font-color-black dark:text-font-color-white mt-2">
        <div
          className="album-title w-full overflow-hidden text-ellipsis whitespace-nowrap pointer text-xl hover:underline"
          title={props.title}
          onClick={showAlbumInfoPage}
        >
          {props.title}
        </div>
        {props.artists && (
          <div
            className="album-artists w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm hover:underline"
            title={props.artists.map((artist) => artist.name).join(', ')}
          >
            {props.artists.map((artist, index) => {
              return (
                <span
                  className="artist w-fit h-[unset] inline m-0 cursor-pointer"
                  key={index}
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
                    ? props.artists.length === 0 ||
                      props.artists.length - 1 === index
                      ? ''
                      : ', '
                    : ''}
                </span>
              );
            })}
          </div>
        )}
        <div className="album-no-of-songs w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs">{`${
          props.songs.length
        } song${props.songs.length === 1 ? '' : 's'}`}</div>
      </div>
    </div>
  );
};
