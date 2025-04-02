import { lazy, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';

import Song from '../SongsPage/Song';
import MainContainer from '../MainContainer';

import PlaylistInfoAndImgContainer from './PlaylistInfoAndImgContainer';
import TitleContainer from '../TitleContainer';
import { songSortOptions, songFilterOptions } from '../SongsPage/SongOptions';
import VirtualizedList from '../VirtualizedList';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const SensitiveActionConfirmPrompt = lazy(() => import('../SensitiveActionConfirmPrompt'));

const PlaylistInfoPage = () => {
  const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);
  const queue = useStore(store, (state) => state.localStorage.queue);
  const playlistSortingState = useStore(
    store,
    (state) => state.localStorage.sortingStates?.songsPage || 'addedOrder'
  );
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const {
    updateQueueData,
    changePromptMenuData,
    addNewNotifications,
    createQueue,
    updateCurrentlyActivePageData,
    playSong
  } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [playlistData, setPlaylistData] = useState({} as Playlist);
  const [playlistSongs, setPlaylistSongs] = useState([] as SongData[]);
  const [sortingOrder, setSortingOrder] = useState<SongSortTypes>(
    (currentlyActivePage?.data?.sortingOrder as SongSortTypes) || playlistSortingState
  );
  const [filteringOrder, setFilteringOrder] = useState<SongFilterTypes>('notSelected');

  const fetchPlaylistData = useCallback(() => {
    if (currentlyActivePage.data?.playlistId) {
      window.api.playlistsData
        .getPlaylistData([currentlyActivePage.data.playlistId as string])
        .then((res) => {
          if (res && res.length > 0 && res[0]) setPlaylistData(res[0]);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [currentlyActivePage.data]);

  const fetchPlaylistSongsData = useCallback(() => {
    const preserveAddedOrder = sortingOrder === 'addedOrder';
    if (playlistData.songs && playlistData.songs.length > 0) {
      window.api.audioLibraryControls
        .getSongInfo(
          playlistData.songs,
          sortingOrder,
          filteringOrder,
          undefined,
          preserveAddedOrder
        )
        .then((songsData) => {
          if (songsData && songsData.length > 0) setPlaylistSongs(songsData);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [filteringOrder, playlistData.songs, sortingOrder]);

  useEffect(() => {
    fetchPlaylistData();
    const managePlaylistUpdatesInPlaylistsInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'playlists') fetchPlaylistData();
        }
      }
    };
    document.addEventListener('app/dataUpdates', managePlaylistUpdatesInPlaylistsInfoPage);
    return () => {
      document.removeEventListener('app/dataUpdates', managePlaylistUpdatesInPlaylistsInfoPage);
    };
  }, [fetchPlaylistData]);

  useEffect(() => {
    fetchPlaylistSongsData();
    const managePlaylistSongUpdatesInPlaylistInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'playlists/newSong' ||
            event.dataType === 'playlists/deletedSong' ||
            event.dataType === 'blacklist/songBlacklist' ||
            (event.dataType === 'songs/likes' && event.eventData.length > 1)
          )
            fetchPlaylistSongsData();
        }
      }
    };
    document.addEventListener('app/dataUpdates', managePlaylistSongUpdatesInPlaylistInfoPage);
    return () => {
      document.removeEventListener('app/dataUpdates', managePlaylistSongUpdatesInPlaylistInfoPage);
    };
  }, [fetchPlaylistSongsData]);

  const selectAllHandler = useSelectAllHandler(playlistSongs, 'songs', 'songId');

  const handleSongPlayBtnClick = useCallback(
    (currSongId: string) => {
      const queueSongIds = playlistSongs
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'playlist', false, playlistData.playlistId, false);
      playSong(currSongId, true);
    },
    [createQueue, playSong, playlistData.playlistId, playlistSongs]
  );

  const listItems = useMemo(() => [playlistData, ...playlistSongs], [playlistData, playlistSongs]);

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
    updateQueueData(undefined, [...queue.queue, ...validSongIds]);
    addNewNotifications([
      {
        id: `addedToQueue`,
        duration: 5000,
        content: t('notifications.addedToQueue', {
          count: validSongIds.length
        })
      }
    ]);
  }, [addNewNotifications, playlistSongs, queue.queue, t, updateQueueData]);

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
      className="main-container playlist-info-page-container h-full! px-8 pb-0! pr-0!"
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
            isVisible: playlistData.playlistId === 'History',
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
              updateCurrentlyActivePageData((currentPageData) => ({
                ...currentPageData,
                filteringOrder: e.currentTarget.value as SongFilterTypes
              }));
              setFilteringOrder(e.currentTarget.value as SongFilterTypes);
            }
          },
          {
            name: 'PlaylistPageSortDropdown',
            type: `${t('common.sortBy')} :`,
            value: sortingOrder,
            options: songSortOptions.concat([
              { label: t('sortTypes.addedOrder'), value: 'addedOrder' }
            ]),
            onChange: (e) => {
              const order = e.currentTarget.value as SongSortTypes;
              updateCurrentlyActivePageData((currentPageData) => ({
                ...currentPageData,
                sortingOrder: order
              }));
              setSortingOrder(order);
            },
            isDisabled: !(playlistData.songs && playlistData.songs.length > 0)
          }
        ]}
      />
      <VirtualizedList
        data={listItems}
        fixedItemHeight={60}
        scrollTopOffset={currentlyActivePage.data?.scrollTopOffset}
        itemContent={(index, item) => {
          if ('songId' in item)
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
          return <PlaylistInfoAndImgContainer playlist={item} songs={playlistSongs} />;
        }}
      />
      {playlistSongs.length === 0 && (
        <div className="no-songs-container appear-from-bottom relative flex h-full grow flex-col items-center justify-center text-center text-lg font-light text-font-color-black opacity-80! dark:text-font-color-white">
          <span className="material-icons-round-outlined mb-4 text-5xl">brightness_empty</span>
          {t('playlist.empty')}
        </div>
      )}
    </MainContainer>
  );
};

PlaylistInfoPage.displayName = 'PlaylistInfoPage';
export default PlaylistInfoPage;
