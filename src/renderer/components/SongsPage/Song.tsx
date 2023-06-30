/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { ForwardedRef } from 'react';
import { DraggableProvided } from 'react-beautiful-dnd';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import Img from '../Img';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';
import AddSongsToPlaylists from './AddSongsToPlaylists';
import BlacklistSongConfrimPrompt from './BlacklistSongConfirmPrompt';
import SongArtist from './SongArtist';
import DefaultSongCover from '../../../../assets/images/webp/song_cover_default.webp';
import DeleteSongsFromSystemConfrimPrompt from './DeleteSongsFromSystemConfrimPrompt';
import Button from '../Button';

interface SongProp {
  songId: string;
  artworkPaths: ArtworkPaths;
  title: string;
  artists?: { name: string; artistId: string }[];
  album?: { name: string; albumId: string };
  duration: number;
  year?: number;
  path: string;
  isBlacklisted?: boolean;
  additionalContextMenuItems?: ContextMenuItem[];
  index: number;
  isIndexingSongs: boolean;
  isAFavorite: boolean;
  className?: string;
  onPlayClick?: (currSongId: string) => void;
  style?: React.CSSProperties;
  isDraggable?: boolean;
  provided?: DraggableProvided;
  selectAllHandler?: (_upToId?: string) => void;
}

