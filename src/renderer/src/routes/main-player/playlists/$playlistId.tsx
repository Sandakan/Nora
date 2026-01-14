import MainContainer from '@renderer/components/MainContainer';
import PlaylistInfoAndImgContainer from '@renderer/components/PlaylistsInfoPage/PlaylistInfoAndImgContainer';
import Song from '@renderer/components/SongsPage/Song';
import { songFilterOptions, songSortOptions } from '@renderer/components/SongsPage/SongOptions';
import TitleContainer from '@renderer/components/TitleContainer';
import VirtualizedList from '@renderer/components/VirtualizedList';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import useSelectAllHandler from '@renderer/hooks/useSelectAllHandler';
import { queryClient } from '@renderer/index';
import { playlistQuery } from '@renderer/queries/playlists';
import { songQuery } from '@renderer/queries/songs';
import { store } from '@renderer/store/store';
import { songSearchSchema } from '@renderer/utils/zod/songSchema';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { lazy, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { SpecialPlaylists } from '@common/playlists.enum';

const SensitiveActionConfirmPrompt = lazy(
  () => import('@renderer/components/SensitiveActionConfirmPrompt')
);

export const Route = createFileRoute('/main-player/playlists/$playlistId')({
  validateSearch: songSearchSchema,
  component: PlaylistInfoPage,
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(
      playlistQuery.single({ playlistId: Number(params.playlistId) })
    );
  }
});

