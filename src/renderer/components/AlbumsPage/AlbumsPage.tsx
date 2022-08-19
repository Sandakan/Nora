/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React, { CSSProperties } from 'react';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import { FixedSizeGrid as Grid } from 'react-window';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import sortAlbums from 'renderer/utils/sortAlbums';
import { Album } from './Album';
import FetchingDataImage from '../../../../assets/images/svg/Cocktail _Monochromatic.svg';
import NoAlbumsImage from '../../../../assets/images/svg/Easter bunny_Monochromatic.svg';
import MainContainer from '../MainContainer';
import Dropdown from '../Dropdown';

interface AlbumsPageReducer {
  albums: Album[];
  sortingOrder: AlbumSortTypes;
}

type AlbumPageReducerActionTypes = 'ALBUM_DATA' | 'SORTING_ORDER';

const reducer = (
  state: AlbumsPageReducer,
  action: { type: AlbumPageReducerActionTypes; data: any }
): AlbumsPageReducer => {
  switch (action.type) {
    case 'ALBUM_DATA':
      return {
        ...state,
        albums: action.data,
      };
    case 'SORTING_ORDER':
      return {
        ...state,
        albums: sortAlbums(state.albums, action.data),
        sortingOrder: action.data,
      };
    default:
      return state;
  }
};

export const AlbumsPage = () => {
  const { currentlyActivePage, userData } = React.useContext(AppContext);
  const { updateCurrentlyActivePageData, updatePageSortingOrder } =
    React.useContext(AppUpdateContext);

  const [content, dispatch] = React.useReducer(reducer, {
    albums: [],
    sortingOrder:
      currentlyActivePage.data &&
      currentlyActivePage.data.albumsPage &&
      currentlyActivePage.data.albumsPage.sortingOrder
        ? currentlyActivePage.data.albumsPage.sortingOrder
        : userData && userData.sortingStates.albumsPage
        ? userData.sortingStates.albumsPage
        : 'aToZ',
  } as AlbumsPageReducer);
  const containerRef = React.useRef(null as HTMLDivElement | null);
  const { height, width } = useResizeObserver(containerRef);
  const MIN_ITEM_WIDTH = 220;
  const MIN_ITEM_HEIGHT = 280;
  const noOfColumns = Math.floor(width / MIN_ITEM_WIDTH);
  const noOfRows = Math.ceil(content.albums.length / noOfColumns);
  const itemWidth =
    MIN_ITEM_WIDTH + ((width % MIN_ITEM_WIDTH) - 10) / noOfColumns;

  const fetchAlbumData = React.useCallback(
    () =>
      window.api.getAlbumData([]).then((res) => {
        if (res && Array.isArray(res)) {
          if (res.length > 0)
            dispatch({
              type: 'ALBUM_DATA',
              data: sortAlbums(res, content.sortingOrder),
            });
          else
            dispatch({
              type: 'ALBUM_DATA',
              data: null,
            });
        }
      }),
    [content.sortingOrder]
  );

  React.useEffect(() => {
    fetchAlbumData();
    const manageDataUpdatesInAlbumsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DataEvent).detail;
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
        manageDataUpdatesInAlbumsPage
      );
    };
  }, [fetchAlbumData]);

  React.useEffect(() => {
    updatePageSortingOrder('sortingStates.albumsPage', content.sortingOrder);
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
      if (index < content.albums.length) {
        const { albumId, year, artists, title, songs, artworkPath } =
          content.albums[index];
        return (
          <div style={{ ...style, display: 'flex', justifyContent: 'center' }}>
            <Album
              index={index}
              artworkPath={artworkPath}
              albumId={albumId}
              title={title}
              year={year}
              artists={artists}
              songs={songs}
            />
          </div>
        );
      }
      return <div style={style} />;
    },
    [content.albums, noOfColumns]
  );

  return (
    <MainContainer className="main-container albums-list-container absolute !h-full !mb-0">
      <>
        <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
          <div className="container flex">
            Albums{' '}
            <div className="other-stats-container text-xs ml-12 flex items-center">
              {content.albums && (
                <span className="no-of-albums">{`${
                  content.albums.length
                } album${content.albums.length === 1 ? '' : 's'}`}</span>
              )}
            </div>
          </div>
          <div className="other-controls-container">
            <Dropdown
              name="albumSortDropdown"
              value={content.sortingOrder}
              options={[
                { label: 'A to Z', value: 'aToZ' },
                { label: 'Z to A', value: 'zToA' },
                { label: 'High Song Count', value: 'noOfSongsDescending' },
                { label: 'Low Song Count', value: 'noOfSongsAscending' },
              ]}
              onChange={(e) => {
                updateCurrentlyActivePageData({
                  albumsPage: {
                    sortingOrder: e.currentTarget.value as ArtistSortTypes,
                  },
                });
                dispatch({
                  type: 'SORTING_ORDER',
                  data: e.currentTarget.value,
                });
              }}
            />
          </div>
        </div>
        <div className="albums-container h-full flex-grow" ref={containerRef}>
          {content.albums && content.albums.length > 0 && (
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
        {content.albums === null && (
          <div className="no-songs-container  h-full w-full text-[#ccc] my-[10%] text-center flex flex-col items-center justify-center text-2xl">
            <img
              src={NoAlbumsImage}
              alt="No songs available."
              className="w-60 mb-8"
            />
            <div>Even the bunny can&apos;t find them. How can we ?</div>
          </div>
        )}
        {content.albums && content.albums.length === 0 && (
          <div className="no-songs-container h-full w-full text-[#ccc] my-[10%] text-center flex flex-col items-center justify-center text-2xl">
            <img
              src={FetchingDataImage}
              alt="No songs available."
              className="w-60 mb-8"
            />
            <div>We&apos;re already there...</div>
          </div>
        )}
      </>
    </MainContainer>
  );
};
