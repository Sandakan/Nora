/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import DefaultPlaylistCover from '../../../../assets/images/playlist_cover_default.png';
import ConfirmDeletePlaylist from './ConfirmDeletePlaylist';

export const Playlist = (props: Playlist) => {
  const { currentlyActivePage } = React.useContext(AppContext);
  const {
    updateContextMenuData,
    changeCurrentActivePage,
    changePromptMenuData,
    createQueue,
  } = React.useContext(AppUpdateContext);

  const openPlaylistInfoPage = () =>
    currentlyActivePage.pageTitle === 'ArtistInfo' &&
    currentlyActivePage.data.artistName === props.playlistId
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('PlaylistInfo', {
          playlistId: props.playlistId,
        });

  const contextMenus: ContextMenuItem[] = [
    {
      label: 'Play',
      iconName: 'play_arrow',
      handlerFunction: () =>
        createQueue(props.songs, 'playlist', false, props.playlistId, true),
    },
    {
      label: 'Info',
      iconName: 'info',
      handlerFunction: openPlaylistInfoPage,
    },
  ];

  return (
    <div
      className={`playlist group appear-from-bottom ${props.playlistId} h-48 w-32 mb-12 mr-16 flex text-font-color-black dark:text-font-color-white flex-col justify-between`}
      data-playlist-id={props.playlistId}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(
          true,
          currentlyActivePage.pageTitle === 'Playlists' &&
            props.playlistId !== 'History' &&
            props.playlistId !== 'Favorites'
            ? [
                ...contextMenus,
                {
                  label: 'Delete',
                  iconName: 'delete_outline',
                  handlerFunction: () =>
                    changePromptMenuData(
                      true,
                      <ConfirmDeletePlaylist
                        playlistName={props.name}
                        playlistId={props.playlistId}
                        noOfSongs={props.songs.length}
                      />
                    ),
                },
              ]
            : contextMenus,
          e.pageX,
          e.pageY
        );
      }}
    >
      <div className="playlist-cover-and-play-btn-container relative h-[70%] overflow-hidden">
        <span
          className="material-icons-round icon absolute bottom-3 right-3 cursor-pointer text-font-color-white dark:text-font-color-white translate-y-10 opacity-0 text-4xl group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,transform] ease-in-out delay-100 duration-200"
          onClick={() =>
            createQueue(props.songs, 'playlist', false, props.playlistId, true)
          }
        >
          play_circle
        </span>
        <div
          className="playlist-cover-container h-full rounded-2xl overflow-hidden cursor-pointer"
          onClick={openPlaylistInfoPage}
        >
          <img
            src={
              props.artworkPath
                ? `otomusic://localFiles/${props.artworkPath}`
                : DefaultPlaylistCover
            }
            alt="Playlist Cover"
            loading="lazy"
            className="h-full"
          />
        </div>
      </div>
      <div className="playlist-info-container">
        <div
          className="title playlist-title text-xl cursor-pointer hover:underline"
          title={props.name}
          onClick={openPlaylistInfoPage}
        >
          {props.name}
        </div>
        <div className="playlist-no-of-songs text-sm font-light hover:underline">{`${
          props.songs.length
        } song${props.songs.length === 1 ? '' : 's'}`}</div>
      </div>
    </div>
  );
};
