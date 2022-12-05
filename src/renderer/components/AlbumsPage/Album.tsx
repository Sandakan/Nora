/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Img from '../Img';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';
import SongArtist from '../SongsPage/SongArtist';
import DefaultAlbumCover from '../../../../assets/images/png/album_cover_default.png';

interface AlbumProp extends Album {
  // eslint-disable-next-line react/no-unused-prop-types
  index: number;
  // eslint-disable-next-line react/require-default-props
  className?: string;
}

export const Album = (props: AlbumProp) => {
  const {
    currentlyActivePage,
    queue,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
  } = React.useContext(AppContext);

  const {
    changeCurrentActivePage,
    createQueue,
    updateContextMenuData,
    updateQueueData,
    addNewNotifications,
    updateMultipleSelections,
    toggleMultipleSelections,
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

  const showAlbumInfoPage = React.useCallback(
    () =>
      currentlyActivePage.pageTitle === 'AlbumInfo' &&
      currentlyActivePage.data &&
      currentlyActivePage.data.albumId === props.albumId
        ? changeCurrentActivePage('Home')
        : changeCurrentActivePage('AlbumInfo', {
            albumId: props.albumId,
          }),
    [
      changeCurrentActivePage,
      currentlyActivePage.data,
      currentlyActivePage.pageTitle,
      props.albumId,
    ]
  );

  const isAMultipleSelection = React.useMemo(() => {
    if (!multipleSelectionsData.isEnabled) return false;
    if (multipleSelectionsData.selectionType !== 'album') return false;
    if (multipleSelectionsData.multipleSelections.length <= 0) return false;
    if (
      multipleSelectionsData.multipleSelections.some(
        (selectionId) => selectionId === props.albumId
      )
    )
      return true;
    return false;
  }, [multipleSelectionsData, props.albumId]);

  const contextMenuItems = React.useMemo(
    () => [
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
      {
        label: isMultipleSelectionEnabled ? 'Unselect' : 'Select',
        iconName: 'checklist',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) {
            return updateMultipleSelections(
              props.albumId,
              'album',
              isAMultipleSelection ? 'remove' : 'add'
            );
          }
          return toggleMultipleSelections(
            !isMultipleSelectionEnabled,
            'album',
            [props.albumId]
          );
        },
      },
    ],
    [
      addNewNotifications,
      isAMultipleSelection,
      isMultipleSelectionEnabled,
      playAlbum,
      props.albumId,
      props.songs,
      queue.queue,
      showAlbumInfoPage,
      toggleMultipleSelections,
      updateMultipleSelections,
      updateQueueData,
    ]
  );

  const contextMenuItemData =
    isMultipleSelectionEnabled &&
    multipleSelectionsData.selectionType === 'album' &&
    isAMultipleSelection
      ? {
          title: `${multipleSelectionsData.multipleSelections.length} selected albums`,
          artworkPath: DefaultAlbumCover,
        }
      : undefined;

  return (
    <div
      // style={{ animationDelay: `${50 * (props.index + 1)}ms` }}
      className={`album appear-from-bottom h-68 group mr-6 mb-2 flex w-48 flex-col justify-between overflow-hidden rounded-md p-4 ${
        props.className ?? ''
      } ${
        isAMultipleSelection
          ? 'bg-background-color-3 text-font-color-black dark:bg-dark-background-color-3 dark:text-font-color-black'
          : ''
      }`}
      onContextMenu={(e) =>
        updateContextMenuData(
          true,
          contextMenuItems,
          e.pageX,
          e.pageY,
          contextMenuItemData
        )
      }
      onClick={() =>
        isMultipleSelectionEnabled &&
        multipleSelectionsData.selectionType === 'album'
          ? updateMultipleSelections(
              props.albumId,
              'album',
              isAMultipleSelection ? 'remove' : 'add'
            )
          : showAlbumInfoPage
      }
    >
      <div
        className="album-cover-and-play-btn-container relative h-[70%] cursor-pointer overflow-hidden"
        onClick={() => {
          if (!isMultipleSelectionEnabled) showAlbumInfoPage();
        }}
      >
        {isMultipleSelectionEnabled &&
        multipleSelectionsData.selectionType === 'album' ? (
          <MultipleSelectionCheckbox
            id={props.albumId}
            selectionType="album"
            className="absolute bottom-3 right-3 z-10"
          />
        ) : (
          <span
            className="material-icons-round icon absolute bottom-[5%] right-[5%] z-[1] cursor-pointer text-5xl text-font-color-white text-opacity-0 group-hover:text-opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              playAlbum();
            }}
          >
            play_circle
          </span>
        )}
        <div className="album-cover-container relative h-full overflow-hidden rounded-lg before:invisible before:absolute before:h-full before:w-full before:bg-gradient-to-b before:from-[hsla(0,0%,0%,0%)] before:to-[hsla(0,0%,0%,50%)] before:opacity-0 before:transition-[visibility,opacity] before:duration-300 before:content-[''] group-hover:before:visible group-hover:before:opacity-100">
          <Img
            src={props.artworkPaths.artworkPath}
            loading="lazy"
            alt="Album Cover"
            className="h-full max-h-full w-full object-cover object-center"
          />
        </div>
      </div>
      <div
        className={`album-info-container mt-2 h-fit w-full pl-2 text-font-color-black dark:text-font-color-white ${
          isAMultipleSelection &&
          'text-font-color-black dark:text-font-color-black'
        }`}
      >
        <div
          className="album-title pointer w-full overflow-hidden text-ellipsis whitespace-nowrap text-xl hover:underline"
          title={props.title}
          onClick={() => {
            if (!isMultipleSelectionEnabled) showAlbumInfoPage();
          }}
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
                <>
                  <SongArtist
                    key={artist.artistId}
                    artistId={artist.artistId}
                    name={artist.name}
                  />
                  {props.artists
                    ? props.artists.length === 0 ||
                      props.artists.length - 1 === index
                      ? ''
                      : ', '
                    : ''}
                </>
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
