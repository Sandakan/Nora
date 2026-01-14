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
import historyPlaylistCoverImage from '../../../assets/images/webp/history-playlist-icon.webp';
import { SpecialPlaylists } from '@common/playlists.enum';
export const Route = createFileRoute('/main-player/playlists/history')({
  validateSearch: songSearchSchema,
  component: HistoryPlaylistInfoPage
});

const playlistData: Playlist = {
  playlistId: SpecialPlaylists.History, // Special ID for History playlist
  name: 'History',
  artworkPaths: {
    artworkPath: historyPlaylistCoverImage,
    optimizedArtworkPath: historyPlaylistCoverImage,
    isDefaultArtwork: true
  },
  songs: [],
  createdDate: new Date(),
  isArtworkAvailable: true
};

function HistoryPlaylistInfoPage() {
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
  const navigate = useNavigate({ from: '/main-player/playlists/history' });

  const { data: historySongs = [] } = useSuspenseQuery({
    ...songQuery.history({ sortType: sortingOrder }),
    select: (data) => data.data
  });

  const selectAllHandler = useSelectAllHandler(historySongs, 'songs', 'songId');

  const handleSongPlayBtnClick = useCallback(
    (currSongId: number) => {
      const queueSongIds = historySongs
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'playlist', false, 'history', false);
      playSong(currSongId, true);
    },
    [createQueue, playSong, historySongs]
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
    const validSongIds = historySongs
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
  }, [addNewNotifications, historySongs, queue.songIds, t, updateQueueData]);

  const shuffleAndPlaySongs = useCallback(
    () =>
      createQueue(
        historySongs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
        'playlist',
        true,
        'history',
        true
      ),
    [createQueue, historySongs]
  );

  const playAllSongs = useCallback(
    () =>
      createQueue(
        historySongs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
        'songs',
        false,
        'history',
        true
      ),
    [createQueue, historySongs]
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
        title={t('playlistsPage.history')}
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
            isDisabled: !(historySongs.length > 0)
          },
          {
            tooltipLabel: t('common.shuffleAndPlay'),
            iconName: 'shuffle',
            clickHandler: shuffleAndPlaySongs,
            isDisabled: !(historySongs.length > 0)
          },
          {
            tooltipLabel: t('common.addToQueue'),
            iconName: 'add',
            clickHandler: addSongsToQueue,
            isDisabled: !(historySongs.length > 0)
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
            isDisabled: !(historySongs.length > 0)
          }
        ]}
      />
      <VirtualizedList
        data={historySongs}
        fixedItemHeight={60}
        scrollTopOffset={scrollTopOffset}
        components={{
          Header: () => <PlaylistInfoAndImgContainer playlist={playlistData} songs={historySongs} />
        }}
        itemContent={(index, item) => {
          return (
            <Song
              key={index}
              index={index}
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
      {historySongs.length === 0 && (
        <div className="no-songs-container appear-from-bottom text-font-color-black dark:text-font-color-white relative flex h-full grow flex-col items-center justify-center text-center text-lg font-light opacity-80!">
          <span className="material-icons-round-outlined mb-4 text-5xl">brightness_empty</span>
          {t('playlist.empty')}
        </div>
      )}
    </MainContainer>
  );
}
