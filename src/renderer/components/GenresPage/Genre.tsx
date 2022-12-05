import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Img from '../Img';
import DefaultSongCover from '../../../../assets/images/png/song_cover_default.png';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';

interface GenreProp {
  // eslint-disable-next-line react/no-unused-prop-types
  index: number;
  genreId: string;
  title: string;
  songIds: string[];
  artworkPaths: ArtworkPaths;
  backgroundColor?: { rgb: unknown };
  className?: string;
}

const Genre = (props: GenreProp) => {
  const { genreId, songIds, title, artworkPaths, backgroundColor, className } =
    props;
  const {
    currentlyActivePage,
    queue,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
  } = React.useContext(AppContext);
  const {
    changeCurrentActivePage,
    createQueue,
    updateQueueData,
    addNewNotifications,
    updateContextMenuData,
    toggleMultipleSelections,
    updateMultipleSelections,
  } = React.useContext(AppUpdateContext);

  const goToGenreInfoTab = () =>
    currentlyActivePage.pageTitle === 'GenreInfo' &&
    currentlyActivePage.data.genreId === genreId
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('GenreInfo', {
          genreId,
        });

  const playGenre = React.useCallback(
    (isShuffle = false) => {
      createQueue(songIds, 'genre', isShuffle, genreId, true);
    },
    [createQueue, genreId, songIds]
  );

  const isAMultipleSelection = React.useMemo(() => {
    if (!multipleSelectionsData.isEnabled) return false;
    if (multipleSelectionsData.selectionType !== 'genre') return false;
    if (multipleSelectionsData.multipleSelections.length <= 0) return false;
    if (
      multipleSelectionsData.multipleSelections.some(
        (selectionId) => selectionId === genreId
      )
    )
      return true;
    return false;
  }, [multipleSelectionsData, genreId]);

  const contextMenuItems: ContextMenuItem[] = React.useMemo(
    () => [
      {
        label: 'Play',
        iconName: 'play_arrow',
        handlerFunction: playGenre,
      },
      {
        label: 'Add to queue',
        iconName: 'queue',
        handlerFunction: () => {
          queue.queue.push(...songIds);
          updateQueueData(undefined, queue.queue);
          addNewNotifications([
            {
              id: 'newSongsToQueue',
              delay: 5000,
              content: (
                <span>
                  Added {songIds.length} song
                  {songIds.length === 1 ? '' : 's'} to the queue.
                </span>
              ),
            },
          ]);
        },
      },
      {
        label: 'Shuffle and Play',
        iconName: 'shuffle',
        handlerFunction: () => playGenre(true),
      },
      {
        label: isMultipleSelectionEnabled ? 'Unselect' : 'Select',
        iconName: 'checklist',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) {
            return updateMultipleSelections(
              genreId,
              'genre',
              isAMultipleSelection ? 'remove' : 'add'
            );
          }
          return toggleMultipleSelections(
            !isMultipleSelectionEnabled,
            'genre',
            [genreId]
          );
        },
      },
    ],
    [
      addNewNotifications,
      isAMultipleSelection,
      isMultipleSelectionEnabled,
      playGenre,
      genreId,
      queue.queue,
      songIds,
      toggleMultipleSelections,
      updateMultipleSelections,
      updateQueueData,
    ]
  );

  const contextMenuItemData =
    isMultipleSelectionEnabled &&
    multipleSelectionsData.selectionType === 'genre' &&
    isAMultipleSelection
      ? {
          title: `${multipleSelectionsData.multipleSelections.length} selected genres`,
          artworkPath: DefaultSongCover,
        }
      : undefined;

  return (
    <div
      className={`genre appear-from-bottom relative mr-10 mb-6 flex h-36 w-72 cursor-pointer items-center overflow-hidden rounded-2xl p-4 text-background-color-2 dark:text-dark-background-color-2 ${className}`}
      style={{
        backgroundColor: `rgb(${
          backgroundColor
            ? (backgroundColor.rgb as [number, number, number]).join(',')
            : '23,23,23'
        })`,
        // animationDelay: `${50 * (index + 1)}ms`,
      }}
      onClick={() =>
        isMultipleSelectionEnabled &&
        multipleSelectionsData.selectionType === 'genre'
          ? updateMultipleSelections(
              genreId,
              'genre',
              isAMultipleSelection ? 'remove' : 'add'
            )
          : goToGenreInfoTab
      }
      onKeyUp={() =>
        isMultipleSelectionEnabled &&
        multipleSelectionsData.selectionType === 'genre'
          ? updateMultipleSelections(
              genreId,
              'genre',
              isAMultipleSelection ? 'remove' : 'add'
            )
          : goToGenreInfoTab
      }
      role="button"
      tabIndex={0}
      onContextMenu={(e) =>
        updateContextMenuData(
          true,
          contextMenuItems,
          e.pageX,
          e.pageY,
          contextMenuItemData
        )
      }
    >
      <div className="genre-info-container w-3/4">
        <div className="genre-title w-full overflow-hidden text-ellipsis whitespace-nowrap text-2xl text-font-color-white dark:text-font-color-white">
          {title}
        </div>
        <div className="genre-no-of-songs text-[#ccc] dark:text-[#ccc]">{`${
          songIds.length
        } song${songIds.length === 1 ? '' : 's'}`}</div>
        {isMultipleSelectionEnabled &&
          multipleSelectionsData.selectionType === 'genre' && (
            <MultipleSelectionCheckbox
              id={genreId}
              selectionType="genre"
              className="z-10 !mt-2"
            />
          )}
      </div>
      <div className="genre-artwork-container absolute -right-4 top-1/2 -translate-y-1/2">
        <Img
          src={artworkPaths.artworkPath}
          className="w-24 rotate-12 rounded-md"
          alt="Artwork cover"
        />
      </div>
    </div>
  );
};

Genre.defaultProps = {
  backgroundColor: { rgb: [23, 23, 23] },
  className: '',
};

export default Genre;
