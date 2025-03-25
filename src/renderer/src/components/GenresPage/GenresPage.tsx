/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
import { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../hooks/useSelectAllHandler';
import storage from '../../utils/localStorage';
import i18n from '../../i18n';

import Dropdown, { type DropdownOption } from '../Dropdown';
import MainContainer from '../MainContainer';
import Genre from './Genre';
import Img from '../Img';
import Button from '../Button';

import NoSongsImage from '../../assets/images/svg/Summer landscape_Monochromatic.svg';
import VirtualizedGrid from '../VirtualizedGrid';
import { store } from '@renderer/store';
import { useStore } from '@tanstack/react-store';

const genreSortTypes: DropdownOption<GenreSortTypes>[] = [
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
const MIN_ITEM_WIDTH = 320;
const MIN_ITEM_HEIGHT = 180;

const GenresPage = () => {
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);
  const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);
  const sortingStates = useStore(store, (state) => state.localStorage.sortingStates);

  const { updateCurrentlyActivePageData, toggleMultipleSelections } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [genresData, setGenresData] = useState([] as Genre[] | null);
  const [sortingOrder, setSortingOrder] = useState<GenreSortTypes>(
    (currentlyActivePage?.data?.sortingOrder as GenreSortTypes) ||
      sortingStates?.genresPage ||
      'aToZ'
  );

  const fetchGenresData = useCallback(() => {
    window.api.genresData
      .getGenresData([], sortingOrder)
      .then((genres) => {
        if (genres && genres.length > 0) return setGenresData(genres);
        return setGenresData(null);
      })
      // eslint-disable-next-line no-console
      .catch((err) => console.error(err));
  }, [sortingOrder]);

  useEffect(() => {
    fetchGenresData();
    const manageGenreDataUpdatesInGenresPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'genres') fetchGenresData();
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageGenreDataUpdatesInGenresPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageGenreDataUpdatesInGenresPage);
    };
  }, [fetchGenresData]);

  useEffect(
    () => storage.sortingStates.setSortingStates('genresPage', sortingOrder),
    [sortingOrder]
  );

  const selectAllHandler = useSelectAllHandler(genresData as Genre[], 'genre', 'genreId');

  return (
    <MainContainer
      className="genres-list-container appear-from-bottom h-full! overflow-hidden pb-0! text-font-color-black dark:text-font-color-white"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        {genresData && genresData.length > 0 && (
          <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
            <div className="container flex">
              {t('common.genre_other')}{' '}
              <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
                {isMultipleSelectionEnabled ? (
                  <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                    {t('common.selectionWithCount', {
                      count: multipleSelectionsData.multipleSelections.length
                    })}
                  </div>
                ) : (
                  genresData &&
                  genresData.length > 0 && (
                    <div className="no-of-genres">
                      {t('common.genreWithCount', { count: genresData.length })}
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="other-controls-container flex">
              <Button
                label={t(`common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`)}
                className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName={isMultipleSelectionEnabled ? 'remove_done' : 'checklist'}
                clickHandler={() => toggleMultipleSelections(!isMultipleSelectionEnabled, 'genre')}
              />
              <Dropdown
                name="genreSortDropdown"
                value={sortingOrder}
                options={genreSortTypes}
                onChange={(e) => {
                  updateCurrentlyActivePageData((currentData) => ({
                    ...currentData,
                    sortingOrder: e.currentTarget.value as ArtistSortTypes
                  }));
                  setSortingOrder(e.currentTarget.value as GenreSortTypes);
                }}
              />
            </div>
          </div>
        )}
        <div
          className={`genres-container flex h-full flex-wrap ${!(genresData && genresData.length > 0) && 'hidden'}`}
        >
          {genresData && genresData.length > 0 && (
            <VirtualizedGrid
              data={genresData}
              fixedItemWidth={MIN_ITEM_WIDTH}
              fixedItemHeight={MIN_ITEM_HEIGHT}
              // scrollTopOffset={currentlyActivePage.data?.scrollTopOffset}
              itemContent={(index, genre) => {
                return (
                  <Genre
                    index={index}
                    title={genre.name}
                    songIds={genre.songs.map((song) => song.songId)}
                    selectAllHandler={selectAllHandler}
                    {...genre}
                  />
                );
              }}
            />
          )}
        </div>
        {genresData === null && (
          <div className="no-songs-container my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img src={NoSongsImage} alt="No songs available." className="mb-8 w-60" />
            <span>{t('genresPage.empty')}</span>
          </div>
        )}
      </>
    </MainContainer>
  );
};

export default GenresPage;
