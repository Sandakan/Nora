/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-array-index-key */
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

interface SongProp {
  songId: string;
  artworkPaths: ArtworkPaths;
  title: string;
  artists?: { name: string; artistId: string }[];
  duration: number;
  year?: number;
  path: string;
  isBlacklisted?: boolean;
  additionalContextMenuItems?: ContextMenuItem[];
  index: number;
  isIndexingSongs: boolean;
  isAFavorite: boolean;
  className?: string;
  style?: React.CSSProperties;
  isDraggable?: boolean;
  provided?: DraggableProvided;
  // updateSongs: (_callback: (_prevSongsData: SongData[]) => SongData[]) => void;
}

const Song = React.forwardRef(
  (props: SongProp, ref: ForwardedRef<HTMLDivElement>) => {
    const {
      currentSongData,
      queue,
      isCurrentSongPlaying,
      userData,
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
      style,
      year,
      // updateSongs,
    } = props;
    const { provided = {} as any } = props;

    const [isAFavorite, setIsAFavorite] = React.useState(props.isAFavorite);
    const [isSongPlaying, setIsSongPlaying] = React.useState(
      currentSongData
        ? currentSongData.songId === songId && isCurrentSongPlaying
        : false
    );

    React.useEffect(() => {
      setIsSongPlaying(() => {
        return currentSongData?.songId === songId && isCurrentSongPlaying;
      });
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
      playSong(songId);
    }, [playSong, songId]);

    const handleLikeButtonClick = React.useCallback(() => {
      window.api
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

    const songArtists = React.useMemo(
      () =>
        Array.isArray(artists) ? (
          artists
            .map((artist, i) =>
              (artists?.length ?? 1) - 1 === i ? (
                <SongArtist
                  key={i}
                  artistId={artist.artistId}
                  name={artist.name}
                  className={`${
                    (currentSongData.songId === songId ||
                      isAMultipleSelection) &&
                    'dark:!text-font-color-black'
                  }`}
                />
              ) : (
                [
                  <SongArtist
                    key={i}
                    artistId={artist.artistId}
                    name={artist.name}
                    className={`${
                      (currentSongData.songId === songId ||
                        isAMultipleSelection) &&
                      'dark:!text-font-color-black'
                    } `}
                  />,
                  <span className="mr-1">,</span>,
                ]
              )
            )
            .flat()
        ) : (
          <span>Unknown Artist</span>
        ),
      [artists, currentSongData.songId, isAMultipleSelection, songId]
    );

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
              const newQueue = queue.queue.filter(
                (id) => !songIds.includes(id)
              );
              newQueue.splice(
                queue.queue.indexOf(currentSongData.songId) + 1 || 0,
                0,
                ...songIds
              );
              updateQueueData(undefined, newQueue);
              addNewNotifications([
                {
                  id: `${title}PlayNext`,
                  delay: 5000,
                  content: (
                    <span>{songIds.length} songs will be played next.</span>
                  ),
                  icon: <span className="material-icons-round">shortcut</span>,
                },
              ]);
            } else {
              const newQueue = queue.queue.filter((id) => id !== songId);
              newQueue.splice(
                queue.queue.indexOf(currentSongData.songId) + 1 || 0,
                0,
                songId
              );
              updateQueueData(undefined, newQueue);
              addNewNotifications([
                {
                  id: `${title}PlayNext`,
                  delay: 5000,
                  content: (
                    <span>&apos;{title}&apos; will be played next.</span>
                  ),
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
                  content: (
                    <span>Added {songIds.length} songs to the queue.</span>
                  ),
                },
              ]);
            } else {
              updateQueueData(undefined, [...queue.queue, songId], false);
              addNewNotifications([
                {
                  id: `${title}AddedToQueue`,
                  delay: 5000,
                  content: <span>Added 1 song to the queue.</span>,
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
            window.api
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
          label: 'Add to a Playlists',
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
          label: isMultipleSelectionEnabled ? 'Unselect' : 'Select',
          iconName: 'checklist',
          handlerFunction: () => {
            if (isMultipleSelectionEnabled) {
              updateMultipleSelections(
                songId,
                'songs',
                isAMultipleSelection ? 'remove' : 'add'
              );
            } else
              toggleMultipleSelections(!isMultipleSelectionEnabled, 'songs', [
                songId,
              ]);
            toggleMultipleSelections(false);
          },
        },
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
          handlerFunction: () => window.api.revealSongInFileExplorer(songId),
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
              window.api
                .restoreBlacklistedSongs([songId])
                .then(() =>
                  addNewNotifications([
                    {
                      id: `${title}RestoredFromBlacklisted`,
                      delay: 5000,
                      content: (
                        <span>
                          &apos;{title}&apos; restored from the blacklist.
                        </span>
                      ),
                      icon: (
                        <span className="material-icons-round">
                          settings_backup_restore
                        </span>
                      ),
                    },
                  ])
                )
                .catch((err) => console.error(err));
            else if (userData?.preferences.doNotShowBlacklistSongConfirm)
              window.api
                .blacklistSongs([songId])
                .then(() =>
                  addNewNotifications([
                    {
                      id: `${title}Blacklisted`,
                      delay: 5000,
                      content: <span>&apos;{title}&apos; blacklisted.</span>,
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

      if (additionalContextMenuItems !== undefined)
        items.unshift(...additionalContextMenuItems);

      return items;
    }, [
      multipleSelectionsData,
      isAMultipleSelection,
      handlePlayBtnClick,
      isAFavorite,
      isMultipleSelectionEnabled,
      goToSongInfoPage,
      isBlacklisted,
      additionalContextMenuItems,
      createQueue,
      queue.queue,
      currentSongData.songId,
      currentSongData.isAFavorite,
      updateQueueData,
      addNewNotifications,
      title,
      toggleMultipleSelections,
      songId,
      artworkPaths.optimizedArtworkPath,
      artworkPaths.artworkPath,
      toggleIsFavorite,
      changePromptMenuData,
      updateMultipleSelections,
      changeCurrentActivePage,
      path,
      userData?.preferences.doNotShowBlacklistSongConfirm,
    ]);

    const contextMenuItemData =
      isMultipleSelectionEnabled &&
      multipleSelectionsData.selectionType === 'songs' &&
      isAMultipleSelection
        ? {
            title: `${multipleSelectionsData.multipleSelections.length} selected songs`,
            artworkPath: DefaultSongCover,
          }
        : undefined;

    return (
      <div
        style={style}
        data-index={index}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`appear-from-bottom ${songId} group relative mr-4 mb-2 flex aspect-[2/1] h-[3.25rem] w-[98%] overflow-hidden rounded-lg p-[0.2rem] transition-[background,opacity] ease-in-out ${
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
          if (
            isMultipleSelectionEnabled &&
            multipleSelectionsData.selectionType === 'songs'
          )
            updateMultipleSelections(
              songId,
              'songs',
              isAMultipleSelection ? 'remove' : 'add'
            );
          else if (e.getModifierState('Shift') === true) {
            toggleMultipleSelections(!isMultipleSelectionEnabled, 'songs');
            updateMultipleSelections(
              songId,
              'songs',
              isAMultipleSelection ? 'remove' : 'add'
            );
          }
        }}
        onDoubleClick={handlePlayBtnClick}
        ref={ref}
      >
        <div className="song-cover-and-play-btn-container relative flex h-full w-[12.5%] items-center justify-center">
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
                className={`material-icons-round text-2xl text-font-color-black dark:text-font-color-white ${
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
          <div className="song-cover-container relative ml-2 mr-4 flex h-[90%] flex-row items-center justify-center overflow-hidden rounded-md">
            <div className="play-btn-container absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <span
                className={`material-icons-round icon cursor-pointer text-3xl text-font-color-white text-opacity-0 ${
                  currentSongData.songId === songId && 'text-opacity-100'
                } group-hover:text-opacity-100`}
                onClick={handlePlayBtnClick}
                style={isSongPlaying ? { color: `hsla(0,0%,100%,0.75)` } : {}}
              >
                {isSongPlaying ? 'pause_circle' : 'play_circle'}
              </span>
            </div>
            <Img
              src={artworkPaths.artworkPath}
              loading="lazy"
              alt="Song cover"
              className={`max-h-full object-cover py-[0.1rem] transition-[filter] duration-300 group-hover:brightness-50 ${
                isSongPlaying ? 'brightness-50' : ''
              }`}
            />
          </div>
        </div>
        <div
          className={`song-info-container flex w-[87.5%] flex-row items-center justify-between text-font-color-black dark:text-font-color-white ${
            (currentSongData.songId === songId || isAMultipleSelection) &&
            'dark:!text-font-color-black'
          }`}
        >
          <div
            className="song-title w-2/5 overflow-hidden text-ellipsis whitespace-nowrap pr-4 text-base font-normal transition-none"
            title={title}
          >
            {title}
          </div>
          <div className="song-artists flex w-1/3 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-normal transition-none">
            {songArtists}
          </div>
          <div className="song-year mr-2 flex w-12 items-center justify-between text-center text-xs transition-none">
            {year ?? '----'}
          </div>
          <div className="song-duration mr-1 flex w-[12.5%] items-center justify-between pr-4 text-center transition-none">
            <span
              className={`${
                isAFavorite
                  ? 'material-icons-round'
                  : 'material-icons-round-outlined'
              } icon cursor-pointer text-xl font-light md:hidden ${
                isAFavorite
                  ? currentSongData.songId === songId || isAMultipleSelection
                    ? 'text-font-color-black dark:text-font-color-black'
                    : 'text-font-color-highlight dark:text-dark-background-color-3'
                  : currentSongData.songId === songId || isAMultipleSelection
                  ? 'text-font-color-black dark:text-font-color-black'
                  : 'text-font-color-highlight dark:text-dark-background-color-3'
              }`}
              title={`You ${isAFavorite ? 'liked' : "didn't like"} this song.`}
              onClick={handleLikeButtonClick}
            >
              favorite
            </span>
            {minutes ?? '--'}:{seconds ?? '--'}
          </div>
        </div>
      </div>
    );
  }
);

Song.displayName = 'Song';
export default Song;
