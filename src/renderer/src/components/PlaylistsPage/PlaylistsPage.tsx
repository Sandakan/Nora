import { lazy, useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';
import storage from '../../utils/localStorage';
import i18n from '../../i18n';

import { Playlist } from './Playlist';
import Button from '../Button';
import MainContainer from '../MainContainer';
import Dropdown, { DropdownOption } from '../Dropdown';
import VirtualizedGrid from '../VirtualizedGrid';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const NewPlaylistPrompt = lazy(() => import('./NewPlaylistPrompt'));

const playlistSortOptions: DropdownOption<PlaylistSortTypes>[] = [
  { label: i18n.t('sortTypes.aToZ'), value: 'aToZ' },
  { label: i18n.t('sortTypes.zToA'), value: 'zToA' },
  {
    label: i18n.t('sortTypes.noOfSongsDescending'),
    value: 'noOfSongsDescending'
  },
  {
    label: i18n.t('sortTypes.noOfSongsAscending'),
    value: 'noOfSongsAscending'
  }
];

const MIN_ITEM_WIDTH = 175;
const MIN_ITEM_HEIGHT = 220;

const PlaylistsPage = () => {
  const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);
  const sortingStates = useStore(store, (state) => state.localStorage.sortingStates);
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );

  const {
    changePromptMenuData,
    updateContextMenuData,
    updateCurrentlyActivePageData,
    toggleMultipleSelections
  } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [playlists, setPlaylists] = useState([] as Playlist[]);
  const [sortingOrder, setSortingOrder] = useState<PlaylistSortTypes>(
    (currentlyActivePage?.data?.sortingOrder as PlaylistSortTypes) ||
      sortingStates?.playlistsPage ||
      'aToZ'
  );

  const fetchPlaylistData = useCallback(
    () =>
      window.api.playlistsData.getPlaylistData([], sortingOrder).then((res) => {
        if (res && res.length > 0) setPlaylists(res);
        return undefined;
      }),
    [sortingOrder]
  );

  useEffect(() => {
    fetchPlaylistData();
    const managePlaylistDataUpdatesInPlaylistsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'playlists') fetchPlaylistData();
        }
      }
    };
    document.addEventListener('app/dataUpdates', managePlaylistDataUpdatesInPlaylistsPage);
    return () => {
      document.removeEventListener('app/dataUpdates', managePlaylistDataUpdatesInPlaylistsPage);
    };
  }, [fetchPlaylistData]);

  useEffect(() => {
    storage.sortingStates.setSortingStates('playlistsPage', sortingOrder);
  }, [sortingOrder]);

  const selectAllHandler = useSelectAllHandler(playlists, 'playlist', 'playlistId');

  const createNewPlaylist = useCallback(
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
      className="main-container appear-from-bottom playlists-list-container mb-0 !h-full !pb-0"
      onContextMenu={(e) =>
        updateContextMenuData(
          true,
          [
            {
              label: t('playlistsPage.createNewPlaylist'),
              handlerFunction: createNewPlaylist,
              iconName: 'add'
            },
            {
              label: t('playlistsPage.importPlaylist'),
              iconName: 'publish',
              handlerFunction: () =>
                window.api.playlistsData.importPlaylist().catch((err) => console.error(err))
            }
          ],
          e.pageX,
          e.pageY
        )
      }
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          <div className="container flex">
            {t('common.playlist_other')}{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
              {isMultipleSelectionEnabled ? (
                <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                  {t('common.selectionWithCount', {
                    count: multipleSelectionsData.multipleSelections.length
                  })}
                </div>
              ) : (
                playlists.length > 0 && (
                  <span className="no-of-artists">
                    {t('common.playlistWithCount', { count: playlists.length })}
                  </span>
                )
              )}
            </div>
          </div>
          {playlists.length > 0 && (
            <div className="other-control-container flex">
              <Button
                className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName={isMultipleSelectionEnabled ? 'remove_done' : 'checklist'}
                clickHandler={() =>
                  toggleMultipleSelections(!isMultipleSelectionEnabled, 'playlist')
                }
                tooltipLabel={t(`common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`)}
              />
              <Button
                label={t(`playlistsPage.importPlaylist`)}
                className="import-playlist-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="publish"
                clickHandler={(_, setIsDisabled, setIsPending) => {
                  setIsDisabled(true);
                  setIsPending(true);

                  return window.api.playlistsData
                    .importPlaylist()
                    .finally(() => {
                      setIsDisabled(false);
                      setIsPending(false);
                    })
                    .catch((err) => console.error(err));
                }}
              />
              <Button
                label={t(`playlistsPage.addPlaylist`)}
                className="add-new-playlist-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName="add"
                clickHandler={createNewPlaylist}
              />
              <Dropdown
                name="playlistsSortDropdown"
                value={sortingOrder}
                options={playlistSortOptions}
                onChange={(e) => {
                  const playlistSortType = e.currentTarget.value as PlaylistSortTypes;
                  updateCurrentlyActivePageData((currentData) => ({
                    ...currentData,
                    sortingOrder: playlistSortType
                  }));
                  setSortingOrder(playlistSortType);
                }}
              />
            </div>
          )}
        </div>

        <div className="playlists-container appear-from-bottom flex h-full flex-wrap delay-100">
          {playlists && playlists.length > 0 && (
            <VirtualizedGrid
              data={playlists}
              fixedItemWidth={MIN_ITEM_WIDTH}
              fixedItemHeight={MIN_ITEM_HEIGHT}
              scrollTopOffset={currentlyActivePage.data?.scrollTopOffset}
              itemContent={(index, playlist) => {
                return <Playlist index={index} selectAllHandler={selectAllHandler} {...playlist} />;
              }}
            />
          )}
        </div>
      </>
    </MainContainer>
  );
};

export default PlaylistsPage;
