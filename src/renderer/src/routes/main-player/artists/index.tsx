import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import { store } from '@renderer/store/store';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import storage from '@renderer/utils/localStorage';
import useSelectAllHandler from '@renderer/hooks/useSelectAllHandler';
import MainContainer from '@renderer/components/MainContainer';
import Button from '@renderer/components/Button';
import Dropdown from '@renderer/components/Dropdown';
import VirtualizedGrid from '@renderer/components/VirtualizedGrid';
import { Artist } from '@renderer/components/ArtistPage/Artist';

import NoArtistImage from '@assets/images/svg/Sun_Monochromatic.svg';
import { zodValidator } from '@tanstack/zod-adapter';
import { artistSearchSchema } from '@renderer/utils/zod/artistSchema';
import {
  artistFilterOptions,
  artistSortOptions
} from '@renderer/components/ArtistPage/ArtistOptions';
import Img from '@renderer/components/Img';

export const Route = createFileRoute('/main-player/artists/')({
  validateSearch: zodValidator(artistSearchSchema),
  component: ArtistPage
});

const MIN_ITEM_WIDTH = 175;
const MIN_ITEM_HEIGHT = 200;

function ArtistPage() {
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);
  const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);
  const sortingStates = useStore(store, (state) => state.localStorage.sortingStates);

  const { updateCurrentlyActivePageData, toggleMultipleSelections } = useContext(AppUpdateContext);
  const { scrollTopOffset, sortingOrder = sortingStates?.artistsPage || 'aToZ' } =
    Route.useSearch();
  const { t } = useTranslation();
  const navigate = useNavigate({ from: Route.fullPath });

  const [artistsData, setArtistsData] = useState([] as Artist[]);
  const [filteringOrder, setFilteringOrder] = useState<ArtistFilterTypes>('notSelected');

  const fetchArtistsData = useCallback(
    () =>
      window.api.artistsData
        .getArtistData([], sortingOrder as ArtistSortTypes, filteringOrder)
        .then((res) => res.data)
        .then((res) => {
          if (res && Array.isArray(res)) {
            if (res.length > 0) return setArtistsData(res);
            return setArtistsData([]);
          }
          return undefined;
        }),
    [filteringOrder, sortingOrder]
  );

  useEffect(() => {
    fetchArtistsData();
    const manageArtistDataUpdatesInArtistsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'artists/likes' && event.dataType.length > 1) fetchArtistsData();
          if (event.dataType === 'artists') fetchArtistsData();
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageArtistDataUpdatesInArtistsPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageArtistDataUpdatesInArtistsPage);
    };
  }, [fetchArtistsData]);

  useEffect(() => {
    storage.sortingStates.setSortingStates('artistsPage', sortingOrder);
  }, [sortingOrder]);

  const selectAllHandler = useSelectAllHandler(artistsData, 'artist', 'artistId');

  console.log('offset', currentlyActivePage?.data);
  return (
    <MainContainer
      className="appear-from-bottom artists-list-container h-full! overflow-hidden pb-0!"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        {artistsData.length > 0 && (
          <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
            <div className="container flex">
              {t('common.artist_other')}{' '}
              <div className="other-stats-container text-font-color-black dark:text-font-color-white ml-12 flex items-center text-xs">
                {isMultipleSelectionEnabled ? (
                  <div className="text-font-color-highlight dark:text-dark-font-color-highlight text-sm">
                    {t('common.selectionWithCount', {
                      count: multipleSelectionsData.multipleSelections.length
                    })}
                  </div>
                ) : (
                  artistsData &&
                  artistsData.length > 0 && (
                    <span className="no-of-artists">
                      {t('common.artistWithCount', {
                        count: artistsData.length
                      })}
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="other-control-container flex">
              <Button
                label={t(`common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`)}
                className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName={isMultipleSelectionEnabled ? 'remove_done' : 'checklist'}
                clickHandler={() => toggleMultipleSelections(!isMultipleSelectionEnabled, 'artist')}
              />
              <Dropdown
                name="artistPageFilterDropdown"
                type={`${t('common.filterBy')} :`}
                value={filteringOrder}
                options={artistFilterOptions}
                onChange={(e) => {
                  updateCurrentlyActivePageData((currentPageData) => ({
                    ...currentPageData,
                    filteringOrder: e.currentTarget.value as ArtistFilterTypes
                  }));
                  setFilteringOrder(e.currentTarget.value as ArtistFilterTypes);
                }}
              />
              <Dropdown
                name="artistsSortDropdown"
                type={`${t('common.sortBy')} :`}
                value={sortingOrder}
                options={artistSortOptions}
                onChange={(e) => {
                  const artistSortType = e.currentTarget.value as ArtistSortTypes;
                  updateCurrentlyActivePageData((currentData) => ({
                    ...currentData,
                    sortingOrder: artistSortType
                  }));
                  navigate({
                    search: (prev) => ({ ...prev, sortingOrder: artistSortType })
                  });
                }}
              />
            </div>
          </div>
        )}
        <div
          className={`artists-container flex h-full! flex-wrap ${!(artistsData && artistsData.length > 0) && 'hidden'}`}
        >
          {artistsData && artistsData.length > 0 && (
            <VirtualizedGrid
              data={artistsData}
              fixedItemWidth={MIN_ITEM_WIDTH}
              fixedItemHeight={MIN_ITEM_HEIGHT}
              scrollTopOffset={scrollTopOffset}
              itemContent={(index, artist) => {
                return (
                  <Artist
                    index={index}
                    key={artist.artistId}
                    className="mb-4"
                    songIds={artist.songs.map((song) => song.songId)}
                    selectAllHandler={selectAllHandler}
                    appearFromBottom={false}
                    {...artist}
                  />
                );
              }}
            />
          )}
        </div>
        {/* {artistsData && artistsData.length === 0 && (
          <div className="no-songs-container my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img
              src={FetchingDataImage}
              alt="No songs available."
              className="mb-8 w-60"
            />
            <div>What about a Lemonade? They are cool, right ?</div>
          </div>
        )} */}
        {artistsData && artistsData.length === 0 && (
          <div className="no-songs-container text-font-color-black dark:text-font-color-white my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl">
            <Img src={NoArtistImage} alt="Sun in a desert" className="mb-8 w-60" />
            <div>{t('artistsPage.empty')}</div>
          </div>
        )}
      </>
    </MainContainer>
  );
}
