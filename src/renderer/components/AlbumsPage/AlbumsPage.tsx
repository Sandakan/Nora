/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { Album } from './Album';

interface AlbumsPageProp {
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
}

export const AlbumsPage = (props: AlbumsPageProp) => {
  const [albums, setAlbums] = React.useState([
    {
      title: 'unknown album',
      artworkPath: undefined,
      albumId: '1',
      artists: [''],
      songs: [{ songId: '', title: 'unknown song' }],
    },
  ] as Album[]);

  React.useEffect(() => {
    window.api.getAlbumData('*').then((res) => {
      if (res && Array.isArray(res)) setAlbums(res);
    });
  }, []);

  const albumComponents = albums.map((album) => (
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
  ));
  return (
    <div className="main-container albums-list-container">
      <div className="title-container">Albums</div>
      <div className="albums-container">{albumComponents}</div>
    </div>
  );
};
