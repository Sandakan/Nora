/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import sortAlbums from 'renderer/utils/sortAlbums';
import { Album } from './Album';

interface AlbumsPageProp {
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
}

export const AlbumsPage = (props: AlbumsPageProp) => {
  const [albums, setAlbums] = React.useState([] as Album[]);
  const [sortingOrder, setSortingOrder] = React.useState(
    'aToZ' as AlbumSortTypes
  );

  React.useEffect(() => {
    window.api.getAlbumData('*').then((res) => {
      if (res && Array.isArray(res)) setAlbums(sortAlbums(res, sortingOrder));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setAlbums((prevData) => sortAlbums(prevData, sortingOrder));
  }, [sortingOrder]);

  // const albumComponents =
  //   // albums.length > 0 &&
  //   albums.map((album) => (
  //     <Album
  //       key={album.albumId}
  //       title={album.title}
  //       artworkPath={album.artworkPath}
  //       albumId={album.albumId}
  //       artists={album.artists}
  //       songs={album.songs}
  //       year={album.year}
  //       changeCurrentActivePage={props.changeCurrentActivePage}
  //       currentlyActivePage={props.currentlyActivePage}
  //     />
  //   ));
  return (
    <div className="main-container albums-list-container">
      <div className="title-container">
        Albums
        <select
          name="sortingOrderDropdown"
          id="sortingOrderDropdown"
          // value={sortingOrder}
          onChange={(e) =>
            setSortingOrder(e.currentTarget.value as AlbumSortTypes)
          }
        >
          <option value="aToZ">A to Z</option>
          <option value="noOfSongs">No. of Songs</option>
        </select>
      </div>
      <div className="albums-container">
        {albums.map((album) => (
          <Album
            key={album.albumId}
            title={album.title}
            artworkPath={album.artworkPath}
            albumId={album.albumId}
            artists={album.artists}
            songs={album.songs}
            year={album.year}
            changeCurrentActivePage={props.changeCurrentActivePage}
            currentlyActivePage={props.currentlyActivePage}
          />
        ))}
      </div>
    </div>
  );
};
