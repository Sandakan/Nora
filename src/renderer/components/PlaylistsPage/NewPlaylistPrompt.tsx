/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import React, { ReactElement } from 'react';
import PlaylistDefaultCover from '../../../../assets/images/playlist_cover_default.png';

interface NewPlaylistPromptProp {
  changePromptMenuData: (
    isVisible: boolean,
    content: ReactElement<any, any>,
    className?: string
  ) => void;
  updatePlaylists: (newPlaylist: Playlist) => void;
  updateDialogMenuData: (
    delay: number,
    content: ReactElement<any, any>
  ) => void;
}

export default (props: NewPlaylistPromptProp) => {
  const [input, setInput] = React.useState('');

  const createNewPlaylist = (playlistName: string) => {
    if (playlistName !== '') {
      window.api.addNewPlaylist(playlistName.trim()).then((res) => {
        if (res && res.success && res.playlist) {
          props.changePromptMenuData(false, <></>);
          props.updatePlaylists(res.playlist);
          props.updateDialogMenuData(5000, <>Playlist added successfully.</>);
        } else {
          props.updateDialogMenuData(5000, <>{res.message}</>);
        }
      });
    } else props.updateDialogMenuData(5000, <>Playlist name cannot be empty</>);
  };

  return (
    <>
      <img src={PlaylistDefaultCover} alt="Playlist default cover" />
      <h2>Add new Playlist </h2>
      <input
        type="text"
        name="playlistName"
        className="playlist-name-input"
        placeholder="Playlist Name"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        className="add-new-playlist-confirm-btn"
        onClick={() => createNewPlaylist(input)}
      >
        Add Playlist
      </button>
    </>
  );
};
