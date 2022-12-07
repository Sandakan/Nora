/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Img from '../Img';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';

import ConfirmDeletePlaylist from './ConfirmDeletePlaylist';

interface PlaylistProp extends Playlist {
  index: number;
}

export const Playlist = (props: PlaylistProp) => {
  const {
    queue,
    currentlyActivePage,
    multipleSelectionsData,
    isMultipleSelectionEnabled,
  } = React.useContext(AppContext);
  const {
    updateContextMenuData,
    changeCurrentActivePage,
    changePromptMenuData,
    createQueue,
    toggleMultipleSelections,
    updateMultipleSelections,
    updateQueueData,
    addNewNotifications,
  } = React.useContext(AppUpdateContext);

  const openPlaylistInfoPage = React.useCallback(
    () =>
      currentlyActivePage.pageTitle === 'PlaylistInfo' &&
      currentlyActivePage.data &&
      currentlyActivePage.data.playlistId === props.playlistId
        ? changeCurrentActivePage('Home')
        : changeCurrentActivePage('PlaylistInfo', {
            playlistId: props.playlistId,
          }),
    [changeCurrentActivePage, currentlyActivePage, props.playlistId]
  );

  const isAMultipleSelection = React.useMemo(() => {
    if (!multipleSelectionsData.isEnabled) return false;
    if (multipleSelectionsData.selectionType !== 'playlist') return false;
    if (multipleSelectionsData.multipleSelections.length <= 0) return false;
    if (
      multipleSelectionsData.multipleSelections.some(
        (selectionId) => selectionId === props.playlistId
      )
    )
      return true;
    return false;
  }, [multipleSelectionsData, props.playlistId]);

  const contextMenus: ContextMenuItem[] = React.useMemo(() => {
    const { multipleSelections: playlistIds } = multipleSelectionsData;
    const commonMenus: ContextMenuItem[] =
      multipleSelectionsData.selectionType === 'playlist' &&
      multipleSelectionsData.multipleSelections.length !== 1 &&
      isAMultipleSelection
        ? [
            {
              label: 'Add to queue',
              iconName: 'queue',
              handlerFunction: () => {
                return window.api
                  .getPlaylistData(playlistIds)
                  .then((playlists) => {
                    const songIds = playlists
                      .map((playlist) => playlist.songs)
                      .flat();
                    const uniqueSongIds = [...new Set(songIds)];
                    updateQueueData(
                      undefined,
                      [...queue.queue, ...uniqueSongIds],
                      false
                    );
                    return addNewNotifications([
                      {
                        id: `${uniqueSongIds.length}AddedToQueueFromMultiSelection`,
                        delay: 5000,
                        content: (
                          <span>
                            Added {uniqueSongIds.length} songs to the queue.
                          </span>
                        ),
                      },
                    ]);
                  });
              },
            },
            {
              label: isMultipleSelectionEnabled ? 'Unselect' : 'Select',
              iconName: 'checklist',
              handlerFunction: () => {
                if (isMultipleSelectionEnabled) {
                  return updateMultipleSelections(
                    props.playlistId,
                    'playlist',
                    isAMultipleSelection ? 'remove' : 'add'
                  );
                }
                return toggleMultipleSelections(
                  !isMultipleSelectionEnabled,
                  'playlist',
                  [props.playlistId]
                );
              },
            },
          ]
        : [
            {
              label: 'Play',
              iconName: 'play_arrow',
              handlerFunction: () =>
                createQueue(
                  props.songs,
                  'playlist',
                  false,
                  props.playlistId,
                  true
                ),
            },
            {
              label: isMultipleSelectionEnabled ? 'Unselect' : 'Select',
              iconName: 'checklist',
              handlerFunction: () => {
                if (isMultipleSelectionEnabled) {
                  return updateMultipleSelections(
                    props.playlistId,
                    'playlist',
                    isAMultipleSelection ? 'remove' : 'add'
                  );
                }
                return toggleMultipleSelections(
                  !isMultipleSelectionEnabled,
                  'playlist',
                  [props.playlistId]
                );
              },
            },
            {
              label: 'Info',
              iconName: 'info',
              handlerFunction: openPlaylistInfoPage,
            },
          ];
    if (
      currentlyActivePage.pageTitle === 'Playlists' &&
      props.playlistId !== 'History' &&
      props.playlistId !== 'Favorites'
    )
      return [
        ...commonMenus,
        {
          label: 'Delete',
          iconName: 'delete_outline',
          handlerFunction: () =>
            changePromptMenuData(
              true,
              <ConfirmDeletePlaylist
                playlistName={props.name}
                playlistId={props.playlistId}
                noOfSongs={props.songs.length}
              />
            ),
        },
      ];
    return commonMenus;
  }, [
    addNewNotifications,
    changePromptMenuData,
    createQueue,
    currentlyActivePage.pageTitle,
    isAMultipleSelection,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
    openPlaylistInfoPage,
    props.name,
    props.playlistId,
    props.songs,
    queue.queue,
    toggleMultipleSelections,
    updateMultipleSelections,
    updateQueueData,
  ]);

  return (
    <div
      style={{ animationDelay: `${50 * (props.index + 1)}ms` }}
      className={`playlist appear-from-bottom group ${
        props.playlistId
      } mb-8 mr-12 flex h-fit max-h-52 min-h-[12rem] w-36 flex-col justify-between rounded-md p-4 text-font-color-black dark:text-font-color-white ${
        isAMultipleSelection
          ? 'bg-background-color-3 text-font-color-black dark:bg-dark-background-color-3 dark:text-font-color-black'
          : ''
      }`}
      data-playlist-id={props.playlistId}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(true, contextMenus, e.pageX, e.pageY);
      }}
      onClick={() =>
        isMultipleSelectionEnabled &&
        multipleSelectionsData.selectionType === 'playlist'
          ? updateMultipleSelections(
              props.playlistId,
              'playlist',
              isAMultipleSelection ? 'remove' : 'add'
            )
          : undefined
      }
    >
      <div
        className="playlist-cover-and-play-btn-container relative h-[70%] cursor-pointer overflow-hidden rounded-xl before:invisible before:absolute before:h-full before:w-full before:bg-gradient-to-b before:from-[hsla(0,0%,0%,0%)] before:to-[hsla(0,0%,0%,40%)] before:opacity-0 before:transition-[visibility,opacity] before:duration-300 before:content-[''] group-hover:before:visible group-hover:before:opacity-100"
        onClick={() =>
          isMultipleSelectionEnabled &&
          multipleSelectionsData.selectionType === 'playlist'
            ? updateMultipleSelections(
                props.playlistId,
                'playlist',
                isAMultipleSelection ? 'remove' : 'add'
              )
            : openPlaylistInfoPage
        }
      >
        {isMultipleSelectionEnabled &&
        multipleSelectionsData.selectionType === 'playlist' ? (
          <MultipleSelectionCheckbox
            id={props.playlistId}
            selectionType="playlist"
            className="absolute bottom-3 right-3"
          />
        ) : (
          <span
            className="material-icons-round icon absolute bottom-3 right-3 translate-y-10 cursor-pointer text-4xl text-font-color-white opacity-0 transition-[opacity,transform] delay-100 duration-200 ease-in-out group-hover:translate-y-0 group-hover:opacity-100 dark:text-font-color-white"
            onClick={() =>
              createQueue(
                props.songs,
                'playlist',
                false,
                props.playlistId,
                true
              )
            }
          >
            play_circle
          </span>
        )}
        <div className="playlist-cover-container h-full cursor-pointer overflow-hidden">
          <Img
            src={props.artworkPaths.artworkPath}
            alt="Playlist Cover"
            loading="lazy"
            className="h-full w-full"
          />
        </div>
      </div>
      <div className="playlist-info-container mt-2">
        <div
          className="title playlist-title w-full cursor-pointer overflow-hidden overflow-ellipsis whitespace-nowrap text-xl hover:underline"
          title={props.name}
          onClick={() =>
            isMultipleSelectionEnabled &&
            multipleSelectionsData.selectionType === 'playlist'
              ? updateMultipleSelections(
                  props.playlistId,
                  'playlist',
                  isAMultipleSelection ? 'remove' : 'add'
                )
              : openPlaylistInfoPage
          }
        >
          {props.name}
        </div>
        <div className="playlist-no-of-songs text-sm font-light">{`${
          props.songs.length
        } song${props.songs.length === 1 ? '' : 's'}`}</div>
      </div>
    </div>
  );
};
