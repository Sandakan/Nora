import Button from '@renderer/components/Button';
import Dropdown from '@renderer/components/Dropdown';
import MainContainer from '@renderer/components/MainContainer';
import { Playlist } from '@renderer/components/PlaylistsPage/Playlist';
import VirtualizedGrid from '@renderer/components/VirtualizedGrid';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import useSelectAllHandler from '@renderer/hooks/useSelectAllHandler';
import { store } from '@renderer/store/store';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { lazy, useCallback, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import storage from '@renderer/utils/localStorage';
import { queryClient } from '@renderer/index';
import { playlistQuery } from '@renderer/queries/playlists';
import { playlistSearchSchema } from '@renderer/utils/zod/playlistSchema';
import { playlistSortOptions } from '@renderer/components/PlaylistsPage/PlaylistOptions';
import { useSuspenseQuery } from '@tanstack/react-query';
import Img from '@renderer/components/Img';
import NoPlaylistsImage from '@assets/images/svg/Empty Inbox _Monochromatic.svg';
import SecondaryContainer from '@renderer/components/SecondaryContainer';
import NavLink from '@renderer/components/NavLink';

import favoritesPlaylistCoverImage from '../../../assets/images/webp/favorites-playlist-icon.webp';
import historyPlaylistCoverImage from '../../../assets/images/webp/history-playlist-icon.webp';

export const Route = createFileRoute('/main-player/playlists/')({
  validateSearch: playlistSearchSchema,
  component: PlaylistsPage,
  loaderDeps: ({ search }) => ({
    sortingOrder: search.sortingOrder
  }),
  loader: async ({ deps }) => {
    await queryClient.ensureQueryData(
      playlistQuery.all({
        sortType: deps.sortingOrder || 'aToZ',
        start: 0,
        end: 30
      })
    );
  }
});

const NewPlaylistPrompt = lazy(
  () => import('@renderer/components/PlaylistsPage/NewPlaylistPrompt')
);

const MIN_ITEM_WIDTH = 175;
const MIN_ITEM_HEIGHT = 220;

function PlaylistsPage() {
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);
  const playlistsPageSortingState = useStore(
    store,
    (state) => state.localStorage.sortingStates.playlistsPage
  );
  const { sortingOrder = playlistsPageSortingState || 'aToZ' } = Route.useSearch();
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );

  const { changePromptMenuData, updateContextMenuData, toggleMultipleSelections } =
    useContext(AppUpdateContext);
  const { t } = useTranslation();
  const navigate = useNavigate({ from: Route.fullPath });

  const {
    data: { data: playlists }
  } = useSuspenseQuery(playlistQuery.all({ sortType: sortingOrder }));

  // useEffect(() => {
  //   fetchPlaylistData();
  //   const managePlaylistDataUpdatesInPlaylistsPage = (e: Event) => {
  //     if ('detail' in e) {
  //       const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
  //       for (let i = 0; i < dataEvents.length; i += 1) {
  //         const event = dataEvents[i];
  //         if (event.dataType === 'playlists') fetchPlaylistData();
  //       }
  //     }
  //   };
  //   document.addEventListener('app/dataUpdates', managePlaylistDataUpdatesInPlaylistsPage);
  //   return () => {
  //     document.removeEventListener('app/dataUpdates', managePlaylistDataUpdatesInPlaylistsPage);
  //   };
  // }, [fetchPlaylistData]);

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
          updatePlaylists={() =>
            queryClient.invalidateQueries(
              playlistQuery.all({
                sortType: sortingOrder,
                start: 0,
                end: 0
              })
            )
          }
        />
      ),
    [changePromptMenuData, playlists, sortingOrder]
  );

  return (
    <MainContainer
      className="main-container appear-from-bottom playlists-list-container mb-0 h-full! pb-0!"
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
        <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
          <div className="container flex">
            {t('common.playlist_other')}{' '}
            <div className="other-stats-container text-font-color-black dark:text-font-color-white ml-12 flex items-center text-xs">
              {isMultipleSelectionEnabled ? (
                <div className="text-font-color-highlight dark:text-dark-font-color-highlight text-sm">
                  {t('common.selectionWithCount', {
                    count: multipleSelectionsData.multipleSelections.length
                  })}
                </div>
              ) : (
                <span className="no-of-artists">
                  {t('common.playlistWithCount', { count: playlists.length })}
                </span>
              )}
            </div>
          </div>
          <div className="other-control-container flex">
            <Button
              className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName={isMultipleSelectionEnabled ? 'remove_done' : 'checklist'}
              clickHandler={() => toggleMultipleSelections(!isMultipleSelectionEnabled, 'playlist')}
              tooltipLabel={t(`common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`)}
              isDisabled={playlists.length === 0}
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
                navigate({
                  search: (prev) => ({
                    ...prev,
                    sortingOrder: e.currentTarget.value as PlaylistSortTypes
                  })
                });
              }}
            />
          </div>
        </div>

        {playlists.length > 0 && (
          <div className="playlists-container appear-from-bottom flex h-full flex-wrap delay-100">
            <VirtualizedGrid
              components={{
                Header: () => (
                  <SecondaryContainer className="appear-from-bottom h-fit max-h-full w-full pb-4">
                    <div className="flex gap-4">
                      <NavLink
                        to="/main-player/playlists/favorites"
                        className="bg-background-color-2/70 hover:bg-background-color-2! dark:bg-dark-background-color-2/70 dark:hover:bg-dark-background-color-2! text-font-color dark:text-dark-font-color flex h-24 min-w-60 items-center gap-4 rounded-xl px-4 py-4"
                      >
                        <Img
                          src={favoritesPlaylistCoverImage}
                          className="aspect-square h-full w-auto rounded-lg"
                        />
                        <span className="text-xl">Favorites</span>
                      </NavLink>
                      <NavLink
                        to="/main-player/playlists/history"
                        className="bg-background-color-2/70 hover:bg-background-color-2! dark:bg-dark-background-color-2/70 dark:hover:bg-dark-background-color-2! text-font-color dark:text-dark-font-color flex h-24 min-w-60 items-center gap-4 rounded-xl px-4 py-4"
                      >
                        <Img
                          src={historyPlaylistCoverImage}
                          className="aspect-square h-full w-auto rounded-lg"
                        />
                        <span className="text-xl">History</span>
                      </NavLink>
                    </div>
                  </SecondaryContainer>
                )
              }}
              data={playlists}
              fixedItemWidth={MIN_ITEM_WIDTH}
              fixedItemHeight={MIN_ITEM_HEIGHT}
              onDebouncedScroll={(range) => {
                navigate({
                  replace: true,
                  search: (prev) => ({ ...prev, scrollTopOffset: range.startIndex })
                });
              }}
              itemContent={(index, playlist) => {
                return <Playlist index={index} selectAllHandler={selectAllHandler} {...playlist} />;
              }}
            />
          </div>
        )}
        {playlists.length === 0 && (
          <div className="no-playlists-container text-font-color-black dark:text-font-color-white my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl">
            <Img src={NoPlaylistsImage} alt="" className="mb-8 w-60" />
            <span>{t('playlistsPage.empty')}</span>
          </div>
        )}
      </>
    </MainContainer>
  );
}

