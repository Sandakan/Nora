/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Img from '../Img';
import DefaultGenreCover from '../../../../assets/images/webp/genre-cover-default.webp';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';
import Button from '../Button';

interface GenreProp {
  // eslint-disable-next-line react/no-unused-prop-types
  index: number;
  genreId: string;
  title: string;
  songIds: string[];
  artworkPaths: ArtworkPaths;
  backgroundColor?: { rgb: unknown };
  className?: string;
  selectAllHandler?: (_upToId?: string) => void;
}

const Genre = (props: GenreProp) => {
  const {
    genreId,
    songIds,
    title,
    artworkPaths,
    backgroundColor,
    className,
    selectAllHandler,
  } = props;
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

  const goToGenreInfoPage = React.useCallback(
    () =>
      currentlyActivePage.pageTitle === 'GenreInfo' &&
      currentlyActivePage?.data?.genreId === genreId
        ? changeCurrentActivePage('Home')
        : changeCurrentActivePage('GenreInfo', {
            genreId,
          }),
    [
      changeCurrentActivePage,
      currentlyActivePage?.data?.genreId,
      currentlyActivePage.pageTitle,
      genreId,
    ]
  );

  const playGenreSongs = React.useCallback(
    (isShuffle = false) => {
      return window.api
        .getSongInfo(songIds, undefined, undefined, true)
        .then((songs) => {
          if (Array.isArray(songs))
            return createQueue(
              songs
                .filter((song) => !song.isBlacklisted)
                .map((song) => song.songId),
              'genre',
              isShuffle,
              genreId,
              true
            );
          return undefined;
        });
    },
    [createQueue, genreId, songIds]
  );

  const playGenreSongsForMultipleSelections = React.useCallback(
    (isShuffle = false) => {
      const { multipleSelections: genreIds } = multipleSelectionsData;
      window.api
        .getGenresData(genreIds)
        .then((genres) => {
          if (Array.isArray(genres) && genres.length > 0) {
            const genreSongIds = genres
              .map((genre) => genre.songs.map((song) => song.songId))
              .flat();

            return window.api.getSongInfo(
              genreSongIds,
              undefined,
              undefined,
              true
            );
          }
          return undefined;
        })
        .then((songs) => {
          if (Array.isArray(songs))
            return createQueue(
              songs
                .filter((song) => !song.isBlacklisted)
                .map((song) => song.songId),
              'songs',
              isShuffle,
              undefined,
              true
            );
          return undefined;
        })
        .catch((err) => console.error(err));
    },
    [createQueue, multipleSelectionsData]
  );

  const addToQueueForMultipleSelections = React.useCallback(() => {
    const { multipleSelections: genreIds } = multipleSelectionsData;
    window.api
      .getGenresData(genreIds)
      .then((genres) => {
        if (Array.isArray(genres) && genres.length > 0) {
          const genreSongIds = genres
            .map((genre) => genre.songs.map((song) => song.songId))
            .flat();

          return window.api.getSongInfo(
            genreSongIds,
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

  const contextMenuItems: ContextMenuItem[] = React.useMemo(() => {
    const isMultipleSelectionsEnabled =
      multipleSelectionsData.selectionType === 'genre' &&
      multipleSelectionsData.multipleSelections.length !== 1 &&
      isAMultipleSelection;

    return [
      {
        label: isMultipleSelectionsEnabled ? 'Play All' : 'Play',
        iconName: 'play_arrow',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled)
            playGenreSongsForMultipleSelections();
          else playGenreSongs();
          toggleMultipleSelections(false);
        },
      },
      {
        label: isMultipleSelectionsEnabled
          ? 'Shuffle and Play All'
          : 'Shuffle and Play',
        iconName: 'shuffle',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled)
            playGenreSongsForMultipleSelections(true);
          else playGenreSongs(true);
          toggleMultipleSelections(false);
        },
      },
      {
        label: 'Add to queue',
        iconName: 'queue',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled) addToQueueForMultipleSelections();
          else {
            queue.queue.push(...songIds);
            updateQueueData(undefined, queue.queue);
            addNewNotifications([
              {
                id: 'newSongsToQueue',
                delay: 5000,
                content: (
                  <span>Added {songIds.length} songs to the queue.</span>
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
            return updateMultipleSelections(
              genreId,
              'genre',
              isAMultipleSelection ? 'remove' : 'add'
            );
          }
          return toggleMultipleSelections(!isAMultipleSelection, 'genre', [
            genreId,
          ]);
        },
      },
      // {
      //   label: 'Select/Unselect All',
      //   iconName: 'checklist',
      //   isDisabled: !selectAllHandler,
      //   handlerFunction: () => selectAllHandler && selectAllHandler(),
      // },
      {
        label: 'Info',
        iconName: 'info',
        iconClassName: 'material-icons-round-outlined',
        handlerFunction: goToGenreInfoPage,
        isDisabled: isMultipleSelectionsEnabled,
      },
    ];
  }, [
    multipleSelectionsData.selectionType,
    multipleSelectionsData.multipleSelections.length,
    isAMultipleSelection,
    goToGenreInfoPage,
    playGenreSongsForMultipleSelections,
    playGenreSongs,
    toggleMultipleSelections,
    addToQueueForMultipleSelections,
    queue.queue,
    songIds,
    updateQueueData,
    addNewNotifications,
    isMultipleSelectionEnabled,
    genreId,
    updateMultipleSelections,
  ]);

  const contextMenuItemData =
    isMultipleSelectionEnabled &&
    multipleSelectionsData.selectionType === 'genre' &&
    isAMultipleSelection
      ? {
          title: `${multipleSelectionsData.multipleSelections.length} selected genres`,
          artworkPath: DefaultGenreCover,
        }
      : undefined;

  return (
    <div
      className={`genre appear-from-bottom group relative mr-10 mb-6 flex h-36 w-72 cursor-pointer items-center overflow-hidden rounded-2xl p-4 text-background-color-2 transition-[border,border-color] dark:text-dark-background-color-2 ${className} ${
        isMultipleSelectionEnabled &&
        multipleSelectionsData.selectionType === 'genre' &&
        'border-4 border-transparent'
      } ${
        isAMultipleSelection &&
        '!border-font-color-highlight dark:!border-dark-font-color-highlight'
      }`}
      style={{
        backgroundColor: `rgb(${
          backgroundColor
            ? (backgroundColor.rgb as [number, number, number]).join(',')
            : '23,23,23'
        })`,
      }}
      onClick={(e) => {
        if (e.getModifierState('Shift') === true && selectAllHandler)
          selectAllHandler(genreId);
        else if (
          isMultipleSelectionEnabled &&
          multipleSelectionsData.selectionType === 'genre'
        )
          updateMultipleSelections(
            genreId,
            'genre',
            isAMultipleSelection ? 'remove' : 'add'
          );
        else goToGenreInfoPage();
      }}
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
        <Button
          className="genre-title !m-0 !block w-full truncate !rounded-none !border-0 !p-0 !text-left !text-2xl text-font-color-white outline-1 outline-offset-1 focus-visible:!outline dark:text-font-color-white"
          label={title}
          clickHandler={goToGenreInfoPage}
        />
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
