import React, { CSSProperties, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { FixedSizeGrid as Grid } from 'react-window';

import useResizeObserver from '../../hooks/useResizeObserver';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import { AppContext } from '../../contexts/AppContext';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';
import storage from '../../utils/localStorage';
import i18n from '../../i18n';

import { Playlist } from './Playlist';
import NewPlaylistPrompt from './NewPlaylistPrompt';
import Button from '../Button';
import MainContainer from '../MainContainer';
import Dropdown, { DropdownOption } from '../Dropdown';

const playlistSortOptions: DropdownOption<PlaylistSortTypes>[] = [
  { label: i18n.t('sortTypes.aToZ'), value: 'aToZ' },
  { label: i18n.t('sortTypes.zToA'), value: 'zToA' },
  {
    label: i18n.t('sortTypes.noOfSongsDescending'),
    value: 'noOfSongsDescending',
  },
  {
    label: i18n.t('sortTypes.noOfSongsAscending'),
    value: 'noOfSongsAscending',
  },
];

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
  const { t } = useTranslation();

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
              label: t('playlistsPage.createNewPlaylist'),
              handlerFunction: createNewPlaylist,
              iconName: 'add',
            },
            {
              label: t('playlistsPage.importPlaylist'),
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
            {t('common.playlist_other')}{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
              {isMultipleSelectionEnabled ? (
                <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                  {t('common.selectionWithCount', {
                    count: multipleSelectionsData.multipleSelections.length,
                  })}
                </div>
              ) : (
                playlists.length > 0 && (
                  <span className="no-of-artists">
                    {t('common.playlistWithCount', { count: playlists.length })}
                  </span>
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
                tooltipLabel={t(
                  `common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`,
                )}
              />
              <Button
                label={t(`playlistsPage.importPlaylist`)}
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
                label={t(`playlistsPage.addPlaylist`)}
                className="add-new-playlist-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="add"
                clickHandler={createNewPlaylist}
              />
              <Dropdown
                name="playlistsSortDropdown"
                value={sortingOrder}
                options={playlistSortOptions}
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
