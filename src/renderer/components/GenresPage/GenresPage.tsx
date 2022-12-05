/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
import React, { CSSProperties } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import Dropdown from '../Dropdown';
import MainContainer from '../MainContainer';
import Genre from './Genre';
import NoSongsImage from '../../../../assets/images/svg/Summer landscape_Monochromatic.svg';
import Img from '../Img';
import Button from '../Button';

const GenresPage = () => {
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

  const [genresData, setGenresData] = React.useState([] as Genre[] | null);
  const scrollOffsetTimeoutIdRef = React.useRef(null as NodeJS.Timeout | null);
  const [sortingOrder, setSortingOrder] = React.useState(
    currentlyActivePage.data && currentlyActivePage.data.sortingOrder
      ? (currentlyActivePage.data.sortingOrder as GenreSortTypes)
      : userData && userData.sortingStates.genresPage
      ? userData.sortingStates.genresPage
      : ('aToZ' as GenreSortTypes)
  );
  const containerRef = React.useRef(null as HTMLDivElement | null);
  const { height, width } = useResizeObserver(containerRef);
  const MIN_ITEM_WIDTH = 320;
  const MIN_ITEM_HEIGHT = 180;
  const noOfColumns = Math.floor(width / MIN_ITEM_WIDTH);
  const noOfRows = Math.ceil(
    (genresData ? genresData.length : 1) / noOfColumns
  );
  const itemWidth =
    MIN_ITEM_WIDTH + ((width % MIN_ITEM_WIDTH) - 10) / noOfColumns;

  const fetchGenresData = React.useCallback(() => {
    window.api
      .getGenresData([], sortingOrder)
      .then((genres) => {
        if (genres && genres.length > 0) return setGenresData(genres);
        return setGenresData(null);
      })
      // eslint-disable-next-line no-console
      .catch((err) => console.error(err));
  }, [sortingOrder]);

  React.useEffect(() => {
    fetchGenresData();
    const manageGenreDataUpdatesInGenresPage = (e: Event) => {
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
      manageGenreDataUpdatesInGenresPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageGenreDataUpdatesInGenresPage
      );
    };
  }, [fetchGenresData]);

  React.useEffect(
    () => updatePageSortingOrder('sortingStates.genresPage', sortingOrder),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortingOrder]
  );

  const row = React.useCallback(
    (props: {
      columnIndex: number;
      rowIndex: number;
      style: CSSProperties;
    }) => {
      const { columnIndex, rowIndex, style } = props;
      const index = rowIndex * noOfColumns + columnIndex;
      // eslint-disable-next-line no-console
      if (genresData && index < genresData.length) {
        const { genreId, name, songs, backgroundColor, artworkPaths } =
          genresData[index];
        return (
          <div style={{ ...style, display: 'flex', justifyContent: 'center' }}>
            <Genre
              index={index}
              artworkPaths={artworkPaths}
              genreId={genreId}
              title={name}
              backgroundColor={backgroundColor}
              songIds={songs.map((song) => song.songId)}
            />
          </div>
        );
      }
      return <div style={style} />;
    },
    [genresData, noOfColumns]
  );

  return (
    <MainContainer className="main-container genres-list-container appear-from=bottom !h-full overflow-hidden !pb-0 text-font-color-black dark:text-font-color-white">
      <>
        <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          <div className="container flex">
            Genres{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
              {isMultipleSelectionEnabled ? (
                <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                  {multipleSelectionsData.multipleSelections.length} selections
                </div>
              ) : (
                genresData &&
                genresData.length > 0 && (
                  <div className="no-of-genres">{`${genresData.length} genre${
                    genresData.length === 1 ? '' : 's'
                  }`}</div>
                )
              )}
            </div>
          </div>
          {genresData && genresData.length > 0 && (
            <div className="other-controls-container flex">
              <>
                <Button
                  label={isMultipleSelectionEnabled ? 'Unselect All' : 'Select'}
                  className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                  iconName={
                    isMultipleSelectionEnabled ? 'remove_done' : 'checklist'
                  }
                  clickHandler={() =>
                    toggleMultipleSelections(
                      !isMultipleSelectionEnabled,
                      'genre'
                    )
                  }
                  tooltipLabel={
                    isMultipleSelectionEnabled ? 'Unselect All' : 'Select'
                  }
                />
                <Dropdown
                  name="genreSortDropdown"
                  value={sortingOrder}
                  options={[
                    { label: 'A to Z', value: 'aToZ' },
                    { label: 'Z to A', value: 'zToA' },
                    { label: 'High Song Count', value: 'noOfSongsDescending' },
                    { label: 'Low Song Count', value: 'noOfSongsAscending' },
                  ]}
                  onChange={(e) => {
                    updateCurrentlyActivePageData((currentData) => ({
                      ...currentData,
                      sortingOrder: e.currentTarget.value as ArtistSortTypes,
                    }));
                    setSortingOrder(e.currentTarget.value as GenreSortTypes);
                  }}
                />
              </>
            </div>
          )}
        </div>
        <div
          className={`genres-container flex h-full flex-wrap ${
            !(genresData && genresData.length > 0) && 'hidden'
          }`}
          ref={containerRef}
        >
          {genresData && genresData.length > 0 && (
            <Grid
              columnCount={noOfColumns || 3}
              columnWidth={itemWidth}
              rowCount={noOfRows || 3}
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
                    1000
                  );
              }}
            >
              {row}
            </Grid>
          )}
        </div>
        {genresData === null && (
          <div className="no-songs-container my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img
              src={NoSongsImage}
              alt="No songs available."
              className="mb-8 w-60"
            />
            <span>Songs without genres. Yeah, we know it isn't ideal.</span>
          </div>
        )}
      </>
    </MainContainer>
  );
};

export default GenresPage;
