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
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import AddSongToPlaylist from './AddSongToPlaylist';
import DeleteSongPrompt from './DeleteSongFromSystemConfrimPrompt';
import RemoveSongFromLibraryConfirmPrompt from './RemoveSongFromLibraryConfirmPrompt';
import SongArtist from './SongArtist';

interface SongCardProp {
  index: number;
  songId: string;
  artworkPath: string;
  path: string;
  title: string;
  artists?: { name: string; artistId: string }[];
  duration: number;
  palette?: {
    DarkVibrant: {
      _rgb?: any;
      rgb?: any;
    };
    LightVibrant: {
      _rgb?: any;
      rgb?: any;
    };
  };
  isAFavorite: boolean;
}

export const SongCard = (props: SongCardProp) => {
  const {
    currentSongData,
    currentlyActivePage,
    queue,
    isCurrentSongPlaying,
    userData,
  } = React.useContext(AppContext);
  const {
    playSong,
    updateContextMenuData,
    changeCurrentActivePage,
    updateQueueData,
    updateNotificationPanelData,
    changePromptMenuData,
    toggleIsFavorite,
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

  const [r, g, b] = React.useMemo(
    () =>
      props.palette
        ? props.palette.LightVibrant._rgb || props.palette.LightVibrant.rgb
        : [47, 49, 55],
    [props.palette]
  );
  const [fr, fg, fb] = React.useMemo(
    () =>
      props.palette
        ? props.palette.DarkVibrant._rgb || props.palette.DarkVibrant.rgb
        : [222, 220, 217],
    [props.palette]
  );

  const background = `linear-gradient(90deg,rgba(${r},${g},${b},1) 0%,rgba(${r},${g},${b},1) 50%,rgba(${r},${g},${b},0.6) 70%,rgba(${r},${g},${b},0) 100%)`;
  const fontColor = `rgba(${fr},${fg},${fb},1)`;

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: 'Play',
      handlerFunction: () => playSong(props.songId),
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
          1,
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
          <DeleteSongPrompt songPath={props.path} title={props.title} />
        ),
    },
  ] as ContextMenuItem[];

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
      style={{ animationDelay: `${50 * (props.index + 1)}ms` }}
      className={`song song-card appear-from-bottom ${props.songId} ${
        currentSongData.songId === props.songId && 'current-song'
      } ${
        isSongPlaying && 'playing'
      } group inline-block aspect-[2/1] overflow-hidden mr-2 rounded-2xl relative border- border-background-color-2 dark:border-dark-background-color-2 transition-[border-color] ease-in-out w-full max-h-40 max-w-[20rem] shadow-xl`}
      data-song-id={props.songId}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(true, contextMenuItems, e.pageX, e.pageY);
      }}
    >
      <div className="song-cover-container w-full h-full flex flex-row items-center justify-end mr-4">
        <img
          src={`otoMusic://localFiles/${props.artworkPath}`}
          loading="lazy"
          alt="Song cover"
          className="max-h-full"
        />
      </div>
      <div
        className="song-info-and-play-btn-container w-full h-full absolute top-0 pl-4"
        data-song-id={props.songId}
        style={{ background }}
      >
        <div
          className="song-info-container h-full flex flex-col  justify-center"
          style={{ color: fontColor }}
        >
          <div
            className="song-title w-2/3 text-2xl font-normal transition-none text-ellipsis whitespace-nowrap overflow-hidden cursor-pointer hover:underline"
            title={props.title}
            onClick={() =>
              currentlyActivePage.pageTitle === 'SongInfo' &&
              currentlyActivePage.data &&
              currentlyActivePage.data.songInfo &&
              currentlyActivePage.data.songInfo.songId === props.songId
                ? changeCurrentActivePage('Home')
                : changeCurrentActivePage('SongInfo', {
                    songInfo: { songId: props.songId },
                  })
            }
          >
            {props.title}
          </div>
          <div
            className="song-artists w-2/3 transition-none text-sm text-ellipsis whitespace-nowrap overflow-hidden"
            title={props.artists ? props.artists.join(', ') : 'Unknown Artist'}
            data-song-id={props.songId}
          >
            {songArtistComponents}
          </div>
        </div>
        <div className="play-btn-container absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2">
          <span
            className={`material-icons-round icon text-4xl text-opacity-0 text-font-color-white cursor-pointer ${
              currentSongData.songId === props.songId && 'text-opacity-100'
            } group-hover:text-opacity-100`}
            onClick={() => playSong(props.songId)}
          >
            {isSongPlaying ? 'pause_circle' : 'play_circle'}
          </span>
        </div>
      </div>
    </div>
  );
};