const Song = React.forwardRef(
  (props: SongProp, ref: ForwardedRef<HTMLDivElement>) => {
    const {
      currentSongData,
      queue,
      isCurrentSongPlaying,
      localStorageData,
      bodyBackgroundImage,
      isMultipleSelectionEnabled,
      multipleSelectionsData,
      currentlyActivePage,
    } = React.useContext(AppContext);
    const {
      playSong,
      updateContextMenuData,
      changeCurrentActivePage,
      updateQueueData,
      changePromptMenuData,
      addNewNotifications,
      toggleIsFavorite,
      toggleMultipleSelections,
      updateMultipleSelections,
      createQueue,
    } = React.useContext(AppUpdateContext);

    const {
      index,
      songId,
      duration,
      artworkPaths,
      isIndexingSongs,
      isBlacklisted = false,
      path,
      title,
      additionalContextMenuItems,
      artists,
      album,
      style,
      year,
      selectAllHandler,
      provided = {} as any,
      onPlayClick,
    } = props;

    const [isAFavorite, setIsAFavorite] = React.useState(props.isAFavorite);
    const [isSongPlaying, setIsSongPlaying] = React.useState(false);
    const clickTimeoutRef = React.useRef<NodeJS.Timeout>();

    React.useEffect(() => {
      setIsSongPlaying(
        () => currentSongData?.songId === songId && isCurrentSongPlaying
      );
      setIsAFavorite((prevState) => {
        if (currentSongData?.songId === songId)
          return currentSongData.isAFavorite;
        return prevState;
      });
    }, [
      currentSongData.songId,
      currentSongData.isAFavorite,
      isCurrentSongPlaying,
      songId,
    ]);

    const handlePlayBtnClick = React.useCallback(() => {
      if (onPlayClick) return onPlayClick(songId);
      return playSong(songId);
    }, [onPlayClick, playSong, songId]);

    const handleLikeButtonClick = React.useCallback(() => {
      window.api.playerControls
        .toggleLikeSongs([songId], !isAFavorite)
        .then((res) => {
          if (res && res.likes.length + res.dislikes.length > 0) {
            if (currentSongData.songId === songId)
              toggleIsFavorite(!currentSongData.isAFavorite, true);
            return setIsAFavorite((prevData) => !prevData);
          }
          setIsAFavorite((prevData) => !prevData);
          return undefined;
        })
        .catch((err) => console.error(err));
    }, [
      currentSongData.isAFavorite,
      currentSongData.songId,
      isAFavorite,
      songId,
      toggleIsFavorite,
    ]);

    const { minutes, seconds } = React.useMemo(() => {
      const addZero = (num: number) => {
        if (num < 10) return `0${num}`;
        return num.toString();
      };

      const min = Math.floor((duration || 0) / 60);
      const sec = Math.floor((duration || 0) % 60);

      return {
        minutes: Number.isNaN(min) ? undefined : addZero(min),
        seconds: Number.isNaN(sec) ? undefined : addZero(sec),
      };
    }, [duration]);

    const isAMultipleSelection = React.useMemo(() => {
      if (!multipleSelectionsData.isEnabled) return false;
      if (multipleSelectionsData.selectionType !== 'songs') return false;
      if (multipleSelectionsData.multipleSelections.length <= 0) return false;
      if (
        multipleSelectionsData.multipleSelections.some(
          (selectionId) => selectionId === songId
        )
      )
        return true;
      return false;
    }, [multipleSelectionsData, songId]);

    const songArtists = React.useMemo(() => {
      if (Array.isArray(artists) && artists.length > 0) {
        return artists
          .map((artist, i) => {
            const arr = [
              <SongArtist
                key={artist.artistId}
                artistId={artist.artistId}
                name={artist.name}
                className={`${
                  (currentSongData.songId === songId || isAMultipleSelection) &&
                  'dark:!text-font-color-black'
                }`}
              />,
            ];

            if ((artists?.length ?? 1) - 1 !== i)
              arr.push(<span className="mr-1">,</span>);

            return arr;
          })
          .flat();
      }
      return <span className="text-xs font-normal">Unknown Artist</span>;
    }, [artists, currentSongData.songId, isAMultipleSelection, songId]);

    const goToSongInfoPage = React.useCallback(() => {
      if (
        currentlyActivePage.pageTitle !== 'SongInfo' &&
        currentlyActivePage?.data?.songId !== songId
      )
        changeCurrentActivePage('SongInfo', {
          songId,
        });
    }, [
      changeCurrentActivePage,
      currentlyActivePage?.data?.songId,
      currentlyActivePage.pageTitle,
      songId,
    ]);

    const goToAlbumInfoPage = React.useCallback(() => {
      if (
        album?.albumId &&
        currentlyActivePage.pageTitle !== 'AlbumInfo' &&
        currentlyActivePage?.data?.albumId !== album.albumId
      )
        changeCurrentActivePage('AlbumInfo', {
          albumId: album.albumId,
        });
    }, [
      album?.albumId,
      changeCurrentActivePage,
      currentlyActivePage?.data?.albumId,
      currentlyActivePage.pageTitle,
    ]);

    const contextMenuItems: ContextMenuItem[] = React.useMemo(() => {
      const isMultipleSelectionsEnabled =
        multipleSelectionsData.selectionType === 'songs' &&
        multipleSelectionsData.multipleSelections.length !== 1 &&
        isAMultipleSelection;

      const { multipleSelections: songIds } = multipleSelectionsData;

      const items: ContextMenuItem[] = [
        {
          label: 'Hr',
          isContextMenuItemSeperator: true,
          handlerFunction: () => true,
          isDisabled: additionalContextMenuItems === undefined,
        },
        {
          label: 'Play',
          handlerFunction: () => {
            handlePlayBtnClick();
            toggleMultipleSelections(false);
          },
          iconName: 'play_arrow',
          isDisabled: isMultipleSelectionsEnabled,
        },
        {
          label: 'Create A Queue',
          handlerFunction: () => {
            createQueue(songIds, 'songs', false, undefined, true);
            toggleMultipleSelections(false);
          },
          iconName: 'queue_music',
          isDisabled: !isMultipleSelectionsEnabled,
        },
        {
          label: isMultipleSelectionsEnabled
            ? 'Add all to Play Next'
            : 'Play Next',
          iconName: 'shortcut',
          handlerFunction: () => {
            if (isMultipleSelectionsEnabled) {
              let currentSongIndex =
                queue.currentSongIndex ??
                queue.queue.indexOf(currentSongData.songId);
              const duplicateIds: string[] = [];

              const newQueue = queue.queue.filter((id) => {
                const isADuplicate = songIds.includes(id);
                if (isADuplicate) duplicateIds.push(id);

                return !isADuplicate;
              });

              for (const duplicateId of duplicateIds) {
                const duplicateIdPosition = queue.queue.indexOf(duplicateId);

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
                  delay: 5000,
                  content: `${songIds.length} songs will be played next.`,
                  icon: <span className="material-icons-round">shortcut</span>,
                },
              ]);
            } else {
              const newQueue = queue.queue.filter((id) => id !== songId);
              const duplicateSongIndex = queue.queue.indexOf(songId);

              const currentSongIndex =
                queue.currentSongIndex &&
                duplicateSongIndex !== -1 &&
                duplicateSongIndex < queue.currentSongIndex
                  ? queue.currentSongIndex - 1
                  : undefined;

              newQueue.splice(
                newQueue.indexOf(currentSongData.songId) + 1 || 0,
                0,
                songId
              );
              updateQueueData(currentSongIndex, newQueue, undefined, false);
              addNewNotifications([
                {
                  id: `${title}PlayNext`,
                  delay: 5000,
                  content: `'${title}' will be played next.`,
                  icon: <span className="material-icons-round">shortcut</span>,
                },
              ]);
            }
            toggleMultipleSelections(false);
          },
        },
        {
          label: 'Add to queue',
          iconName: 'queue',
          handlerFunction: () => {
            if (isMultipleSelectionsEnabled) {
              updateQueueData(undefined, [...queue.queue, ...songIds], false);
              addNewNotifications([
                {
                  id: `${songIds.length}AddedToQueueFromMultiSelection`,
                  delay: 5000,
                  content: `Added ${songIds.length} songs to the queue.`,
                },
              ]);
            } else {
              updateQueueData(undefined, [...queue.queue, songId], false);
              addNewNotifications([
                {
                  id: `${title}AddedToQueue`,
                  delay: 5000,
                  content: `Added 1 song to the queue.`,
                  icon: (
                    <Img
                      src={artworkPaths.optimizedArtworkPath}
                      alt="Song Artwork"
                    />
                  ),
                },
              ]);
            }
            toggleMultipleSelections(false);
          },
        },
        {
          label: isMultipleSelectionsEnabled
            ? 'Toggle Like/Dislike Songs'
            : `${isAFavorite ? 'Unlike' : 'Like'} the song`,
          iconName: `favorite`,
          iconClassName: isMultipleSelectionsEnabled
            ? 'material-icons-round-outlined mr-4 text-xl'
            : isAFavorite
            ? 'material-icons-round mr-4 text-xl'
            : 'material-icons-round-outlined mr-4 text-xl',
          handlerFunction: () => {
            window.api.playerControls
              .toggleLikeSongs(
                isMultipleSelectionsEnabled ? [...songIds] : [songId]
              )
              .then((res) => {
                if (res && res.likes.length + res.dislikes.length > 0) {
                  if (currentSongData.songId === songId)
                    toggleIsFavorite(!currentSongData.isAFavorite);
                  return setIsAFavorite((prevData) => !prevData);
                }
                return undefined;
              })
              .catch((err) => console.error(err));
            toggleMultipleSelections(false);
          },
        },
        {
          label: 'Add to Playlists',
          iconName: 'playlist_add',
          handlerFunction: () => {
            changePromptMenuData(
              true,
              <AddSongsToPlaylists
                songIds={isAMultipleSelection ? songIds : [songId]}
                title={title}
              />
            );
            toggleMultipleSelections(false);
          },
        },
        {
          label: isAMultipleSelection ? 'Unselect' : 'Select',
          iconName: 'checklist',
          handlerFunction: () => {
            if (isMultipleSelectionEnabled) {
              updateMultipleSelections(
                songId,
                'songs',
                isAMultipleSelection ? 'remove' : 'add'
              );
            } else
              toggleMultipleSelections(!isAMultipleSelection, 'songs', [
                songId,
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
          label: 'Hr',
          isContextMenuItemSeperator: true,
          handlerFunction: () => true,
          isDisabled: isMultipleSelectionsEnabled,
        },
        {
          label: 'Reveal in File Explorer',
          class: 'reveal-file-explorer',
          iconName: 'folder_open',
          handlerFunction: () =>
            window.api.songUpdates.revealSongInFileExplorer(songId),
          isDisabled: isMultipleSelectionsEnabled,
        },
        {
          label: 'Info',
          class: 'info',
          iconName: 'info',
          handlerFunction: goToSongInfoPage,
          isDisabled: isMultipleSelectionsEnabled,
        },
        {
          label: 'Go to Album',
          iconName: 'album',
          handlerFunction: () =>
            album &&
            changeCurrentActivePage('AlbumInfo', {
              albumId: album?.albumId,
            }),
          isDisabled: !album,
        },
        {
          label: 'Edit song tags',
          class: 'edit',
          iconName: 'edit',
          handlerFunction: () =>
            changeCurrentActivePage('SongTagsEditor', {
              songId,
              songArtworkPath: artworkPaths.artworkPath,
              songPath: path,
            }),
          isDisabled: isMultipleSelectionsEnabled,
        },
        {
          label: 'Re-parse song',
          class: 'sync',
          iconName: 'sync',
          handlerFunction: () => window.api.songUpdates.reParseSong(path),
          isDisabled: isMultipleSelectionsEnabled,
        },
        {
          label: 'Hr',
          isContextMenuItemSeperator: true,
          handlerFunction: () => true,
          isDisabled: isMultipleSelectionsEnabled,
        },
        {
          label: isBlacklisted ? 'Restore from Blacklist' : 'Blacklist Song',
          iconName: isBlacklisted ? 'settings_backup_restore' : 'block',
          handlerFunction: () => {
            if (isBlacklisted)
              window.api.audioLibraryControls
                .restoreBlacklistedSongs([songId])
                .catch((err) => console.error(err));
            else if (
              localStorageData?.preferences.doNotShowBlacklistSongConfirm
            )
              window.api.audioLibraryControls
                .blacklistSongs([songId])
                .then(() =>
                  addNewNotifications([
                    {
                      id: `${title}Blacklisted`,
                      delay: 5000,
                      content: `'${title}' blacklisted.`,
                      icon: <span className="material-icons-round">block</span>,
                    },
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
          isDisabled: isMultipleSelectionsEnabled,
        },
        {
          label: 'Delete from System',
          iconName: 'delete',
          handlerFunction: () => {
            changePromptMenuData(
              true,
              <DeleteSongsFromSystemConfrimPrompt
                songIds={isMultipleSelectionsEnabled ? songIds : [songId]}
              />
            );
            toggleMultipleSelections(false);
          },
        },
      ];

      if (additionalContextMenuItems)
        items.unshift(...additionalContextMenuItems);

      return items;
    }, [
      multipleSelectionsData,
      isAMultipleSelection,
      additionalContextMenuItems,
      isAFavorite,
      goToSongInfoPage,
      album,
      isBlacklisted,
      handlePlayBtnClick,
      toggleMultipleSelections,
      createQueue,
      queue.currentSongIndex,
      queue.queue,
      currentSongData.songId,
      currentSongData.isAFavorite,
      updateQueueData,
      addNewNotifications,
      title,
      songId,
      artworkPaths.optimizedArtworkPath,
      artworkPaths.artworkPath,
      toggleIsFavorite,
      changePromptMenuData,
      isMultipleSelectionEnabled,
      updateMultipleSelections,
      changeCurrentActivePage,
      path,
      localStorageData?.preferences.doNotShowBlacklistSongConfirm,
    ]);

    const contextMenuItemData: ContextMenuAdditionalData =
      isMultipleSelectionEnabled &&
      multipleSelectionsData.selectionType === 'songs' &&
      isAMultipleSelection
        ? {
            title: `${multipleSelectionsData.multipleSelections.length} selected songs`,
            artworkPath: DefaultSongCover,
          }
        : {
            title: title || 'Unknown title',
            subTitle:
              artists?.map((artist) => artist.name).join(', ') ??
              'Unknown artist',
            artworkPath: artworkPaths.artworkPath,
          };

    return (
      <div
        style={style}
        data-index={index}
        {...provided?.draggableProps}
        {...provided?.dragHandleProps}
        className={`${songId} group relative mb-2 mr-4 flex h-[3.25rem] w-[98%] overflow-hidden rounded-lg p-[0.2rem] px-2 outline-1 -outline-offset-2 transition-[background,color,opacity] ease-in-out focus-visible:!outline ${
          currentSongData.songId === songId || isAMultipleSelection
            ? bodyBackgroundImage
              ? `bg-background-color-3/70 text-font-color-black shadow-lg backdrop-blur-md dark:bg-dark-background-color-3/70`
              : 'bg-background-color-3 text-font-color-black shadow-lg dark:bg-dark-background-color-3'
            : bodyBackgroundImage
            ? `bg-background-color-2/70 backdrop-blur-md hover:!bg-background-color-2 dark:bg-dark-background-color-2/70 dark:hover:!bg-dark-background-color-2`
            : `odd:bg-background-color-2/70 hover:!bg-background-color-2 dark:odd:bg-dark-background-color-2/50 dark:hover:!bg-dark-background-color-2 ${
                (index + 1) % 2 === 1
                  ? '!bg-background-color-2/70 dark:!bg-dark-background-color-2/50'
                  : '!bg-background-color-1 dark:!bg-dark-background-color-1'
              }`
        } ${!isAMultipleSelection && isBlacklisted && '!opacity-30'}`}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          updateContextMenuData(
            true,
            contextMenuItems,
            e.pageX,
            e.pageY,
            contextMenuItemData
          );
        }}
        onClick={(e) => {
          clickTimeoutRef.current = setTimeout(() => {
            if (e.getModifierState('Shift') === true && selectAllHandler)
              selectAllHandler(songId);
            else if (
              isMultipleSelectionEnabled &&
              multipleSelectionsData.selectionType === 'songs'
            )
              updateMultipleSelections(
                songId,
                'songs',
                isAMultipleSelection ? 'remove' : 'add'
              );
          }, 100);
        }}
        onDoubleClick={() => {
          if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
          handlePlayBtnClick();
        }}
        ref={ref}
      >
        <div
          className={`song-cover-and-play-btn-container flex w-[clamp(6rem,15%,9rem)] shrink-0 items-center justify-center ${
            !isIndexingSongs && '!w-[clamp(4rem,10%,6rem)]'
          }`}
        >
          {isMultipleSelectionEnabled &&
          multipleSelectionsData.selectionType === 'songs' ? (
            <div className="relative mx-1 flex h-fit items-center rounded-lg bg-background-color-1 p-1 text-font-color-highlight dark:bg-dark-background-color-1 dark:text-dark-background-color-3">
              <MultipleSelectionCheckbox id={songId} selectionType="songs" />
            </div>
          ) : isBlacklisted ? (
            <div
              className="relative flex h-full items-center justify-center"
              title={`'${title}' is blacklisted.`}
            >
              <span
                className={`material-icons-round mx-2 text-2xl text-font-color-black dark:text-font-color-white ${
                  currentSongData.songId === songId &&
                  'dark:!text-font-color-black'
                } `}
              >
                block
              </span>
            </div>
          ) : isIndexingSongs ? (
            <div className="relative mx-1 h-fit rounded-2xl bg-background-color-1 px-3 text-font-color-highlight group-even:bg-background-color-2/75 group-hover:bg-background-color-1 dark:bg-dark-background-color-1 dark:text-dark-background-color-3 dark:group-even:bg-dark-background-color-2/50 dark:group-hover:bg-dark-background-color-1">
              {index + 1}
            </div>
          ) : (
            ''
          )}
          <div
            className={`song-cover-container relative ml-2 mr-4 flex h-[90%] flex-row items-center justify-center overflow-hidden rounded-md ${
              (isIndexingSongs ||
                isMultipleSelectionEnabled ||
                isBlacklisted) &&
              'sm:hidden'
            }`}
          >
            <div className="play-btn-container absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <Button
                className="!m-0 !rounded-none !border-0 !p-0 outline-1 outline-offset-1 focus-visible:!outline"
                iconClassName={`!text-3xl text-font-color-white text-opacity-0 !leading-none ${
                  currentSongData.songId === songId && 'text-opacity-100'
                } group-focus-within:text-opacity-100 group-hover:text-opacity-100 ${
                  isSongPlaying && '!text-font-color-white/75'
                }`}
                clickHandler={handlePlayBtnClick}
                iconName={isSongPlaying ? 'pause_circle' : 'play_circle'}
              />
            </div>
            <Img
              src={artworkPaths.artworkPath}
              loading="lazy"
              alt="Song cover"
              className={`aspect-square max-h-full object-contain py-[0.1rem] transition-[filter] duration-300 group-focus-within:brightness-50 group-hover:brightness-50 ${
                isSongPlaying ? 'brightness-50' : ''
              }`}
            />
          </div>
        </div>
        <div
          className={`song-info-container grid grow grid-cols-[35%_2fr_1fr_minmax(4rem,5rem)_minmax(4.5rem,6.5rem)] items-center gap-3 text-font-color-black dark:text-font-color-white lg:grid-cols-[40%_1fr_minmax(4rem,5rem)_minmax(4.5rem,6.5rem)] lg:!gap-0 sm:grid-cols-[45%_1fr_minmax(4.5rem,6rem)] sm:gap-2 ${
            (currentSongData.songId === songId || isAMultipleSelection) &&
            'dark:!text-font-color-black'
          }`}
        >
          <div
            className="song-title truncate text-base font-normal outline-1 outline-offset-1 transition-none focus-visible:!outline"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && goToSongInfoPage()}
            title={title}
          >
            {title}
          </div>
          <div className="song-artists w-full truncate text-xs font-normal transition-none">
            {songArtists}
          </div>
          <div className="song-album w-full truncate text-xs transition-none lg:hidden md:hidden sm:hidden">
            {album?.name ? (
              <span
                className="cursor-pointer outline-1 -outline-offset-1 hover:underline focus-visible:!outline"
                tabIndex={0}
                title={album.name}
                role="button"
                onClick={goToAlbumInfoPage}
                onKeyDown={(e) => e.key === 'Enter' && goToAlbumInfoPage()}
              >
                {album.name}
              </span>
            ) : (
              'Unknown album'
            )}
          </div>
          <div className="song-year flex items-center justify-center text-center text-xs transition-none sm:hidden">
            {year ?? '----'}
          </div>
          <div className="song-duration flex !w-full items-center justify-between pl-2 pr-4 text-center transition-none sm:pr-1">
            <Button
              className="!mr-0 mt-1 !rounded-none !border-0 !p-0 !text-inherit outline-1 outline-offset-1 focus-visible:!outline"
              iconName="favorite"
              iconClassName={`${
                isAFavorite
                  ? 'material-icons-round'
                  : 'material-icons-round-outlined'
              } !leading-none !text-xl !font-light md:hidden ${
                isAFavorite
                  ? currentSongData.songId === songId || isAMultipleSelection
                    ? '!text-font-color-black dark:!text-font-color-black'
                    : '!text-font-color-highlight dark:!text-dark-background-color-3'
                  : currentSongData.songId === songId || isAMultipleSelection
                  ? '!text-font-color-black dark:!text-font-color-black'
                  : '!text-font-color-highlight dark:!text-dark-background-color-3'
              }`}
              tooltipLabel={`You ${
                isAFavorite ? 'liked' : "didn't like"
              } this song.`}
              clickHandler={(e) => {
                e.stopPropagation();
                handleLikeButtonClick();
              }}
            />
            <span className="">
              {minutes ?? '--'}:{seconds ?? '--'}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

Song.displayName = 'Song';
export default Song;
