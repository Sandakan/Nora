/* eslint-disable jsx-a11y/no-autofocus */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppContext';
import PlaylistDefaultCover from '../../../../assets/images/png/playlist_cover_default.png';
import Button from '../Button';

interface NewPlaylistPromptProp {
  updatePlaylists: (updatedPlaylist: Playlist[]) => void;
  currentPlaylists: Playlist[];
}

export default (props: NewPlaylistPromptProp) => {
  const { changePromptMenuData, addNewNotifications } =
    React.useContext(AppUpdateContext);
  const [input, setInput] = React.useState('');

  const createNewPlaylist = (playlistName: string) => {
    if (playlistName !== '') {
      window.api.addNewPlaylist(playlistName.trim()).then((res) => {
        if (res && res.success && res.playlist) {
          changePromptMenuData(false, <></>);
          props.updatePlaylists([...props.currentPlaylists, res.playlist]);
          addNewNotifications([
            {
              id: 'playlistCreated',
              delay: 5000,
              content: <>Playlist added successfully.</>,
            },
          ]);
        } else {
          addNewNotifications([
            {
              id: 'playlistCreateFailed',
              delay: 5000,
              content: <>{res.message}</>,
            },
          ]);
        }
      });
    } else
      addNewNotifications([
        {
          id: 'EmptyPlaylistName',
          delay: 5000,
          content: <>Playlist name cannot be empty</>,
        },
      ]);
  };

  return (
    <>
      <img
        src={PlaylistDefaultCover}
        alt="Playlist default cover"
        className="mb-8 max-w-[50%] rounded-xl"
      />
      <span className="text-2xl font-medium text-center mb-4">
        Add new Playlist{' '}
      </span>
      <input
        type="text"
        name="playlistName"
        className="playlist-name-input w-3/4 min-w-[400px] max-w-[90%] px-6 py-3 rounded-2xl text-lg !bg-background-color-2 dark:!bg-dark-background-color-2 border-[transparent] outline-none text-font-color-black dark:text-font-color-white"
        placeholder="Playlist Name"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        autoFocus
      />
      <Button
        label="Add Playlist"
        className="w-1/2 p-2 rounded-lg text-lg cursor-pointer text-font-color-black dark:text-font-color-black justify-center !bg-background-color-3 dark:!bg-dark-background-color-3 my-4"
        clickHandler={() => createNewPlaylist(input)}
      />
    </>
  );
};
