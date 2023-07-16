/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useContext } from 'react';
import { VariableSizeList as List } from 'react-window';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import debounce from 'renderer/utils/debounce';

import MainContainer from '../MainContainer';
import Song from '../SongsPage/Song';
import TitleContainer from '../TitleContainer';
import AlbumImgAndInfoContainer from './AlbumImgAndInfoContainer';

interface AlbumContentReducer {
  albumData: Album;
  songsData: SongData[];
  sortingOrder: SongSortTypes;
}

type AlbumContentReducerActions =
  | 'ALBUM_DATA_UPDATE'
  | 'SONGS_DATA_UPDATE'
  | 'UPDATE_SORTING_ORDER';

const reducer = (
  state: AlbumContentReducer,
  action: { type: AlbumContentReducerActions; data: any }
): AlbumContentReducer => {
  switch (action.type) {
    case 'ALBUM_DATA_UPDATE':
      return {
        ...state,
        albumData: action.data,
      };
    case 'SONGS_DATA_UPDATE':
      return {
        ...state,
        songsData: action.data,
      };
    case 'UPDATE_SORTING_ORDER':
      return {
        ...state,
        sortingOrder: action.data,
      };
    default:
      return state;
  }
};

const dropdownOptions: { label: string; value: SongSortTypes }[] = [
  { label: 'A to Z', value: 'aToZ' },
  { label: 'Z to A', value: 'zToA' },
  { label: 'Newest', value: 'dateAddedAscending' },
  { label: 'Oldest', value: 'dateAddedDescending' },
  { label: 'Released Year (Ascending)', value: 'releasedYearAscending' },
  { label: 'Released Year (Descending)', value: 'releasedYearDescending' },
  { label: 'Track Number (Ascending)', value: 'trackNoAscending' },
  { label: 'Track Number (Descending)', value: 'trackNoDescending' },
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

const AlbumInfoPage = () => {
  const { currentlyActivePage, queue, localStorageData } =
    useContext(AppContext);
  const {
    createQueue,
    updateQueueData,
    addNewNotifications,
    updateCurrentlyActivePageData,
    playSong,
  } = useContext(AppUpdateContext);
  const songsContainerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver(songsContainerRef);

  const [albumContent, dispatch] = React.useReducer(reducer, {
    albumData: {} as Album,
    songsData: [] as SongData[],
    sortingOrder: 'trackNoAscending' as SongSortTypes,
  });

  const fetchAlbumData = React.useCallback(() => {
    if (currentlyActivePage.data.albumId) {
      window.api.albumsData
        .getAlbumData([currentlyActivePage.data.albumId as string])
        .then((res) => {
          if (res && res.length > 0 && res[0]) {
            dispatch({ type: 'ALBUM_DATA_UPDATE', data: res[0] });
          }
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [currentlyActivePage.data.albumId]);

  const fetchAlbumSongs = React.useCallback(() => {
    if (
      albumContent.albumData.songs &&
      albumContent.albumData.songs.length > 0
    ) {
      window.api.audioLibraryControls
        .getSongInfo(
          albumContent.albumData.songs.map((song) => song.songId),
          albumContent.sortingOrder
        )
        .then((res) => {
          if (res && res.length > 0) {
            dispatch({ type: 'SONGS_DATA_UPDATE', data: res });
          }
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [albumContent.albumData, albumContent.sortingOrder]);

  React.useEffect(() => {
    fetchAlbumData();
    const manageDataUpdatesInAlbumsInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'albums') fetchAlbumData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageDataUpdatesInAlbumsInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageDataUpdatesInAlbumsInfoPage
      );
    };
  }, [fetchAlbumData]);

  React.useEffect(() => {
    fetchAlbumSongs();
    const manageAlbumSongUpdatesInAlbumInfoPage = (e: Event) => {
      const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
      if ('detail' in e) {
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'songs/deletedSong' ||
            event.dataType === 'songs/newSong' ||
            event.dataType === 'blacklist/songBlacklist' ||
            (event.dataType === 'songs/likes' && event.eventData.length > 1)
          )
            fetchAlbumSongs();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageAlbumSongUpdatesInAlbumInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageAlbumSongUpdatesInAlbumInfoPage
      );
    };
  }, [fetchAlbumSongs]);

  const selectAllHandler = useSelectAllHandler(
    albumContent.songsData,
    'songs',
    'songId'
  );

  const handleSongPlayBtnClick = React.useCallback(
    (currSongId: string) => {
      const queueSongIds = albumContent.songsData
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(
        queueSongIds,
        'album',
        false,
        albumContent.albumData.albumId,
        false
      );
      playSong(currSongId, true);
    },
    [
      albumContent.songsData,
      albumContent.albumData.albumId,
      createQueue,
      playSong,
    ]
  );

  const listItems = React.useMemo(
    () => [albumContent.albumData, ...albumContent.songsData],
    [albumContent.albumData, albumContent.songsData]
  );

  const listComponents = React.useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      const song = listItems[index];

      return (
        <div style={style}>
          {'songId' in song ? (
            <Song
              key={song.songId}
              index={index - 1}
              isIndexingSongs={
                localStorageData?.preferences?.isSongIndexingEnabled
              }
              title={song.title}
              artists={song.artists}
              artworkPaths={song.artworkPaths}
              duration={song.duration}
              songId={song.songId}
              path={song.path}
              album={song.album}
              isAFavorite={song.isAFavorite}
              year={song.year}
              isBlacklisted={song.isBlacklisted}
              selectAllHandler={selectAllHandler}
              onPlayClick={handleSongPlayBtnClick}
            />
          ) : (
            <AlbumImgAndInfoContainer
              albumData={song}
              songsData={albumContent.songsData}
            />
          )}
        </div>
      );
    },
    [
      albumContent.songsData,
      handleSongPlayBtnClick,
      listItems,
      localStorageData?.preferences?.isSongIndexingEnabled,
      selectAllHandler,
    ]
  );

  const getItemSize = React.useCallback((index: number) => {
    if (index === 0) return 250;
    return 60;
  }, []);

  return (
    <MainContainer
      className="album-info-page-container appear-from-bottom h-full !pb-0 pl-8 "
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <TitleContainer
        title={albumContent.albumData.title}
        className="pr-4"
        buttons={[
          {
            label: 'Play All',
            iconName: 'play_arrow',
            clickHandler: () =>
              createQueue(
                albumContent.songsData
                  .filter((song) => !song.isBlacklisted)
                  .map((song) => song.songId),
                'songs',
                false,
                albumContent.albumData.albumId,
                true
              ),
            isDisabled: !(albumContent.songsData.length > 0),
          },
          {
            tooltipLabel: 'Shuffle and Play',
            iconName: 'shuffle',
            clickHandler: () =>
              createQueue(
                albumContent.songsData
                  .filter((song) => !song.isBlacklisted)
                  .map((song) => song.songId),
                'songs',
                true,
                albumContent.albumData.albumId,
                true
              ),
            isDisabled: !(albumContent.songsData.length > 0),
          },
          {
            tooltipLabel: 'Add to Queue',
            iconName: 'add',
            clickHandler: () => {
              updateQueueData(
                undefined,
                [
                  ...queue.queue,
                  ...albumContent.songsData.map((song) => song.songId),
                ],
                false,
                false
              );
              addNewNotifications([
                {
                  id: albumContent.albumData.albumId,
                  delay: 5000,
                  content: (
                    <span>
                      Added {albumContent.songsData.length} song
                      {albumContent.songsData.length === 1 ? '' : 's'} to the
                      queue.
                    </span>
                  ),
                },
              ]);
            },
            isDisabled: !(albumContent.songsData.length > 0),
          },
        ]}
        dropdown={{
          name: 'PlaylistPageSortDropdown',
          value: albumContent.sortingOrder,
          options: dropdownOptions,
          onChange: (e) => {
            const order = e.currentTarget.value as SongSortTypes;
            updateCurrentlyActivePageData((currentPageData) => ({
              ...currentPageData,
              sortingOrder: order,
            }));
            dispatch({ type: 'UPDATE_SORTING_ORDER', data: order });
          },
          isDisabled: !(albumContent.songsData.length > 0),
        }}
      />
      <div className="h-full" ref={songsContainerRef}>
        {listItems.length > 0 && (
          <List
            itemCount={listItems.length}
            itemSize={getItemSize}
            width={width || '100%'}
            height={height || 450}
            overscanCount={10}
            className="appear-from-bottom h-full pb-4 delay-100"
            initialScrollOffset={currentlyActivePage.data?.scrollTopOffset ?? 0}
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
    </MainContainer>
  );
};

export default AlbumInfoPage;
