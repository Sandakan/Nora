/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import DefaultArtistCover from '../../../../assets/images/png/artist_cover_default.png';
import Img from '../Img';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';

interface ArtistProp {
  // eslint-disable-next-line react/no-unused-prop-types
  index: number;
  className?: string;
  artistId: string;
  name: string;
  artworkPaths: ArtworkPaths;
  songIds: string[];
  onlineArtworkPaths?: {
    picture_small: string;
    picture_medium: string;
  };
}

export const Artist = (props: ArtistProp) => {
  const {
    currentlyActivePage,
    queue,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
  } = React.useContext(AppContext);
  const {
    changeCurrentActivePage,
    updateContextMenuData,
    createQueue,
    updateQueueData,
    addNewNotifications,
    toggleMultipleSelections,
    updateMultipleSelections,
  } = React.useContext(AppUpdateContext);

  const showArtistInfoPage = React.useCallback(() => {
    return currentlyActivePage.pageTitle === 'ArtistInfo' &&
      currentlyActivePage.data &&
      currentlyActivePage.data.artistName === props.name
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('ArtistInfo', {
          artistName: props.name,
        });
  }, [
    changeCurrentActivePage,
    currentlyActivePage.data,
    currentlyActivePage.pageTitle,
    props.name,
  ]);
  const playArtistSongs = React.useCallback(
    () => createQueue(props.songIds, 'artist', false, props.artistId, true),
    [createQueue, props.artistId, props.songIds]
  );

  const isAMultipleSelection = React.useMemo(() => {
    if (!multipleSelectionsData.isEnabled) return false;
    if (multipleSelectionsData.selectionType !== 'artist') return false;
    if (multipleSelectionsData.multipleSelections.length <= 0) return false;
    if (
      multipleSelectionsData.multipleSelections.some(
        (selectionId) => selectionId === props.artistId
      )
    )
      return true;
    return false;
  }, [multipleSelectionsData, props.artistId]);

  const artistContextMenus: ContextMenuItem[] = React.useMemo(() => {
    if (
      multipleSelectionsData.selectionType === 'artist' &&
      multipleSelectionsData.multipleSelections.length !== 1 &&
      isAMultipleSelection
    ) {
      return [
        {
          label: 'Add to queue',
          iconName: 'queue',
          handlerFunction: () => {
            const { multipleSelections: artistIds } = multipleSelectionsData;
            return window.api.getArtistData(artistIds).then((artists) => {
              const songIds = artists
                .map((artist) => artist.songs.map((song) => song.songId))
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
                props.artistId,
                'artist',
                isAMultipleSelection ? 'remove' : 'add'
              );
            }
            return toggleMultipleSelections(
              !isMultipleSelectionEnabled,
              'artist',
              [props.artistId]
            );
          },
        },
      ];
    }
    return [
      {
        label: 'Play all Songs',
        iconName: 'play_arrow',
        handlerFunction: playArtistSongs,
      },
      {
        label: 'Info',
        iconName: 'info',
        handlerFunction: showArtistInfoPage,
      },
      {
        label: 'Add to queue',
        iconName: 'queue',
        handlerFunction: () => {
          updateQueueData(
            undefined,
            [...queue.queue, ...props.songIds],
            false,
            false
          );
          addNewNotifications([
            {
              id: 'addSongsToQueue',
              delay: 5000,
              content: (
                <span>
                  Added {props.songIds.length} song
                  {props.songIds.length === 1 ? '' : 's'} to the queue.
                </span>
              ),
            },
          ]);
        },
      },
      {
        label: isMultipleSelectionEnabled ? 'Unselect' : 'Select',
        iconName: 'checklist',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) {
            return updateMultipleSelections(
              props.artistId,
              'artist',
              isAMultipleSelection ? 'remove' : 'add'
            );
          }
          return toggleMultipleSelections(
            !isMultipleSelectionEnabled,
            'artist',
            [props.artistId]
          );
        },
      },
    ];
  }, [
    addNewNotifications,
    isAMultipleSelection,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
    playArtistSongs,
    props.artistId,
    props.songIds,
    queue.queue,
    showArtistInfoPage,
    toggleMultipleSelections,
    updateMultipleSelections,
    updateQueueData,
  ]);

  const contextMenuItemData =
    isMultipleSelectionEnabled &&
    multipleSelectionsData.selectionType === 'artist' &&
    isAMultipleSelection
      ? {
          title: `${multipleSelectionsData.multipleSelections.length} selected artists`,
          artworkPath: DefaultArtistCover,
        }
      : undefined;

  return (
    <div
      // style={{ animationDelay: `${50 * (props.index + 1)}ms` }}
      className={`artist appear-from-bottom mr-2 flex h-44 w-40 cursor-pointer flex-col justify-between overflow-hidden rounded-lg p-4 ${
        props.className
      } ${
        isAMultipleSelection
          ? 'bg-background-color-3 dark:bg-dark-background-color-3'
          : ''
      }`}
      onContextMenu={(e) => {
        updateContextMenuData(
          true,
          artistContextMenus,
          e.pageX,
          e.pageY,
          contextMenuItemData
        );
      }}
      onClick={() =>
        isMultipleSelectionEnabled &&
        multipleSelectionsData.selectionType === 'artist'
          ? updateMultipleSelections(
              props.artistId,
              'artist',
              isAMultipleSelection ? 'remove' : 'add'
            )
          : undefined
      }
    >
      <div className="artist-img-container relative flex h-3/4 items-center justify-center">
        <Img
          src={
            navigator.onLine && props.onlineArtworkPaths
              ? props.onlineArtworkPaths.picture_medium
              : props.artworkPaths.artworkPath || DefaultArtistCover
          }
          alt="Default song cover"
          className="aspect-square h-full rounded-full object-cover shadow-xl"
          onClick={() => {
            if (!isMultipleSelectionEnabled) showArtistInfoPage();
          }}
        />
        {isMultipleSelectionEnabled &&
          multipleSelectionsData.selectionType === 'artist' && (
            <MultipleSelectionCheckbox
              id={props.artistId}
              selectionType="artist"
              className="absolute bottom-3 right-3 z-10"
            />
          )}
      </div>
      <div className="artist-info-container max-h-1/5">
        <div
          className={`name-container w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-center text-xl text-font-color-black hover:underline dark:text-font-color-white lg:text-base ${
            isAMultipleSelection &&
            'text-font-color-black dark:text-font-color-black'
          }`}
          title={props.name === '' ? 'Unknown Artist' : props.name}
          onClick={() => {
            if (!isMultipleSelectionEnabled) showArtistInfoPage();
          }}
        >
          {props.name === '' ? 'Unknown Artist' : props.name}
        </div>
      </div>
    </div>
  );
};
