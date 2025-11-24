import Button from '@renderer/components/Button';
import MainContainer from '@renderer/components/MainContainer';
import { searchFilter } from '@renderer/components/SearchPage/SearchOptions';
import SearchResultsFilter from '@renderer/components/SearchPage/SearchResultsFilter';
import useResizeObserver from '@renderer/hooks/useResizeObserver';
import { store } from '@renderer/store/store';
import { searchPageSchema } from '@renderer/utils/zod/searchPageSchema';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import storage from '@renderer/utils/localStorage';
import { useThrottledCallback } from '@tanstack/react-pacer';

import GenreSearchResultsContainer from '@renderer/components/SearchPage/Result_Containers/GenreSearchResultsContainer';
import PlaylistSearchResultsContainer from '@renderer/components/SearchPage/Result_Containers/PlaylistSearchResultsContainer';
import AlbumSearchResultsContainer from '@renderer/components/SearchPage/Result_Containers/AlbumSearchResultsContainer';
import SongSearchResultsContainer from '@renderer/components/SearchPage/Result_Containers/SongSearchResultsContainer';
import MostRelevantSearchResultsContainer from '@renderer/components/SearchPage/Result_Containers/MostRelevantSearchResultsContainer';
import ArtistsSearchResultsContainer from '@renderer/components/SearchPage/Result_Containers/ArtistsSearchResultsContainer';
import NoSearchResultsContainer from '@renderer/components/SearchPage/NoSearchResultsContainer';
import SearchStartPlaceholder from '@renderer/components/SearchPage/SearchStartPlaceholder';
import { searchQuery } from '@renderer/queries/search';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/main-player/search/')({
  validateSearch: searchPageSchema,
  component: SearchPage
  // loaderDeps: ({ search }) => ({ search }),
  // loader: ({ deps }) => {
  //   const { search } = deps;

  // if ((search.keyword ?? '').trim().length === 0) return;
  // return queryClient.ensureQueryData(
  //   searchQuery.query({
  //     keyword: search.keyword ?? '',
  //     filter: search.filterBy ?? 'all',
  //     isSimilaritySearchEnabled: search.isSimilaritySearchEnabled ?? false,
  //     updateSearchHistory: true
  //   })
  // );
  // }
});

const ARTIST_WIDTH = 175;
const ALBUM_WIDTH = 210;
const PLAYLIST_WIDTH = 160;
const GENRE_WIDTH = 300;

