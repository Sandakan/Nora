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
import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import { calculateTime } from '../../utils/calculateTime';
import AddSongToPlaylist from './AddSongToPlaylist';
import DeleteSongFromSystemConfrimPrompt from './DeleteSongFromSystemConfrimPrompt';
import RemoveSongFromLibraryConfirmPrompt from './RemoveSongFromLibraryConfirmPrompt';
import SongArtist from './SongArtist';

interface SongProp {
  songId: string;
  artworkPath?: string;
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
}

export const Song = (props: SongProp) => {
  const { currentSongData, queue, isCurrentSongPlaying, userData } =
    React.useContext(AppContext);
  const {
    playSong,
    updateContextMenuData,
    changeCurrentActivePage,
    updateQueueData,
    changePromptMenuData,
    updateNotificationPanelData,
    toggleIsFavorite,
  } = React.useContext(AppUpdateContext);

  const [isAFavorite, setIsAFavorite] = React.useState(props.isAFavorite);
  const [isSongPlaying, setIsSongPlaying] = React.useState(
    currentSongData
      ? currentSongData.songId === props.songId && isCurrentSongPlaying
      : false
  );

  React.useEffect(() => {
    setIsSongPlaying(() => {
      if (currentSongData)
        return currentSongData.songId === props.songId && isCurrentSongPlaying;
      else return false;
    });
  }, [currentSongData, isCurrentSongPlaying, props.songId]);

  // React.useEffect(() => {
  //   const manageDataUpdateEvents = (
  //     _: unknown,
  //     dataType: DataUpdateEventTypes,
  //     id?: string
  //   ) => {
  //     if (dataType === 'songs/likes' && id === props.songId)
  //       setIsAFavorite((prevData) => !prevData);
  //   };
  //   window.api.dataUpdateEvent(manageDataUpdateEvents);
  //   return () => {
  //     window.api.removeDataUpdateEventListener(manageDataUpdateEvents);
  //   };
  // }, [props.songId]);

  const handlePlayBtnClick = () => {
    playSong(props.songId);
  };

  const contextMenuItems: ContextMenuItem[] = [
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
        updateNotificationPanelData(
          5000,
          <span>&apos;{props.title}&apos; will be played next.</span>,
          <span className="material-icons-round">shortcut</span>
        );
      },
    },
    {
      label: 'Add to queue',
      iconName: 'queue',
      handlerFunction: () => {
        updateQueueData(undefined, [...queue.queue, props.songId], false);
        updateNotificationPanelData(
          5000,
          <span>Added 1 song to the queue.</span>,
          <img
            src={`otoMusic://localFiles/${props.artworkPath?.replace(
              '.webp',
              '-optimized.webp'
            )}`}
            alt="Song Artwork"
          />
        );
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
          .toggleLikeSong(props.songId, !isAFavorite)
          .then(() => {
            if (currentSongData.songId === props.songId)
              toggleIsFavorite(!currentSongData.isAFavorite);
            return setIsAFavorite((prevData) => !prevData);
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
          <AddSongToPlaylist songId={props.songId} title={props.title} />
        ),
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
      handlerFunction: () => window.api.revealSongInFileExplorer(props.songId),
    },
    {
      label: 'Info',
      class: 'info',
      iconName: 'info',
      handlerFunction: () =>
        changeCurrentActivePage('SongInfo', {
          songInfo: { songId: props.songId },
        }),
    },
    {
      label: 'Edit song tags',
      class: 'edit',
      iconName: 'edit',
      handlerFunction: () =>
        changeCurrentActivePage('SongTagsEditor', {
          songTagsEditor: {
            songId: props.songId,
            songArtworkPath: props.artworkPath,
            songPath: props.path,
          },
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
          ? window.api
              .removeSongFromLibrary(props.path)
              .then(
                (res) =>
                  res.success &&
                  updateNotificationPanelData(
                    5000,
                    <span>
                      &apos;{props.title}&apos; blacklisted and removed from the
                      library.
                    </span>,
                    <span className="material-icons-round">delete_outline</span>
                  )
              )
          : changePromptMenuData(
              true,
              <RemoveSongFromLibraryConfirmPrompt
                title={props.title}
                songPath={props.path}
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
          />
        ),
    },
  ];

  if (props.additionalContextMenuItems !== undefined)
    contextMenuItems.unshift(...props.additionalContextMenuItems);

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

  return (
    <div
      style={props.style ? props.style : {}}
      // style={{ animationDelay: `${50 * (props.index + 1)}ms` }}
      className={`appear-from-bottom ${
        props.songId
      } group h-[3.25rem] w-[98%] aspect-[2/1] overflow-hidden mr-4 mb-2 rounded-lg relative flex border-[0.2rem] border-background-color-2 dark:border-dark-background-color-2 transition-[border-color] ease-in-out shadow-xl hover:border-background-color-3 dark:hover:border-dark-background-color-3  ${
        currentSongData.songId === props.songId
          ? 'bg-background-color-3 dark:bg-dark-background-color-3 text-font-color-black'
          : 'bg-background-color-2 dark:bg-dark-background-color-2'
      }`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(true, contextMenuItems, e.pageX, e.pageY);
      }}
    >
      <div className="song-cover-and-play-btn-container max-w-1/5 w-fit h-full relative flex items-center justify-center">
        {props.isIndexingSongs && (
          <div className="song-index px-3 mx-1 bg-background-color-1 dark:bg-dark-background-color-1 rounded-2xl text-background-color-3 dark:text-dark-background-color-3 h-fit relative">
            {props.index + 1}
          </div>
        )}
        <div className="song-cover-container relative h-[90%] w-full flex flex-row items-center justify-center ml-2 mr-4 rounded-md overflow-hidden">
          <div className="play-btn-container absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span
              className={`material-icons-round icon text-3xl text-opacity-0 text-font-color-white cursor-pointer ${
                currentSongData.songId === props.songId && 'text-opacity-100'
              } group-hover:text-opacity-100`}
              onClick={handlePlayBtnClick}
              style={isSongPlaying ? { color: `hsla(0,0%,100%,1)` } : {}}
            >
              {isSongPlaying ? 'pause_circle' : 'play_circle'}
            </span>
          </div>
          <img
            src={`otoMusic://localFiles/${props.artworkPath?.replace(
              '.webp',
              '-optimized.webp'
            )}`}
            loading="lazy"
            alt="Song cover"
            className="max-h-full object-cover"
          />
        </div>
      </div>
      <div
        className={`song-info-container w-[92.5%] flex flex-row items-center justify-between text-font-color-black dark:text-font-color-white  ${
          currentSongData.songId === props.songId &&
          'dark:text-font-color-black'
        } `}
      >
        <div
          className="song-title w-1/2 text-base font-normal transition-none text-ellipsis whitespace-nowrap overflow-hidden"
          title={props.title}
        >
          {props.title}
        </div>
        <div className="song-artists w-1/3 transition-none text-xs font-normal">
          {songArtists}
        </div>
        <div className="song-duration w-[12.5%] text-center mr-1 flex items-center justify-between transition-none pr-4">
          <span
            className={`${
              isAFavorite
                ? 'material-icons-round'
                : 'material-icons-round-outlined'
            } icon text-xl cursor-pointer font-light md:hidden ${
              isAFavorite
                ? currentSongData.songId === props.songId
                  ? 'text-font-color-black dark:text-font-color-black'
                  : 'text-background-color-3 dark:text-dark-background-color-3'
                : currentSongData.songId === props.songId
                ? 'text-font-color-black dark:text-font-color-black'
                : 'text-background-color-3 dark:text-dark-background-color-3'
            }`}
            title={`You ${isAFavorite ? 'liked' : "didn't like"} this song.`}
            onClick={() => {
              window.api
                .toggleLikeSong(props.songId, !isAFavorite)
                .then(() => {
                  if (currentSongData.songId === props.songId)
                    toggleIsFavorite(!currentSongData.isAFavorite);
                  return setIsAFavorite((prevData) => !prevData);
                })
                .catch((err) => console.error(err));
            }}
          >
            favorite
          </span>
          {props.duration ? calculateTime(props.duration) : `-- : --`}
        </div>
      </div>
    </div>
  );
};