function PlaylistInfoPage() {
  const { playlistId } = Route.useParams({
    select: (params) => ({ playlistId: Number(params.playlistId) })
  });
  const { scrollTopOffset } = Route.useSearch();

  const queue = useStore(store, (state) => state.localStorage.queue);
  const playlistSortingState = useStore(
    store,
    (state) => state.localStorage.sortingStates?.songsPage || 'addedOrder'
  );
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const { updateQueueData, changePromptMenuData, addNewNotifications, createQueue, playSong } =
    useContext(AppUpdateContext);
  const { t } = useTranslation();
  const { sortingOrder = playlistSortingState, filteringOrder = 'notSelected' } = Route.useSearch();
  const navigate = useNavigate({ from: '/main-player/playlists/$playlistId' });

  const { data: playlistData } = useSuspenseQuery({
    ...playlistQuery.single({ playlistId: playlistId }),
    select: (data) => data.data[0]
  });
  const { data: playlistSongs = [] } = useQuery({
    ...songQuery.allSongInfo({
      songIds: playlistData.songs,
      sortType: sortingOrder,
      filterType: filteringOrder
    }),
    enabled: Array.isArray(playlistData.songs)
  });

  const selectAllHandler = useSelectAllHandler(playlistSongs, 'songs', 'songId');

  const handleSongPlayBtnClick = useCallback(
    (currSongId: number) => {
      const queueSongIds = playlistSongs
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'playlist', false, playlistData.playlistId, false);
      playSong(currSongId, true);
    },
    [createQueue, playSong, playlistData.playlistId, playlistSongs]
  );

  const clearSongHistory = useCallback(() => {
    changePromptMenuData(
      true,
      <SensitiveActionConfirmPrompt
        title={t('settingsPage.confirmSongHistoryDeletion')}
        content={t('settingsPage.songHistoryDeletionDisclaimer')}
        confirmButton={{
          label: t('settingsPage.clearHistory'),
          clickHandler: () =>
            window.api.audioLibraryControls
              .clearSongHistory()
              .then(
                (res) =>
                  res.success &&
                  addNewNotifications([
                    {
                      id: 'queueCleared',
                      duration: 5000,
                      content: t('settingsPage.songHistoryDeletionSuccess')
                    }
                  ])
              )
              .catch((err) => console.error(err))
        }}
      />
    );
  }, [addNewNotifications, changePromptMenuData, t]);

  const addSongsToQueue = useCallback(() => {
    const validSongIds = playlistSongs
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
  }, [addNewNotifications, playlistSongs, queue.songIds, t, updateQueueData]);

  const shuffleAndPlaySongs = useCallback(
    () =>
      createQueue(
        playlistSongs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
        'playlist',
        true,
        playlistData.playlistId,
        true
      ),
    [createQueue, playlistData.playlistId, playlistSongs]
  );

  const playAllSongs = useCallback(
    () =>
      createQueue(
        playlistSongs.filter((song) => !song.isBlacklisted).map((song) => song.songId),
        'songs',
        false,
        playlistData.playlistId,
        true
      ),
    [createQueue, playlistData.playlistId, playlistSongs]
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
        title={playlistData.name}
        className="pr-4"
        buttons={[
          {
            label: t('settingsPage.clearHistory'),
            iconName: 'clear',
            clickHandler: clearSongHistory,
            isVisible: playlistData.playlistId === SpecialPlaylists.History,
            isDisabled: !(playlistData.songs && playlistData.songs.length > 0)
          },
          {
            label: t('common.playAll'),
            iconName: 'play_arrow',
            clickHandler: playAllSongs,
            isDisabled: !(playlistData.songs && playlistData.songs.length > 0)
          },
          {
            tooltipLabel: t('common.shuffleAndPlay'),
            iconName: 'shuffle',
            clickHandler: shuffleAndPlaySongs,
            isDisabled: !(playlistData.songs && playlistData.songs.length > 0)
          },
          {
            tooltipLabel: t('common.addToQueue'),
            iconName: 'add',
            clickHandler: addSongsToQueue,
            isDisabled: !(playlistData.songs && playlistData.songs.length > 0)
          }
        ]}
        dropdowns={[
          {
            name: 'songsPageFilterDropdown',
            type: `${t('common.filterBy')} :`,
            value: filteringOrder,
            options: songFilterOptions,
            onChange: (e) => {
              const order = e.currentTarget.value as SongFilterTypes;
              navigate({ search: (prev) => ({ ...prev, filteringOrder: order }) });
            }
          },
          {
            name: 'PlaylistPageSortDropdown',
            type: `${t('common.sortBy')} :`,
            value: sortingOrder,
            options: songSortOptions,
            onChange: (e) => {
              const order = e.currentTarget.value as SongSortTypes;
              navigate({ search: (prev) => ({ ...prev, sortingOrder: order }) });
            },
            isDisabled: !(playlistData.songs && playlistData.songs.length > 0)
          }
        ]}
      />
      <VirtualizedList
        data={playlistSongs}
        fixedItemHeight={60}
        scrollTopOffset={scrollTopOffset}
        components={{
          Header: () => (
            <PlaylistInfoAndImgContainer playlist={playlistData} songs={playlistSongs} />
          )
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
              additionalContextMenuItems={[
                {
                  label: t('playlistsPage.removeFromThisPlaylist'),
                  iconName: 'playlist_remove',
                  handlerFunction: () =>
                    window.api.playlistsData
                      .removeSongFromPlaylist(playlistData.playlistId, item.songId)
                      .then(
                        (res) =>
                          res.success &&
                          addNewNotifications([
                            {
                              id: `${item.songId}Removed`,
                              duration: 5000,
                              content: t('playlistsPage.removeSongFromPlaylistSuccess', {
                                title: item.title,
                                playlistName: playlistData.name
                              })
                            }
                          ])
                      )
                      .catch((err) => console.error(err))
                }
              ]}
            />
          );
        }}
      />
      {playlistSongs.length === 0 && (
        <div className="no-songs-container appear-from-bottom text-font-color-black dark:text-font-color-white relative flex h-full grow flex-col items-center justify-center text-center text-lg font-light opacity-80!">
          <span className="material-icons-round-outlined mb-4 text-5xl">brightness_empty</span>
          {t('playlist.empty')}
        </div>
      )}
    </MainContainer>
  );
}
