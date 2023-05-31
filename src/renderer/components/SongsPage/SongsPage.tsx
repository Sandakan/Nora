/* eslint-disable import/prefer-default-export */
import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';
import storage from 'renderer/utils/localStorage';

import Song from './Song';
import Button from '../Button';
import MainContainer from '../MainContainer';
import Dropdown from '../Dropdown';
import useResizeObserver from '../../hooks/useResizeObserver';
import Img from '../Img';

import NoSongsImage from '../../../../assets/images/svg/Empty Inbox _Monochromatic.svg';
import DataFetchingImage from '../../../../assets/images/svg/Road trip_Monochromatic.svg';
import AddMusicFoldersPrompt from '../MusicFoldersPage/AddMusicFoldersPrompt';

interface SongPageReducer {
  songsData: AudioInfo[];
  sortingOrder: SongSortTypes;
}

type SongPageReducerActionTypes = 'SONGS_DATA' | 'SORTING_ORDER';

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
  { label: 'Blacklisted Songs', value: 'blacklistedSongs' },
  {
    label: 'Whitelisted Songs',
    value: 'whitelistedSongs',
  },
];

const reducer = (
  state: SongPageReducer,
  action: { type: SongPageReducerActionTypes; data: any }
): SongPageReducer => {
  switch (action.type) {
    case 'SONGS_DATA':
      return {
        ...state,
        songsData: action.data,
      };
    case 'SORTING_ORDER':
      return {
        ...state,
        sortingOrder: action.data,
      };
    default:
      return state;
  }
};

