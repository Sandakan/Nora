import MainContainer from '@renderer/components/MainContainer';
import PlaylistInfoAndImgContainer from '@renderer/components/PlaylistsInfoPage/PlaylistInfoAndImgContainer';
import Song from '@renderer/components/SongsPage/Song';
import { songSortOptions } from '@renderer/components/SongsPage/SongOptions';
import TitleContainer from '@renderer/components/TitleContainer';
import VirtualizedList from '@renderer/components/VirtualizedList';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import useSelectAllHandler from '@renderer/hooks/useSelectAllHandler';
import { songQuery } from '@renderer/queries/songs';
import { store } from '@renderer/store/store';
import { songSearchSchema } from '@renderer/utils/zod/songSchema';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import favoritesPlaylistCoverImage from '../../../assets/images/webp/favorites-playlist-icon.webp';
import { SpecialPlaylists } from '../../../../../common/playlists.enum';

export const Route = createFileRoute('/main-player/playlists/favorites')({
  validateSearch: songSearchSchema,
  component: FavoritesPlaylistInfoPage
});

const playlistData: Playlist = {
  playlistId: SpecialPlaylists.Favorites, // Special ID for Favorites playlist
  name: 'Favorites',
  artworkPaths: {
    artworkPath: favoritesPlaylistCoverImage,
    optimizedArtworkPath: favoritesPlaylistCoverImage,
    isDefaultArtwork: true
  },
  songs: [],
  createdDate: new Date(),
  isArtworkAvailable: true
};

