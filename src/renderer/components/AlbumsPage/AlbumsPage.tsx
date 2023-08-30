/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React, { CSSProperties } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';
import storage from 'renderer/utils/localStorage';

import { Album } from './Album';
import MainContainer from '../MainContainer';
import Dropdown from '../Dropdown';
import Img from '../Img';
import Button from '../Button';

import NoAlbumsImage from '../../../../assets/images/svg/Easter bunny_Monochromatic.svg';

const AlbumsPage = () => {
  const {
    currentlyActivePage,
    localStorageData,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
  } = React.useContext(AppContext);
  const { updateCurrentlyActivePageData, toggleMultipleSelections } =
    React.useContext(AppUpdateContext);

  const [albumsData, setAlbumsData] = React.useState([] as Album[]);
  const [sortingOrder, setSortingOrder] = React.useState<AlbumSortTypes>(
    currentlyActivePage?.data?.sortingOrder ||
      localStorageData?.sortingStates?.albumsPage ||
      'aToZ',
  );

  const scrollOffsetTimeoutIdRef = React.useRef(null as NodeJS.Timeout | null);
  const containerRef = React.useRef(null as HTMLDivElement | null);
  const { height, width } = useResizeObserver(containerRef);
  const MIN_ITEM_WIDTH = 220;
  const MIN_ITEM_HEIGHT = 280;
  const noOfColumns = Math.floor(width / MIN_ITEM_WIDTH);
  const noOfRows = Math.ceil(albumsData.length / noOfColumns);
  const itemWidth =
    MIN_ITEM_WIDTH + ((width % MIN_ITEM_WIDTH) - 10) / noOfColumns;

  const fetchAlbumData = React.useCallback(
    () =>
      window.api.albumsData.getAlbumData([], sortingOrder).then((res) => {
        if (res && Array.isArray(res)) {
          if (res.length > 0) setAlbumsData(res);
          else setAlbumsData([]);
        }
        return undefined;
      }),
    [sortingOrder],
  );

  React.useEffect(() => {
    fetchAlbumData();
    const manageDataUpdatesInAlbumsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'albums/newAlbum') fetchAlbumData();
          if (event.dataType === 'albums/deletedAlbum') fetchAlbumData();
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageDataUpdatesInAlbumsPage);
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageDataUpdatesInAlbumsPage,
      );
    };
  }, [fetchAlbumData]);

  React.useEffect(() => {
    storage.sortingStates.setSortingStates('albumsPage', sortingOrder);
  }, [sortingOrder]);

  const selectAllHandler = useSelectAllHandler(albumsData, 'album', 'albumId');

  const row = React.useCallback(
    (props: {
      columnIndex: number;
      rowIndex: number;
      style: CSSProperties;
    }) => {
      const { columnIndex, rowIndex, style } = props;
      const index = rowIndex * noOfColumns + columnIndex;
      // eslint-disable-next-line no-console
      if (index < albumsData.length) {
        const { albumId, year, artists, title, songs, artworkPaths } =
          albumsData[index];
        return (
          <div style={{ ...style, display: 'flex', justifyContent: 'center' }}>
            <Album
              key={`${albumId}-${title}`}
              index={index}
              artworkPaths={artworkPaths}
              albumId={albumId}
              title={title}
              year={year}
              artists={artists}
              songs={songs}
              selectAllHandler={selectAllHandler}
            />
          </div>
        );
      }
      return <div style={style} />;
    },
    [albumsData, noOfColumns, selectAllHandler],
  );

  return (
    <MainContainer
      className="appear-from-bottom albums-list-container !h-full overflow-hidden !pb-0"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        {albumsData.length > 0 && (
          <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
            <div className="container flex">
              Albums{' '}
              <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
                {isMultipleSelectionEnabled ? (
                  <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                    {multipleSelectionsData.multipleSelections.length}{' '}
                    selections
                  </div>
                ) : (
                  albumsData.length > 0 && (
                    <span className="no-of-albums">{`${
                      albumsData.length
                    } album${albumsData.length === 1 ? '' : 's'}`}</span>
                  )
                )}
              </div>
            </div>
            <div className="other-controls-container flex">
              <Button
                label={isMultipleSelectionEnabled ? 'Unselect All' : 'Select'}
                className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName={
                  isMultipleSelectionEnabled ? 'remove_done' : 'checklist'
                }
                clickHandler={() =>
                  toggleMultipleSelections(!isMultipleSelectionEnabled, 'album')
                }
                tooltipLabel={
                  isMultipleSelectionEnabled ? 'Unselect All' : 'Select'
                }
              />
              <Dropdown
                name="albumSortDropdown"
                value={sortingOrder}
                options={
                  [
                    { label: 'A to Z', value: 'aToZ' },
                    { label: 'Z to A', value: 'zToA' },
                    { label: 'High Song Count', value: 'noOfSongsDescending' },
                    { label: 'Low Song Count', value: 'noOfSongsAscending' },
                  ] as { label: string; value: AlbumSortTypes }[]
                }
                onChange={(e) => {
                  const albumSortTypes = e.currentTarget
                    .value as AlbumSortTypes;
                  updateCurrentlyActivePageData((currentData) => ({
                    ...currentData,
                    sortingOrder: albumSortTypes,
                  }));
                  setSortingOrder(albumSortTypes);
                }}
              />
            </div>
          </div>
        )}
        <div
          className={`albums-container h-full w-full flex-grow ${
            !(albumsData && albumsData.length > 0) && 'hidden'
          }`}
          ref={containerRef}
        >
          {albumsData && albumsData.length > 0 && (
            <Grid
              className="appear-from-bottom delay-100"
              columnCount={noOfColumns || 5}
              columnWidth={itemWidth}
              rowCount={noOfRows || 5}
              rowHeight={MIN_ITEM_HEIGHT}
              height={height || 300}
              width={width || 500}
              overscanRowCount={3}
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
        {/* {albumsData && albumsData.length === 0 && (
          <div className="no-songs-container my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-2xl text-[#ccc]">
            <Img
              src={FetchingDataImage}
              alt="No songs available."
              className="mb-8 w-60"
            />
            <div>We&apos;re already there...</div>
          </div>
        )} */}
        {albumsData && albumsData.length === 0 && (
          <div className="no-songs-container my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img
              src={NoAlbumsImage}
              alt="No songs available."
              className="mb-8 w-60"
            />
            <div>Even the bunny can&apos;t find them. How can we ?</div>
          </div>
        )}
      </>
    </MainContainer>
  );
};

export default AlbumsPage;
