/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/button-has-type */
/* eslint-disable import/prefer-default-export */
import React, { useContext } from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import { Playlist } from './Playlist';
import NewPlaylistPrompt from './NewPlaylistPrompt';
import Button from '../Button';
import MainContainer from '../MainContainer';
import Dropdown from '../Dropdown';

export const PlaylistsPage = () => {
  const {
    currentlyActivePage,
    userData,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
  } = useContext(AppContext);
  const {
    changePromptMenuData,
    updateContextMenuData,
    updatePageSortingOrder,
    updateCurrentlyActivePageData,
    toggleMultipleSelections,
  } = useContext(AppUpdateContext);
  const [playlists, setPlaylists] = React.useState([] as Playlist[]);
  const [sortingOrder, setSortingOrder] = React.useState(
    // eslint-disable-next-line no-nested-ternary
    (currentlyActivePage.data && currentlyActivePage.data.sortingOrder
      ? currentlyActivePage.data.sortingOrder
      : userData && userData.sortingStates.playlistsPage
      ? userData.sortingStates.playlistsPage
      : 'aToZ') as PlaylistSortTypes
  );

  const fetchPlaylistData = React.useCallback(
    () =>
      window.api.getPlaylistData([], sortingOrder).then((res) => {
        if (res && res.length > 0) setPlaylists(res);
      }),
    [sortingOrder]
  );

  React.useEffect(() => {
    fetchPlaylistData();
    const managePlaylistDataUpdatesInPlaylistsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'playlists') fetchPlaylistData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      managePlaylistDataUpdatesInPlaylistsPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        managePlaylistDataUpdatesInPlaylistsPage
      );
    };
  }, [fetchPlaylistData]);

  React.useEffect(() => {
    updatePageSortingOrder('sortingStates.playlistsPage', sortingOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortingOrder]);

  const playlistComponents = React.useMemo(
    () =>
      playlists.length > 0
        ? playlists.map((playlist, index) => {
            return (
              <Playlist
                index={index}
                name={playlist.name}
                createdDate={playlist.createdDate}
                playlistId={playlist.playlistId}
                songs={playlist.songs}
                isArtworkAvailable={playlist.isArtworkAvailable}
                artworkPaths={playlist.artworkPaths}
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
        />
      ),
    [changePromptMenuData, playlists]
  );

  return (
    <MainContainer
      className="main-container appear-from-bottom playlists-list-container mb-0 !h-full"
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
        <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          <div className="container flex">
            Playlists{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
              {isMultipleSelectionEnabled ? (
                <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                  {multipleSelectionsData.multipleSelections.length} selections
                </div>
              ) : (
                playlists.length > 0 && (
                  <span className="no-of-artists">{`${
                    playlists.length
                  } playlist${playlists.length === 1 ? '' : 's'}`}</span>
                )
              )}
            </div>
          </div>
          {playlists.length > 0 && (
            <div className="other-control-container flex">
              <Button
                className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName={
                  isMultipleSelectionEnabled ? 'remove_done' : 'checklist'
                }
                clickHandler={() =>
                  toggleMultipleSelections(
                    !isMultipleSelectionEnabled,
                    'playlist'
                  )
                }
                tooltipLabel={
                  isMultipleSelectionEnabled ? 'Unselect All' : 'Select'
                }
              />
              <Button
                label="Add New Playlist"
                className="add-new-playlist-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="add"
                clickHandler={createNewPlaylist}
              />
              <Dropdown
                name="playlistsSortDropdown"
                value={sortingOrder}
                options={
                  [
                    { label: 'A to Z', value: 'aToZ' },
                    { label: 'Z to A', value: 'zToA' },
                    { label: 'High Song Count', value: 'noOfSongsDescending' },
                    { label: 'Low Song Count', value: 'noOfSongsAscending' },
                  ] as { label: string; value: ArtistSortTypes }[]
                }
                onChange={(e) => {
                  const playlistSortType = e.currentTarget
                    .value as PlaylistSortTypes;
                  updateCurrentlyActivePageData((currentData) => ({
                    ...currentData,
                    sortingOrder: playlistSortType,
                  }));
                  setSortingOrder(playlistSortType);
                }}
              />
            </div>
          )}
        </div>
        {playlists.length > 1 ? (
          <div className="playlists-container flex h-full flex-wrap">
            {playlistComponents}
          </div>
        ) : (
          <div className="no-playlists-container p-20 text-center text-font-color-black dark:text-font-color-white">
            No playlists found.
          </div>
        )}
      </>
    </MainContainer>
  );
};
