/* eslint-disable import/prefer-default-export */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FixedSizeList as List } from 'react-window';
// import InfiniteLoader from 'react-window-infinite-loader';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import { AppContext } from '../../contexts/AppContext';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';
import storage from '../../utils/localStorage';
import debounce from '../../utils/debounce';
import i18n from '../../i18n';

import Song from './Song';
import Button from '../Button';
import MainContainer from '../MainContainer';
import Dropdown, { DropdownOption } from '../Dropdown';
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

export const songSortOptions: DropdownOption<SongSortTypes>[] = [
  { label: i18n.t('sortTypes.aToZ'), value: 'aToZ' },
  { label: i18n.t('sortTypes.zToA'), value: 'zToA' },
  {
    label: i18n.t('sortTypes.dateAddedAscending'),
    value: 'dateAddedAscending',
  },
  {
    label: i18n.t('sortTypes.dateAddedDescending'),
    value: 'dateAddedDescending',
  },
  {
    label: i18n.t('sortTypes.releasedYearAscending'),
    value: 'releasedYearAscending',
  },
  {
    label: i18n.t('sortTypes.releasedYearDescending'),
    value: 'releasedYearDescending',
  },
  {
    label: i18n.t('sortTypes.allTimeMostListened'),
    value: 'allTimeMostListened',
  },
  {
    label: i18n.t('sortTypes.allTimeLeastListened'),
    value: 'allTimeLeastListened',
  },
  {
    label: i18n.t('sortTypes.monthlyMostListened'),
    value: 'monthlyMostListened',
  },
  {
    label: i18n.t('sortTypes.monthlyLeastListened'),
    value: 'monthlyLeastListened',
  },
  {
    label: i18n.t('sortTypes.artistNameAscending'),
    value: 'artistNameAscending',
  },
  {
    label: i18n.t('sortTypes.artistNameDescending'),
    value: 'artistNameDescending',
  },
  {
    label: i18n.t('sortTypes.albumNameAscending'),
    value: 'albumNameAscending',
  },
  {
    label: i18n.t('sortTypes.albumNameDescending'),
    value: 'albumNameDescending',
  },
  { label: i18n.t('sortTypes.blacklistedSongs'), value: 'blacklistedSongs' },
  {
    label: i18n.t('sortTypes.whitelistedSongs'),
    value: 'whitelistedSongs',
  },
];

const reducer = (
  state: SongPageReducer,
  action: { type: SongPageReducerActionTypes; data: any },
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
    playSong,
    updateCurrentlyActivePageData,
    toggleMultipleSelections,
    updateContextMenuData,
    changePromptMenuData,
  } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [content, dispatch] = React.useReducer(reducer, {
    songsData: [],
    sortingOrder:
      currentlyActivePage?.data?.sortingOrder ||
      localStorageData?.sortingStates?.songsPage ||
      'aToZ',
  });
  const songsContainerRef = React.useRef(null as HTMLDivElement | null);
  const { width, height } = useResizeObserver(songsContainerRef);

  const fetchSongsData = React.useCallback(() => {
    console.time('songs');

    window.api.audioLibraryControls
      .getAllSongs(content.sortingOrder)
      .then((audioInfoArray) => {
        console.timeEnd('songs');

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
      .catch((err) => console.error(err));
  }, [content.sortingOrder]);

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
      manageSongsDataUpdatesInSongsPage,
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSongsDataUpdatesInSongsPage,
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
      />,
    );
  }, [changePromptMenuData]);

  const importAppData = React.useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void,
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
    [],
  );

  const selectAllHandler = useSelectAllHandler(
    content.songsData,
    'songs',
    'songId',
  );

  const handleSongPlayBtnClick = React.useCallback(
    (currSongId: string) => {
      const queueSongIds = content.songsData
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'songs', false, undefined, false);
      playSong(currSongId, true);
    },
    [content.songsData, createQueue, playSong],
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
            onPlayClick={handleSongPlayBtnClick}
            selectAllHandler={selectAllHandler}
          />
        </div>
      );
    },
    [
      content.songsData,
      handleSongPlayBtnClick,
      localStorageData?.preferences.isSongIndexingEnabled,
      selectAllHandler,
    ],
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
          <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
            <div className="container flex">
              {t('common.song_other')}{' '}
              <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
                {isMultipleSelectionEnabled ? (
                  <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                    {t('common.selectionWithCount', {
                      count: multipleSelectionsData.multipleSelections.length,
                    })}
                  </div>
                ) : (
                  content.songsData &&
                  content.songsData.length > 0 && (
                    <span className="no-of-songs">
                      {t('common.songWithCount', {
                        count: content.songsData.length,
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
                        handlerFunction: () =>
                          window.api.audioLibraryControls.resyncSongsLibrary(),
                      },
                    ],
                    x + 10,
                    y + 50,
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
                        handlerFunction: () =>
                          window.api.audioLibraryControls.resyncSongsLibrary(),
                      },
                    ],
                    e.pageX,
                    e.pageY,
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
                tooltipLabel={t(
                  `common.${
                    isMultipleSelectionEnabled &&
                    multipleSelectionsData.selectionType === 'songs'
                      ? 'unselectAll'
                      : 'select'
                  }`,
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
                    true,
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
                    true,
                  )
                }
              />
              <Dropdown
                name="songsPageSortDropdown"
                value={content.sortingOrder}
                options={songSortOptions}
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
            <List
              itemCount={content.songsData.length}
              itemSize={60}
              width={width || '100%'}
              height={height || 450}
              overscanCount={10}
              className="appear-from-bottom delay-100 [scrollbar-gutter:stable]"
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
                className="mt-4 !bg-background-color-3 px-8 text-lg !text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3"
                clickHandler={addNewSongs}
              />
              <Button
                label={t('settingsPage.importAppData')}
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
