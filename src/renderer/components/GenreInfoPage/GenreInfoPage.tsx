/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import React from 'react';
import { VariableSizeList as List } from 'react-window';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import debounce from 'renderer/utils/debounce';

import MainContainer from '../MainContainer';
import Song from '../SongsPage/Song';
import TitleContainer from '../TitleContainer';
import GenreImgAndInfoContainer from './GenreImgAndInfoContainer';

const dropdownOptions: { label: string; value: SongSortTypes }[] = [
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

const GenreInfoPage = () => {
  const { currentlyActivePage, queue, localStorageData } =
    React.useContext(AppContext);
  const {
    createQueue,
    updateQueueData,
    addNewNotifications,
    updateCurrentlyActivePageData,
    playSong,
  } = React.useContext(AppUpdateContext);

  const [genreData, setGenreData] = React.useState<Genre>();
  const [genreSongs, setGenreSongs] = React.useState<AudioInfo[]>([]);
  const [sortingOrder, setSortingOrder] = React.useState<SongSortTypes>('aToZ');
  const songsContainerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver(songsContainerRef);

  const fetchGenresData = React.useCallback(() => {
    if (currentlyActivePage.data) {
      window.api.genresData
        .getGenresData([currentlyActivePage.data.genreId])
        .then((res) => {
          if (res && res.length > 0 && res[0]) setGenreData(res[0]);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [currentlyActivePage.data]);

  const fetchSongsData = React.useCallback(() => {
    if (genreData && genreData.songs && genreData.songs.length > 0) {
      window.api.audioLibraryControls
        .getSongInfo(
          genreData.songs.map((song) => song.songId),
          sortingOrder,
        )
        .then((res) => {
          if (res) return setGenreSongs(res);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
    return undefined;
  }, [genreData, sortingOrder]);

  React.useEffect(() => {
    fetchGenresData();
    const manageGenreUpdatesInGenresInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'genres') fetchGenresData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageGenreUpdatesInGenresInfoPage,
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageGenreUpdatesInGenresInfoPage,
      );
    };
  }, [fetchGenresData]);

  React.useEffect(() => {
    fetchSongsData();
    const manageSongUpdatesInGenreInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'songs/deletedSong' ||
            event.dataType === 'songs/newSong' ||
            event.dataType === 'blacklist/songBlacklist' ||
            (event.dataType === 'songs/likes' && event.eventData.length > 1)
          )
            fetchSongsData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageSongUpdatesInGenreInfoPage,
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSongUpdatesInGenreInfoPage,
      );
    };
  }, [fetchSongsData]);

  const selectAllHandler = useSelectAllHandler(genreSongs, 'songs', 'songId');

  const handleSongPlayBtnClick = React.useCallback(
    (currSongId: string) => {
      const queueSongIds = genreSongs
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'genre', false, genreData?.genreId, false);
      playSong(currSongId, true);
    },
    [createQueue, genreData?.genreId, genreSongs, playSong],
  );

  const listItems = React.useMemo(
    () =>
      [genreData, ...genreSongs].filter((x) => x !== undefined) as (
        | Genre
        | AudioInfo
      )[],
    [genreData, genreSongs],
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
              selectAllHandler={selectAllHandler}
            />
          ) : (
            <GenreImgAndInfoContainer
              genreData={song}
              genreSongs={genreSongs}
            />
          )}
        </div>
      );
    },
    [
      genreSongs,
      handleSongPlayBtnClick,
      listItems,
      localStorageData?.preferences?.isSongIndexingEnabled,
      selectAllHandler,
    ],
  );

  const getItemSize = React.useCallback((index: number) => {
    if (index === 0) return 270;
    return 60;
  }, []);

  return (
    <MainContainer
      className="appear-from-bottom genre-info-page-container !h-full !pb-0"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <TitleContainer
        title={genreData?.name || ''}
        className="pr-4"
        buttons={[
          {
            label: 'Play All',
            iconName: 'play_arrow',
            clickHandler: () =>
              createQueue(
                genreSongs
                  .filter((song) => !song.isBlacklisted)
                  .map((song) => song.songId),
                'genre',
                false,
                genreData?.genreId,
                true,
              ),
            isDisabled: !(genreData && genreSongs.length > 0),
          },
          {
            iconName: 'shuffle',
            clickHandler: () =>
              createQueue(
                genreSongs
                  .filter((song) => !song.isBlacklisted)
                  .map((song) => song.songId),
                'genre',
                true,
                genreData?.genreId,
                true,
              ),
            isDisabled: !(genreData && genreSongs.length > 0),
          },
          {
            iconName: 'add',
            clickHandler: () => {
              updateQueueData(
                undefined,
                [...queue.queue, ...genreSongs.map((song) => song.songId)],
                false,
                false,
              );
              addNewNotifications([
                {
                  id: genreData?.genreId || '',
                  delay: 5000,
                  content: (
                    <span>
                      Added {genreSongs.length} song
                      {genreSongs.length === 1 ? '' : 's'} to the queue.
                    </span>
                  ),
                },
              ]);
            },
            isDisabled: !(genreData && genreSongs.length > 0),
          },
        ]}
        dropdown={{
          name: 'songsPageSortDropdown',
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
          isDisabled: !(genreData && genreSongs.length > 0),
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
              className="appear-from-bottom h-full pb-4 delay-100 [scrollbar-gutter:stable]"
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
                    500,
                  );
              }}
            >
              {listComponents}
            </List>
          )}
        </div>
      </div>
    </MainContainer>
  );
};

export default GenreInfoPage;
