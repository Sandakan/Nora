/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
// import { AppContext } from 'renderer/contexts/AppContext';
import sortAlbums from 'renderer/utils/sortAlbums';
import { Album } from './Album';
import FetchingDataImage from '../../../../assets/images/Cocktail _Monochromatic.svg';
import NoAlbumsImage from '../../../../assets/images/Easter bunny_Monochromatic.svg';
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
    const manageAlbumDataUpdates = (
      _: unknown,
      eventType: DataUpdateEventTypes
    ) => {
      if (eventType === 'albums') fetchAlbumData();
    };
    window.api.dataUpdateEvent(manageAlbumDataUpdates);
    return () => {
      window.api.removeDataUpdateEventListener(manageAlbumDataUpdates);
    };
  }, [fetchAlbumData]);

  React.useEffect(() => {
    updatePageSortingOrder('sortingStates.albumsPage', content.sortingOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.sortingOrder]);

  const albumComponenets = React.useMemo(
    () =>
      content.albums.map((album) => (
        <Album
          key={album.albumId}
          title={album.title}
          artworkPath={album.artworkPath}
          albumId={album.albumId}
          artists={album.artists}
          songs={album.songs}
          year={album.year}
        />
      )),
    [content.albums]
  );

  return (
    <MainContainer className="main-container albums-list-container absolute">
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
        {content.albums && content.albums.length > 0 && (
          <div className="albums-container flex flex-wrap">
            {albumComponenets}
          </div>
        )}
        {content.albums === null && (
          <div className="no-songs-container  h-full w-full text-[#ccc] text-center flex flex-col items-center justify-center text-2xl">
            <img
              src={NoAlbumsImage}
              alt="No songs available."
              className="w-60 mb-8"
            />
            <div>Even the bunny can&apos;t find them. How can we ?</div>
          </div>
        )}
        {content.albums && content.albums.length === 0 && (
          <div className="no-songs-container  h-full w-full text-[#ccc] text-center flex flex-col items-center justify-center text-2xl">
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
