import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import { store } from '@renderer/store/store';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import storage from '@renderer/utils/localStorage';
import useSelectAllHandler from '@renderer/hooks/useSelectAllHandler';
import MainContainer from '@renderer/components/MainContainer';
import Button from '@renderer/components/Button';
import Dropdown from '@renderer/components/Dropdown';
import VirtualizedGrid from '@renderer/components/VirtualizedGrid';
import Genre from '@renderer/components/GenresPage/Genre';
import NoSongsImage from '@assets/images/svg/Summer landscape_Monochromatic.svg';
import Img from '@renderer/components/Img';
import { genreSortOptions } from '@renderer/components/GenresPage/genreOptions';
import { genreSearchSchema } from '@renderer/utils/zod/genreSchema';
import { queryClient } from '@renderer/index';
import { genreQuery } from '@renderer/queries/genres';
import { useSuspenseQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/main-player/genres/')({
  validateSearch: genreSearchSchema,
  component: GenresPage,
  loaderDeps: ({ search }) => ({
    sortingOrder: search.sortingOrder
  }),
  loader: async ({ deps }) => {
    await queryClient.ensureQueryData(
      genreQuery.all({
        sortType: deps.sortingOrder || 'aToZ',
        start: 0,
        end: 30
      })
    );
  }
});

const MIN_ITEM_WIDTH = 320;
const MIN_ITEM_HEIGHT = 180;

function GenresPage() {
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);

  const { toggleMultipleSelections } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const genresPageSortingState = useStore(
    store,
    (state) => state.localStorage.sortingStates.genresPage
  );
  const { sortingOrder = genresPageSortingState || 'aToZ' } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const {
    data: { data: genresData }
  } = useSuspenseQuery(genreQuery.all({ sortType: sortingOrder }));

  // useEffect(() => {
  //   fetchGenresData();
  //   const manageGenreDataUpdatesInGenresPage = (e: Event) => {
  //     if ('detail' in e) {
  //       const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
  //       for (let i = 0; i < dataEvents.length; i += 1) {
  //         const event = dataEvents[i];
  //         if (event.dataType === 'genres') fetchGenresData();
  //       }
  //     }
  //   };
  //   document.addEventListener('app/dataUpdates', manageGenreDataUpdatesInGenresPage);
  //   return () => {
  //     document.removeEventListener('app/dataUpdates', manageGenreDataUpdatesInGenresPage);
  //   };
  // }, [fetchGenresData]);

  useEffect(
    () => storage.sortingStates.setSortingStates('genresPage', sortingOrder),
    [sortingOrder]
  );

  const selectAllHandler = useSelectAllHandler(genresData as Genre[], 'genre', 'genreId');

  return (
    <MainContainer
      className="genres-list-container appear-from-bottom text-font-color-black dark:text-font-color-white h-full! overflow-hidden pb-0!"
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
          <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
            <div className="container flex">
              {t('common.genre_other')}{' '}
              <div className="other-stats-container text-font-color-black dark:text-font-color-white ml-12 flex items-center text-xs">
                {isMultipleSelectionEnabled ? (
                  <div className="text-font-color-highlight dark:text-dark-font-color-highlight text-sm">
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
                options={genreSortOptions}
                onChange={(e) => {
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      sortingOrder: e.currentTarget.value as GenreSortTypes
                    })
                  });
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
              onDebouncedScroll={(range) => {
                navigate({
                  replace: true,
                  search: (prev) => ({ ...prev, scrollTopOffset: range.startIndex })
                });
              }}
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
          <div className="no-songs-container text-font-color-black dark:text-font-color-white my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl">
            <Img src={NoSongsImage} alt="No songs available." className="mb-8 w-60" />
            <span>{t('genresPage.empty')}</span>
          </div>
        )}
      </>
    </MainContainer>
  );
}