const SongsPage = () => {
  const {
    currentlyActivePage,
    localStorageData,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
  } = React.useContext(AppContext);
  const {
    createQueue,
    updateCurrentlyActivePageData,
    toggleMultipleSelections,
    updateContextMenuData,
    changePromptMenuData,
  } = React.useContext(AppUpdateContext);

  const scrollOffsetTimeoutIdRef = React.useRef(null as NodeJS.Timeout | null);
  const [content, dispatch] = React.useReducer(reducer, {
    songsData: [],
    sortingOrder:
      currentlyActivePage?.data?.sortingOrder ||
      localStorageData?.sortingStates?.songsPage ||
      'aToZ',
  });
  const songsContainerRef = React.useRef(null as HTMLDivElement | null);
  const { width, height } = useResizeObserver(songsContainerRef);

  const fetchSongsData = React.useCallback(
    () =>
      window.api.audioLibraryControls
        .getAllSongs(content.sortingOrder)
        .then((audioInfoArray) => {
          if (audioInfoArray) {
            if (audioInfoArray.data.length === 0)
              dispatch({
                type: 'SONGS_DATA',
                data: null,
              });
            else
              dispatch({
                type: 'SONGS_DATA',
                data: audioInfoArray.data,
              });
          }
          return undefined;
        })
        .catch((err) => console.error(err)),
    [content.sortingOrder]
  );

  React.useEffect(() => {
    fetchSongsData();
    const manageSongsDataUpdatesInSongsPage = (e: Event) => {
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
      manageSongsDataUpdatesInSongsPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSongsDataUpdatesInSongsPage
      );
    };
  }, [fetchSongsData]);

  React.useEffect(() => {
    storage.sortingStates.setSortingStates('songsPage', content.sortingOrder);
  }, [content.sortingOrder]);

  const addNewSongs = React.useCallback(() => {
    changePromptMenuData(
      true,
      <AddMusicFoldersPrompt
        onSuccess={(songs) => {
          const relevantSongsData: AudioInfo[] = songs.map((song) => {
            return {
              title: song.title,
              songId: song.songId,
              artists: song.artists,
              duration: song.duration,
              palette: song.palette,
              path: song.path,
              artworkPaths: song.artworkPaths,
              addedDate: song.addedDate,
              isAFavorite: song.isAFavorite,
              isBlacklisted: song.isBlacklisted,
            };
          });
          dispatch({ type: 'SONGS_DATA', data: relevantSongsData });
        }}
        onFailure={() => dispatch({ type: 'SONGS_DATA', data: [null] })}
      />
    );
  }, [changePromptMenuData]);

  const importAppData = React.useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void
    ) => {
      setIsDisabled(true);
      setIsPending(true);

      return window.api.settingsHelpers
        .importAppData()
        .then((res) => {
          if (res) storage.setAllItems(res);
          return undefined;
        })
        .finally(() => {
          setIsDisabled(false);
          setIsPending(false);
        })
        .catch((err) => console.error(err));
    },
    []
  );

  const selectAllHandler = useSelectAllHandler(
    content.songsData,
    'songs',
    'songId'
  );

  const songs = React.useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      const {
        songId,
        title,
        artists,
        album,
        duration,
        isAFavorite,
        artworkPaths,
        year,
        path,
        isBlacklisted,
      } = content.songsData[index];
      return (
        <div style={style}>
          <Song
            key={index}
            index={index}
            isIndexingSongs={
              localStorageData?.preferences.isSongIndexingEnabled
            }
            title={title}
            songId={songId}
            artists={artists}
            album={album}
            artworkPaths={artworkPaths}
            duration={duration}
            year={year}
            path={path}
            isAFavorite={isAFavorite}
            isBlacklisted={isBlacklisted}
            selectAllHandler={selectAllHandler}
          />
        </div>
      );
    },
    [
      content.songsData,
      localStorageData?.preferences.isSongIndexingEnabled,
      selectAllHandler,
    ]
  );

  return (
    <MainContainer
      className="main-container appear-from-bottom songs-list-container !h-full overflow-hidden !pb-0"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        {content.songsData && content.songsData.length > 0 && (
          <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium  text-font-color-highlight dark:text-dark-font-color-highlight">
            <div className="container flex">
              Songs{' '}
              <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
                {isMultipleSelectionEnabled ? (
                  <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                    {multipleSelectionsData.multipleSelections.length}{' '}
                    selections
                  </div>
                ) : (
                  content.songsData &&
                  content.songsData.length > 0 && (
                    <span className="no-of-songs">
                      {content.songsData.length} songs
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="other-controls-container flex">
              <Button
                key={0}
                className="more-options-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="more_horiz"
                clickHandler={(e) => {
                  e.stopPropagation();
                  const button = e.currentTarget || e.target;
                  const { x, y } = button.getBoundingClientRect();
                  updateContextMenuData(
                    true,
                    [
                      {
                        label: 'Resync library',
                        iconName: 'sync',
                        handlerFunction: () =>
                          window.api.audioLibraryControls.resyncSongsLibrary(),
                      },
                    ],
                    x + 10,
                    y + 50
                  );
                }}
                tooltipLabel="More Options"
                onContextMenu={(e) => {
                  e.preventDefault();
                  updateContextMenuData(
                    true,
                    [
                      {
                        label: 'Resync library',
                        iconName: 'sync',
                        handlerFunction: () =>
                          window.api.audioLibraryControls.resyncSongsLibrary(),
                      },
                    ],
                    e.pageX,
                    e.pageY
                  );
                }}
              />
              <Button
                key={1}
                className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName={
                  isMultipleSelectionEnabled ? 'remove_done' : 'checklist'
                }
                clickHandler={() =>
                  toggleMultipleSelections(!isMultipleSelectionEnabled, 'songs')
                }
                tooltipLabel={
                  isMultipleSelectionEnabled ? 'Unselect All' : 'Select'
                }
              />
              <Button
                key={2}
                tooltipLabel="Play All"
                className="play-all-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="play_arrow"
                clickHandler={() =>
                  createQueue(
                    content.songsData
                      .filter((song) => !song.isBlacklisted)
                      .map((song) => song.songId),
                    'songs',
                    false,
                    undefined,
                    true
                  )
                }
              />
              <Button
                key={3}
                label="Shuffle and Play"
                className="shuffle-and-play-all-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="shuffle"
                clickHandler={() =>
                  createQueue(
                    content.songsData
                      .filter((song) => !song.isBlacklisted)
                      .map((song) => song.songId),
                    'songs',
                    true,
                    undefined,
                    true
                  )
                }
              />
              <Dropdown
                name="songsPageSortDropdown"
                value={content.sortingOrder}
                options={dropdownOptions}
                onChange={(e) => {
                  updateCurrentlyActivePageData((currentPageData) => ({
                    ...currentPageData,
                    sortingOrder: e.currentTarget.value as SongSortTypes,
                  }));
                  dispatch({
                    type: 'SORTING_ORDER',
                    data: e.currentTarget.value,
                  });
                }}
              />
            </div>
          </div>
        )}
        <div
          className="songs-container appear-from-bottom h-full flex-1 delay-100"
          ref={songsContainerRef}
        >
          {content.songsData && content.songsData.length > 0 && (
            <List
              itemCount={content.songsData.length}
              itemSize={60}
              width={width || '100%'}
              height={height || 450}
              overscanCount={10}
              className="appear-from-bottom delay-100"
              initialScrollOffset={
                currentlyActivePage.data?.scrollTopOffset ?? 0
              }
              onScroll={(data) => {
                if (scrollOffsetTimeoutIdRef.current)
                  clearTimeout(scrollOffsetTimeoutIdRef.current);
                if (!data.scrollUpdateWasRequested && data.scrollOffset !== 0)
                  scrollOffsetTimeoutIdRef.current = setTimeout(
                    () =>
                      updateCurrentlyActivePageData((currentPageData) => ({
                        ...currentPageData,
                        scrollTopOffset: data.scrollOffset,
                      })),
                    500
                  );
              }}
            >
              {songs}
            </List>
          )}
        </div>
        {content.songsData && content.songsData.length === 0 && (
          <div className="no-songs-container my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img
              src={DataFetchingImage}
              alt="No songs available."
              className="mb-8 w-60"
            />
            <span>
              Like road trips? Just asking. It wouldn't take that long...
            </span>
          </div>
        )}
        {content.songsData === null && (
          <div className="no-songs-container my-[8%] flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img
              src={NoSongsImage}
              alt="No songs available."
              className="mb-8 w-60"
            />
            <span>
              What&apos;s a world without music. So let&apos;s find them...
            </span>
            <div className="flex items-center justify-between">
              <Button
                label="Add Folder"
                iconName="create_new_folder"
                iconClassName="material-icons-round-outlined"
                className="mt-4 !bg-background-color-3 px-8 text-lg !text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3"
                clickHandler={addNewSongs}
              />
              <Button
                label="Import App Data"
                iconName="upload"
                className="mt-4 !bg-background-color-3 px-8 text-lg !text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3"
                clickHandler={importAppData}
              />
            </div>
          </div>
        )}
      </>
    </MainContainer>
  );
};

export default SongsPage;
