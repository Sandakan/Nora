/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import DefaultPlaylistCover from '../../../../assets/images/playlist_cover_default.png';

interface PlaylistProp extends Playlist {
  currentPlaylists: Playlist[];
  updatePlaylists: (updatedPlaylists: Playlist[]) => void;
}

export const Playlist = (props: PlaylistProp) => {
  const {
    updateContextMenuData,
    currentlyActivePage,
    changeCurrentActivePage,
    updateNotificationPanelData,
    createQueue,
  } = React.useContext(AppContext);

  const contextMenus: ContextMenuItem[] = [
    {
      label: 'Play',
      iconName: 'play_arrow',
      handlerFunction: () => createQueue(props.songs, props.playlistId, true),
    },
  ];

  return (
    <div
      className={`playlist ${props.playlistId}`}
      data-playlist-id={props.playlistId}
      onContextMenu={(e) => {
        e.preventDefault();
        updateContextMenuData(
          true,
          props.playlistId !== 'History' && props.playlistId !== 'Favorites'
            ? [
                ...contextMenus,
                {
                  label: 'Delete',
                  iconName: 'delete_outline',
                  handlerFunction: () =>
                    window.api.removeAPlaylist(props.playlistId).then((res) => {
                      if (res.success) {
                        updateNotificationPanelData(
                          5000,
                          <span>{`Playlist '${props.name}' deleted.`}</span>
                        );
                        props.updatePlaylists(
                          props.currentPlaylists.filter(
                            (playlist) =>
                              playlist.playlistId !== props.playlistId
                          )
                        );
                      }
                      return undefined;
                    }),
                },
              ]
            : contextMenus,
          e.pageX,
          e.pageY
        );
      }}
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
            currentlyActivePage.pageTitle === 'ArtistInfo' &&
            currentlyActivePage.data.artistName === props.playlistId
              ? changeCurrentActivePage('Home')
              : changeCurrentActivePage('PlaylistInfo', {
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
