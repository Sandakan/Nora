import { lazy, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Img from '../Img';
import Button from '../Button';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';
import DefaultPlaylistCover from '../../assets/images/webp/playlist_cover_default.webp';
import MultipleArtworksCover from './MultipleArtworksCover';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';
import { useNavigate } from '@tanstack/react-router';
import NavLink from '../NavLink';
import { SpecialPlaylists } from '@common/playlists.enum';

const ConfirmDeletePlaylistsPrompt = lazy(() => import('./ConfirmDeletePlaylistsPrompt'));
const RenamePlaylistPrompt = lazy(() => import('./RenamePlaylistPrompt'));

interface PlaylistProp extends Playlist {
  index: number;
  selectAllHandler?: (_upToId?: number) => void;
}

export const Playlist = (props: PlaylistProp) => {
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);
  const queue = useStore(store, (state) => state.localStorage.queue);

  const {
    updateQueueData,
    updateContextMenuData,
    changePromptMenuData,
    createQueue,
    toggleMultipleSelections,
    updateMultipleSelections,
    addNewNotifications
  } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const openPlaylistInfoPage = useCallback(
    () =>
      navigate({
        to: '/main-player/playlists/$playlistId',
        params: { playlistId: String(props.playlistId) }
      }),
    [navigate, props.playlistId]
  );

  const isAMultipleSelection = useMemo(() => {
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

  const playAllSongs = useCallback(
    (isShuffling = false) => {
      window.api.audioLibraryControls
        .getSongInfo(props.songs, undefined, undefined, undefined, true)
        .then((songs) => {
          if (Array.isArray(songs))
            return createQueue(
              songs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
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

  const playAllSongsForMultipleSelections = useCallback(
    (isShuffling = false) => {
      const { multipleSelections: playlistIds } = multipleSelectionsData;
      window.api.playlistsData
        .getPlaylistData(playlistIds)
        .then((playlists) => {
          const ids = playlists.data.map((playlist) => playlist.songs).flat();

          return window.api.audioLibraryControls.getSongInfo(
            ids,
            undefined,
            undefined,
            undefined,
            true
          );
        })
        .then((songs) => {
          if (Array.isArray(songs)) {
            const songIds = songs.filter((song) => !song.isBlacklisted).map((song) => song.songId);
            createQueue(songIds, 'songs', isShuffling);
            return addNewNotifications([
              {
                id: `${songIds.length}AddedToQueueFromMultiSelection`,
                duration: 5000,
                content: t(`notifications.addedToQueue`, {
                  count: songIds.length
                })
              }
            ]);
          }
          return undefined;
        })
        .catch((err) => console.error(err));
    },
    [addNewNotifications, createQueue, multipleSelectionsData, t]
  );

  const addToQueueForMultipleSelections = useCallback(() => {
    const { multipleSelections: playlistIds } = multipleSelectionsData;
    window.api.playlistsData
      .getPlaylistData(playlistIds)
      .then((playlists) => {
        if (Array.isArray(playlists) && playlists.length > 0) {
          const playlistSongIds = playlists.map((playlist) => playlist.songs).flat();

          return window.api.audioLibraryControls.getSongInfo(
            playlistSongIds,
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

  const contextMenus: ContextMenuItem[] = useMemo(() => {
    const { multipleSelections: playlistIds } = multipleSelectionsData;
    const isMultipleSelectionsEnabled =
      multipleSelectionsData.selectionType === 'playlist' &&
      multipleSelectionsData.multipleSelections.length !== 1 &&
      isAMultipleSelection;

    return [
      {
        label: t(`common.${isMultipleSelectionsEnabled ? 'playAll' : 'play'}`),
        iconName: 'play_arrow',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) playAllSongsForMultipleSelections();
          else playAllSongs();
          toggleMultipleSelections(false);
        }
      },
      {
        label: isMultipleSelectionsEnabled
          ? t(`common.shuffleAndPlayAll`)
          : t(`common.shuffleAndPlay`),
        iconName: 'shuffle',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) playAllSongsForMultipleSelections(true);
          else playAllSongs(true);
          toggleMultipleSelections(false);
        }
      },
      {
        label: t(`common.addToQueue`),
        iconName: 'queue',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled) addToQueueForMultipleSelections();
          else {
            queue.songIds.push(...props.songs);
            updateQueueData(undefined, queue.songIds);
            addNewNotifications([
              {
                id: 'newSongsToQueue',
                duration: 5000,
                content: t(`notifications.addedToQueue`, {
                  count: props.songs.length
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
        label: t(`playlist.${props.isArtworkAvailable ? 'changeArtwork' : 'addArtwork'}`),
        iconName: 'photo_camera',
        handlerFunction: () => {
          window.api.songUpdates
            .getImgFileLocation()
            .then((artworkPath) => {
              if (artworkPath) {
                return window.api.playlistsData.addArtworkToAPlaylist(
                  props.playlistId,
                  artworkPath
                );
              }
              return undefined;
            })
            .then(() => {
              return addNewNotifications([
                {
                  content: t('playlist.playlistArtworkUpdateSuccess'),
                  icon: <span className="material-icons-round">done</span>,
                  duration: 5000,
                  id: 'PlaylistArtworkUpdateSuccessful'
                }
              ]);
            })
            .catch((err) => console.error(err));
        },
        isDisabled: isMultipleSelectionsEnabled
          ? false
          : props.playlistId === SpecialPlaylists.Favorites ||
            props.playlistId === SpecialPlaylists.History // Special playlists IDs for History and Favorites
      },
      {
        label: t('playlist.renamePlaylist'),
        iconName: 'edit',
        handlerFunction: () => {
          changePromptMenuData(true, <RenamePlaylistPrompt playlistData={props} />);
        },
        isDisabled: isMultipleSelectionsEnabled
          ? false
          : props.playlistId === SpecialPlaylists.Favorites ||
            props.playlistId === SpecialPlaylists.History // Special playlists IDs for History and Favorites
      },
      {
        label: t(`common.${isAMultipleSelection ? 'unselect' : 'select'}`),
        iconName: 'checklist',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) {
            updateMultipleSelections(
              props.playlistId,
              'playlist',
              isAMultipleSelection ? 'remove' : 'add'
            );
          } else toggleMultipleSelections(!isAMultipleSelection, 'playlist', [props.playlistId]);
        }
      },
      {
        label: t('playlist.exportPlaylist'),
        iconName: 'upload',
        handlerFunction: () => window.api.playlistsData.exportPlaylist(props.playlistId),
        isDisabled: isMultipleSelectionsEnabled
      },
      // {
      //   label: 'Select/Unselect All',
      //   iconName: 'checklist',
      //   isDisabled: !props.selectAllHandler,
      //   handlerFunction: () =>
      //     props.selectAllHandler && props.selectAllHandler(),
      // },
      {
        label: t('common.info'),
        iconName: 'info',
        handlerFunction: openPlaylistInfoPage,
        isDisabled: isMultipleSelectionsEnabled
      },
      {
        label: 'Hr',
        isContextMenuItemSeperator: true,
        handlerFunction: () => true,
        isDisabled: isMultipleSelectionsEnabled
          ? false
          : props.playlistId === SpecialPlaylists.Favorites ||
            props.playlistId === SpecialPlaylists.History // Special playlists IDs for History and Favorites
      },
      {
        label: t(
          `playlist.${isMultipleSelectionsEnabled ? 'deleteSelectedPlaylists' : 'deletePlaylist_one'}`
        ),
        iconName: 'delete_outline',
        handlerFunction: () => {
          changePromptMenuData(
            true,
            <ConfirmDeletePlaylistsPrompt
              playlistIds={isMultipleSelectionsEnabled ? playlistIds : [props.playlistId]}
              playlistName={props.name}
            />
          );
          toggleMultipleSelections(false);
        },
        isDisabled: isMultipleSelectionsEnabled
          ? false
          : props.playlistId === SpecialPlaylists.Favorites ||
            props.playlistId === SpecialPlaylists.History // Special playlists IDs for History and Favorites
      }
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
    queue.songIds,
    t,
    toggleMultipleSelections,
    updateMultipleSelections,
    updateQueueData
  ]);

  const contextMenuItemData = useMemo(
    (): ContextMenuAdditionalData =>
      isMultipleSelectionEnabled &&
      multipleSelectionsData.selectionType === 'playlist' &&
      isAMultipleSelection
        ? {
            title: t('playlist.selectedPlaylistCount', {
              count: multipleSelectionsData.multipleSelections.length
            }),
            artworkPath: DefaultPlaylistCover
          }
        : {
            title: props.name,
            artworkPath: props?.artworkPaths?.optimizedArtworkPath,
            subTitle: t('common.songWithCount', { count: props.songs.length })
          },
    [
      isAMultipleSelection,
      isMultipleSelectionEnabled,
      multipleSelectionsData.multipleSelections.length,
      multipleSelectionsData.selectionType,
      props?.artworkPaths?.optimizedArtworkPath,
      props.name,
      props.songs.length,
      t
    ]
  );

  return (
    <NavLink
      to={'/main-player/playlists/$playlistId'}
      params={{ playlistId: String(props.playlistId) }}
      preload={isMultipleSelectionEnabled ? false : undefined}
      className={`playlist group hover:bg-background-color-2/50 dark:hover:bg-dark-background-color-2/50 ${
        props.playlistId
      } text-font-color-black dark:text-font-color-white mr-12 mb-8 flex h-fit max-h-52 min-h-48 w-36 flex-col justify-between rounded-md p-4 ${
        isAMultipleSelection
          ? 'bg-background-color-3! text-font-color-black! dark:bg-dark-background-color-3! dark:text-font-color-black!'
          : ''
      }`}
      data-playlist-id={props.playlistId}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(true, contextMenus, e.pageX, e.pageY, contextMenuItemData);
      }}
      onClick={(e) => {
        e.preventDefault();
        if (e.getModifierState('Shift') === true && props.selectAllHandler)
          props.selectAllHandler(props.playlistId);
        else if (e.getModifierState('Control') === true && !isMultipleSelectionEnabled)
          toggleMultipleSelections(!isAMultipleSelection, 'playlist', [props.playlistId]);
        else if (isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'playlist')
          updateMultipleSelections(
            props.playlistId,
            'playlist',
            isAMultipleSelection ? 'remove' : 'add'
          );
        else openPlaylistInfoPage();
      }}
    >
      <div className="playlist-cover-and-play-btn-container relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl before:invisible before:absolute before:z-10 before:h-full before:w-full before:bg-linear-to-b before:from-[hsla(0,0%,0%,0%)] before:to-[hsla(0,0%,0%,40%)] before:opacity-0 before:transition-[visibility,opacity] before:duration-300 before:content-[''] group-focus-within:before:visible group-focus-within:before:opacity-100 group-hover:before:visible group-hover:before:opacity-100">
        {isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'playlist' ? (
          <MultipleSelectionCheckbox
            id={props.playlistId}
            selectionType="playlist"
            className="absolute right-3 bottom-3 z-10"
          />
        ) : (
          <Button
            className="text-font-color-white dark:text-font-color-white! absolute right-2 bottom-2 z-10 m-0! translate-y-10 scale-90 rounded-none! border-0! bg-transparent p-0! opacity-0 outline-offset-1 transition-[opacity,transform] delay-100 duration-200 ease-in-out group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 hover:bg-transparent focus-visible:outline! dark:bg-transparent dark:hover:bg-transparent"
            clickHandler={() => playAllSongs()}
            iconName="play_circle"
            iconClassName="text-4xl! leading-none! text-inherit!"
          />
        )}
        <div className="playlist-cover-container h-full cursor-pointer overflow-hidden">
          {preferences?.enableArtworkFromSongCovers && props.songs.length > 2 ? (
            <div className="relative aspect-square w-full">
              <MultipleArtworksCover
                songIds={props.songs}
                className="aspect-square w-full"
                enableImgFadeIns={!isMultipleSelectionEnabled}
              />
              <Img
                src={props.artworkPaths.artworkPath}
                alt="Playlist Cover"
                loading="lazy"
                className="absolute! bottom-1 left-1 h-8 w-8 rounded-md!"
                enableImgFadeIns={!isMultipleSelectionEnabled}
              />
            </div>
          ) : (
            <Img
              src={props.artworkPaths.artworkPath}
              alt="Playlist Cover"
              loading="lazy"
              className="h-full w-full"
              enableImgFadeIns={!isMultipleSelectionEnabled}
            />
          )}
        </div>
      </div>
      <div className="playlist-info-container mt-2">
        <Button
          className={`playlist-title m-0! block! w-full truncate rounded-none! border-0! bg-transparent p-0! text-left! text-xl! outline-offset-1 hover:bg-transparent hover:underline focus-visible:outline! dark:bg-transparent dark:hover:bg-transparent ${
            isAMultipleSelection && 'text-font-color-black! dark:text-font-color-black!'
          }`}
          tooltipLabel={props.name}
          clickHandler={() => {
            if (isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'playlist') {
              updateMultipleSelections(
                props.playlistId,
                'playlist',
                isAMultipleSelection ? 'remove' : 'add'
              );
            } else {
              openPlaylistInfoPage();
            }
          }}
          label={props.name}
        />
        <div className="playlist-no-of-songs text-sm font-light">
          {t('common.songWithCount', { count: props.songs.length })}
        </div>
      </div>
    </NavLink>
  );
};
