import { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import Img from '../Img';
import DefaultGenreCover from '../../assets/images/webp/genre-cover-default.webp';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';
import Button from '../Button';
import { store } from '@renderer/store/store';
import { useStore } from '@tanstack/react-store';
import { useNavigate } from '@tanstack/react-router';
import NavLink from '../NavLink';

interface GenreProp {
  index: number;
  genreId: number;
  title: string;
  songIds: number[];
  artworkPaths: ArtworkPaths;
  paletteData?: PaletteData;
  className?: string;
  selectAllHandler?: (_upToId?: number) => void;
}

const Genre = (props: GenreProp) => {
  const { genreId, songIds, title, artworkPaths, paletteData, className, selectAllHandler } = props;
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);
  const queue = useStore(store, (state) => state.localStorage.queue);

  const {
    createQueue,
    updateQueueData,
    addNewNotifications,
    updateContextMenuData,
    toggleMultipleSelections,
    updateMultipleSelections
  } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goToGenreInfoPage = useCallback(
    () =>
      navigate({
        to: '/main-player/genres/$genreId',
        params: { genreId: String(genreId) }
      }),
    [genreId, navigate]
  );

  const backgroundColor = useMemo(() => {
    const swatch = paletteData?.DarkVibrant;
    if (swatch?.hsl) {
      const { hsl } = swatch;

      return `hsl(${hsl[0] * 360} ${hsl[1] * 100}% ${hsl[2] * 100}%)`;
    }
    return undefined;
  }, [paletteData?.DarkVibrant]);

  const playGenreSongs = useCallback(
    (isShuffle = false) => {
      return window.api.audioLibraryControls
        .getSongInfo(songIds, undefined, undefined, undefined, true)
        .then((songs) => {
          if (Array.isArray(songs))
            return createQueue(
              songs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
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

  const playGenreSongsForMultipleSelections = useCallback(
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
              undefined,
              true
            );
          }
          return undefined;
        })
        .then((songs) => {
          if (Array.isArray(songs))
            return createQueue(
              songs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
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

  const addToQueueForMultipleSelections = useCallback(() => {
    const { multipleSelections: genreIds } = multipleSelectionsData;
    window.api.genresData
      .getGenresData(genreIds)
      .then((genres) => {
        if (Array.isArray(genres) && genres.length > 0) {
          const genreSongIds = genres.map((genre) => genre.songs.map((song) => song.songId)).flat();

          return window.api.audioLibraryControls.getSongInfo(
            genreSongIds,
            undefined,
            undefined,
            undefined,
            true
          );
        }
        return undefined;
      })
      .then((songs) => {
        if (Array.isArray(songs)) {
          queue.songIds.push(
            ...songs.filter((song) => !song.isBlacklisted).map((song) => song.songId)
          );
          updateQueueData(undefined, queue.songIds);
          addNewNotifications([
            {
              id: 'newSongsToQueue',
              duration: 5000,
              content: t(`notifications.addedToQueue`, {
                count: songs.length
              })
            }
          ]);
        }
        return undefined;
      })
      .catch((err) => console.error(err));
  }, [addNewNotifications, multipleSelectionsData, queue.songIds, t, updateQueueData]);

  const isAMultipleSelection = useMemo(() => {
    if (!multipleSelectionsData.isEnabled) return false;
    if (multipleSelectionsData.selectionType !== 'genre') return false;
    if (multipleSelectionsData.multipleSelections.length <= 0) return false;
    if (multipleSelectionsData.multipleSelections.some((selectionId) => selectionId === genreId))
      return true;
    return false;
  }, [multipleSelectionsData, genreId]);

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    const isMultipleSelectionsEnabled =
      multipleSelectionsData.selectionType === 'genre' &&
      multipleSelectionsData.multipleSelections.length !== 1 &&
      isAMultipleSelection;

    return [
      {
        label: t(`common.${isMultipleSelectionsEnabled ? 'playAll' : 'play'}`),
        iconName: 'play_arrow',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled) playGenreSongsForMultipleSelections();
          else playGenreSongs();
          toggleMultipleSelections(false);
        }
      },
      {
        label: isMultipleSelectionsEnabled
          ? t(`common.shuffleAndPlayAll`)
          : t(`common.shuffleAndPlay`),
        iconName: 'shuffle',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled) playGenreSongsForMultipleSelections(true);
          else playGenreSongs(true);
          toggleMultipleSelections(false);
        }
      },
      {
        label: t(`common.addToQueue`),
        iconName: 'queue',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled) addToQueueForMultipleSelections();
          else {
            queue.songIds.push(...songIds);
            updateQueueData(undefined, queue.songIds);
            addNewNotifications([
              {
                id: 'newSongsToQueue',
                duration: 5000,
                content: t(`notifications.addedToQueue`, {
                  count: songIds.length
                })
              }
            ]);
          }
          toggleMultipleSelections(false);
        }
      },
      {
        label: 'Hr',
        isContextMenuItemSeperator: true,
        handlerFunction: () => true
      },
      {
        label: t(`common.${isAMultipleSelection ? 'unselect' : 'select'}`),
        iconName: 'checklist',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) {
            return updateMultipleSelections(
              genreId,
              'genre',
              isAMultipleSelection ? 'remove' : 'add'
            );
          }
          return toggleMultipleSelections(!isAMultipleSelection, 'genre', [genreId]);
        }
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
        isDisabled: isMultipleSelectionsEnabled
      }
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
    queue,
    songIds,
    updateQueueData,
    addNewNotifications,
    isMultipleSelectionEnabled,
    genreId,
    updateMultipleSelections
  ]);

  const contextMenuItemData = useMemo(
    () =>
      isMultipleSelectionEnabled &&
      multipleSelectionsData.selectionType === 'genre' &&
      isAMultipleSelection
        ? {
            title: t(`genre.selectedGenreCount`, {
              count: multipleSelectionsData.multipleSelections.length
            }),
            artworkPath: DefaultGenreCover
          }
        : {
            title,
            artworkPath: artworkPaths?.optimizedArtworkPath,
            subTitle: t('common.songWithCount', { count: songIds.length })
          },
    [
      artworkPaths?.optimizedArtworkPath,
      isAMultipleSelection,
      isMultipleSelectionEnabled,
      multipleSelectionsData.multipleSelections.length,
      multipleSelectionsData.selectionType,
      songIds.length,
      t,
      title
    ]
  );

  return (
    <NavLink
      to="/main-player/genres/$genreId"
      params={{ genreId: String(genreId) }}
      preload={isMultipleSelectionEnabled ? false : undefined}
      className={`genre group bg-background-color-2/70 hover:bg-background-color-2! dark:bg-dark-background-color-2/70 dark:hover:bg-dark-background-color-2! text-background-color-2 dark:text-dark-background-color-2 relative mr-10 mb-6 flex h-36 w-72 cursor-pointer items-center gap-4 overflow-hidden rounded-2xl p-4 backdrop-blur-md transition-[border,border-color] ${className} ${
        isMultipleSelectionEnabled &&
        multipleSelectionsData.selectionType === 'genre' &&
        'border-4 border-transparent'
      } ${isAMultipleSelection && 'border-font-color-highlight! dark:border-dark-font-color-highlight!'}`}
      style={{
        backgroundColor
      }}
      onClick={(e) => {
        e.preventDefault();
        if (e.getModifierState('Shift') === true && selectAllHandler) selectAllHandler(genreId);
        else if (e.getModifierState('Control') === true && !isMultipleSelectionEnabled)
          toggleMultipleSelections(!isAMultipleSelection, 'genre', [genreId]);
        else if (isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'genre')
          updateMultipleSelections(genreId, 'genre', isAMultipleSelection ? 'remove' : 'add');
        else goToGenreInfoPage();
      }}
      onContextMenu={(e) =>
        updateContextMenuData(true, contextMenuItems, e.pageX, e.pageY, contextMenuItemData)
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
      <div className="genre-info-container w-3/5 grow-0">
        <Button
          className="genre-title text-font-color-white dark:text-font-color-white m-0! block! w-full truncate rounded-none! border-0! bg-transparent p-0! text-left! text-2xl! outline-offset-1 hover:bg-transparent focus-visible:outline! dark:bg-transparent dark:hover:bg-transparent"
          label={title}
          clickHandler={goToGenreInfoPage}
        />
        <div className="genre-no-of-songs text-font-color-white/75 dark:text-font-color-white/75 text-sm">
          {t(`common.songWithCount`, {
            count: songIds.length
          })}
        </div>
        {isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'genre' && (
          <MultipleSelectionCheckbox id={genreId} selectionType="genre" className="z-10 mt-2!" />
        )}
      </div>
    </NavLink>
  );
};

export default Genre;
