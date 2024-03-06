/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../contexts/AppContext';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
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
  backgroundColor?: { rgb: [number, number, number] };
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
  const { queue, isMultipleSelectionEnabled, multipleSelectionsData } =
    React.useContext(AppContext);
  const {
    changeCurrentActivePage,
    createQueue,
    updateQueueData,
    addNewNotifications,
    updateContextMenuData,
    toggleMultipleSelections,
    updateMultipleSelections,
  } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const goToGenreInfoPage = React.useCallback(
    () =>
      changeCurrentActivePage('GenreInfo', {
        genreId,
      }),
    [changeCurrentActivePage, genreId],
  );

  const playGenreSongs = React.useCallback(
    (isShuffle = false) => {
      return window.api.audioLibraryControls
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
              true,
            );
          return undefined;
        });
    },
    [createQueue, genreId, songIds],
  );

  const playGenreSongsForMultipleSelections = React.useCallback(
    (isShuffle = false) => {
      const { multipleSelections: genreIds } = multipleSelectionsData;
      window.api.genresData
        .getGenresData(genreIds)
        .then((genres) => {
          if (Array.isArray(genres) && genres.length > 0) {
            const genreSongIds = genres
              .map((genre) => genre.songs.map((song) => song.songId))
              .flat();

            return window.api.audioLibraryControls.getSongInfo(
              genreSongIds,
              undefined,
              undefined,
              true,
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
              true,
            );
          return undefined;
        })
        .catch((err) => console.error(err));
    },
    [createQueue, multipleSelectionsData],
  );

  const addToQueueForMultipleSelections = React.useCallback(() => {
    const { multipleSelections: genreIds } = multipleSelectionsData;
    window.api.genresData
      .getGenresData(genreIds)
      .then((genres) => {
        if (Array.isArray(genres) && genres.length > 0) {
          const genreSongIds = genres
            .map((genre) => genre.songs.map((song) => song.songId))
            .flat();

          return window.api.audioLibraryControls.getSongInfo(
            genreSongIds,
            undefined,
            undefined,
            true,
          );
        }
        return undefined;
      })
      .then((songs) => {
        if (Array.isArray(songs)) {
          queue.queue.push(
            ...songs
              .filter((song) => !song.isBlacklisted)
              .map((song) => song.songId),
          );
          updateQueueData(undefined, queue.queue);
          addNewNotifications([
            {
              id: 'newSongsToQueue',
              delay: 5000,
              content: t(`notifications.addedToQueue`, {
                count: songs.length,
              }),
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
    t,
    updateQueueData,
  ]);

  const isAMultipleSelection = React.useMemo(() => {
    if (!multipleSelectionsData.isEnabled) return false;
    if (multipleSelectionsData.selectionType !== 'genre') return false;
    if (multipleSelectionsData.multipleSelections.length <= 0) return false;
    if (
      multipleSelectionsData.multipleSelections.some(
        (selectionId) => selectionId === genreId,
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
        label: t(`common.${isMultipleSelectionsEnabled ? 'playAll' : 'play'}`),
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
          ? t(`common.shuffleAndPlayAll`)
          : t(`common.shuffleAndPlay`),
        iconName: 'shuffle',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled)
            playGenreSongsForMultipleSelections(true);
          else playGenreSongs(true);
          toggleMultipleSelections(false);
        },
      },
      {
        label: t(`common.addToQueue`),
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
                content: t(`notifications.addedToQueue`, {
                  count: songIds.length,
                }),
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
        label: t(`common.${isAMultipleSelection ? 'unselect' : 'select'}`),
        iconName: 'checklist',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) {
            return updateMultipleSelections(
              genreId,
              'genre',
              isAMultipleSelection ? 'remove' : 'add',
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
        label: t(`common.info`),
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
    t,
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

  const contextMenuItemData = React.useMemo(
    () =>
      isMultipleSelectionEnabled &&
      multipleSelectionsData.selectionType === 'genre' &&
      isAMultipleSelection
        ? {
            title: t(`genre.selectedGenreCount`, {
              count: multipleSelectionsData.multipleSelections.length,
            }),
            artworkPath: DefaultGenreCover,
          }
        : {
            title,
            artworkPath: artworkPaths?.optimizedArtworkPath,
            subTitle: t('common.songWithCount', { count: songIds.length }),
          },
    [
      artworkPaths?.optimizedArtworkPath,
      isAMultipleSelection,
      isMultipleSelectionEnabled,
      multipleSelectionsData.multipleSelections.length,
      multipleSelectionsData.selectionType,
      songIds.length,
      t,
      title,
    ],
  );

  return (
    <div
      className={`genre group relative mb-6 mr-10 flex h-36 w-72 cursor-pointer items-center gap-4 overflow-hidden rounded-2xl p-4 text-background-color-2 transition-[border,border-color] dark:text-dark-background-color-2 ${className} ${
        isMultipleSelectionEnabled &&
        multipleSelectionsData.selectionType === 'genre' &&
        'border-4 border-transparent'
      } ${isAMultipleSelection && '!border-font-color-highlight dark:!border-dark-font-color-highlight'}`}
      style={{
        backgroundColor: `rgb(${backgroundColor ? backgroundColor.rgb.join(',') : '23,23,23'})`,
      }}
      onClick={(e) => {
        if (e.getModifierState('Shift') === true && selectAllHandler)
          selectAllHandler(genreId);
        else if (
          e.getModifierState('Control') === true &&
          !isMultipleSelectionEnabled
        )
          toggleMultipleSelections(!isAMultipleSelection, 'genre', [genreId]);
        else if (
          isMultipleSelectionEnabled &&
          multipleSelectionsData.selectionType === 'genre'
        )
          updateMultipleSelections(
            genreId,
            'genre',
            isAMultipleSelection ? 'remove' : 'add',
          );
        else goToGenreInfoPage();
      }}
      onContextMenu={(e) =>
        updateContextMenuData(
          true,
          contextMenuItems,
          e.pageX,
          e.pageY,
          contextMenuItemData,
        )
      }
    >
      <div className="genre-artwork-container w-2/5 max-w-[100px]">
        <Img
          src={artworkPaths.artworkPath}
          className="aspect-square rounded-md shadow-2xl"
          alt="Artwork cover"
          enableImgFadeIns={!isMultipleSelectionEnabled}
        />
      </div>
      <div className="genre-info-container w-3/5 flex-grow-0">
        <Button
          className="genre-title !m-0 !block w-full truncate !rounded-none !border-0 !p-0 !text-left !text-2xl text-font-color-white outline-1 outline-offset-1 focus-visible:!outline dark:text-font-color-white"
          label={title}
          clickHandler={goToGenreInfoPage}
        />
        <div className="genre-no-of-songs text-sm text-font-color-white/75 dark:text-font-color-white/75">
          {t(`common.songWithCount`, {
            count: songIds.length,
          })}
        </div>
        {isMultipleSelectionEnabled &&
          multipleSelectionsData.selectionType === 'genre' && (
            <MultipleSelectionCheckbox
              id={genreId}
              selectionType="genre"
              className="z-10 !mt-2"
            />
          )}
      </div>
    </div>
  );
};

export default Genre;
