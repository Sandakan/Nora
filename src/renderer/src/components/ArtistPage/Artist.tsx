import { store } from '@renderer/store/store';
import { useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DefaultArtistCover from '../../assets/images/webp/artist_cover_default.webp';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import Button from '../Button';
import Img from '../Img';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';
import NavLink from '../NavLink';

interface ArtistProp {
  index: number;
  className?: string;
  artistId: number;
  name: string;
  artworkPaths: ArtworkPaths;
  songIds: number[];
  onlineArtworkPaths?: {
    picture_small: string;
    picture_medium: string;
  };
  isAFavorite: boolean;
  selectAllHandler?: (_upToId?: number) => void;
  appearFromBottom?: boolean;
}

export const Artist = (props: ArtistProp) => {
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);
  const queue = useStore(store, (state) => state.localStorage.queue);

  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    updateContextMenuData,
    createQueue,
    updateQueueData,
    addNewNotifications,
    toggleMultipleSelections,
    updateMultipleSelections
  } = useContext(AppUpdateContext);

  const { appearFromBottom = true } = props;

  const [isAFavorite, setIsAFavorite] = useState(props.isAFavorite);

  const goToArtistInfoPage = useCallback(
    () =>
      navigate({
        to: '/main-player/artists/$artistId',
        params: { artistId: String(props.artistId) }
      }),
    [navigate, props.artistId]
  );

  const playArtistSongs = useCallback(
    (isShuffle = false) =>
      window.api.audioLibraryControls
        .getSongInfo(props.songIds, undefined, undefined, undefined, true)
        .then((songs) => {
          if (Array.isArray(songs))
            return createQueue(
              songs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
              'artist',
              isShuffle,
              props.artistId,
              true
            );
          return undefined;
        }),
    [createQueue, props.artistId, props.songIds]
  );

  const playArtistSongsForMultipleSelections = useCallback(
    (isShuffling = false) => {
      const { multipleSelections: artistIds } = multipleSelectionsData;

      return window.api.artistsData
        .getArtistData(artistIds)
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            const songIds = res.data
              .map((artist) => artist.songs.map((song) => song.songId))
              .flat();
            return window.api.audioLibraryControls.getSongInfo(songIds);
          }
          return undefined;
        })
        .then((songsData) => {
          if (Array.isArray(songsData) && songsData.length > 0) {
            return createQueue(
              songsData.filter((song) => !song.isBlacklisted).map((song) => song.songId),
              'artist',
              isShuffling,
              props.artistId,
              true
            );
          }
          return undefined;
        });
    },
    [createQueue, multipleSelectionsData, props.artistId]
  );

  const isAMultipleSelection = useMemo(() => {
    if (!multipleSelectionsData.isEnabled) return false;
    if (multipleSelectionsData.selectionType !== 'artist') return false;
    if (multipleSelectionsData.multipleSelections.length <= 0) return false;
    if (
      multipleSelectionsData.multipleSelections.some(
        (selectionId) => selectionId === props.artistId
      )
    )
      return true;
    return false;
  }, [multipleSelectionsData, props.artistId]);

  const artistContextMenus: ContextMenuItem[] = useMemo(() => {
    const isMultipleSelectionsEnabled =
      multipleSelectionsData.selectionType === 'artist' &&
      multipleSelectionsData.multipleSelections.length !== 1 &&
      isAMultipleSelection;

    return [
      {
        label: isMultipleSelectionsEnabled ? t(`artist.playAllSongs`) : t(`common.playAll`),
        iconName: 'play_arrow',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled) return playArtistSongsForMultipleSelections();
          return playArtistSongs();
        }
      },
      {
        label: isMultipleSelectionsEnabled
          ? t(`common.shuffleAndPlayAll`)
          : t(`common.shuffleAndPlay`),
        iconName: 'shuffle',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled) return playArtistSongsForMultipleSelections(true);
          return playArtistSongs(true);
        }
      },
      {
        label: isMultipleSelectionsEnabled ? t(`common.addSongsToQueue`) : t(`common.addToQueue`),
        iconName: 'queue',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled) {
            const { multipleSelections: artistIds } = multipleSelectionsData;
            return window.api.artistsData.getArtistData(artistIds).then((artists) => {
              const songIds = artists.data
                .map((artist) => artist.songs.map((song) => song.songId))
                .flat();
              const uniqueSongIds = [...new Set(songIds)];
              updateQueueData(undefined, [...queue.songIds, ...uniqueSongIds], false);
              return addNewNotifications([
                {
                  id: `${uniqueSongIds.length}AddedToQueueFromMultiSelection`,
                  duration: 5000,
                  content: t(`notifications.addedToQueue`, {
                    count: uniqueSongIds.length
                  })
                }
              ]);
            });
          }
          updateQueueData(undefined, [...queue.songIds, ...props.songIds], false, false);
          return addNewNotifications([
            {
              id: 'addSongsToQueue',
              duration: 5000,
              content: t(`notifications.addedToQueue`, {
                count: props.songIds.length
              })
            }
          ]);
        }
      },
      {
        label: 'Hr',
        isContextMenuItemSeperator: true,
        handlerFunction: () => true,
        isDisabled: isMultipleSelectionsEnabled
      },
      {
        label: t(
          `artist.${isMultipleSelectionEnabled ? 'toggleLikeArtists' : isAFavorite ? 'dislikeArtist' : 'likeArtist'}`
        ),
        iconName: 'favorite',
        iconClassName: isMultipleSelectionsEnabled
          ? 'material-icons-round-outlined mr-4 text-xl'
          : isAFavorite
            ? 'material-icons-round mr-4 text-xl'
            : 'material-icons-round-outlined mr-4 text-xl',
        handlerFunction: () => {
          const { multipleSelections: artistIds } = multipleSelectionsData;

          return window.api.artistsData
            .toggleLikeArtists(isMultipleSelectionsEnabled ? artistIds : [props.artistId])
            .then((res) => {
              if (res && res.likes.length + res.dislikes.length > 0) {
                return setIsAFavorite((prevState) => {
                  const isLiked = res.likes.includes(props.artistId);
                  const isDisliked = res.dislikes.includes(props.artistId);

                  return isLiked ? true : isDisliked ? false : prevState;
                });
              }
              return undefined;
            })
            .catch((err) => console.error(err));
        }
      },
      {
        label: t(`common.info`),
        iconName: 'info',
        iconClassName: 'material-icons-round-outlined',
        handlerFunction: goToArtistInfoPage,
        isDisabled: isMultipleSelectionsEnabled
      },
      {
        label: t(`common.${isAMultipleSelection ? 'unselect' : 'select'}`),
        iconName: 'checklist',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) {
            return updateMultipleSelections(
              props.artistId,
              'artist',
              isAMultipleSelection ? 'remove' : 'add'
            );
          }
          return toggleMultipleSelections(!isAMultipleSelection, 'artist', [props.artistId]);
        }
      }
      // {
      //   label: 'Select/Unselect All',
      //   iconName: 'checklist',
      //   isDisabled: !props.selectAllHandler,
      //   handlerFunction: () =>
      //     props.selectAllHandler && props.selectAllHandler(),
      // },
    ] satisfies ContextMenuItem[];
  }, [
    multipleSelectionsData,
    isAMultipleSelection,
    t,
    isMultipleSelectionEnabled,
    isAFavorite,
    goToArtistInfoPage,
    playArtistSongsForMultipleSelections,
    playArtistSongs,
    updateQueueData,
    queue.songIds,
    props.songIds,
    props.artistId,
    addNewNotifications,
    toggleMultipleSelections,
    updateMultipleSelections
  ]);

  const contextMenuItemData = useMemo(
    (): ContextMenuAdditionalData =>
      isMultipleSelectionEnabled &&
      multipleSelectionsData.selectionType === 'artist' &&
      isAMultipleSelection
        ? {
            title: t(`artist.selectedArtistCount`, {
              count: multipleSelectionsData.multipleSelections.length
            }),
            artworkPath: DefaultArtistCover
          }
        : {
            title: props.name,
            artworkPath:
              props?.onlineArtworkPaths?.picture_small || props?.artworkPaths?.optimizedArtworkPath,
            artworkClassName: 'rounded-full!',
            subTitle: t(`common.songWithCount`, {
              count: props.songIds.length
            })
          },
    [
      isAMultipleSelection,
      isMultipleSelectionEnabled,
      multipleSelectionsData.multipleSelections.length,
      multipleSelectionsData.selectionType,
      props?.artworkPaths?.optimizedArtworkPath,
      props.name,
      props?.onlineArtworkPaths?.picture_small,
      props.songIds.length,
      t
    ]
  );

  return (
    <NavLink
      to="/main-player/artists/$artistId"
      params={{ artistId: String(props.artistId) }}
      preload={isMultipleSelectionEnabled ? false : undefined}
      // style={{ animationDelay: `${50 * (props.index + 1)}ms` }}
      className={`artist ${appearFromBottom && 'appear-from-bottom'} hover:bg-background-color-2/50 dark:hover:bg-dark-background-color-2/50 mr-2 flex h-44 w-40 cursor-pointer flex-col justify-between overflow-hidden rounded-lg p-4 ${
        props.className
      } ${isAMultipleSelection ? 'bg-background-color-3! dark:bg-dark-background-color-3!' : ''}`}
      onContextMenu={(e) => {
        e.stopPropagation();
        updateContextMenuData(true, artistContextMenus, e.pageX, e.pageY, contextMenuItemData);
      }}
      onClick={(e) => {
        e.preventDefault();
        if (e.getModifierState('Shift') === true && props.selectAllHandler)
          props.selectAllHandler(props.artistId);
        else if (e.getModifierState('Control') === true && !isMultipleSelectionEnabled)
          toggleMultipleSelections(!isAMultipleSelection, 'artist', [props.artistId]);
        else if (isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'artist')
          updateMultipleSelections(
            props.artistId,
            'artist',
            isAMultipleSelection ? 'remove' : 'add'
          );
        else goToArtistInfoPage();
      }}
    >
      <div className="artist-img-container relative flex h-3/4 items-center justify-center">
        {isAFavorite && (
          <span
            className={`material-icons-round bg-background-color-1 !text-font-color-highlight dark:bg-dark-background-color-2 dark:!text-dark-font-color-highlight absolute -bottom-2 z-10 flex rounded-full p-2 text-2xl shadow-lg ${
              isAMultipleSelection && 'bg-background-color-3! dark:bg-dark-background-color-3!'
            }`}
          >
            favorite
          </span>
        )}
        <Img
          src={props?.onlineArtworkPaths?.picture_medium}
          fallbackSrc={props.artworkPaths.artworkPath}
          alt="Default song cover"
          className="aspect-square h-full rounded-full object-cover"
          // enableImgFadeIns={!isMultipleSelectionEnabled}
          enableImgFadeIns={false}
        />
        {isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'artist' && (
          <MultipleSelectionCheckbox
            id={props.artistId}
            selectionType="artist"
            className="absolute right-3 bottom-3 z-10"
          />
        )}
      </div>
      <div className="artist-info-container relative max-h-1/5">
        <Button
          className={`name-container !m-0 !block !w-full !max-w-full truncate !rounded-none !border-0 bg-transparent !p-0 text-center !text-lg outline-offset-1 hover:bg-transparent hover:underline focus-visible:!outline lg:text-base dark:bg-transparent dark:hover:bg-transparent ${
            isAMultipleSelection && 'text-font-color-black! dark:text-font-color-black!'
          }`}
          label={props.name === '' ? 'Unknown Artist' : props.name}
          clickHandler={goToArtistInfoPage}
        />
      </div>
    </NavLink>
  );
};
