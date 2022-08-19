/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable import/prefer-default-export */
import React, { CSSProperties } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import sortArtists from 'renderer/utils/sortArtists';
import { Artist } from './Artist';
import NoArtistImage from '../../../../assets/images/svg/Sun_Monochromatic.svg';
import FetchingDataImage from '../../../../assets/images/svg/Lemonade_Monochromatic.svg';
import Dropdown from '../Dropdown';
import MainContainer from '../MainContainer';

interface ArtistPageReducer {
  artists: Artist[];
  sortingOrder: ArtistSortTypes;
}

type ArtistPageReducerTypes = 'SORTING_ORDER' | 'ARTISTS_DATA';

const reducer = (
  state: ArtistPageReducer,
  action: { type: ArtistPageReducerTypes; data: any }
): ArtistPageReducer => {
  switch (action.type) {
    case 'ARTISTS_DATA':
      return {
        ...state,
        artists: action.data,
      };
    case 'SORTING_ORDER':
      return {
        ...state,
        artists: sortArtists(state.artists, action.data),
        sortingOrder: action.data,
      };
    default:
      return state;
  }
};

export const ArtistPage = () => {
  const { currentlyActivePage, userData } = React.useContext(AppContext);
  const { updateCurrentlyActivePageData, updatePageSortingOrder } =
    React.useContext(AppUpdateContext);
  const [content, dispatch] = React.useReducer(reducer, {
    artists: [],
    sortingOrder:
      currentlyActivePage.data &&
      currentlyActivePage.data.artistsPage &&
      currentlyActivePage.data.artistsPage.sortingOrder
        ? currentlyActivePage.data.artistsPage.sortingOrder
        : userData && userData.sortingStates.artistsPage
        ? userData.sortingStates.artistsPage
        : 'aToZ',
  } as ArtistPageReducer);
  const containerRef = React.useRef(null as HTMLDivElement | null);
  const { height, width } = useResizeObserver(containerRef);
  const MIN_ITEM_WIDTH = 175;
  const MIN_ITEM_HEIGHT = 200;
  const noOfColumns = Math.floor(width / MIN_ITEM_WIDTH);
  const noOfRows = Math.ceil(content.artists.length / noOfColumns);
  const itemWidth =
    MIN_ITEM_WIDTH + ((width % MIN_ITEM_WIDTH) - 10) / noOfColumns;

  const fetchArtistsData = React.useCallback(
    () =>
      window.api.getArtistData().then((res) => {
        if (res && Array.isArray(res)) {
          if (res.length > 0)
            dispatch({
              type: 'ARTISTS_DATA',
              data: sortArtists(res, content.sortingOrder),
            });
          else
            dispatch({
              type: 'ARTISTS_DATA',
              data: null,
            });
        }
      }),
    [content.sortingOrder]
  );

  React.useEffect(() => {
    fetchArtistsData();
    const manageArtistDataUpdatesInArtistsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DataEvent).detail;
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
    updatePageSortingOrder('sortingStates.artistsPage', content.sortingOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.sortingOrder]);

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
      if (index < content.artists.length) {
        const { artistId, name, onlineArtworkPaths, songs, artworkPath } =
          content.artists[index];
        return (
          <div style={{ ...style, display: 'flex', justifyContent: 'center' }}>
            <Artist
              index={index}
              key={artistId}
              className="mb-12"
              artistId={artistId}
              name={name}
              artworkPath={artworkPath}
              onlineArtworkPaths={onlineArtworkPaths}
              songIds={songs.map((song) => song.songId)}
            />
          </div>
        );
      }
      return <div style={style} />;
    },
    [content.artists, noOfColumns]
  );

  return (
    <MainContainer className="main-container artists-list-container !h-full !mb-0">
      <>
        <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
          <div className="container flex">
            Artists{' '}
            <div className="other-stats-container text-xs ml-12 flex items-center">
              {content.artists && (
                <span className="no-of-artists">{`${
                  content.artists.length
                } artist${content.artists.length === 1 ? '' : 's'}`}</span>
              )}
            </div>
          </div>
          <div className="other-control-container">
            <Dropdown
              name="artistsSortDropdown"
              value={content.sortingOrder}
              options={[
                { label: 'A to Z', value: 'aToZ' },
                { label: 'Z to A', value: 'zToA' },
                { label: 'High Song Count', value: 'noOfSongsDescending' },
                { label: 'Low Song Count', value: 'noOfSongsAscending' },
              ]}
              onChange={(e) => {
                updateCurrentlyActivePageData({
                  artistsPage: {
                    sortingOrder: e.currentTarget.value as ArtistSortTypes,
                  },
                });
                dispatch({
                  type: 'SORTING_ORDER',
                  data: e.currentTarget.value as ArtistSortTypes,
                });
              }}
            />
          </div>
        </div>
        <div
          className="artists-container flex flex-wrap !h-full"
          ref={containerRef}
        >
          {content.artists && content.artists.length > 0 && (
            <Grid
              columnCount={noOfColumns || 5}
              columnWidth={itemWidth}
              rowCount={noOfRows || 5}
              rowHeight={MIN_ITEM_HEIGHT}
              height={height || 300}
              width={width || 500}
              overscanRowCount={2}
            >
              {row}
            </Grid>
          )}
        </div>
        {content.artists === null && (
          <div className="no-songs-container h-full w-full text-[#ccc] my-[10%] text-center flex flex-col items-center justify-center text-2xl">
            <img
              src={NoArtistImage}
              alt="Sun in a desert"
              className="w-60 mb-8"
            />
            <div>Hmm... Where did the artists go?</div>
          </div>
        )}
        {content.artists && content.artists.length === 0 && (
          <div className="no-songs-container h-full w-full text-[#ccc] my-[10%] text-center flex flex-col items-center justify-center text-2xl">
            <img
              src={FetchingDataImage}
              alt="No songs available."
              className="w-60 mb-8"
            />
            <div>What about a Lemonade? They are cool, right ?</div>
          </div>
        )}
      </>
    </MainContainer>
  );
};
