import React, { CSSProperties, useContext } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';

import useResizeObserver from 'renderer/hooks/useResizeObserver';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';
import storage from 'renderer/utils/localStorage';

import { Playlist } from './Playlist';
import NewPlaylistPrompt from './NewPlaylistPrompt';
import Button from '../Button';
import MainContainer from '../MainContainer';
import Dropdown from '../Dropdown';

const PlaylistsPage = () => {
  const {
    currentlyActivePage,
    localStorageData,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
  } = useContext(AppContext);
  const {
    changePromptMenuData,
    updateContextMenuData,
    updateCurrentlyActivePageData,
    toggleMultipleSelections,
  } = useContext(AppUpdateContext);
  const [playlists, setPlaylists] = React.useState([] as Playlist[]);
  const [sortingOrder, setSortingOrder] = React.useState<PlaylistSortTypes>(
    currentlyActivePage?.data?.sortingOrder ||
      localStorageData?.sortingStates?.playlistsPage ||
      'aToZ',
  );

  const scrollOffsetTimeoutIdRef = React.useRef(null as NodeJS.Timeout | null);
  const containerRef = React.useRef(null as HTMLDivElement | null);
  const { height, width } = useResizeObserver(containerRef);
  const MIN_ITEM_WIDTH = 175;
  const MIN_ITEM_HEIGHT = 220;
  const noOfColumns = Math.floor(width / MIN_ITEM_WIDTH);
  const noOfRows = Math.ceil(playlists.length / noOfColumns);
  const itemWidth =
    MIN_ITEM_WIDTH + ((width % MIN_ITEM_WIDTH) - 10) / noOfColumns;

  const fetchPlaylistData = React.useCallback(
    () =>
      window.api.playlistsData.getPlaylistData([], sortingOrder).then((res) => {
        if (res && res.length > 0) setPlaylists(res);
        return undefined;
      }),
    [sortingOrder],
  );

  React.useEffect(() => {
    fetchPlaylistData();
    const managePlaylistDataUpdatesInPlaylistsPage = (e: Event) => {
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
      managePlaylistDataUpdatesInPlaylistsPage,
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        managePlaylistDataUpdatesInPlaylistsPage,
      );
    };
  }, [fetchPlaylistData]);

  React.useEffect(() => {
    storage.sortingStates.setSortingStates('playlistsPage', sortingOrder);
  }, [sortingOrder]);

  const selectAllHandler = useSelectAllHandler(
    playlists,
    'playlist',
    'playlistId',
  );

  const row = React.useCallback(
    (props: {
      columnIndex: number;
      rowIndex: number;
      style: CSSProperties;
    }) => {
      const { columnIndex, rowIndex, style } = props;
      const index = rowIndex * noOfColumns + columnIndex;
      if (index < playlists.length) {
        const playlist = playlists[index];
        return (
          <div style={{ ...style, display: 'flex', justifyContent: 'center' }}>
            <Playlist
              index={index}
              name={playlist.name}
              createdDate={playlist.createdDate}
              playlistId={playlist.playlistId}
              songs={playlist.songs}
              isArtworkAvailable={playlist.isArtworkAvailable}
              artworkPaths={playlist.artworkPaths}
              key={playlist.playlistId}
              selectAllHandler={selectAllHandler}
            />
          </div>
        );
      }
      return <div style={style} />;
    },
    [noOfColumns, playlists, selectAllHandler],
  );

  const createNewPlaylist = React.useCallback(
    () =>
      changePromptMenuData(
        true,
        <NewPlaylistPrompt
          currentPlaylists={playlists}
          updatePlaylists={(newPlaylists) => setPlaylists(newPlaylists)}
        />,
      ),
    [changePromptMenuData, playlists],
  );

  return (
    <MainContainer
      className="main-container appear-from-bottom playlists-list-container mb-0 !h-full !pb-0"
      onContextMenu={(e) =>
        updateContextMenuData(
          true,
          [
            {
              label: 'Create New Playlist',
              handlerFunction: createNewPlaylist,
              iconName: 'add',
            },
            {
              label: 'Import Playlist',
              iconName: 'publish',
              handlerFunction: () =>
                window.api.playlistsData
                  .importPlaylist()
                  .catch((err) => console.error(err)),
            },
          ],
          e.pageX,
          e.pageY,
        )
      }
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          <div className="container flex">
            Playlists{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
              {isMultipleSelectionEnabled ? (
                <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                  {multipleSelectionsData.multipleSelections.length} selections
                </div>
              ) : (
                playlists.length > 0 && (
                  <span className="no-of-artists">{`${
                    playlists.length
                  } playlist${playlists.length === 1 ? '' : 's'}`}</span>
                )
              )}
            </div>
          </div>
          {playlists.length > 0 && (
            <div className="other-control-container flex">
              <Button
                className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName={
                  isMultipleSelectionEnabled ? 'remove_done' : 'checklist'
                }
                clickHandler={() =>
                  toggleMultipleSelections(
                    !isMultipleSelectionEnabled,
                    'playlist',
                  )
                }
                tooltipLabel={
                  isMultipleSelectionEnabled ? 'Unselect All' : 'Select'
                }
              />
              <Button
                label="Import Playlist"
                className="import-playlist-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="publish"
                clickHandler={(_, setIsDisabled, setIsPending) => {
                  setIsDisabled(true);
                  setIsPending(true);

                  return window.api.playlistsData
                    .importPlaylist()
                    .finally(() => {
                      setIsDisabled(false);
                      setIsPending(false);
                    })
                    .catch((err) => console.error(err));
                }}
              />
              <Button
                label="Add Playlist"
                className="add-new-playlist-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="add"
                clickHandler={createNewPlaylist}
              />
              <Dropdown
                name="playlistsSortDropdown"
                value={sortingOrder}
                options={
                  [
                    { label: 'A to Z', value: 'aToZ' },
                    { label: 'Z to A', value: 'zToA' },
                    { label: 'High Song Count', value: 'noOfSongsDescending' },
                    { label: 'Low Song Count', value: 'noOfSongsAscending' },
                  ] as { label: string; value: ArtistSortTypes }[]
                }
                onChange={(e) => {
                  const playlistSortType = e.currentTarget
                    .value as PlaylistSortTypes;
                  updateCurrentlyActivePageData((currentData) => ({
                    ...currentData,
                    sortingOrder: playlistSortType,
                  }));
                  setSortingOrder(playlistSortType);
                }}
              />
            </div>
          )}
        </div>

        <div
          className="playlists-container appear-from-bottom flex h-full flex-wrap delay-100"
          ref={containerRef}
        >
          {playlists && playlists.length > 0 && (
            <Grid
              className="appear-from-bottom delay-100 [scrollbar-gutter:stable]"
              columnCount={noOfColumns || 5}
              columnWidth={itemWidth}
              rowCount={noOfRows || 5}
              rowHeight={MIN_ITEM_HEIGHT}
              height={height || 300}
              width={width || 500}
              overscanRowCount={2}
              initialScrollTop={currentlyActivePage.data?.scrollTopOffset ?? 0}
              onScroll={(data) => {
                if (scrollOffsetTimeoutIdRef.current)
                  clearTimeout(scrollOffsetTimeoutIdRef.current);
                if (!data.scrollUpdateWasRequested && data.scrollTop !== 0)
                  scrollOffsetTimeoutIdRef.current = setTimeout(
                    () =>
                      updateCurrentlyActivePageData((currentPageData) => ({
                        ...currentPageData,
                        scrollTopOffset: data.scrollTop,
                      })),
                    500,
                  );
              }}
            >
              {row}
            </Grid>
          )}
        </div>
      </>
    </MainContainer>
  );
};

export default PlaylistsPage;
