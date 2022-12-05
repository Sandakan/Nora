/* eslint-disable react/require-default-props */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable no-console */
/* eslint-disable no-else-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/self-closing-comp */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React, { ForwardedRef } from 'react';
import { DraggableProvided } from 'react-beautiful-dnd';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import Img from '../Img';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';
import AddSongsToPlaylists from './AddSongsToPlaylists';
import DeleteSongFromSystemConfrimPrompt from './DeleteSongFromSystemConfrimPrompt';
import RemoveSongFromLibraryConfirmPrompt from './RemoveSongFromLibraryConfirmPrompt';
import SongArtist from './SongArtist';
import DefaultSongCover from '../../../../assets/images/png/song_cover_default.png';

interface SongProp {
  songId: string;
  artworkPaths: ArtworkPaths;
  title: string;
  artists?: { name: string; artistId: string }[];
  duration: number;
  path: string;
  additionalContextMenuItems?: ContextMenuItem[];
  index: number;
  isIndexingSongs: boolean;
  isAFavorite: boolean;
  className?: string;
  style?: React.CSSProperties;
  isDraggable?: boolean;
  provided?: DraggableProvided;
}

export const Song = React.forwardRef(
  (props: SongProp, ref: ForwardedRef<HTMLDivElement>) => {
    const {
      currentSongData,
      queue,
      isCurrentSongPlaying,
      userData,
      bodyBackgroundImage,
      isMultipleSelectionEnabled,
      multipleSelectionsData,
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
    } = React.useContext(AppUpdateContext);
    const { provided = {} as any } = props;

    const [isAFavorite, setIsAFavorite] = React.useState(props.isAFavorite);
    const [isSongPlaying, setIsSongPlaying] = React.useState(
      currentSongData
        ? currentSongData.songId === props.songId && isCurrentSongPlaying
        : false
    );

    React.useEffect(() => {
      setIsSongPlaying(() => {
        return currentSongData?.songId === props.songId && isCurrentSongPlaying;
      });
      setIsAFavorite((prevState) => {
        if (currentSongData?.songId === props.songId)
          return currentSongData.isAFavorite;
        return prevState;
      });
    }, [
      currentSongData.songId,
      currentSongData.isAFavorite,
      isCurrentSongPlaying,
      props.songId,
    ]);

    const handlePlayBtnClick = React.useCallback(() => {
      playSong(props.songId);
    }, [playSong, props.songId]);

    const songArtists = React.useMemo(
      () =>
        Array.isArray(props.artists) ? (
          props.artists
            .map((artist, index) =>
              (props.artists?.length ?? 1) - 1 === index ? (
                <SongArtist
                  key={index}
                  artistId={artist.artistId}
                  name={artist.name}
                />
              ) : (
                [
                  <SongArtist
                    key={index}
                    artistId={artist.artistId}
                    name={artist.name}
                  />,
                  ', ',
                ]
              )
            )
            .flat()
        ) : (
          <span>Unknown Artist</span>
        ),
      [props.artists]
    );

    const { minutes, seconds } = React.useMemo(() => {
      const addZero = (num: number) => {
        if (num < 10) return `0${num}`;
        return num.toString();
      };

      const min = Math.floor((props.duration || 0) / 60);
      const sec = Math.floor((props.duration || 0) % 60);

      return {
        minutes: Number.isNaN(min) ? undefined : addZero(min),
        seconds: Number.isNaN(sec) ? undefined : addZero(sec),
      };
    }, [props.duration]);

    const isAMultipleSelection = React.useMemo(() => {
      if (!multipleSelectionsData.isEnabled) return false;
      if (multipleSelectionsData.selectionType !== 'songs') return false;
      if (multipleSelectionsData.multipleSelections.length <= 0) return false;
      if (
        multipleSelectionsData.multipleSelections.some(
          (selectionId) => selectionId === props.songId
        )
      )
        return true;
      return false;
    }, [multipleSelectionsData, props.songId]);

    const contextMenuItems: ContextMenuItem[] = React.useMemo(() => {
      if (
        multipleSelectionsData.selectionType === 'songs' &&
        multipleSelectionsData.multipleSelections.length !== 1 &&
        isAMultipleSelection
      ) {
        const { multipleSelections: songIds } = multipleSelectionsData;
        return [
          {
            label: 'Add to queue',
            iconName: 'queue',
            handlerFunction: () => {
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
            },
          },
          {
            label: 'Add All to Play Next',
            iconName: 'shortcut',
            handlerFunction: () => {
              const newQueue = queue.queue.filter((songId) =>
                songIds.some((id) => songId !== id)
              );
              newQueue.splice(
                queue.queue.indexOf(currentSongData.songId) + 1 || 0,
                0,
                ...songIds
              );
              updateQueueData(undefined, newQueue);
              addNewNotifications([
                {
                  id: `${songIds.join(';')}PlayAllNext`,
                  delay: 5000,
                  content: (
                    <span>{songIds.length} songs will be played next.</span>
                  ),
                  icon: <span className="material-icons-round">shortcut</span>,
                },
              ]);
              toggleMultipleSelections(false);
            },
          },
          // {
          //   label: `Toggle like/dislike songs`,
          //   iconName: `favorite`,
          //   iconClassName: 'material-icons-round-outlined mr-4 text-xl',
          //   handlerFunction: () => {
          //     window.api
          //       .toggleLikeSongs(songIds)
          //       .then((res) => {
          //         if (res && res.likes + res.dislikes > 0) {
          //           for (let i = 0; i < songIds.length; i += 1) {
          //             const songId = songIds[i];
          //             if (currentSongData.songId === songId)
          //               toggleIsFavorite(!currentSongData.isAFavorite);
          //             if (songId === props.songId)
          //               setIsAFavorite((prevState) => !prevState);
          //           }
          //         }
          //         return undefined;
          //       })
          //       .catch((err) => console.error(err));
          //     toggleMultipleSelections(false);
          //   },
          // },
          {
            label: 'Remove from Library',
            iconName: 'block',
            handlerFunction: () => {
              if (userData?.preferences.doNotShowRemoveSongFromLibraryConfirm)
                return window.api.removeSongsFromLibrary(songIds).then(
                  (res) =>
                    res.success &&
                    addNewNotifications([
                      {
                        id: `${songIds.join(';')}Blacklisted`,
                        delay: 5000,
                        content: (
                          <span>
                            {songIds.length} songs blacklisted and removed from
                            the library.
                          </span>
                        ),
                        icon: (
                          <span className="material-icons-round">
                            delete_outline
                          </span>
                        ),
                      },
                    ])
                );
              else
                changePromptMenuData(
                  true,
                  <RemoveSongFromLibraryConfirmPrompt songIds={songIds} />
                );
              return toggleMultipleSelections(false);
            },
          },
          {
            label: 'Unselect',
            iconName: 'checklist',
            handlerFunction: () =>
              updateMultipleSelections(
                props.songId,
                'songs',
                isAMultipleSelection ? 'remove' : 'add'
              ),
          },
        ];
      }
      const items: ContextMenuItem[] = [
        {
          label: 'Play',
          handlerFunction: handlePlayBtnClick,
          iconName: 'play_arrow',
        },
        {
          label: 'Play Next',
          iconName: 'shortcut',
          handlerFunction: () => {
            const newQueue = queue.queue.filter(
              (songId) => songId !== props.songId
            );
            newQueue.splice(
              queue.queue.indexOf(currentSongData.songId) + 1 || 0,
              0,
              props.songId
            );
            updateQueueData(undefined, newQueue);
            addNewNotifications([
              {
                id: `${props.title}PlayNext`,
                delay: 5000,
                content: (
                  <span>&apos;{props.title}&apos; will be played next.</span>
                ),
                icon: <span className="material-icons-round">shortcut</span>,
              },
            ]);
          },
        },
        {
          label: 'Add to queue',
          iconName: 'queue',
          handlerFunction: () => {
            updateQueueData(undefined, [...queue.queue, props.songId], false);
            addNewNotifications([
              {
                id: `${props.title}AddedToQueue`,
                delay: 5000,
                content: <span>Added 1 song to the queue.</span>,
                icon: (
                  <Img
                    src={props.artworkPaths.optimizedArtworkPath}
                    alt="Song Artwork"
                  />
                ),
              },
            ]);
          },
        },
        {
          label: `${isAFavorite ? 'Unlike' : 'Like'} the song`,
          iconName: `favorite`,
          iconClassName: `${
            isAFavorite
              ? 'material-icons-round mr-4 text-xl'
              : 'material-icons-round-outlined mr-4 text-xl'
          }`,
          handlerFunction: () => {
            window.api
              .toggleLikeSongs([props.songId], !isAFavorite)
              .then((res) => {
                if (res && res.likes + res.dislikes > 0) {
                  if (currentSongData.songId === props.songId)
                    toggleIsFavorite(!currentSongData.isAFavorite);
                  return setIsAFavorite((prevData) => !prevData);
                }
                return undefined;
              })
              .catch((err) => console.error(err));
          },
        },
        {
          label: 'Add to a Playlist',
          iconName: 'playlist_add',
          handlerFunction: () =>
            changePromptMenuData(
              true,
              <AddSongsToPlaylists songId={props.songId} title={props.title} />
            ),
        },
        {
          label: isMultipleSelectionEnabled ? 'Unselect' : 'Select',
          iconName: 'checklist',
          handlerFunction: () => {
            if (isMultipleSelectionEnabled) {
              return updateMultipleSelections(
                props.songId,
                'songs',
                isAMultipleSelection ? 'remove' : 'add'
              );
            }
            return toggleMultipleSelections(
              !isMultipleSelectionEnabled,
              'songs',
              [props.songId]
            );
          },
        },
        {
          label: 'Hr',
          isContextMenuItemSeperator: true,
          handlerFunction: () => true,
        },
        {
          label: 'Reveal in File Explorer',
          class: 'reveal-file-explorer',
          iconName: 'folder_open',
          handlerFunction: () =>
            window.api.revealSongInFileExplorer(props.songId),
        },
        {
          label: 'Info',
          class: 'info',
          iconName: 'info',
          handlerFunction: () =>
            changeCurrentActivePage('SongInfo', {
              songId: props.songId,
            }),
        },
        {
          label: 'Edit song tags',
          class: 'edit',
          iconName: 'edit',
          handlerFunction: () =>
            changeCurrentActivePage('SongTagsEditor', {
              songId: props.songId,
              songArtworkPath: props.artworkPaths.artworkPath,
              songPath: props.path,
            }),
        },
        {
          label: 'Hr',
          isContextMenuItemSeperator: true,
          handlerFunction: () => true,
        },
        {
          label: 'Remove from Library',
          iconName: 'block',
          handlerFunction: () =>
            userData?.preferences.doNotShowRemoveSongFromLibraryConfirm
              ? window.api.removeSongsFromLibrary([props.songId]).then(
                  (res) =>
                    res.success &&
                    addNewNotifications([
                      {
                        id: `${props.title}Blacklisted`,
                        delay: 5000,
                        content: (
                          <span>
                            &apos;{props.title}&apos; blacklisted and removed
                            from the library.
                          </span>
                        ),
                        icon: (
                          <span className="material-icons-round">
                            delete_outline
                          </span>
                        ),
                      },
                    ])
                )
              : changePromptMenuData(
                  true,
                  <RemoveSongFromLibraryConfirmPrompt
                    title={props.title}
                    songIds={[props.songId]}
                  />
                ),
        },
        {
          label: 'Delete from System',
          iconName: 'delete',
          handlerFunction: () =>
            changePromptMenuData(
              true,
              <DeleteSongFromSystemConfrimPrompt
                songPath={props.path}
                title={props.title}
                songId={props.songId}
              />
            ),
        },
      ];

      if (props.additionalContextMenuItems !== undefined)
        items.unshift(...props.additionalContextMenuItems);

      return items;
    }, [
      addNewNotifications,
      changeCurrentActivePage,
      changePromptMenuData,
      currentSongData.isAFavorite,
      currentSongData.songId,
      handlePlayBtnClick,
      isAFavorite,
      isAMultipleSelection,
      isMultipleSelectionEnabled,
      multipleSelectionsData,
      props.additionalContextMenuItems,
      props.artworkPaths.artworkPath,
      props.artworkPaths.optimizedArtworkPath,
      props.path,
      props.songId,
      props.title,
      queue.queue,
      toggleIsFavorite,
      toggleMultipleSelections,
      updateMultipleSelections,
      updateQueueData,
      userData?.preferences.doNotShowRemoveSongFromLibraryConfirm,
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
        style={props.style ? props.style : {}}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...provided.draggableProps}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...provided.dragHandleProps}
        // style={{ animationDelay: `${50 * (props.index + 1)}ms` }}
        className={`appear-from-bottom ${
          props.songId
        } group relative mr-4 mb-2 flex aspect-[2/1] h-[3.25rem] w-[98%] overflow-hidden rounded-lg border-[0.2rem] shadow-xl transition-[border-color] ease-in-out hover:border-background-color-3 dark:hover:border-dark-background-color-3  ${
          currentSongData.songId === props.songId || isAMultipleSelection
            ? bodyBackgroundImage
              ? `border-[transparent] bg-background-color-3/70 text-font-color-black backdrop-blur-md dark:bg-dark-background-color-3/70`
              : 'border-background-color-2 bg-background-color-3 text-font-color-black dark:border-dark-background-color-2 dark:bg-dark-background-color-3'
            : bodyBackgroundImage
            ? `border-[transparent] bg-background-color-2/70 backdrop-blur-md dark:bg-dark-background-color-2/70`
            : 'border-background-color-2 bg-background-color-2 dark:border-dark-background-color-2 dark:bg-dark-background-color-2'
        }`}
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
        onClick={() =>
          isMultipleSelectionEnabled &&
          multipleSelectionsData.selectionType === 'songs'
            ? updateMultipleSelections(
                props.songId,
                'songs',
                isAMultipleSelection ? 'remove' : 'add'
              )
            : undefined
        }
        onDoubleClick={handlePlayBtnClick}
        ref={ref}
      >
        <div className="song-cover-and-play-btn-container max-w-1/5 relative flex h-full w-fit items-center justify-center">
          {isMultipleSelectionEnabled &&
          multipleSelectionsData.selectionType === 'songs' ? (
            <div className="relative mx-1 flex h-fit items-center rounded-lg bg-background-color-1 p-1 text-font-color-highlight dark:bg-dark-background-color-1 dark:text-dark-background-color-3">
              <MultipleSelectionCheckbox
                id={props.songId}
                selectionType="songs"
              />
            </div>
          ) : props.isIndexingSongs ? (
            <div className="relative mx-1 h-fit rounded-2xl bg-background-color-1 px-3 text-font-color-highlight dark:bg-dark-background-color-1 dark:text-dark-background-color-3">
              {props.index + 1}
            </div>
          ) : (
            ''
          )}
          <div className="song-cover-container relative ml-2 mr-4 flex h-[90%] w-full flex-row items-center justify-center overflow-hidden rounded-md">
            <div className="play-btn-container absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <span
                className={`material-icons-round icon cursor-pointer text-3xl text-font-color-white text-opacity-0 ${
                  currentSongData.songId === props.songId && 'text-opacity-100'
                } group-hover:text-opacity-100`}
                onClick={handlePlayBtnClick}
                style={isSongPlaying ? { color: `hsla(0,0%,100%,1)` } : {}}
              >
                {isSongPlaying ? 'pause_circle' : 'play_circle'}
              </span>
            </div>
            <Img
              src={props.artworkPaths.artworkPath}
              loading="lazy"
              alt="Song cover"
              className={`max-h-full object-cover transition-[filter] duration-300 group-hover:brightness-50 ${
                isSongPlaying ? 'brightness-50' : ''
              }`}
            />
          </div>
        </div>
        <div
          className={`song-info-container flex w-[92.5%] flex-row items-center justify-between text-font-color-black dark:text-font-color-white  ${
            (currentSongData.songId === props.songId || isAMultipleSelection) &&
            'dark:text-font-color-black'
          } `}
        >
          <div
            className="song-title w-1/2 overflow-hidden text-ellipsis whitespace-nowrap text-base font-normal transition-none"
            title={props.title}
          >
            {props.title}
          </div>
          <div className="song-artists w-1/3 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-normal transition-none">
            {songArtists}
          </div>
          <div className="song-duration mr-1 flex w-[12.5%] items-center justify-between pr-4 text-center transition-none">
            <>
              <span
                className={`${
                  isAFavorite
                    ? 'material-icons-round'
                    : 'material-icons-round-outlined'
                } icon cursor-pointer text-xl font-light md:hidden ${
                  isAFavorite
                    ? currentSongData.songId === props.songId ||
                      isAMultipleSelection
                      ? 'text-font-color-black dark:text-font-color-black'
                      : 'text-font-color-highlight dark:text-dark-background-color-3'
                    : currentSongData.songId === props.songId ||
                      isAMultipleSelection
                    ? 'text-font-color-black dark:text-font-color-black'
                    : 'text-font-color-highlight dark:text-dark-background-color-3'
                }`}
                title={`You ${
                  isAFavorite ? 'liked' : "didn't like"
                } this song.`}
                onClick={() => {
                  window.api
                    .toggleLikeSongs([props.songId], !isAFavorite)
                    .then((res) => {
                      if (res && res?.likes + res?.dislikes > 0) {
                        if (currentSongData.songId === props.songId)
                          toggleIsFavorite(!currentSongData.isAFavorite);
                        return setIsAFavorite((prevData) => !prevData);
                      }
                      setIsAFavorite((prevData) => !prevData);
                      return undefined;
                    })
                    .catch((err) => console.error(err));
                }}
              >
                favorite
              </span>
              {minutes ?? '--'}:{seconds ?? '--'}
            </>
          </div>
        </div>
      </div>
    );
  }
);
