/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/button-has-type */
/* eslint-disable import/prefer-default-export */
import React, { useContext } from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppContext';
import { Playlist } from './Playlist';
import NewPlaylistPrompt from './NewPlaylistPrompt';
import Button from '../Button';
import MainContainer from '../MainContainer';

export const PlaylistsPage = () => {
  const { changePromptMenuData, updateContextMenuData } =
    useContext(AppUpdateContext);
  const [playlists, setPlaylists] = React.useState([] as Playlist[]);

  const fetchPlaylistData = React.useCallback(
    () =>
      window.api.getPlaylistData([]).then((res) => {
        if (res && res.length > 0) setPlaylists(res);
      }),
    []
  );

  React.useEffect(() => {
    const managePlaylistDataUpdates = (
      _: unknown,
      event: DataUpdateEventTypes
    ) => {
      if (event === 'playlists') fetchPlaylistData();
    };
    window.api.dataUpdateEvent(managePlaylistDataUpdates);
    fetchPlaylistData();
    return () => {
      window.api.removeDataUpdateEventListener(managePlaylistDataUpdates);
    };
  }, [fetchPlaylistData]);

  const playlistComponents = React.useMemo(
    () =>
      playlists.length > 0
        ? playlists.map((playlist) => {
            return (
              <Playlist
                name={playlist.name}
                createdDate={playlist.createdDate}
                playlistId={playlist.playlistId}
                songs={playlist.songs}
                artworkPath={playlist.artworkPath}
                key={playlist.playlistId}
              />
            );
          })
        : [],
    [playlists]
  );

  const createNewPlaylist = React.useCallback(
    () =>
      changePromptMenuData(
        true,
        <NewPlaylistPrompt
          currentPlaylists={playlists}
          updatePlaylists={(newPlaylists) => setPlaylists(newPlaylists)}
        />,
        'flex flex-col items-center'
      ),
    [changePromptMenuData, playlists]
  );

  return (
    <MainContainer
      className="main-container playlists-list-container h-full mb-0"
      onContextMenu={(e) =>
        updateContextMenuData(
          true,
          [
            {
              label: 'Create New Playlist',
              handlerFunction: createNewPlaylist,
              iconName: 'add',
            },
          ],
          e.pageX,
          e.pageY
        )
      }
    >
      <>
        <div className="title-container mt-1 mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
          Playlists
        </div>
        {playlists.length > 1 ? (
          <div className="playlists-container h-full flex flex-wrap">
            {playlistComponents}
          </div>
        ) : (
          <div className="no-playlists-container p-20 text-center">
            No playlists found.
          </div>
        )}
        <Button
          label="Add New Playlist"
          className="add-new-playlist-btn appear-from-bottom absolute w-fit px-5 py-3 text-xl flex items-center right-8 bottom-8 rounded-2xl text-font-color-black dark:text-font-color-black !bg-background-color-3 dark:!bg-background-color-3 !border-[transparent] pointer shadow-md transition-[box_shadow,border] hover:shadow-lg focus:shadow-lg"
          iconName="add"
          clickHandler={createNewPlaylist}
        />
      </>
    </MainContainer>
  );
};