function FavoritesPlaylistInfoPage() {
  const { scrollTopOffset } = Route.useSearch();

  const queue = useStore(store, (state) => state.localStorage.queue);
  const playlistSortingState = useStore(
    store,
    (state) => state.localStorage.sortingStates?.songsPage || 'addedOrder'
  );
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const { updateQueueData, addNewNotifications, createQueue, playSong } =
    useContext(AppUpdateContext);
  const { t } = useTranslation();
  const { sortingOrder = playlistSortingState } = Route.useSearch();
  const navigate = useNavigate({ from: '/main-player/playlists/favorites' });

  const { data: favoriteSongs = [] } = useSuspenseQuery({
    ...songQuery.favorites({ sortType: sortingOrder }),
    select: (data) => data.data
  });

  const selectAllHandler = useSelectAllHandler(favoriteSongs, 'songs', 'songId');

  const handleSongPlayBtnClick = useCallback(
    (currSongId: number) => {
      const queueSongIds = favoriteSongs
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'favorites', false, '', false);
      playSong(currSongId, true);
    },
    [createQueue, playSong, favoriteSongs]
  );

  // const clearSongHistory = useCallback(() => {
  //   changePromptMenuData(
  //     true,
  //     <SensitiveActionConfirmPrompt
  //       title={t('settingsPage.confirmSongHistoryDeletion')}
  //       content={t('settingsPage.songHistoryDeletionDisclaimer')}
  //       confirmButton={{
  //         label: t('settingsPage.clearHistory'),
  //         clickHandler: () =>
  //           window.api.audioLibraryControls
  //             .clearSongHistory()
  //             .then(
  //               (res) =>
  //                 res.success &&
  //                 addNewNotifications([
  //                   {
  //                     id: 'queueCleared',
  //                     duration: 5000,
  //                     content: t('settingsPage.songHistoryDeletionSuccess')
  //                   }
  //                 ])
  //             )
  //             .catch((err) => console.error(err))
  //       }}
  //     />
  //   );
  // }, [addNewNotifications, changePromptMenuData, t]);

  const addSongsToQueue = useCallback(() => {
    const validSongIds = favoriteSongs
      .filter((song) => !song.isBlacklisted)
      .map((song) => song.songId);
    updateQueueData(undefined, [...queue.songIds, ...validSongIds]);
    addNewNotifications([
      {
        id: `addedToQueue`,
        duration: 5000,
        content: t('notifications.addedToQueue', {
          count: validSongIds.length
        })
      }
    ]);
  }, [addNewNotifications, favoriteSongs, queue.songIds, t, updateQueueData]);

  const shuffleAndPlaySongs = useCallback(
    () =>
      createQueue(
        favoriteSongs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
        'favorites',
        true,
        '',
        true
      ),
    [createQueue, favoriteSongs]
  );

  const playAllSongs = useCallback(
    () =>
      createQueue(
        favoriteSongs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
        'favorites',
        false,
        '',
        true
      ),
    [createQueue, favoriteSongs]
  );

  return (
    <MainContainer
      className="main-container playlist-info-page-container h-full! px-8 pr-0! pb-0!"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <TitleContainer
        title={t('playlistsPage.favorites')}
        className="pr-4"
        buttons={[
          // {
          //   label: t('settingsPage.clearHistory'),
          //   iconName: 'clear',
          //   clickHandler: clearSongHistory,
          //   isVisible: playlistData.playlistId === 'History',
          //   isDisabled: !(playlistData.songs && playlistData.songs.length > 0)
          // },
          {
            label: t('common.playAll'),
            iconName: 'play_arrow',
            clickHandler: playAllSongs,
            isDisabled: !(favoriteSongs.length > 0)
          },
          {
            tooltipLabel: t('common.shuffleAndPlay'),
            iconName: 'shuffle',
            clickHandler: shuffleAndPlaySongs,
            isDisabled: !(favoriteSongs.length > 0)
          },
          {
            tooltipLabel: t('common.addToQueue'),
            iconName: 'add',
            clickHandler: addSongsToQueue,
            isDisabled: !(favoriteSongs.length > 0)
          }
        ]}
        dropdowns={[
          {
            name: 'PlaylistPageSortDropdown',
            type: `${t('common.sortBy')} :`,
            value: sortingOrder,
            options: songSortOptions,
            onChange: (e) => {
              const order = e.currentTarget.value as SongSortTypes;
              navigate({ search: (prev) => ({ ...prev, sortingOrder: order }), replace: true });
            },
            isDisabled: !(favoriteSongs.length > 0)
          }
        ]}
      />
      <VirtualizedList
        data={favoriteSongs}
        fixedItemHeight={60}
        scrollTopOffset={scrollTopOffset}
        components={{
          Header: () => (
            <PlaylistInfoAndImgContainer playlist={playlistData} songs={favoriteSongs} />
          )
        }}
        itemContent={(index, item) => {
          return (
            <Song
              key={index}
              // # Since the first element is the PlaylistInfoAndImgContainer, we need to subtract 1
              index={index - 1}
              isIndexingSongs={preferences.isSongIndexingEnabled}
              onPlayClick={handleSongPlayBtnClick}
              selectAllHandler={selectAllHandler}
              {...item}
              trackNo={undefined}
              // additionalContextMenuItems={[
              //   {
              //     label: t('playlistsPage.removeFromThisPlaylist'),
              //     iconName: 'playlist_remove',
              //     handlerFunction: () =>
              //       window.api.playlistsData
              //         .removeSongFromPlaylist(playlistData.playlistId, item.songId)
              //         .then(
              //           (res) =>
              //             res.success &&
              //             addNewNotifications([
              //               {
              //                 id: `${item.songId}Removed`,
              //                 duration: 5000,
              //                 content: t('playlistsPage.removeSongFromPlaylistSuccess', {
              //                   title: item.title,
              //                   playlistName: playlistData.name
              //                 })
              //               }
              //             ])
              //         )
              //         .catch((err) => console.error(err))
              //   }
              // ]}
            />
          );
        }}
      />
      {favoriteSongs.length === 0 && (
        <div className="no-songs-container appear-from-bottom text-font-color-black dark:text-font-color-white relative flex h-full grow flex-col items-center justify-center text-center text-lg font-light opacity-80!">
          <span className="material-icons-round-outlined mb-4 text-5xl">brightness_empty</span>
          {t('playlist.empty')}
        </div>
      )}
    </MainContainer>
  );
}

