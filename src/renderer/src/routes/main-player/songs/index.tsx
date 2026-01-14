import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import { store } from '@renderer/store/store';
import { songSearchSchema } from '@renderer/utils/zod/songSchema';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { lazy, useCallback, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import storage from '@renderer/utils/localStorage';
import useSelectAllHandler from '@renderer/hooks/useSelectAllHandler';
import MainContainer from '@renderer/components/MainContainer';
import Button from '@renderer/components/Button';
import Dropdown from '@renderer/components/Dropdown';
import { songFilterOptions, songSortOptions } from '@renderer/components/SongsPage/SongOptions';
import VirtualizedList from '@renderer/components/VirtualizedList';
import Song from '@renderer/components/SongsPage/Song';

import NoSongsImage from '@assets/images/svg/Empty Inbox _Monochromatic.svg';
import Img from '@renderer/components/Img';
import { useSuspenseQuery } from '@tanstack/react-query';
import { queryClient } from '@renderer/index';
import { songQuery } from '@renderer/queries/songs';

export const Route = createFileRoute('/main-player/songs/')({
  validateSearch: songSearchSchema,
  loaderDeps: ({ search }) => ({
    sortingOrder: search.sortingOrder,
    filteringOrder: search.filteringOrder
  }),
  loader: async ({ deps }) => {
    await queryClient.ensureQueryData(
      songQuery.all({
        sortType: deps.sortingOrder ?? 'aToZ',
        filterType: deps.filteringOrder ?? 'notSelected',
        start: 0,
        end: 0
      })
    );
  },
  component: SongsPage
});

const AddMusicFoldersPrompt = lazy(
  () => import('@renderer/components/MusicFoldersPage/AddMusicFoldersPrompt')
);

function SongsPage() {
  const songsPageSortingState = useStore(
    store,
    (state) => state.localStorage.sortingStates.songsPage
  );
  const isSongIndexingEnabled = useStore(
    store,
    (state) => state.localStorage.preferences.isSongIndexingEnabled
  );
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);

  const {
    createQueue,
    playSong,
    toggleMultipleSelections,
    updateContextMenuData,
    changePromptMenuData
  } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const {
    scrollTopOffset,
    sortingOrder = songsPageSortingState || 'aToZ',
    filteringOrder = 'notSelected'
  } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const {
    data: { data: songData }
  } = useSuspenseQuery(
    songQuery.all({ sortType: sortingOrder, filterType: filteringOrder, start: 0, end: 0 })
  );

  useEffect(() => {
    storage.sortingStates.setSortingStates('songsPage', sortingOrder);
  }, [sortingOrder]);

  const addNewSongs = useCallback(() => {
    changePromptMenuData(
      true,
      <AddMusicFoldersPrompt
        onSuccess={() => {
          // const relevantSongsData: AudioInfo[] = songs.map((song) => {
          //   return {
          //     title: song.title,
          //     songId: song.songId,
          //     artists: song.artists,
          //     duration: song.duration,
          //     path: song.path,
          //     artworkPaths: song.artworkPaths,
          //     addedDate: song.addedDate,
          //     isAFavorite: song.isAFavorite,
          //     isBlacklisted: song.isBlacklisted
          //   };
          // });
          queryClient.invalidateQueries(
            songQuery.all({
              sortType: sortingOrder,
              filterType: filteringOrder,
              start: 0,
              end: 0
            })
          );
        }}
        // onFailure={() => setSongData([])}
      />
    );
  }, [changePromptMenuData, filteringOrder, sortingOrder]);

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

  const selectAllHandler = useSelectAllHandler(songData, 'songs', 'songId');

  const handleSongPlayBtnClick = useCallback(
    (currSongId: number) => {
      const queueSongIds = songData
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'songs', false, undefined, false);
      playSong(currSongId, true);
    },
    [songData, createQueue, playSong]
  );

  // const parentRef = useRef<HTMLDivElement>(null);

  // const rowVirtualizer = useVirtualizer({
  //   count: songsData?.length || 0,
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
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
        <div className="container flex">
          {t('common.song_other')}{' '}
          <div className="other-stats-container text-font-color-black dark:text-font-color-white ml-12 flex items-center text-xs">
            {isMultipleSelectionEnabled ? (
              <div className="text-font-color-highlight dark:text-dark-font-color-highlight text-sm">
                {t('common.selectionWithCount', {
                  count: multipleSelectionsData.multipleSelections.length
                })}
              </div>
            ) : (
              songData &&
              songData.length > 0 && (
                <span className="no-of-songs">
                  {t('common.songWithCount', {
                    count: songData.length
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
                songData.filter((song) => !song.isBlacklisted).map((song) => song.songId),
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
                songData.filter((song) => !song.isBlacklisted).map((song) => song.songId),
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
            value={filteringOrder}
            options={songFilterOptions}
            onChange={(e) => {
              navigate({
                search: (prev) => ({
                  ...prev,
                  filteringOrder: e.currentTarget.value as SongFilterTypes
                })
              });
            }}
          />
          <Dropdown
            name="songsPageSortDropdown"
            type={`${t('common.sortBy')} :`}
            value={sortingOrder}
            options={songSortOptions}
            onChange={(e) => {
              navigate({
                search: (prev) => ({
                  ...prev,
                  sortingOrder: e.currentTarget.value as SongSortTypes
                })
              });
            }}
          />
        </div>
      </div>
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
                itemCount={songsData.length}
                itemSize={60}
                width={width || '100%'}
                height={height || 450}
                overscanCount={10}
                className="appear-from-bottom delay-100"
                initialScrollOffset={
                  currentlyActivePage.data?.scrollTopOffset ?? 0
                }
                onScroll={(data) => {
                }
              >
                {songs}
              </List>
            )}
          </InfiniteLoader> */}
        {songData && songData.length > 0 && (
          <VirtualizedList
            data={songData}
            fixedItemHeight={60}
            scrollTopOffset={scrollTopOffset}
            onDebouncedScroll={(range) => {
              navigate({
                replace: true,
                search: (prev) => ({
                  ...prev,
                  scrollTopOffset: range.startIndex
                })
              });
            }}
            itemContent={(index, song) => {
              if (song)
                return (
                  <Song
                    key={index}
                    index={index}
                    isIndexingSongs={isSongIndexingEnabled}
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
      {songData === null && (
        <div className="no-songs-container text-font-color-black dark:text-font-color-white my-[8%] flex h-full w-full flex-col items-center justify-center text-center text-xl">
          <Img src={NoSongsImage} alt="" className="mb-8 w-60" />
          <span>{t('songsPage.empty')}</span>
          <div className="flex items-center justify-between">
            <Button
              label={t('foldersPage.addFolder')}
              iconName="create_new_folder"
              iconClassName="material-icons-round-outlined"
              className="bg-background-color-3! text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 mt-4 px-8 text-lg"
              clickHandler={addNewSongs}
            />
            <Button
              label={t('settingsPage.importAppData')}
              iconName="upload"
              className="bg-background-color-3! text-font-color-black! hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 mt-4 px-8 text-lg"
              clickHandler={importAppData}
            />
          </div>
        </div>
      )}
    </MainContainer>
  );
}

