/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import DefaultPlaylistCover from '../../../../assets/images/playlist_cover_default.png';

interface PlaylistProp extends Playlist {
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
}

export const Playlist = (props: PlaylistProp) => {
  console.log(props.artworkPath);
  return (
    <div
      className={`playlist ${props.playlistId}`}
      data-playlist-id={props.playlistId}
    >
      <div className="playlist-cover-and-play-btn-container">
        <i className="fa-solid fa-circle-play"></i>
        <div className="playlist-cover-container">
          <img
            src={
              props.artworkPath
                ? `otomusic://localFiles/${props.artworkPath}`
                : DefaultPlaylistCover
            }
            alt=""
            loading="lazy"
          />
        </div>
      </div>
      <div className="playlist-info-container">
        <div
          className="title playlist-title"
          title={props.name}
          onClick={() =>
            props.currentlyActivePage.pageTitle === 'ArtistInfo' &&
            props.currentlyActivePage.data.artistName === props.playlistId
              ? props.changeCurrentActivePage('Home')
              : props.changeCurrentActivePage('PlaylistInfo', {
                  playlistId: props.playlistId,
                })
          }
        >
          {props.name}
        </div>
        <div className="playlist-no-of-songs">{`${props.songs.length} song${
          props.songs.length === 1 ? '' : 's'
        }`}</div>
      </div>
    </div>
  );
};
