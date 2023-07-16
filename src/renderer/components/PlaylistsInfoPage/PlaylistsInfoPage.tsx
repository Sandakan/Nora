/* eslint-disable react/no-array-index-key */
import React, { useContext } from 'react';
import { VariableSizeList as List } from 'react-window';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import debounce from 'renderer/utils/debounce';

import Song from '../SongsPage/Song';
import SensitiveActionConfirmPrompt from '../SensitiveActionConfirmPrompt';
import MainContainer from '../MainContainer';

import PlaylistInfoAndImgContainer from './PlaylistInfoAndImgContainer';
import TitleContainer from '../TitleContainer';

const dropdownOptions: { label: string; value: SongSortTypes }[] = [
  { label: 'Added Order', value: 'addedOrder' },
  { label: 'A to Z', value: 'aToZ' },
  { label: 'Z to A', value: 'zToA' },
  { label: 'Newest', value: 'dateAddedAscending' },
  { label: 'Oldest', value: 'dateAddedDescending' },
  { label: 'Released Year (Ascending)', value: 'releasedYearAscending' },
  { label: 'Released Year (Descending)', value: 'releasedYearDescending' },
  {
    label: 'Most Listened (All Time)',
    value: 'allTimeMostListened',
  },
  {
    label: 'Least Listened (All Time)',
    value: 'allTimeLeastListened',
  },
  {
    label: 'Most Listened (This Month)',
    value: 'monthlyMostListened',
  },
  {
    label: 'Least Listened (This Month)',
    value: 'monthlyLeastListened',
  },
  {
    label: 'Artist Name (A to Z)',
    value: 'artistNameAscending',
  },
  {
    label: 'Artist Name (Z to A)',
    value: 'artistNameDescending',
  },
  { label: 'Album Name (A to Z)', value: 'albumNameAscending' },
  {
    label: 'Album Name (Z to A)',
    value: 'albumNameDescending',
  },
];

