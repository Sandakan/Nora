/* eslint-disable react/self-closing-comp */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';

export const Album = (props: Album) => {
  return (
    <div className="album">
      <div className="album-cover-and-play-btn-container">
        <i className="fa-solid fa-circle-play" />
        <div className="album-cover-container">
          <img
            src={`otomusic://localFiles/${props.artworkPath}`}
            loading="lazy"
          />
        </div>
      </div>
      <div className="album-info-container">
        <div className="album-title" title={props.title}>
          {props.title}
        </div>
        <div className="album-artists" title={props.artists.join(', ')}>
          {props.artists.join(', ')}
        </div>
        <div className="album-no-of-songs">{`${props.songs.length} song${
          props.songs.length === 1 ? '' : 's'
        }`}</div>
      </div>
    </div>
  );
};
