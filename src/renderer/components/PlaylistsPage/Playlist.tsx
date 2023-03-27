/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Img from '../Img';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';
import ConfirmDeletePlaylists from './ConfirmDeletePlaylists';
import DefaultPlaylistCover from '../../../../assets/images/webp/playlist_cover_default.webp';
import Button from '../Button';

interface PlaylistProp extends Playlist {
  index: number;
  selectAllHandler?: (_upToId?: string) => void;
}

export const Playlist = (props: PlaylistProp) => {
  const {
    queue,
    currentlyActivePage,
    multipleSelectionsData,
    isMultipleSelectionEnabled,
  } = React.useContext(AppContext);
  const {
    updateQueueData,
    updateContextMenuData,
    changeCurrentActivePage,
    changePromptMenuData,
    createQueue,
    toggleMultipleSelections,
    updateMultipleSelections,
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

  const playAllSongs = React.useCallback(
    (isShuffling = false) => {
      window.api
        .getSongInfo(props.songs, undefined, undefined, true)
        .then((songs) => {
          if (Array.isArray(songs))
            return createQueue(
              songs
                .filter((song) => !song.isBlacklisted)
                .map((song) => song.songId),
              'playlist',
              isShuffling,
              props.playlistId,
              true
            );
          return undefined;
        })
        .catch((err) => console.error(err));
    },
    [createQueue, props.playlistId, props.songs]
  );

  const playAllSongsForMultipleSelections = React.useCallback(
    (isShuffling = false) => {
      const { multipleSelections: playlistIds } = multipleSelectionsData;
      window.api
        .getPlaylistData(playlistIds)
        .then((playlists) => {
          const ids = playlists.map((playlist) => playlist.songs).flat();

          return window.api.getSongInfo(ids, undefined, undefined, true);
        })
        .then((songs) => {
          if (Array.isArray(songs)) {
            const songIds = songs
              .filter((song) => !song.isBlacklisted)
              .map((song) => song.songId);
            createQueue(songIds, 'songs', isShuffling);
            return addNewNotifications([
              {
                id: `${songIds.length}AddedToQueueFromMultiSelection`,
                delay: 5000,
                content: (
                  <span>Added {songIds.length} songs to the queue.</span>
                ),
              },
            ]);
          }
          return undefined;
        })
        .catch((err) => console.error(err));
    },
    [addNewNotifications, createQueue, multipleSelectionsData]
  );

  const addToQueueForMultipleSelections = React.useCallback(() => {
    const { multipleSelections: playlistIds } = multipleSelectionsData;
    window.api
      .getPlaylistData(playlistIds)
      .then((playlists) => {
        if (Array.isArray(playlists) && playlists.length > 0) {
          const playlistSongIds = playlists
            .map((playlist) => playlist.songs)
            .flat();

          return window.api.getSongInfo(
            playlistSongIds,
            undefined,
            undefined,
            true
          );
        }
        return undefined;
      })
      .then((songs) => {
        if (Array.isArray(songs)) {
          queue.queue.push(
            ...songs
              .filter((song) => !song.isBlacklisted)
              .map((song) => song.songId)
          );
          updateQueueData(undefined, queue.queue);
          addNewNotifications([
            {
              id: 'newSongsToQueue',
              delay: 5000,
              content: <span>Added {songs.length} songs to the queue.</span>,
            },
          ]);
        }
        return undefined;
      })
      .catch((err) => console.error(err));
  }, [
    addNewNotifications,
    multipleSelectionsData,
    queue.queue,
    updateQueueData,
  ]);

  const contextMenus: ContextMenuItem[] = React.useMemo(() => {
    const { multipleSelections: playlistIds } = multipleSelectionsData;
    const isMultipleSelectionsEnabled =
      multipleSelectionsData.selectionType === 'playlist' &&
      multipleSelectionsData.multipleSelections.length !== 1 &&
      isAMultipleSelection;

    return [
      {
        label: isMultipleSelectionsEnabled ? 'Play All' : 'Play',
        iconName: 'play_arrow',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) playAllSongsForMultipleSelections();
          else playAllSongs();
          toggleMultipleSelections(false);
        },
      },
      {
        label: isMultipleSelectionsEnabled
          ? 'Shuffle and Play All'
          : 'Shuffle and Play',
        iconName: 'shuffle',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled)
            playAllSongsForMultipleSelections(true);
          else playAllSongs(true);
          toggleMultipleSelections(false);
        },
      },
      {
        label: 'Add to Queue',
        iconName: 'queue',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled) addToQueueForMultipleSelections();
          else {
            queue.queue.push(...props.songs);
            updateQueueData(undefined, queue.queue);
            addNewNotifications([
              {
                id: 'newSongsToQueue',
                delay: 5000,
                content: (
                  <span>Added {props.songs.length} songs to the queue.</span>
                ),
              },
            ]);
          }
          toggleMultipleSelections(false);
        },
      },
      {
        label: 'Hr',
        isContextMenuItemSeperator: true,
        handlerFunction: () => true,
      },
      {
        label: isAMultipleSelection ? 'Unselect' : 'Select',
        iconName: 'checklist',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) {
            updateMultipleSelections(
              props.playlistId,
              'playlist',
              isAMultipleSelection ? 'remove' : 'add'
            );
          } else
            toggleMultipleSelections(!isAMultipleSelection, 'playlist', [
              props.playlistId,
            ]);
        },
      },
      // {
      //   label: 'Select/Unselect All',
      //   iconName: 'checklist',
      //   isDisabled: !props.selectAllHandler,
      //   handlerFunction: () =>
      //     props.selectAllHandler && props.selectAllHandler(),
      // },
      {
        label: 'Info',
        iconName: 'info',
        handlerFunction: openPlaylistInfoPage,
        isDisabled: isMultipleSelectionsEnabled,
      },
      {
        label: 'Hr',
        isContextMenuItemSeperator: true,
        handlerFunction: () => true,
        isDisabled: isMultipleSelectionsEnabled
          ? false
          : props.playlistId === 'History' || props.playlistId === 'Favorites',
      },
      {
        label: isMultipleSelectionsEnabled
          ? 'Delete Selected Playlists'
          : 'Delete Playlist',
        iconName: 'delete_outline',
        handlerFunction: () => {
          changePromptMenuData(
            true,
            <ConfirmDeletePlaylists
              playlistIds={
                isMultipleSelectionsEnabled ? playlistIds : [props.playlistId]
              }
              playlistName={props.name}
            />
          );
          toggleMultipleSelections(false);
        },
        isDisabled: isMultipleSelectionsEnabled
          ? false
          : props.playlistId === 'History' || props.playlistId === 'Favorites',
      },
    ];
  }, [
    addNewNotifications,
    addToQueueForMultipleSelections,
    changePromptMenuData,
    isAMultipleSelection,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
    openPlaylistInfoPage,
    playAllSongs,
    playAllSongsForMultipleSelections,
    props,
    queue.queue,
    toggleMultipleSelections,
    updateMultipleSelections,
    updateQueueData,
  ]);

  const contextMenuItemData = React.useMemo(
    () =>
      isMultipleSelectionEnabled &&
      multipleSelectionsData.selectionType === 'playlist' &&
      isAMultipleSelection
        ? {
            title: `${multipleSelectionsData.multipleSelections.length} selected playlists`,
            artworkPath: DefaultPlaylistCover,
          }
        : undefined,
    [
      isAMultipleSelection,
      isMultipleSelectionEnabled,
      multipleSelectionsData.multipleSelections.length,
      multipleSelectionsData.selectionType,
    ]
  );

  return (
    <div
      style={{ animationDelay: `${25 * (props.index + 1)}ms` }}
      className={`playlist appear-from-bottom group hover:bg-background-color-2/50 dark:hover:bg-dark-background-color-2/50  ${
        props.playlistId
      } mb-8 mr-12 flex h-fit max-h-52 min-h-[12rem] w-36 flex-col justify-between rounded-md p-4 text-font-color-black dark:text-font-color-white ${
        isAMultipleSelection
          ? '!bg-background-color-3 !text-font-color-black dark:!bg-dark-background-color-3 dark:!text-font-color-black'
          : ''
      }`}
      data-playlist-id={props.playlistId}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(
          true,
          contextMenus,
          e.pageX,
          e.pageY,
          contextMenuItemData
        );
      }}
      onClick={(e) => {
        if (e.getModifierState('Shift') === true && props.selectAllHandler)
          props.selectAllHandler(props.playlistId);
        else if (
          isMultipleSelectionEnabled &&
          multipleSelectionsData.selectionType === 'playlist'
        )
          updateMultipleSelections(
            props.playlistId,
            'playlist',
            isAMultipleSelection ? 'remove' : 'add'
          );
        else openPlaylistInfoPage();
      }}
    >
      <div className="playlist-cover-and-play-btn-container relative h-[70%] cursor-pointer overflow-hidden rounded-xl before:invisible before:absolute before:h-full before:w-full before:bg-gradient-to-b before:from-[hsla(0,0%,0%,0%)] before:to-[hsla(0,0%,0%,40%)] before:opacity-0 before:transition-[visibility,opacity] before:duration-300 before:content-[''] group-focus-within:before:visible group-focus-within:before:opacity-100 group-hover:before:visible group-hover:before:opacity-100">
        {isMultipleSelectionEnabled &&
        multipleSelectionsData.selectionType === 'playlist' ? (
          <MultipleSelectionCheckbox
            id={props.playlistId}
            selectionType="playlist"
            className="absolute bottom-3 right-3"
          />
        ) : (
          <Button
            className="absolute bottom-2 right-2 !m-0 translate-y-10 scale-90 !rounded-none !border-0 !p-0 text-font-color-white opacity-0 outline-1 outline-offset-1 transition-[opacity,transform] delay-100 duration-200 ease-in-out focus-visible:!outline group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 dark:!text-font-color-white"
            clickHandler={() => playAllSongs()}
            iconName="play_circle"
            iconClassName="!text-4xl !leading-none !text-inherit"
          />
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
        <Button
          className={`playlist-title !m-0 !block w-full truncate !rounded-none !border-0 !p-0 !text-left !text-xl outline-1 outline-offset-1 hover:underline focus-visible:!outline ${
            isAMultipleSelection &&
            '!text-font-color-black dark:!text-font-color-black'
          }`}
          tooltipLabel={props.name}
          clickHandler={() =>
            isMultipleSelectionEnabled &&
            multipleSelectionsData.selectionType === 'playlist'
              ? updateMultipleSelections(
                  props.playlistId,
                  'playlist',
                  isAMultipleSelection ? 'remove' : 'add'
                )
              : openPlaylistInfoPage()
          }
          label={props.name}
        />
        <div className="playlist-no-of-songs text-sm font-light">{`${
          props.songs.length
        } song${props.songs.length === 1 ? '' : 's'}`}</div>
      </div>
    </div>
  );
};
