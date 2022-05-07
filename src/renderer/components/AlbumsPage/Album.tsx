/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/self-closing-comp */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
// import React from 'react';

interface AlbumProp extends Album {
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
}

export const Album = (props: AlbumProp) => {
  return (
    <div className="album">
      <div className="album-cover-and-play-btn-container">
        <span className="material-icons-round icon">play_circle</span>
        <div className="album-cover-container">
          <img
            src={`otomusic://localFiles/${props.artworkPath}`}
            loading="lazy"
          />
        </div>
      </div>
      <div className="album-info-container">
        <div
          className="album-title"
          title={props.title}
          onClick={() =>
            props.currentlyActivePage.pageTitle === 'AlbumInfo' &&
            props.currentlyActivePage.data.artistName === props.albumId
              ? props.changeCurrentActivePage('Home')
              : props.changeCurrentActivePage('AlbumInfo', {
                  albumId: props.albumId,
                })
          }
        >
          {props.title}
        </div>
        <div className="album-artists" title={props.artists.join(', ')}>
          {props.artists.map((artist, index) => {
            return (
              <span
                className="artist"
                onClick={() =>
                  props.currentlyActivePage.pageTitle === 'ArtistInfo' &&
                  props.currentlyActivePage.data.artistName === artist
                    ? props.changeCurrentActivePage('Home')
                    : props.changeCurrentActivePage('ArtistInfo', {
                        artistName: artist,
                      })
                }
              >
                {artist}
                {props.artists.length === 0 ||
                props.artists.length - 1 === index
                  ? ''
                  : ', '}
              </span>
            );
          })}
        </div>
        <div className="album-no-of-songs">{`${props.songs.length} song${
          props.songs.length === 1 ? '' : 's'
        }`}</div>
      </div>
    </div>
  );
};
