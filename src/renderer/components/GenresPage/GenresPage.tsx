/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
import React, { CSSProperties } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import sortGenres from 'renderer/utils/sortGenres';
import Dropdown from '../Dropdown';
import MainContainer from '../MainContainer';
import Genre from './Genre';
import NoSongsImage from '../../../../assets/images/svg/Summer landscape_Monochromatic.svg';

const GenresPage = () => {
  const { currentlyActivePage, userData } = React.useContext(AppContext);
  const { updateCurrentlyActivePageData, updatePageSortingOrder } =
    React.useContext(AppUpdateContext);

  const [genresData, setGenresData] = React.useState([] as Genre[] | null);
  const [sortingOrder, setSortingOrder] = React.useState(
    currentlyActivePage.data &&
      currentlyActivePage.data.artistsPage &&
      currentlyActivePage.data.artistsPage.sortingOrder
      ? (currentlyActivePage.data.artistsPage.sortingOrder as GenreSortTypes)
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
      .getGenresData([])
      .then((genres) => {
        if (genres && genres.length > 0)
          return setGenresData(sortGenres(genres, sortingOrder));
        return setGenresData(null);
      })
      // eslint-disable-next-line no-console
      .catch((err) => console.error(err));
  }, [sortingOrder]);

  React.useEffect(() => {
    fetchGenresData();
    const manageGenreDataUpdatesInGenresPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DataEvent).detail;
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
      console.log(index);
      if (genresData && index < genresData.length) {
        const { genreId, name, songs, backgroundColor, artworkPath } =
          genresData[index];
        return (
          <div style={{ ...style, display: 'flex', justifyContent: 'center' }}>
            <Genre
              index={index}
              artworkPath={artworkPath}
              genreId={genreId}
              title={name}
              backgroundColor={backgroundColor}
              noOfSongs={songs.length}
            />
          </div>
        );
      }
      return <div style={style} />;
    },
    [genresData, noOfColumns]
  );

  return (
    <MainContainer className="main-container genres-list-container appear-from=bottom text-font-color-black dark:text-font-color-white !h-full !mb-0">
      <>
        <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
          <div className="container flex">
            Genres{' '}
            <div className="other-stats-container text-xs ml-12 flex items-center">
              {genresData && genresData.length > 0 && (
                <div className="no-of-genres">{`${genresData.length} genre${
                  genresData.length === 1 ? '' : 's'
                }`}</div>
              )}
            </div>
          </div>
          <div className="other-controls-container">
            {genresData && genresData.length > 0 && (
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
                  updateCurrentlyActivePageData({
                    songsPage: {
                      sortingOrder: e.currentTarget.value as ArtistSortTypes,
                    },
                  });
                  setSortingOrder(e.currentTarget.value as GenreSortTypes);
                }}
              />
            )}
          </div>
        </div>
        <div
          className="genres-container flex flex-wrap h-full"
          ref={containerRef}
        >
          {genresData && genresData.length > 0 && (
            <Grid
              columnCount={noOfColumns || 3}
              columnWidth={itemWidth}
              rowCount={noOfRows || 3}
              rowHeight={MIN_ITEM_HEIGHT}
              height={height - 10 || 300}
              width={width || 500}
              overscanRowCount={2}
            >
              {row}
            </Grid>
          )}
        </div>
        {genresData === null && (
          <div className="no-songs-container my-[10%] h-full w-full text-[#ccc] text-center flex flex-col items-center justify-center text-2xl">
            <img
              src={NoSongsImage}
              alt="No songs available."
              className="w-60 mb-8"
            />
            <span>Songs without genres. Yeah, we know it isn't ideal.</span>
          </div>
        )}
      </>
    </MainContainer>
  );
};

export default GenresPage;
