/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
// import { AppContext } from 'renderer/contexts/AppContext';
import sortAlbums from 'renderer/utils/sortAlbums';
import { Album } from './Album';
import FetchingDataImage from '../../../../assets/images/Cocktail _Monochromatic.svg';
import NoAlbumsImage from '../../../../assets/images/Easter bunny_Monochromatic.svg';

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
  const { currentlyActivePage, updateCurrentlyActivePageData } =
    React.useContext(AppContext);
  const [content, dispatch] = React.useReducer(reducer, {
    albums: [],
    sortingOrder:
      currentlyActivePage.data &&
      currentlyActivePage.data.albumsPage &&
      currentlyActivePage.data.albumsPage.sortingOrder
        ? currentlyActivePage.data.albumsPage.sortingOrder
        : 'aToZ',
  } as AlbumsPageReducer);

  React.useEffect(() => {
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
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="main-container albums-list-container">
      <div className="title-container">
        <div className="container">
          Albums{' '}
          <div className="other-stats-container">
            {content.albums && (
              <span className="no-of-albums">{`${content.albums.length} album${
                content.albums.length === 1 ? '' : 's'
              }`}</span>
            )}
          </div>
        </div>
        <div className="other-controls-container">
          <select
            name="sortingOrderDropdown"
            id="sortingOrderDropdown"
            className="dropdown"
            onChange={(e) => {
              updateCurrentlyActivePageData({
                albumsPage: {
                  sortingOrder: e.currentTarget.value as ArtistSortTypes,
                },
              });
              dispatch({ type: 'SORTING_ORDER', data: e.currentTarget.value });
            }}
          >
            <option value="aToZ">A to Z</option>
            <option value="ZToA">Z to A</option>
            <option value="noOfSongsAscending">
              No. of Songs ( Ascending )
            </option>
            <option value="noOfSongsDescending">
              No. of Songs ( Descending )
            </option>
          </select>
        </div>
      </div>
      {content.albums && content.albums.length > 0 && (
        <div className="albums-container">
          {content.albums.map((album) => (
            <Album
              key={album.albumId}
              title={album.title}
              artworkPath={album.artworkPath}
              albumId={album.albumId}
              artists={album.artists}
              songs={album.songs}
              year={album.year}
            />
          ))}
        </div>
      )}
      {content.albums === null && (
        <div className="no-songs-container">
          <img src={NoAlbumsImage} alt="No songs available." />
          <div>Even the bunny can&apos;t find them. How can we ?</div>
        </div>
      )}
      {content.albums && content.albums.length === 0 && (
        <div className="no-songs-container">
          <img src={FetchingDataImage} alt="No songs available." />
          <div>We&apos;re already there...</div>
        </div>
      )}
    </div>
  );
};
