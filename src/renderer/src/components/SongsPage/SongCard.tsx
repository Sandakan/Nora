/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { lazy, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Img from '../Img';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';
import SongArtist from './SongArtist';
import Button from '../Button';

const AddSongsToPlaylistsPrompt = lazy(() => import('./AddSongsToPlaylistsPrompt'));
const BlacklistSongConfrimPrompt = lazy(() => import('./BlacklistSongConfirmPrompt'));
const DeleteSongsFromSystemConfrimPrompt = lazy(
  () => import('./DeleteSongsFromSystemConfrimPrompt')
);

import DefaultSongCover from '../../assets/images/webp/song_cover_default.webp';
import { useStore } from '@tanstack/react-store';
import { store } from '../../store/store';
import { useNavigate } from '@tanstack/react-router';
import NavLink from '../NavLink';

interface SongCardProp {
  index: number;
  songId: number;
  artworkPath: string;
  path: string;
  title: string;
  artists?: { name: string; artistId: number }[];
  album?: { name: string; albumId: number };
  palette?: NodeVibrantPalette;
  isAFavorite: boolean;
  className?: string;
  isBlacklisted: boolean;
  selectAllHandler?: (_upToId?: number) => void;
}

const SongCard = (props: SongCardProp) => {
  const currentSongData = useStore(store, (state) => state.currentSongData);
  const queue = useStore(store, (state) => state.localStorage.queue);
  const doNotShowBlacklistSongConfirm = useStore(
    store,
    (state) => state.localStorage.preferences.doNotShowBlacklistSongConfirm
  );
  const isCurrentSongPlaying = useStore(store, (state) => state.player.isCurrentSongPlaying);
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);

  const {
    playSong,
    updateContextMenuData,
    updateQueueData,
    addNewNotifications,
    changePromptMenuData,
    toggleIsFavorite,
    toggleMultipleSelections,
    updateMultipleSelections,
    createQueue
  } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    title,
    artworkPath,
    index,
    isAFavorite,
    path,
    songId,
    artists,
    album,
    className,
    isBlacklisted,
    palette,
    selectAllHandler
  } = props;

  const [isSongAFavorite, setIsSongAFavorite] = useState(
    songId === currentSongData.songId ? currentSongData.isAFavorite : isAFavorite
  );
  const [isSongPlaying, setIsSongPlaying] = useState(
    currentSongData ? currentSongData.songId === songId && isCurrentSongPlaying : false
  );
  useEffect(() => {
    setIsSongPlaying(() => {
      if (currentSongData) return currentSongData.songId === songId && isCurrentSongPlaying;
      return false;
    });
    setIsSongAFavorite((prevState) => {
      if (currentSongData?.songId === songId) return currentSongData.isAFavorite;
      return prevState;
    });
  }, [currentSongData, isCurrentSongPlaying, songId]);

  const [h, s, l] = useMemo(() => {
    const swatch = palette?.LightVibrant;
    if (swatch?.hsl) {
      const { hsl } = swatch;

      return [`${hsl[0] * 360}`, `${hsl[1] * 100}%`, `${hsl[2] * 100}%`];
    }
    return ['0', '0%', '0%'];
  }, [palette?.LightVibrant]);

  const background = `linear-gradient(to top,hsl(${h} ${s} ${l} / 0.35) 0%, hsl(${h} ${s} ${l} / 0.15) 40%), linear-gradient(to top,rgba(0,0,0,0.8)0%,rgba(0,0,0,0.1) 60%)`;

  const handlePlayBtnClick = useCallback(() => {
    playSong(songId);
  }, [playSong, songId]);

  const isAMultipleSelection = useMemo(() => {
    if (!multipleSelectionsData.isEnabled) return false;
    if (multipleSelectionsData.selectionType !== 'songs') return false;
    if (multipleSelectionsData.multipleSelections.length <= 0) return false;
    if (multipleSelectionsData.multipleSelections.some((selectionId) => selectionId === songId))
      return true;
    return false;
  }, [multipleSelectionsData, songId]);

  const contextMenuItemData =
    isMultipleSelectionEnabled &&
    multipleSelectionsData.selectionType === 'songs' &&
    isAMultipleSelection
      ? {
          title: t('song.selectedSongCount', {
            count: multipleSelectionsData.multipleSelections.length
          }),
          artworkPath: DefaultSongCover
        }
      : {
          title: title || t('common.unknownTitle'),
          subTitle: artists?.map((artist) => artist.name).join(', ') ?? t('common.unknownArtist'),
          artworkPath
        };

  const handleLikeButtonClick = useCallback(() => {
    window.api.playerControls
      .toggleLikeSongs([songId], !isSongAFavorite)
      .then((res) => {
        if (res && res.likes.length + res.dislikes.length > 0) {
          if (currentSongData.songId === songId)
            toggleIsFavorite(!currentSongData.isAFavorite, true);
          return setIsSongAFavorite((prevData) => !prevData);
        }
        return undefined;
      })
      .catch((err) => console.error(err));
  }, [
    currentSongData.isAFavorite,
    currentSongData.songId,
    isSongAFavorite,
    songId,
    toggleIsFavorite
  ]);

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    const isMultipleSelectionsEnabled =
      multipleSelectionsData.selectionType === 'songs' &&
      multipleSelectionsData.multipleSelections.length !== 1 &&
      isAMultipleSelection;

    const { multipleSelections: songIds } = multipleSelectionsData;

    const items: ContextMenuItem[] = [
      {
        label: t('common.play'),
        handlerFunction: () => {
          handlePlayBtnClick();
          toggleMultipleSelections(false);
        },
        iconName: 'play_arrow',
        isDisabled: isMultipleSelectionsEnabled
      },
      {
        label: t('common.createAQueue'),
        handlerFunction: () => {
          createQueue(songIds, 'songs', false, undefined, true);
          toggleMultipleSelections(false);
        },
        iconName: 'queue_music',
        isDisabled: !isMultipleSelectionsEnabled
      },

      {
        label: t(`common.${isMultipleSelectionsEnabled ? 'playNextAll' : 'playNext'}`),
        iconName: 'shortcut',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled) {
            let currentSongIndex = queue.position ?? queue.songIds.indexOf(currentSongData.songId);
            const duplicateIds: number[] = [];

            const newQueue = queue.songIds.filter((id) => {
              const isADuplicate = songIds.includes(id);
              if (isADuplicate) duplicateIds.push(id);

              return !isADuplicate;
            });

            for (const duplicateId of duplicateIds) {
              const duplicateIdPosition = queue.songIds.indexOf(duplicateId);

              if (
                duplicateIdPosition !== -1 &&
                duplicateIdPosition < currentSongIndex &&
                currentSongIndex - 1 >= 0
              )
                currentSongIndex -= 1;
            }

            newQueue.splice(currentSongIndex + 1, 0, ...songIds);

            updateQueueData(currentSongIndex, newQueue, undefined, false);
            addNewNotifications([
              {
                id: `${title}PlayNext`,
                content: t('notifications.playingNextSongsWithCount', {
                  count: songIds.length
                }),
                iconName: 'shortcut'
              }
            ]);
          } else {
            const newQueue = queue.songIds.filter((id) => id !== songId);
            newQueue.splice(newQueue.indexOf(currentSongData.songId) + 1 || 0, 0, songId);

            const duplicateSongIndex = queue.songIds.indexOf(songId);

            const currentSongIndex =
              queue.position && duplicateSongIndex !== -1 && duplicateSongIndex < queue.position
                ? queue.position - 1
                : undefined;

            updateQueueData(currentSongIndex, newQueue, undefined, false);
            addNewNotifications([
              {
                id: `${title}PlayNext`,
                content: t('notifications.playingNext', { title }),
                iconName: 'shortcut'
              }
            ]);
          }
          toggleMultipleSelections(false);
        }
      },
      {
        label: t('common.addToQueue'),
        iconName: 'queue',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled) {
            updateQueueData(undefined, [...queue.songIds, ...songIds], false);
            addNewNotifications([
              {
                id: `${songIds.length}AddedToQueueFromMultiSelection`,
                content: t('notifications.addedToQueue', {
                  count: songIds.length
                }),
                iconName: 'add'
              }
            ]);
          } else {
            updateQueueData(undefined, [...queue.songIds, songId], false);
            addNewNotifications([
              {
                id: `${title}AddedToQueue`,
                content: t('notifications.addedToQueue', {
                  count: 1
                }),
                icon: <Img src={artworkPath} loading="lazy" alt="Song Artwork" />
              }
            ]);
          }
          toggleMultipleSelections(false);
        }
      },
      {
        label: isMultipleSelectionsEnabled
          ? t('song.toggleLikeSongs')
          : t(`song.${isSongAFavorite ? 'unlikeSong' : 'likeSong'}`),
        iconName: `favorite`,
        iconClassName: isMultipleSelectionsEnabled
          ? 'material-icons-round-outlined mr-4 text-xl'
          : isSongAFavorite
            ? 'material-icons-round mr-4 text-xl'
            : 'material-icons-round-outlined mr-4 text-xl',
        handlerFunction: () => {
          window.api.playerControls
            .toggleLikeSongs(isMultipleSelectionsEnabled ? [...songIds] : [songId])
            .then((res) => {
              if (res && res.likes.length + res.dislikes.length > 0) {
                if (isMultipleSelectionsEnabled) {
                  for (let i = 0; i < songIds.length; i += 1) {
                    const id = songIds[i];
                    if (currentSongData.songId === id)
                      toggleIsFavorite(!currentSongData.isAFavorite);
                    if (id === songId) setIsSongAFavorite((prevState) => !prevState);
                  }
                } else {
                  if (currentSongData.songId === songId)
                    toggleIsFavorite(!currentSongData.isAFavorite);
                  return setIsSongAFavorite((prevData) => !prevData);
                }
              }
              return undefined;
            })
            .catch((err) => console.error(err));
          toggleMultipleSelections(false);
        }
      },
      {
        label: t('song.addToPlaylists'),
        iconName: 'playlist_add',
        handlerFunction: () => {
          changePromptMenuData(
            true,
            <AddSongsToPlaylistsPrompt
              songIds={isAMultipleSelection ? songIds : [songId]}
              title={title}
            />
          );
          toggleMultipleSelections(false);
        }
      },
      {
        label: t(`common.${isAMultipleSelection ? 'unselect' : 'select'}`),
        iconName: 'checklist',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) {
            return updateMultipleSelections(
              songId,
              'songs',
              isAMultipleSelection ? 'remove' : 'add'
            );
          }
          return toggleMultipleSelections(!isAMultipleSelection, 'songs', [songId]);
        }
      },
      // {
      //   label: 'Select/Unselect All',
      //   iconName: 'checklist',
      //   isDisabled: !selectAllHandler,
      //   handlerFunction: () => selectAllHandler && selectAllHandler(),
      // },
      {
        label: 'Hr',
        isContextMenuItemSeperator: true,
        handlerFunction: () => true,
        isDisabled: isMultipleSelectionsEnabled
      },
      {
        label: t('song.showInFileExplorer'),
        class: 'reveal-file-explorer',
        iconName: 'folder_open',
        handlerFunction: () => window.api.songUpdates.revealSongInFileExplorer(songId),
        isDisabled: isMultipleSelectionsEnabled
      },
      {
        label: t('common.info'),
        class: 'info',
        iconName: 'info',
        handlerFunction: () =>
          navigate({ to: '/main-player/songs/$songId', params: { songId: String(songId) } }),
        isDisabled: isMultipleSelectionsEnabled
      },
      {
        label: t('song.goToAlbum'),
        iconName: 'album',
        handlerFunction: () =>
          album &&
          navigate({
            to: '/main-player/albums/$albumId',
            params: { albumId: String(album.albumId) }
          }),
        isDisabled: !album
      },
      {
        label: t('song.editSongTags'),
        class: 'edit',
        iconName: 'edit',
        handlerFunction: () => {
          // TODO: Implement song tags editor page navigation
          // changeCurrentActivePage('SongTagsEditor', {
          //   songId,
          //   songArtworkPath: artworkPath,
          //   songPath: path
          // });
        },
        isDisabled: isMultipleSelectionsEnabled
      },
      {
        label: t('song.reparseSong'),
        class: 'sync',
        iconName: 'sync',
        handlerFunction: () => window.api.songUpdates.reParseSong(path),
        isDisabled: isMultipleSelectionsEnabled
      },
      {
        label: 'Hr',
        isContextMenuItemSeperator: true,
        handlerFunction: () => true,
        isDisabled: isMultipleSelectionsEnabled
      },
      {
        label: t(`song.${isBlacklisted ? 'deblacklist' : 'blacklistSong'}`, {
          count: 1
        }),
        iconName: isBlacklisted ? 'settings_backup_restore' : 'block',
        handlerFunction: () => {
          if (isBlacklisted)
            window.api.audioLibraryControls
              .restoreBlacklistedSongs([songId])
              .catch((err) => console.error(err));
          else if (doNotShowBlacklistSongConfirm)
            window.api.audioLibraryControls
              .blacklistSongs([songId])
              .then(() =>
                addNewNotifications([
                  {
                    id: `${title}Blacklisted`,
                    duration: 5000,
                    content: t('notifications.songBlacklisted', { title }),
                    iconName: 'block'
                  }
                ])
              )
              .catch((err) => console.error(err));
          else
            changePromptMenuData(
              true,
              <BlacklistSongConfrimPrompt title={title} songIds={[songId]} />
            );
          return toggleMultipleSelections(false);
        },
        isDisabled: isMultipleSelectionsEnabled
      },
      {
        label: t('song.delete'),
        iconName: 'delete',
        handlerFunction: () => {
          changePromptMenuData(
            true,
            <DeleteSongsFromSystemConfrimPrompt
              songIds={isMultipleSelectionsEnabled ? songIds : [songId]}
            />
          );
          toggleMultipleSelections(false);
        }
      }
    ];
    return items;
  }, [
    multipleSelectionsData,
    isAMultipleSelection,
    t,
    isSongAFavorite,
    album,
    isBlacklisted,
    handlePlayBtnClick,
    toggleMultipleSelections,
    createQueue,
    queue.position,
    queue.songIds,
    currentSongData.songId,
    currentSongData.isAFavorite,
    updateQueueData,
    addNewNotifications,
    title,
    songId,
    artworkPath,
    toggleIsFavorite,
    changePromptMenuData,
    isMultipleSelectionEnabled,
    updateMultipleSelections,
    navigate,
    path,
    doNotShowBlacklistSongConfirm
  ]);

  const songArtistComponents = useMemo(() => {
    if (Array.isArray(artists) && artists.length > 0) {
      return artists
        .map((artist, i) => {
          const arr = [
            <SongArtist
              key={artist.artistId}
              artistId={artist.artistId}
              name={artist.name}
              className="text-font-color-white/80! dark:text-font-color-white/80!"
            />
          ];

          if ((artists?.length ?? 1) - 1 !== i)
            arr.push(
              <span className="mr-1" key={`${artists[i].name}=>${artists[i + 1].name}`}>
                ,
              </span>
            );

          return arr;
        })
        .flat();
    }
    return <span className="text-xs font-normal">{t('common.unknownArtist')}</span>;
  }, [artists, t]);

  return (
    <div
      style={{
        animationDelay: `${50 * (index + 1)}ms`
      }}
      className={`song song-card appear-from-bottom ${songId} ${
        currentSongData.songId === songId && 'current-song'
      } ${
        isSongPlaying && 'playing'
      } group/songCard relative mr-2 mb-2 aspect-2/1 max-w-[24rem] min-w-[15rem] overflow-hidden rounded-2xl border-[transparent] shadow-xl transition-[border-color] ease-in-out ${
        className || ''
      } ${
        isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'songs' && 'border-4'
      } ${
        isAMultipleSelection &&
        'border-font-color-highlight! dark:border-dark-font-color-highlight!'
      }`}
      data-song-id={songId}
      onDoubleClick={handlePlayBtnClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(true, contextMenuItems, e.pageX, e.pageY, contextMenuItemData);
      }}
      onClick={(e) => {
        e.preventDefault();
        if (e.getModifierState('Shift') === true && selectAllHandler) selectAllHandler(songId);
        else if (e.getModifierState('Control') === true && !isMultipleSelectionEnabled)
          toggleMultipleSelections(!isAMultipleSelection, 'songs', [songId]);
        else if (isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'songs')
          updateMultipleSelections(songId, 'songs', isAMultipleSelection ? 'remove' : 'add');
      }}
      title={isBlacklisted ? `'${title}' is blacklisted.` : undefined}
    >
      <div className="h-full w-full">
        <Img
          src={artworkPath}
          loading="eager"
          alt="Song cover"
          className={`h-full w-full object-cover object-center transition-[filter] group-focus-within/songCard:brightness-90 group-hover/songCard:brightness-90 dark:brightness-90 ${
            isBlacklisted && 'brightness-50! dark:brightness-[.40]!'
          }`}
          enableImgFadeIns={!isMultipleSelectionEnabled}
        />
      </div>
      <div
        className="song-info-and-controls-container absolute top-0 flex h-full w-full flex-col justify-between px-4 py-4"
        data-song-id={songId}
        style={{ background }}
      >
        <div className="song-states-container flex items-center justify-between">
          <div className="state-info flex">
            {typeof queue.position === 'number' &&
              Array.isArray(queue.songIds) &&
              queue.songIds.length > 0 &&
              queue?.songIds?.at(queue.position + 1) === songId && (
                <span className="text-font-color-white! mr-2 font-semibold uppercase opacity-50 transition-opacity group-hover/songCard:opacity-90 last:mr-0">
                  {t('song.playingNext')}
                </span>
              )}
            {currentSongData.songId === songId && (
              <span className="text-font-color-white! mr-2 font-semibold uppercase opacity-50 transition-opacity group-hover/songCard:opacity-90 last:mr-0">
                {t('song.playingNow')}
              </span>
            )}
            {isBlacklisted &&
              !(
                typeof queue.position === 'number' &&
                Array.isArray(queue.songIds) &&
                queue.songIds.length > 0 &&
                queue?.songIds?.at(queue.position + 1) === songId &&
                currentSongData.songId === songId
              ) && (
                <span className="text-font-color-white! mr-2 font-semibold uppercase opacity-50 transition-opacity group-hover/songCard:opacity-90 last:mr-0">
                  {t('song.blacklisted')}
                </span>
              )}
          </div>
          <div className="state-icons flex">
            <Button
              className="order-2 m-0! rounded-none! border-0! bg-transparent p-1! text-inherit! opacity-50 outline-offset-1 transition-opacity group-focus-within/songCard:opacity-100 group-hover/songCard:opacity-100 hover:bg-transparent focus-visible:outline! dark:bg-transparent dark:hover:bg-transparent"
              iconName="favorite"
              iconClassName={`${
                isSongAFavorite ? 'material-icons-round' : 'material-icons-round-outlined'
              } !text-2xl !text-font-color-white !leading-none`}
              tooltipLabel={isSongAFavorite ? t('song.likedThisSong') : undefined}
              clickHandler={(e) => {
                e.stopPropagation();
                handleLikeButtonClick();
              }}
            />
          </div>
        </div>
        <div className="song-info-and-play-btn-container flex w-full items-center justify-between">
          <div className="song-info-container text-font-color-white dark:text-font-color-white max-w-[75%]">
            <NavLink
              to="/main-player/songs/$songId"
              params={{ songId: String(songId) }}
              preload={isMultipleSelectionEnabled ? false : undefined}
              className={`song-title cursor-pointer overflow-hidden text-xl font-normal text-ellipsis whitespace-nowrap outline-offset-1 transition-none hover:underline focus-visible:outline!`}
              title={title}
              tabIndex={0}
              disabled={isMultipleSelectionEnabled}
            >
              {title}
            </NavLink>
            <div
              className="song-artists w-full max-w-full truncate text-sm transition-none"
              title={artists ? artists.map((x) => x.name).join(', ') : t('common.unknownArtist')}
              data-song-id={songId}
            >
              {songArtistComponents}
            </div>
          </div>
          <div className="play-btn-and-multiple-selection-checkbox-container">
            {isMultipleSelectionEnabled ? (
              multipleSelectionsData.selectionType === 'songs' && (
                <MultipleSelectionCheckbox id={songId} selectionType="songs" className="mr-1!" />
              )
            ) : (
              <Button
                className={`!m-0 !rounded-none !border-0 bg-transparent !p-0 opacity-60 outline-offset-1 transition-opacity hover:bg-transparent focus-visible:!outline dark:bg-transparent dark:hover:bg-transparent ${
                  currentSongData.songId === songId && 'opacity-100!'
                } group-focus-within/songCard:opacity-100 group-hover/songCard:opacity-100`}
                iconName={isSongPlaying ? 'pause_circle' : 'play_circle'}
                iconClassName="text-4xl! leading-none! text-font-color-white transition-opacity"
                clickHandler={(e) => {
                  e.stopPropagation();
                  handlePlayBtnClick();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongCard;
