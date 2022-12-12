/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable import/prefer-default-export */
import React, { CSSProperties } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { Artist } from './Artist';
import NoArtistImage from '../../../../assets/images/svg/Sun_Monochromatic.svg';
// import FetchingDataImage from '../../../../assets/images/svg/Lemonade_Monochromatic.svg';
import Dropdown from '../Dropdown';
import MainContainer from '../MainContainer';
import Img from '../Img';
import Button from '../Button';

export const ArtistPage = () => {
  const {
    currentlyActivePage,
    userData,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
  } = React.useContext(AppContext);
  const {
    updateCurrentlyActivePageData,
    updatePageSortingOrder,
    toggleMultipleSelections,
  } = React.useContext(AppUpdateContext);

  const [artistsData, setArtistsData] = React.useState([] as Artist[]);
  const [sortingOrder, setSortingOrder] = React.useState(
    (currentlyActivePage.data && currentlyActivePage.data.sortingOrder
      ? currentlyActivePage.data.sortingOrder
      : userData && userData.sortingStates.artistsPage
      ? userData.sortingStates.artistsPage
      : 'aToZ') as ArtistSortTypes
  );

  const scrollOffsetTimeoutIdRef = React.useRef(null as NodeJS.Timeout | null);
  const containerRef = React.useRef(null as HTMLDivElement | null);
  const { height, width } = useResizeObserver(containerRef);
  const MIN_ITEM_WIDTH = 175;
  const MIN_ITEM_HEIGHT = 200;
  const noOfColumns = Math.floor(width / MIN_ITEM_WIDTH);
  const noOfRows = Math.ceil(artistsData.length / noOfColumns);
  const itemWidth =
    MIN_ITEM_WIDTH + ((width % MIN_ITEM_WIDTH) - 10) / noOfColumns;

  const fetchArtistsData = React.useCallback(
    () =>
      window.api.getArtistData([], sortingOrder).then((res) => {
        if (res && Array.isArray(res)) {
          if (res.length > 0) return setArtistsData(res);
          // if (res.length === 0) return setArtistsData(null);
          return setArtistsData([]);
        }
        return undefined;
      }),
    [sortingOrder]
  );

  React.useEffect(() => {
    fetchArtistsData();
    const manageArtistDataUpdatesInArtistsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'artists') fetchArtistsData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageArtistDataUpdatesInArtistsPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageArtistDataUpdatesInArtistsPage
      );
    };
  }, [fetchArtistsData]);

  React.useEffect(() => {
    updatePageSortingOrder('sortingStates.artistsPage', sortingOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortingOrder]);

  const row = React.useCallback(
    (props: {
      columnIndex: number;
      rowIndex: number;
      style: CSSProperties;
    }) => {
      const { columnIndex, rowIndex, style } = props;
      const index = rowIndex * noOfColumns + columnIndex;
      // eslint-disable-next-line no-console
      // console.log(index);
      if (index < artistsData.length) {
        const { artistId, name, onlineArtworkPaths, songs, artworkPaths } =
          artistsData[index];
        return (
          <div style={{ ...style, display: 'flex', justifyContent: 'center' }}>
            <Artist
              index={index}
              key={artistId}
              className="mb-4"
              artistId={artistId}
              name={name}
              artworkPaths={artworkPaths}
              onlineArtworkPaths={onlineArtworkPaths}
              songIds={songs.map((song) => song.songId)}
            />
          </div>
        );
      }
      return <div style={style} />;
    },
    [artistsData, noOfColumns]
  );

  return (
    <MainContainer className="main-container artists-list-container !h-full overflow-hidden !pb-0">
      <>
        <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          <div className="container flex">
            Artists{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
              {isMultipleSelectionEnabled ? (
                <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                  {multipleSelectionsData.multipleSelections.length} selections
                </div>
              ) : (
                artistsData &&
                artistsData.length > 0 && (
                  <span className="no-of-artists">{`${
                    artistsData.length
                  } artist${artistsData.length === 1 ? '' : 's'}`}</span>
                )
              )}
            </div>
          </div>
          {artistsData.length > 0 && (
            <div className="other-control-container flex">
              <Button
                label={isMultipleSelectionEnabled ? 'Unselect All' : 'Select'}
                className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName={
                  isMultipleSelectionEnabled ? 'remove_done' : 'checklist'
                }
                clickHandler={() =>
                  toggleMultipleSelections(
                    !isMultipleSelectionEnabled,
                    'artist'
                  )
                }
                tooltipLabel={
                  isMultipleSelectionEnabled ? 'Unselect All' : 'Select'
                }
              />
              <Dropdown
                name="artistsSortDropdown"
                value={sortingOrder}
                options={
                  [
                    { label: 'A to Z', value: 'aToZ' },
                    { label: 'Z to A', value: 'zToA' },
                    { label: 'High Song Count', value: 'noOfSongsDescending' },
                    { label: 'Low Song Count', value: 'noOfSongsAscending' },
                    { label: 'Most Loved', value: 'mostLovedDescending' },
                    { label: 'Least Loved', value: 'mostLovedAscending' },
                  ] as { label: string; value: ArtistSortTypes }[]
                }
                onChange={(e) => {
                  const artistSortType = e.currentTarget
                    .value as ArtistSortTypes;
                  updateCurrentlyActivePageData((currentData) => ({
                    ...currentData,
                    sortingOrder: artistSortType,
                  }));
                  setSortingOrder(artistSortType);
                }}
              />
            </div>
          )}
        </div>
        <div
          className={`artists-container flex !h-full flex-wrap ${
            !(artistsData && artistsData.length > 0) && 'hidden'
          }`}
          ref={containerRef}
        >
          {artistsData && artistsData.length > 0 && (
            <Grid
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
                    500
                  );
              }}
            >
              {row}
            </Grid>
          )}
        </div>
        {/* {artistsData && artistsData.length === 0 && (
          <div className="no-songs-container my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img
              src={FetchingDataImage}
              alt="No songs available."
              className="mb-8 w-60"
            />
            <div>What about a Lemonade? They are cool, right ?</div>
          </div>
        )} */}
        {artistsData && artistsData.length === 0 && (
          <div className="no-songs-container my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img
              src={NoArtistImage}
              alt="Sun in a desert"
              className="mb-8 w-60"
            />
            <div>Hmm... Where did the artists go?</div>
          </div>
        )}
      </>
    </MainContainer>
  );
};
