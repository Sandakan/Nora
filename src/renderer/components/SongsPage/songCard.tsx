/* eslint-disable no-console */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/require-default-props */
/* eslint-disable no-underscore-dangle */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Img from '../Img';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';
import AddSongsToPlaylists from './AddSongsToPlaylists';
import RemoveSongFromLibraryConfirmPrompt from './RemoveSongFromLibraryConfirmPrompt';
import SongArtist from './SongArtist';
import DefaultSongCover from '../../../../assets/images/png/song_cover_default.png';
import DeleteSongFromSystemConfrimPrompt from './DeleteSongFromSystemConfrimPrompt';

interface SongCardProp {
  index: number;
  songId: string;
  artworkPath: string;
  path: string;
  title: string;
  artists?: { name: string; artistId: string }[];
  duration: number;
  palette?: NodeVibrantPalette;
  isAFavorite: boolean;
  className?: string;
}

export const SongCard = (props: SongCardProp) => {
  const {
    currentSongData,
    currentlyActivePage,
    queue,
    isCurrentSongPlaying,
    userData,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
  } = React.useContext(AppContext);
  const {
    playSong,
    updateContextMenuData,
    changeCurrentActivePage,
    updateQueueData,
    addNewNotifications,
    changePromptMenuData,
    toggleIsFavorite,
    toggleMultipleSelections,
    updateMultipleSelections,
  } = React.useContext(AppUpdateContext);

  const [isAFavorite, setIsAFavorite] = React.useState(
    props.songId === currentSongData.songId
      ? currentSongData.isAFavorite
      : props.isAFavorite
  );
  const [isSongPlaying, setIsSongPlaying] = React.useState(
    currentSongData
      ? currentSongData.songId === props.songId && isCurrentSongPlaying
      : false
  );
  React.useEffect(() => {
    setIsSongPlaying(() => {
      if (currentSongData)
        return currentSongData.songId === props.songId && isCurrentSongPlaying;
      return false;
    });
  }, [currentSongData, isCurrentSongPlaying, props.songId]);

  const [r, g, b] = React.useMemo(
    () =>
      props.palette && props.palette.LightVibrant && props.palette.DarkVibrant
        ? props.palette.LightVibrant.rgb
        : [47, 49, 55],
    [props.palette]
  );
  const [fr, fg, fb] = React.useMemo(
    () =>
      props.palette && props.palette.LightVibrant && props.palette.DarkVibrant
        ? props.palette.DarkVibrant.rgb
        : [222, 220, 217],
    [props.palette]
  );

  const background = `linear-gradient(90deg,rgba(${r},${g},${b},1) 0%,rgba(${r},${g},${b},1) 50%,rgba(${r},${g},${b},0.6) 70%,rgba(${r},${g},${b},0) 100%)`;
  const fontColor = `rgba(${fr},${fg},${fb},1)`;

  const handlePlayBtnClick = React.useCallback(() => {
    playSong(props.songId);
  }, [playSong, props.songId]);

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

  const contextMenuItemData =
    isMultipleSelectionEnabled &&
    multipleSelectionsData.selectionType === 'songs' &&
    isAMultipleSelection
      ? {
          title: `${multipleSelectionsData.multipleSelections.length} selected songs`,
          artworkPath: DefaultSongCover,
        }
      : undefined;

  const showSongInfoPage = () =>
    currentlyActivePage.pageTitle === 'SongInfo' &&
    currentlyActivePage.data &&
    currentlyActivePage.data.songInfo &&
    currentlyActivePage.data.songInfo.songId === props.songId
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('SongInfo', {
          songId: props.songId,
        });

  const handleLikeButtonClick = React.useCallback(() => {
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
  }, [
    currentSongData.isAFavorite,
    currentSongData.songId,
    isAFavorite,
    props.songId,
    toggleIsFavorite,
  ]);

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
                id: `${props.title}PlayNext`,
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
        {
          label: `Toggle like/dislike songs`,
          iconName: `favorite`,
          iconClassName: 'material-icons-round-outlined mr-4 text-xl',
          handlerFunction: () => {
            window.api
              .toggleLikeSongs(songIds)
              .then((res) => {
                if (res && res.likes + res.dislikes > 0) {
                  for (let i = 0; i < songIds.length; i += 1) {
                    const songId = songIds[i];
                    if (currentSongData.songId === songId)
                      toggleIsFavorite(!currentSongData.isAFavorite);
                    if (songId === props.songId)
                      setIsAFavorite((prevState) => !prevState);
                  }
                }
                return undefined;
              })
              .catch((err) => console.error(err));
            toggleMultipleSelections(false);
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
      ] as ContextMenuItem[];
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
              icon: <Img src={props.artworkPath} alt="Song Artwork" />,
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
        label:
          isMultipleSelectionEnabled &&
          multipleSelectionsData.multipleSelections.includes(props.songId)
            ? 'Unselect'
            : 'Select',
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
            songArtworkPath: props.artworkPath,
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
                          &apos;{props.title}&apos; blacklisted and removed from
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
    props.artworkPath,
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

  const songArtistComponents = React.useMemo(
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

  return (
    <div
      style={{
        animationDelay: `${50 * (props.index + 1)}ms`,
      }}
      className={`song song-card appear-from-bottom ${props.songId} ${
        currentSongData.songId === props.songId && 'current-song'
      } ${
        isSongPlaying && 'playing'
      } group relative mr-2 mb-2 aspect-[2/1] max-w-md overflow-hidden rounded-2xl border-background-color-2 shadow-xl transition-[border-color] ease-in-out dark:border-dark-background-color-2 ${
        props.className || ''
      }`}
      data-song-id={props.songId}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(
          true,
          contextMenuItems,
          e.pageX,
          e.pageY,
          contextMenuItemData
          //   {
          //   title: props.title,
          //   artworkPath: props.artworkPath,
          //   subTitle: props.artists?.map((x) => x.name).join(', '),
          //   button: (
          //     <span
          //       className={`${
          //         isAFavorite
          //           ? 'material-icons-round text-font-color-crimson'
          //           : 'material-icons-round-outlined'
          //       } cursor-pointer text-lg`}
          //       onClick={() => {
          //         window.api
          //           .toggleLikeSongs(props.songId, !isAFavorite)
          //           .then(() => {
          //             if (currentSongData.songId === props.songId)
          //               toggleIsFavorite(!currentSongData.isAFavorite);
          //             return setIsAFavorite((prevData) => !prevData);
          //           })
          //           .catch((err) => console.error(err));
          //       }}
          //     >
          //       favorite
          //     </span>
          //   ),
          // }
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
    >
      <div className="song-cover-container mr-4 flex h-full w-full flex-row items-center justify-end">
        <Img
          src={props.artworkPath}
          loading="lazy"
          alt="Song cover"
          className="aspect-square h-full max-h-full object-cover"
        />
      </div>
      <div
        className="song-info-and-play-btn-container absolute top-0 h-full w-full pl-4"
        data-song-id={props.songId}
        style={{ background }}
      >
        <div
          className="song-info-container flex h-full translate-y-1 flex-col justify-center"
          style={{ color: fontColor }}
        >
          <div
            className="song-title w-2/3 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-normal transition-none hover:underline"
            title={props.title}
            onClick={(e) => {
              e.stopPropagation();
              showSongInfoPage();
            }}
          >
            {props.title}
          </div>
          <div
            className="song-artists w-2/3 overflow-hidden text-ellipsis whitespace-nowrap text-sm transition-none"
            title={props.artists ? props.artists.join(', ') : 'Unknown Artist'}
            data-song-id={props.songId}
          >
            {songArtistComponents}
          </div>
          <div className="song-states-container">
            <span
              className={`material-icons-${
                isAFavorite ? 'round' : 'round-outlined'
              } mt-1 cursor-pointer text-lg`}
              title={isAFavorite ? 'You liked this song' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                handleLikeButtonClick();
              }}
            >
              favorite
            </span>
            <MultipleSelectionCheckbox
              id={props.songId}
              selectionType="songs"
            />
          </div>
        </div>
        <div className="play-btn-container absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2">
          <span
            className={`material-icons-round icon cursor-pointer text-4xl text-font-color-white text-opacity-0 ${
              currentSongData.songId === props.songId && 'text-opacity-100'
            } group-hover:text-opacity-100`}
            onClick={(e) => {
              e.stopPropagation();
              handlePlayBtnClick();
            }}
          >
            {isSongPlaying ? 'pause_circle' : 'play_circle'}
          </span>
        </div>
      </div>
    </div>
  );
};
