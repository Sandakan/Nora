/* eslint-disable import/prefer-default-export */
import { lazy, useCallback, useContext, useEffect, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';
import storage from '../../utils/localStorage';

import Song from './Song';
import Button from '../Button';
import MainContainer from '../MainContainer';
import Dropdown from '../Dropdown';
import Img from '../Img';
import VirtualizedList from '../VirtualizedList';

import { songSortOptions, songFilterOptions } from './SongOptions';

import DataFetchingImage from '../../assets/images/svg/Road trip_Monochromatic.svg';
import NoSongsImage from '../../assets/images/svg/Empty Inbox _Monochromatic.svg';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const AddMusicFoldersPrompt = lazy(() => import('../MusicFoldersPage/AddMusicFoldersPrompt'));

interface SongPageReducer {
  songsData: AudioInfo[];
  sortingOrder: SongSortTypes;
  filteringOrder: SongFilterTypes;
}

type SongPageReducerActionTypes = 'SONGS_DATA' | 'SORTING_ORDER' | 'FILTERING_ORDER';

const reducer = (
  state: SongPageReducer,
  action: { type: SongPageReducerActionTypes; data: any }
): SongPageReducer => {
  switch (action.type) {
    case 'SONGS_DATA':
      return {
        ...state,
        songsData: action.data
      };
    case 'SORTING_ORDER':
      return {
        ...state,
        sortingOrder: action.data
      };
    case 'FILTERING_ORDER':
      return {
        ...state,
        filteringOrder: action.data
      };
    default:
      return state;
  }
};

const SongsPage = () => {
  const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);
  const localStorageData = useStore(store, (state) => state.localStorage);
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);

  const {
    createQueue,
    playSong,
    updateCurrentlyActivePageData,
    toggleMultipleSelections,
    updateContextMenuData,
    changePromptMenuData
  } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [content, dispatch] = useReducer(reducer, {
    songsData: [],
    sortingOrder:
      (currentlyActivePage?.data?.sortingOrder as SongSortTypes) ||
      localStorageData?.sortingStates?.songsPage ||
      'aToZ',
    filteringOrder: 'notSelected'
  });

  const fetchSongsData = useCallback(() => {
    console.time('songs');

    window.api.audioLibraryControls
      .getAllSongs(content.sortingOrder, content.filteringOrder)
      .then((audioInfoArray) => {
        console.timeEnd('songs');

        if (audioInfoArray) {
          if (audioInfoArray.data.length === 0)
            dispatch({
              type: 'SONGS_DATA',
              data: null
            });
          else
            dispatch({
              type: 'SONGS_DATA',
              data: audioInfoArray.data
            });
        }
        return undefined;
      })
      .catch((err) => console.error(err));
  }, [content.filteringOrder, content.sortingOrder]);

  useEffect(() => {
    fetchSongsData();
    const manageSongsDataUpdatesInSongsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
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
    document.addEventListener('app/dataUpdates', manageSongsDataUpdatesInSongsPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageSongsDataUpdatesInSongsPage);
    };
  }, [fetchSongsData]);

  useEffect(() => {
    storage.sortingStates.setSortingStates('songsPage', content.sortingOrder);
  }, [content.sortingOrder]);

  const addNewSongs = useCallback(() => {
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
              path: song.path,
              artworkPaths: song.artworkPaths,
              addedDate: song.addedDate,
              isAFavorite: song.isAFavorite,
              isBlacklisted: song.isBlacklisted
            };
          });
          dispatch({ type: 'SONGS_DATA', data: relevantSongsData });
        }}
        onFailure={() => dispatch({ type: 'SONGS_DATA', data: [null] })}
      />
    );
  }, [changePromptMenuData]);

  const importAppData = useCallback(
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

  const selectAllHandler = useSelectAllHandler(content.songsData, 'songs', 'songId');

  const handleSongPlayBtnClick = useCallback(
    (currSongId: string) => {
      const queueSongIds = content.songsData
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'songs', false, undefined, false);
      playSong(currSongId, true);
    },
    [content.songsData, createQueue, playSong]
  );

  // const parentRef = useRef<HTMLDivElement>(null);

  // const rowVirtualizer = useVirtualizer({
  //   count: content.songsData?.length || 0,
  //   getScrollElement: () => parentRef.current,
  //   estimateSize: () => 60,
  //   overscan: 10,
  //   debug: true
  // });

  return (
    <MainContainer
      className="main-container appear-from-bottom songs-list-container h-full! overflow-hidden pb-0!"
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
          <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
            <div className="container flex">
              {t('common.song_other')}{' '}
              <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
                {isMultipleSelectionEnabled ? (
                  <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                    {t('common.selectionWithCount', {
                      count: multipleSelectionsData.multipleSelections.length
                    })}
                  </div>
                ) : (
                  content.songsData &&
                  content.songsData.length > 0 && (
                    <span className="no-of-songs">
                      {t('common.songWithCount', {
                        count: content.songsData.length
                      })}
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
                  const button = e.currentTarget;
                  const { x, y } = button.getBoundingClientRect();
                  updateContextMenuData(
                    true,
                    [
                      {
                        label: t('settingsPage.resyncLibrary'),
                        iconName: 'sync',
                        handlerFunction: () => window.api.audioLibraryControls.resyncSongsLibrary()
                      }
                    ],
                    x + 10,
                    y + 50
                  );
                }}
                tooltipLabel={t('common.moreOptions')}
                onContextMenu={(e) => {
                  e.preventDefault();
                  updateContextMenuData(
                    true,
                    [
                      {
                        label: t('settingsPage.resyncLibrary'),
                        iconName: 'sync',
                        handlerFunction: () => window.api.audioLibraryControls.resyncSongsLibrary()
                      }
                    ],
                    e.pageX,
                    e.pageY
                  );
                }}
              />
              <Button
                key={1}
                className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName={isMultipleSelectionEnabled ? 'remove_done' : 'checklist'}
                clickHandler={() => toggleMultipleSelections(!isMultipleSelectionEnabled, 'songs')}
                tooltipLabel={t(
                  `common.${
                    isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'songs'
                      ? 'unselectAll'
                      : 'select'
                  }`
                )}
              />
              <Button
                key={2}
                tooltipLabel={t('common.playAll')}
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
                label={t('common.shuffleAndPlay')}
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
                name="songsPageFilterDropdown"
                type={`${t('common.filterBy')} :`}
                value={content.filteringOrder}
                options={songFilterOptions}
                onChange={(e) => {
                  updateCurrentlyActivePageData((currentPageData) => ({
                    ...currentPageData,
                    filteringOrder: e.currentTarget.value as SongFilterTypes
                  }));
                  dispatch({
                    type: 'FILTERING_ORDER',
                    data: e.currentTarget.value
                  });
                }}
              />
              <Dropdown
                name="songsPageSortDropdown"
                type={`${t('common.sortBy')} :`}
                value={content.sortingOrder}
                options={songSortOptions}
                onChange={(e) => {
                  updateCurrentlyActivePageData((currentPageData) => ({
                    ...currentPageData,
                    sortingOrder: e.currentTarget.value as SongSortTypes
                  }));
                  dispatch({
                    type: 'SORTING_ORDER',
                    data: e.currentTarget.value
                  });
                }}
              />
            </div>
          </div>
        )}
        <div
          className="songs-container appear-from-bottom h-full flex-1 delay-100"
          // ref={songsContainerRef}
        >
          {/* <InfiniteLoader
            // isItemLoaded={isItemLoaded}
            itemCount={60}
            // loadMoreItems={loadMoreItems}
          >
            {({ onItemsRendered, ref }) => (
              <List
                ref={ref}
                onItemsRendered={onItemsRendered}
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
                {songs}
              </List>
            )}
          </InfiniteLoader> */}
          {content.songsData && content.songsData.length > 0 && (
            <VirtualizedList
              data={content.songsData}
              fixedItemHeight={60}
              scrollTopOffset={currentlyActivePage.data?.scrollTopOffset}
              itemContent={(index, song) => {
                if (song)
                  return (
                    <Song
                      key={index}
                      index={index}
                      isIndexingSongs={localStorageData?.preferences.isSongIndexingEnabled}
                      onPlayClick={handleSongPlayBtnClick}
                      selectAllHandler={selectAllHandler}
                      {...song}
                    />
                  );
                return <div>Bad Index</div>;
              }}
            />
          )}
        </div>
        {content.songsData && content.songsData.length === 0 && (
          <div className="no-songs-container my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img src={DataFetchingImage} alt="" className="mb-8 w-60" />
            <span>{t('songsPage.loading')}</span>
          </div>
        )}
        {content.songsData === null && (
          <div className="no-songs-container my-[8%] flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img src={NoSongsImage} alt="" className="mb-8 w-60" />
            <span>{t('songsPage.empty')}</span>
            <div className="flex items-center justify-between">
              <Button
                label={t('foldersPage.addFolder')}
                iconName="create_new_folder"
                iconClassName="material-icons-round-outlined"
                className="mt-4 bg-background-color-3! px-8 text-lg text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3"
                clickHandler={addNewSongs}
              />
              <Button
                label={t('settingsPage.importAppData')}
                iconName="upload"
                className="mt-4 bg-background-color-3! px-8 text-lg text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3"
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