const PlaylistInfoPage = () => {
  const { currentlyActivePage, queue, localStorageData } =
    useContext(AppContext);
  const {
    updateQueueData,
    changePromptMenuData,
    addNewNotifications,
    createQueue,
    updateCurrentlyActivePageData,
    playSong,
  } = React.useContext(AppUpdateContext);

  const [playlistData, setPlaylistData] = React.useState({} as Playlist);
  const [playlistSongs, setPlaylistSongs] = React.useState([] as SongData[]);
  const [sortingOrder, setSortingOrder] = React.useState<SongSortTypes>(
    currentlyActivePage?.data?.sortingOrder || 'addedOrder'
  );
  const songsContainerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver(songsContainerRef);

  const fetchPlaylistData = React.useCallback(() => {
    if (currentlyActivePage.data?.playlistId) {
      window.api.playlistsData
        .getPlaylistData([currentlyActivePage.data.playlistId])
        .then((res) => {
          if (res && res.length > 0 && res[0]) setPlaylistData(res[0]);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [currentlyActivePage.data]);

  const fetchPlaylistSongsData = React.useCallback(() => {
    const preserveAddedOrder = sortingOrder === 'addedOrder';
    if (playlistData.songs && playlistData.songs.length > 0) {
      window.api.audioLibraryControls
        .getSongInfo(
          playlistData.songs,
          sortingOrder,
          undefined,
          preserveAddedOrder
        )
        .then((songsData) => {
          if (songsData && songsData.length > 0) setPlaylistSongs(songsData);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [playlistData.songs, sortingOrder]);

  React.useEffect(() => {
    fetchPlaylistData();
    const managePlaylistUpdatesInPlaylistsInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'playlists') fetchPlaylistData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      managePlaylistUpdatesInPlaylistsInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        managePlaylistUpdatesInPlaylistsInfoPage
      );
    };
  }, [fetchPlaylistData]);

  React.useEffect(() => {
    fetchPlaylistSongsData();
    const managePlaylistSongUpdatesInPlaylistInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
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
    document.addEventListener(
      'app/dataUpdates',
      managePlaylistSongUpdatesInPlaylistInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        managePlaylistSongUpdatesInPlaylistInfoPage
      );
    };
  }, [fetchPlaylistSongsData]);

  const selectAllHandler = useSelectAllHandler(
    playlistSongs,
    'songs',
    'songId'
  );

  const handleSongPlayBtnClick = React.useCallback(
    (currSongId: string) => {
      const queueSongIds = playlistSongs
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(
        queueSongIds,
        'playlist',
        false,
        playlistData.playlistId,
        false
      );
      playSong(currSongId, true);
    },
    [createQueue, playSong, playlistData.playlistId, playlistSongs]
  );

  const listItems = React.useMemo(
    () => [playlistData, ...playlistSongs],
    [playlistData, playlistSongs]
  );

  const listComponents = React.useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      const song = listItems[index];
      return (
        <div style={style}>
          {'songId' in song ? (
            <Song
              key={index}
              index={index - 1}
              isIndexingSongs={
                localStorageData?.preferences?.isSongIndexingEnabled
              }
              title={song.title}
              artists={song.artists}
              album={song.album}
              duration={song.duration}
              songId={song.songId}
              artworkPaths={song.artworkPaths}
              path={song.path}
              year={song.year}
              isAFavorite={song.isAFavorite}
              isBlacklisted={song.isBlacklisted}
              onPlayClick={handleSongPlayBtnClick}
              additionalContextMenuItems={[
                {
                  label: 'Remove from this Playlist',
                  iconName: 'playlist_remove',
                  handlerFunction: () =>
                    window.api.playlistsData
                      .removeSongFromPlaylist(
                        playlistData.playlistId,
                        song.songId
                      )
                      .then(
                        (res) =>
                          res.success &&
                          addNewNotifications([
                            {
                              id: `${song.songId}Removed`,
                              delay: 5000,
                              content: (
                                <span>
                                  '{song.title}' removed from '
                                  {playlistData.name}' playlist successfully.
                                </span>
                              ),
                            },
                          ])
                      )
                      .catch((err) => console.error(err)),
                },
              ]}
              selectAllHandler={selectAllHandler}
            />
          ) : (
            <PlaylistInfoAndImgContainer
              playlist={song}
              songs={playlistSongs}
            />
          )}
        </div>
      );
    },
    [
      addNewNotifications,
      handleSongPlayBtnClick,
      listItems,
      localStorageData?.preferences?.isSongIndexingEnabled,
      playlistData.name,
      playlistData.playlistId,
      playlistSongs,
      selectAllHandler,
    ]
  );

  const clearSongHistory = React.useCallback(() => {
    changePromptMenuData(
      true,
      <SensitiveActionConfirmPrompt
        title="Confrim the action to clear Song History"
        content={`You wouldn't be able to see what you have listened previously if you decide to continue this action.`}
        confirmButton={{
          label: 'Clear History',
          clickHandler: () =>
            window.api.audioLibraryControls
              .clearSongHistory()
              .then(
                (res) =>
                  res.success &&
                  addNewNotifications([
                    {
                      id: 'queueCleared',
                      delay: 5000,
                      content: (
                        <span>Cleared the song history successfully.</span>
                      ),
                    },
                  ])
              )
              .catch((err) => console.error(err)),
        }}
      />
    );
  }, [addNewNotifications, changePromptMenuData]);

  const addSongsToQueue = React.useCallback(() => {
    const validSongIds = playlistSongs
      .filter((song) => !song.isBlacklisted)
      .map((song) => song.songId);
    updateQueueData(undefined, [...queue.queue, ...validSongIds]);
    addNewNotifications([
      {
        id: `addedToQueue`,
        delay: 5000,
        content: `
            Added ${validSongIds.length} song${
          validSongIds.length === 1 ? '' : 's'
        } to the queue.
         `,
      },
    ]);
  }, [addNewNotifications, playlistSongs, queue.queue, updateQueueData]);

  const shuffleAndPlaySongs = React.useCallback(
    () =>
      createQueue(
        playlistSongs
          .filter((song) => !song.isBlacklisted)
          .map((song) => song.songId),
        'playlist',
        true,
        playlistData.playlistId,
        true
      ),
    [createQueue, playlistData.playlistId, playlistSongs]
  );

  const playAllSongs = React.useCallback(
    () =>
      createQueue(
        playlistSongs
          .filter((song) => !song.isBlacklisted)
          .map((song) => song.songId),
        'songs',
        false,
        playlistData.playlistId,
        true
      ),
    [createQueue, playlistData.playlistId, playlistSongs]
  );

  const getItemSize = React.useCallback((index: number) => {
    if (index === 0) return 300;
    return 60;
  }, []);

  return (
    <MainContainer
      className="main-container playlist-info-page-container !h-full px-8 !pb-0 !pr-0"
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
            label: 'Clear History',
            iconName: 'clear',
            clickHandler: clearSongHistory,
            isVisible: playlistData.playlistId === 'History',
            isDisabled: !(playlistData.songs && playlistData.songs.length > 0),
          },
          {
            label: 'Play All',
            iconName: 'play_arrow',
            clickHandler: playAllSongs,
            isDisabled: !(playlistData.songs && playlistData.songs.length > 0),
          },
          {
            tooltipLabel: 'Shuffle and Play',
            iconName: 'shuffle',
            clickHandler: shuffleAndPlaySongs,
            isDisabled: !(playlistData.songs && playlistData.songs.length > 0),
          },
          {
            tooltipLabel: 'Add to Queue',
            iconName: 'add',
            clickHandler: addSongsToQueue,
            isDisabled: !(playlistData.songs && playlistData.songs.length > 0),
          },
        ]}
        dropdown={{
          name: 'PlaylistPageSortDropdown',
          value: sortingOrder,
          options: dropdownOptions,
          onChange: (e) => {
            const order = e.currentTarget.value as SongSortTypes;
            updateCurrentlyActivePageData((currentPageData) => ({
              ...currentPageData,
              sortingOrder: order,
            }));
            setSortingOrder(order);
          },
          isDisabled: !(playlistData.songs && playlistData.songs.length > 0),
        }}
      />
      <div className="flex h-full flex-col">
        <div className="songs-list-container h-full" ref={songsContainerRef}>
          {listItems.length > 0 && (
            <List
              itemCount={listItems.length}
              itemSize={getItemSize}
              width={width || '100%'}
              height={height || 450}
              overscanCount={10}
              className="appear-from-bottom h-full pb-4 delay-100"
              initialScrollOffset={
                currentlyActivePage.data?.scrollTopOffset ?? 0
              }
              onScroll={(data) => {
                if (!data.scrollUpdateWasRequested && data.scrollOffset !== 0)
                  debounce(
                    () =>
                      updateCurrentlyActivePageData((currentPageData) => ({
                        ...currentPageData,
                        scrollTopOffset: data.scrollOffset,
                      })),
                    500
                  );
              }}
            >
              {listComponents}
            </List>
          )}
        </div>
      </div>
      {playlistSongs.length === 0 && (
        <div className="no-songs-container appear-from-bottom relative flex h-full flex-grow flex-col items-center justify-center text-center text-lg font-light text-font-color-black !opacity-80 dark:text-font-color-white">
          <span className="material-icons-round-outlined mb-4 text-5xl">
            brightness_empty
          </span>
          Seems like this playlist is empty.
        </div>
      )}
    </MainContainer>
  );
};

PlaylistInfoPage.displayName = 'PlaylistInfoPage';
export default PlaylistInfoPage;
