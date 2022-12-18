/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';

interface ConfirmDeletePlaylistProp {
  playlistName: string;
  playlistId: string;
  noOfSongs: number;
}

const ConfirmDeletePlaylist = (props: ConfirmDeletePlaylistProp) => {
  const { addNewNotifications, changePromptMenuData } =
    React.useContext(AppUpdateContext);
  const { playlistName, playlistId, noOfSongs } = props;
  return (
    <>
      <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
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
      <div className="buttons-container mt-8 flex w-full justify-end">
        <Button
          label="Delete Playlist"
          className="delete-playlist-btn danger-btn float-right h-10 w-48 cursor-pointer rounded-lg border-[transparent] !bg-font-color-crimson text-font-color-white outline-none ease-in-out hover:border-font-color-crimson dark:!bg-font-color-crimson dark:text-font-color-white dark:hover:border-font-color-crimson"
          clickHandler={() =>
            window.api.removePlaylist(playlistId).then((res) => {
              if (res.success) {
                changePromptMenuData(false);
                addNewNotifications([
                  {
                    id: `${playlistName}Deleted`,
                    delay: 5000,
                    content: (
                      <span>{`Playlist '${playlistName}' deleted.`}</span>
                    ),
                  },
                ]);
              }
              return undefined;
            })
          }
        />
      </div>
    </>
  );
};

export default ConfirmDeletePlaylist;
