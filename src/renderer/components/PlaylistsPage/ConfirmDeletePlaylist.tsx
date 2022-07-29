/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppContext';
import Button from '../Button';

interface ConfirmDeletePlaylistProp {
  playlistName: string;
  playlistId: string;
  noOfSongs: number;
}

const ConfirmDeletePlaylist = (props: ConfirmDeletePlaylistProp) => {
  const { updateNotificationPanelData, changePromptMenuData } =
    React.useContext(AppUpdateContext);
  const { playlistName, playlistId, noOfSongs } = props;
  return (
    <>
      <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
        Confrim Deleting &apos;{playlistName}&apos; playlist
      </div>
      <div className="description">
        Removing this playlist will remove the connection between this playlist
        and the songs that you organized into this playlist. You won't be able
        to access this playlist again if you decide to delete it.
        {noOfSongs > 0 && (
          <>
            <br />
            <br />
            {noOfSongs} songs that you organized into this playlist will be
            lost.
          </>
        )}
      </div>
      <Button
        label="Delete Playlist"
        className="delete-playlist-btn danger-btn w-48 h-10 rounded-lg outline-none !bg-foreground-color-1 dark:!bg-foreground-color-1 text-font-color-white dark:text-font-color-white border-[transparent] float-right cursor-pointer hover:border-foreground-color-1 dark:hover:border-foreground-color-1 transition-[background] ease-in-out"
        clickHandler={() =>
          window.api.removeAPlaylist(playlistId).then((res) => {
            if (res.success) {
              changePromptMenuData(false);
              updateNotificationPanelData(
                5000,
                <span>{`Playlist '${playlistName}' deleted.`}</span>
              );
            }
            return undefined;
          })
        }
      />
    </>
  );
};

export default ConfirmDeletePlaylist;
