/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Img from '../Img';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';
import AddSongsToPlaylists from './AddSongsToPlaylists';
import BlacklistSongConfrimPrompt from './BlacklistSongConfirmPrompt';
import SongArtist from './SongArtist';
import DefaultSongCover from '../../../../assets/images/webp/song_cover_default.webp';
import DeleteSongsFromSystemConfrimPrompt from './DeleteSongsFromSystemConfrimPrompt';
import Button from '../Button';

interface SongCardProp {
  index: number;
  songId: string;
  artworkPath: string;
  path: string;
  title: string;
  artists?: { name: string; artistId: string }[];
  palette?: NodeVibrantPalette;
  isAFavorite: boolean;
  className?: string;
  isBlacklisted: boolean;
  selectAllHandler?: (_upToId?: string) => void;
}

const SongCard = (props: SongCardProp) => {
  const {
    currentSongData,
    currentlyActivePage,
    queue,
    isCurrentSongPlaying,
    localStorageData,
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
    createQueue,
  } = React.useContext(AppUpdateContext);

  const {
    title,
    artworkPath,
    index,
    isAFavorite,
    path,
    songId,
    artists,
    className,
    isBlacklisted,
    palette,
    selectAllHandler,
  } = props;

  const [isSongAFavorite, setIsSongAFavorite] = React.useState(
    songId === currentSongData.songId
      ? currentSongData.isAFavorite
      : isAFavorite
  );
  const [isSongPlaying, setIsSongPlaying] = React.useState(
    currentSongData
      ? currentSongData.songId === songId && isCurrentSongPlaying
      : false
  );
  React.useEffect(() => {
    setIsSongPlaying(() => {
      if (currentSongData)
        return currentSongData.songId === songId && isCurrentSongPlaying;
      return false;
    });
    setIsSongAFavorite((prevState) => {
      if (currentSongData?.songId === songId)
        return currentSongData.isAFavorite;
      return prevState;
    });
  }, [currentSongData, isCurrentSongPlaying, songId]);

  const [r, g, b] = React.useMemo(
    () =>
      palette && palette.LightVibrant && palette.DarkVibrant
        ? palette.LightVibrant.rgb
        : [47, 49, 55],
    [palette]
  );
  const [fr, fg, fb] = React.useMemo(
    () =>
      palette && palette.LightVibrant && palette.DarkVibrant
        ? palette.DarkVibrant.rgb
        : [222, 220, 217],
    [palette]
  );

  const background = `linear-gradient(90deg,rgba(${r},${g},${b},1) 0%,rgba(${r},${g},${b},1) 50%,rgba(${r},${g},${b},0.6) 70%,rgba(${r},${g},${b},0) 100%)`;
  const fontColor = `rgba(${fr},${fg},${fb},1)`;

  const handlePlayBtnClick = React.useCallback(() => {
    playSong(songId);
  }, [playSong, songId]);

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
    currentlyActivePage.data.songInfo.songId === songId
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('SongInfo', {
          songId,
        });

  const handleLikeButtonClick = React.useCallback(() => {
    window.api
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
    toggleIsFavorite,
  ]);

  const contextMenuItems: ContextMenuItem[] = React.useMemo(() => {
    const isMultipleSelectionsEnabled =
      multipleSelectionsData.selectionType === 'songs' &&
      multipleSelectionsData.multipleSelections.length !== 1 &&
      isAMultipleSelection;

    const { multipleSelections: songIds } = multipleSelectionsData;

    const items: ContextMenuItem[] = [
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
            const newQueue = queue.queue.filter((id) => !songIds.includes(id));
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
                content: <span>&apos;{title}&apos; will be played next.</span>,
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
                icon: <Img src={artworkPath} alt="Song Artwork" />,
              },
            ]);
          }
          toggleMultipleSelections(false);
        },
      },
      {
        label: isMultipleSelectionsEnabled
          ? 'Toggle Like/Dislike Songs'
          : `${isSongAFavorite ? 'Unlike' : 'Like'} the song`,
        iconName: `favorite`,
        iconClassName: isMultipleSelectionsEnabled
          ? 'material-icons-round-outlined mr-4 text-xl'
          : isSongAFavorite
          ? 'material-icons-round mr-4 text-xl'
          : 'material-icons-round-outlined mr-4 text-xl',
        handlerFunction: () => {
          window.api
            .toggleLikeSongs(
              isMultipleSelectionsEnabled ? [...songIds] : [songId]
            )
            .then((res) => {
              if (res && res.likes.length + res.dislikes.length > 0) {
                if (isMultipleSelectionsEnabled) {
                  for (let i = 0; i < songIds.length; i += 1) {
                    const id = songIds[i];
                    if (currentSongData.songId === id)
                      toggleIsFavorite(!currentSongData.isAFavorite);
                    if (id === songId)
                      setIsSongAFavorite((prevState) => !prevState);
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
        label: isAMultipleSelection ? 'Unselect' : 'Select',
        iconName: 'checklist',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) {
            return updateMultipleSelections(
              songId,
              'songs',
              isAMultipleSelection ? 'remove' : 'add'
            );
          }
          return toggleMultipleSelections(!isAMultipleSelection, 'songs', [
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
        handlerFunction: () => window.api.revealSongInFileExplorer(songId),
        isDisabled: isMultipleSelectionsEnabled,
      },
      {
        label: 'Info',
        class: 'info',
        iconName: 'info',
        handlerFunction: () =>
          changeCurrentActivePage('SongInfo', {
            songId,
          }),
        isDisabled: isMultipleSelectionsEnabled,
      },
      {
        label: 'Edit song tags',
        class: 'edit',
        iconName: 'edit',
        handlerFunction: () =>
          changeCurrentActivePage('SongTagsEditor', {
            songId,
            songArtworkPath: artworkPath,
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
              .catch((err) => console.error(err));
          else if (localStorageData?.preferences.doNotShowBlacklistSongConfirm)
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
    return items;
  }, [
    multipleSelectionsData,
    isAMultipleSelection,
    isSongAFavorite,
    isBlacklisted,
    handlePlayBtnClick,
    toggleMultipleSelections,
    createQueue,
    queue.queue,
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
    changeCurrentActivePage,
    path,
    localStorageData?.preferences.doNotShowBlacklistSongConfirm,
  ]);

  const songArtistComponents = React.useMemo(
    () =>
      Array.isArray(artists) ? (
        artists
          .map((artist, i) =>
            (artists?.length ?? 1) - 1 === i ? (
              <SongArtist
                key={artist.artistId}
                artistId={artist.artistId}
                name={artist.name}
                style={{ color: fontColor }}
              />
            ) : (
              [
                <SongArtist
                  key={artist.artistId}
                  artistId={artist.artistId}
                  name={artist.name}
                  style={{ color: fontColor }}
                />,
                <span className="mr-1">,</span>,
              ]
            )
          )
          .flat()
      ) : (
        <span>Unknown Artist</span>
      ),
    [fontColor, artists]
  );

  return (
    <div
      style={{
        animationDelay: `${50 * (index + 1)}ms`,
      }}
      className={`song song-card appear-from-bottom ${songId} ${
        currentSongData.songId === songId && 'current-song'
      } ${
        isSongPlaying && 'playing'
      } group relative mr-2 mb-2 aspect-[2/1] max-w-md overflow-hidden rounded-2xl border-[transparent] border-background-color-2 shadow-xl transition-[border-color] ease-in-out dark:border-dark-background-color-2 ${
        className || ''
      } ${isBlacklisted && '!opacity-30'} ${
        isMultipleSelectionEnabled &&
        multipleSelectionsData.selectionType === 'songs' &&
        'border-4'
      } ${
        isAMultipleSelection &&
        '!border-font-color-highlight dark:!border-dark-font-color-highlight'
      }`}
      data-song-id={songId}
      onDoubleClick={handlePlayBtnClick}
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
      }}
    >
      <div className="song-cover-container mr-4 flex h-full w-full flex-row items-center justify-end">
        <Img
          src={artworkPath}
          loading="lazy"
          alt="Song cover"
          className="aspect-square h-full max-h-full object-cover"
        />
      </div>
      <div
        className="song-info-and-play-btn-container absolute top-0 h-full w-full pl-4"
        data-song-id={songId}
        style={{ background }}
      >
        <div
          className="song-info-container flex h-full translate-y-1 flex-col justify-center"
          style={{ color: fontColor }}
        >
          <div
            className="song-title w-2/3 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-normal outline-1 outline-offset-1 transition-none hover:underline focus-visible:!outline"
            title={title}
            onClick={(e) => {
              e.stopPropagation();
              showSongInfoPage();
            }}
            onKeyDown={(e) => e.key === 'Enter' && showSongInfoPage()}
            tabIndex={0}
          >
            {title}
          </div>
          <div
            className="song-artists flex w-2/3 overflow-hidden text-ellipsis whitespace-nowrap text-sm transition-none"
            title={artists ? artists.join(', ') : 'Unknown Artist'}
            data-song-id={songId}
          >
            {songArtistComponents}
          </div>
          <div className="song-states-container">
            <div className="flex">
              <Button
                className="mt-1 !mr-0 !rounded-none !border-0 !p-0 !text-inherit outline-1 outline-offset-1 focus-visible:!outline"
                iconName="favorite"
                iconClassName={`${
                  isSongAFavorite
                    ? 'material-icons-round'
                    : 'material-icons-round-outlined'
                } !text-lg !leading-none`}
                tooltipLabel={
                  isSongAFavorite ? 'You liked this song' : undefined
                }
                clickHandler={(e) => {
                  e.stopPropagation();
                  handleLikeButtonClick();
                }}
              />
              {isBlacklisted && (
                <span
                  className="material-icons-round mt-1 ml-2 cursor-pointer text-lg"
                  title={`'${title}' is blacklisted.`}
                >
                  block
                </span>
              )}
            </div>
            {isMultipleSelectionEnabled &&
              multipleSelectionsData.selectionType === 'songs' && (
                <MultipleSelectionCheckbox id={songId} selectionType="songs" />
              )}
          </div>
        </div>
        <div className="play-btn-container absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2">
          <Button
            className="!m-0 !rounded-none !border-0 !p-0 outline-1 outline-offset-1 focus-visible:!outline"
            iconName={isSongPlaying ? 'pause_circle' : 'play_circle'}
            iconClassName={`!text-4xl !leading-none text-font-color-white text-opacity-0 ${
              currentSongData.songId === songId && 'text-opacity-100'
            } group-hover:text-opacity-100 group-focus-within:text-opacity-100`}
            clickHandler={(e) => {
              e.stopPropagation();
              handlePlayBtnClick();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SongCard;
