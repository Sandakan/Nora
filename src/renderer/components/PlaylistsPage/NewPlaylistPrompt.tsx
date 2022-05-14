/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import PlaylistDefaultCover from '../../../../assets/images/playlist_cover_default.png';

interface NewPlaylistPromptProp {
  updatePlaylists: (updatedPlaylist: Playlist[]) => void;
  currentPlaylists: Playlist[];
}

export default (props: NewPlaylistPromptProp) => {
  const { changePromptMenuData, updateNotificationPanelData } =
    React.useContext(AppContext);
  const [input, setInput] = React.useState('');

  const createNewPlaylist = (playlistName: string) => {
    if (playlistName !== '') {
      window.api.addNewPlaylist(playlistName.trim()).then((res) => {
        if (res && res.success && res.playlist) {
          changePromptMenuData(false, <></>);
          props.updatePlaylists([...props.currentPlaylists, res.playlist]);
          updateNotificationPanelData(5000, <>Playlist added successfully.</>);
        } else {
          updateNotificationPanelData(5000, <>{res.message}</>);
        }
      });
    } else
      updateNotificationPanelData(5000, <>Playlist name cannot be empty</>);
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
