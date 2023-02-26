/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';

interface ConfirmDeletePlaylistProp {
  playlistIds: string[];
  playlistName?: string;
}

const ConfirmDeletePlaylists = (props: ConfirmDeletePlaylistProp) => {
  const { addNewNotifications, changePromptMenuData } =
    React.useContext(AppUpdateContext);
  const { playlistIds, playlistName } = props;

  const [playlistsData, setPlaylistsData] = React.useState<Playlist[]>([]);

  React.useEffect(() => {
    if (playlistIds.length > 0) {
      window.api
        .getPlaylistData(playlistIds)
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            return setPlaylistsData(res);
          }
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [playlistIds]);

  const arePlaylistsRemovable = React.useMemo(() => {
    const unRemovablePlaylistIds = ['History', 'Favorites'];

    return !playlistIds.some((playlistId) =>
      unRemovablePlaylistIds.includes(playlistId)
    );
  }, [playlistIds]);

  const removePlaylists = React.useCallback(() => {
    window.api
      .removePlaylists(playlistIds)
      .then(() => {
        changePromptMenuData(false);
        return addNewNotifications([
          {
            id: `playlistsDeleted`,
            delay: 5000,
            content: <span>{playlistIds.length} playlists deleted.</span>,
          },
        ]);
      })
      .catch((err) => console.error(err));
  }, [addNewNotifications, changePromptMenuData, playlistIds]);

  return (
    <>
      <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
        Confrim Deleting{' '}
        {playlistIds.length === 1
          ? `'${playlistName}' playlist`
          : `${playlistIds.length} playlists`}
        .
      </div>
      <div className="description">
        Removing{' '}
        {playlistIds.length === 1 ? 'this playlist' : 'these playlists'} will
        remove the connection between{' '}
        {playlistIds.length === 1 ? 'this playlist' : 'these playlists'} and the
        songs that you organized into{' '}
        {playlistIds.length === 1 ? 'this playlist' : 'these playlists'}. You
        won't be able to access{' '}
        {playlistIds.length === 1 ? 'this playlist' : 'these playlists'} again
        if you decide to delete it.
        <div className="info-about-affecting-files-container mt-4">
          <p>Proceeding this action affects these playlists :</p>
          <ul className="ml-4 list-inside list-disc">
            {playlistsData.map((playlist) => (
              <li className="text-sm font-light">{playlist.name}</li>
            ))}
          </ul>
        </div>
      </div>
      {!arePlaylistsRemovable && (
        <h4 className="mt-8 flex items-center justify-center font-medium text-font-color-crimson">
          <span className="material-icons-round-outlined mr-2 text-lg">
            warning
          </span>{' '}
          You cannot remove Playlists like History or Favorites.
        </h4>
      )}
      {arePlaylistsRemovable && (
        <div className="buttons-container mt-8 flex w-full justify-end">
          <Button
            label="Delete Playlists"
            className="delete-playlist-btn danger-btn float-right h-10 w-48 cursor-pointer rounded-lg border-[transparent] !bg-font-color-crimson text-font-color-white outline-none ease-in-out hover:border-font-color-crimson dark:!bg-font-color-crimson dark:text-font-color-white dark:hover:border-font-color-crimson"
            clickHandler={removePlaylists}
          />
        </div>
      )}
    </>
  );
};

export default ConfirmDeletePlaylists;
