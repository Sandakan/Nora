import { useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';
import Img from '../Img';
import RecentSearchResult from './RecentSearchResult';

import SearchSomethingImage from '../../assets/images/svg/Flying kite_Monochromatic.svg';
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { queryClient } from '@renderer/index';
import { searchQuery } from '@renderer/queries/search';

type Props = {
  searchInput: string;
  searchResults?: SearchResult;

  updateSearchInput: (input: string) => void;
};

const recentSearchResultsQueryOptions = queryOptions(searchQuery.recentResults);

const SearchStartPlaceholder = (props: Props) => {
  const { updateCurrentlyActivePageData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { searchResults, searchInput, updateSearchInput } = props;

  const { data: recentSearchResults } = useSuspenseQuery(recentSearchResultsQueryOptions);

  useEffect(() => {
    const manageSearchResultsUpdatesInSearchPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'userData/recentSearches')
            queryClient.invalidateQueries(recentSearchResultsQueryOptions);
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageSearchResultsUpdatesInSearchPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageSearchResultsUpdatesInSearchPage);
    };
  }, []);

  const recentSearchResultComponents = useMemo(
    () =>
      recentSearchResults.length > 0
        ? recentSearchResults.map((result, index) => (
            <RecentSearchResult
              key={index}
              result={result}
              clickHandler={() => {
                updateSearchInput(result);
                updateCurrentlyActivePageData((currentData) => ({
                  ...currentData,
                  keyword: result
                }));
              }}
            />
          ))
        : [],
    [recentSearchResults, updateCurrentlyActivePageData, updateSearchInput]
  );

  return (
    <>
      {searchInput.trim() === '' && (
        <div className="search-start-placeholder active appear-from-bottom relative flex h-full! w-full flex-col items-center justify-center text-center">
          <Img
            src={SearchSomethingImage}
            className={
              searchResults?.songs.length === 0 &&
              searchResults?.artists.length === 0 &&
              searchResults?.albums.length === 0 &&
              searchResults?.playlists.length === 0 &&
              searchResults?.genres.length === 0 &&
              searchInput.trim() === ''
                ? 'mb-4 w-60 max-w-full'
                : ''
            }
            alt=""
          />

          <div className="description text-font-color-black dark:text-font-color-white text-xl">
            {t('searchPage.searchForAnythingInLibrary')}
          </div>
          <div className="recent-search-results-container mt-4 flex w-[clamp(12.5rem,90%,50rem)] flex-wrap items-center justify-center">
            {recentSearchResultComponents}
          </div>
          {recentSearchResultComponents.length > 0 && (
            <Button
              label="clear search history"
              className="text-font-color-highlight! dark:text-dark-font-color-highlight/75! m-0! mt-4! rounded-none! border-0! p-0! outline-offset-1 hover:underline focus-visible:outline!"
              clickHandler={(_, setIsDisabled) => {
                setIsDisabled(true);
                window.api.search.clearSearchHistory().catch((err) => {
                  setIsDisabled(false);
                  console.warn(err);
                });
              }}
              pendingAnimationOnDisabled
              pendingClassName="mr-2"
            />
          )}
        </div>
      )}
    </>
  );
};

export default SearchStartPlaceholder;