function SearchPage() {
  const isSimilaritySearchEnabledInLocalStorage = useStore(
    store,
    (state) => state.localStorage.preferences.isSimilaritySearchEnabled
  );

  const { t } = useTranslation();
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    keyword,
    isSimilaritySearchEnabled = isSimilaritySearchEnabledInLocalStorage,
    filterBy
  } = Route.useSearch();

  const searchContainerRef = useRef(null);
  const { width } = useResizeObserver(searchContainerRef);
  const [searchText, setSearchText] = useState(keyword);

  const { data: searchResults } = useQuery({
    ...searchQuery.query({
      keyword: keyword ?? '',
      filter: filterBy ?? 'all',
      isSimilaritySearchEnabled
    }),
    enabled: (keyword ?? '').trim().length > 0
  });

  const throttledSetSearch = useThrottledCallback(
    (value) => {
      navigate({ search: (prev) => ({ ...prev, keyword: value }), replace: true });
    },
    {
      wait: 1000
    }
  );

  const updateSearchInput = (input: string) => {
    const value = input ?? '';
    setSearchText(value);

    throttledSetSearch(value);
  };

  const { noOfArtists, noOfPlaylists, noOfAlbums, noOfGenres } = useMemo(() => {
    return {
      noOfPlaylists: Math.floor(width / PLAYLIST_WIDTH) || 4,
      noOfArtists: Math.floor(width / ARTIST_WIDTH) || 5,
      noOfAlbums: Math.floor(width / ALBUM_WIDTH) || 4,
      noOfGenres: Math.floor(width / GENRE_WIDTH) || 3
    };
  }, [width]);

  const filters = useMemo(
    () =>
      searchFilter.map((filter) => {
        return (
          <SearchResultsFilter
            key={filter.value}
            label={filter.label}
            icon={filter.icon}
            value={filter.value}
            isCurrentActiveFilter={filter.value === filterBy}
            changeActiveFilter={(filterType) =>
              navigate({ search: (prev) => ({ ...prev, filterBy: filterType }) })
            }
          />
        );
      }),
    [filterBy, navigate]
  );

  return (
    <MainContainer className="h-full! pb-0! [scrollbar-gutter:stable]" ref={searchContainerRef}>
      <div className="search-controls-container">
        <div className="search-input-container appear-from-bottom mb-4 flex items-center">
          <div className="search-bar-container bg-background-color-2 dark:bg-dark-background-color-2 flex w-1/2 max-w-xl min-w-[25rem] items-center rounded-3xl px-2 py-1">
            <Button
              className={`my-1! mr-2! ml-1! rounded-3xl! border-none px-4! py-2! shadow-sm outline-offset-1 focus-visible:outline! ${
                isSimilaritySearchEnabled
                  ? 'bg-background-color-3 dark:bg-dark-background-color-3 text-black!'
                  : 'bg-background-color-1/50 text-font-color-highlight! hover:bg-background-color-1 focus-visible:bg-background-color-1 dark:bg-dark-background-color-1/50 dark:text-dark-font-color-highlight! dark:hover:bg-dark-background-color-1 dark:focus-visible:bg-dark-background-color-1'
              }`}
              iconName={isSimilaritySearchEnabled ? 'auto_fix' : 'auto_fix_off'}
              tooltipLabel={t(
                `searchPage.${
                  isSimilaritySearchEnabled ? 'disablePredictiveSearch' : 'enablePredictiveSearch'
                }`
              )}
              iconClassName="material-icons-round-outlined"
              clickHandler={() => {
                storage.preferences.setPreferences(
                  'isSimilaritySearchEnabled',
                  !isSimilaritySearchEnabled
                );
                navigate({
                  search: (prev) => ({
                    ...prev,
                    isSimilaritySearchEnabled: !isSimilaritySearchEnabled
                  })
                });
              }}
            />
            {/* SEARCH INPUT */}
            <input
              type="search"
              name="search"
              id="searchBar"
              className="text-font-color-black placeholder:text-font-color-highlight dark:text-font-color-white dark:placeholder:text-dark-font-color-highlight h-full w-full border-2 border-[transparent] bg-[transparent] outline-hidden"
              aria-label="Search"
              placeholder={t('searchPage.searchForAnything')}
              value={searchText}
              onChange={(e) => updateSearchInput(e.currentTarget.value)}
              onKeyDown={(e) => e.stopPropagation()}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>
          <span
            className="material-icons-round-outlined text-font-color-highlight dark:text-dark-font-color-highlight ml-4 cursor-help text-2xl"
            title={t('searchPage.separateKeywords')}
          >
            help
          </span>
        </div>
        {/* SEARCH FILTERS */}
        <div className="search-filters-container mb-6">
          <ul className="flex items-center">{filters}</ul>
        </div>
      </div>
      <div className="search-results-container relative h-full!">
        {searchResults && (
          <>
            {/* MOST RELEVANT SEARCH RESULTS */}
            <MostRelevantSearchResultsContainer searchResults={searchResults} />
            {/* SONG SEARCH RESULTS */}
            <SongSearchResultsContainer
              songs={searchResults.songs}
              searchInput={keyword}
              isSimilaritySearchEnabled={isSimilaritySearchEnabled}
            />
            {/* ARTIST SEARCH RESULTS */}
            <ArtistsSearchResultsContainer
              artists={searchResults.artists}
              searchInput={keyword}
              noOfVisibleArtists={noOfArtists}
              isSimilaritySearchEnabled={isSimilaritySearchEnabled}
            />
            {/* ALBUM SEARCH RESULTS */}
            <AlbumSearchResultsContainer
              albums={searchResults.albums}
              searchInput={keyword}
              noOfVisibleAlbums={noOfAlbums}
              isSimilaritySearchEnabled={isSimilaritySearchEnabled}
            />
            {/* PLAYLIST SEARCH RESULTS */}
            <PlaylistSearchResultsContainer
              playlists={searchResults.playlists}
              searchInput={keyword}
              noOfVisiblePlaylists={noOfPlaylists}
              isSimilaritySearchEnabled={isSimilaritySearchEnabled}
            />
            {/* GENRE SEARCH RESULTS */}
            <GenreSearchResultsContainer
              genres={searchResults.genres}
              searchInput={keyword}
              noOfVisibleGenres={noOfGenres}
              isSimilaritySearchEnabled={isSimilaritySearchEnabled}
            />
            {/* NO SEARCH RESULTS PLACEHOLDER */}
            <NoSearchResultsContainer
              searchInput={keyword}
              searchResults={searchResults}
              updateSearchInput={updateSearchInput}
            />
          </>
        )}
        {/* SEARCH START PLACEHOLDER */}
        <SearchStartPlaceholder
          searchResults={searchResults}
          searchInput={keyword}
          updateSearchInput={updateSearchInput}
        />
      </div>
    </MainContainer>
  );
}

