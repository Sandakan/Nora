/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import sortAlbums from 'renderer/utils/sortAlbums';
import { Album } from './Album';

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
  const { currentlyActivePage, changeCurrentActivePage } =
    useContext(AppContext);

  const [content, dispatch] = React.useReducer(reducer, {
    albums: [],
    sortingOrder: 'aToZ',
  } as AlbumsPageReducer);

  React.useEffect(() => {
    window.api.getAlbumData('*').then((res) => {
      if (res && Array.isArray(res))
        dispatch({
          type: 'ALBUM_DATA',
          data: sortAlbums(res, content.sortingOrder),
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="main-container albums-list-container">
      <div className="title-container">
        Albums
        <select
          name="sortingOrderDropdown"
          id="sortingOrderDropdown"
          // value={sortingOrder}
          onChange={(e) =>
            dispatch({ type: 'SORTING_ORDER', data: e.currentTarget.value })
          }
        >
          <option value="aToZ">A to Z</option>
          <option value="noOfSongs">No. of Songs</option>
        </select>
      </div>
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
            changeCurrentActivePage={changeCurrentActivePage}
            currentlyActivePage={currentlyActivePage}
          />
        ))}
      </div>
    </div>
  );
};
