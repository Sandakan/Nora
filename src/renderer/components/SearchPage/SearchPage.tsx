/* eslint-disable jsx-a11y/no-autofocus */
/* eslint-disable react/no-array-index-key */
import React, { useContext } from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import SearchResultsFilter from './SearchResultsFilter';
import MainContainer from '../MainContainer';
import GenreSearchResultsContainer from './Result_Containers/GenreSearchResultsContainer';
import PlaylistSearchResultsContainer from './Result_Containers/PlaylistSearchResultsContainer';
import AlbumSearchResultsContainer from './Result_Containers/AlbumSearchResultsContainer';
import SongSearchResultsContainer from './Result_Containers/SongSearchResultsContainer';
import MostRelevantSearchResultsContainer from './Result_Containers/MostRelevantSearchResultsContainer';
import ArtistsSearchResultsContainer from './Result_Containers/ArtistsSearchResultsContainer';
import NoSearchResultsContainer from './NoSearchResultsContainer';
import SearchStartPlaceholder from './SearchStartPlaceholder';

const filterTypes = 'All Songs Albums Artists Playlists Genres'.split(
  ' '
) as SearchFilters[];

const SearchPage = () => {
  const { currentlyActivePage } = useContext(AppContext);
  const { updateCurrentlyActivePageData } = React.useContext(AppUpdateContext);

  const [searchInput, setSearchInput] = React.useState(
    currentlyActivePage?.data?.keyword
      ? (currentlyActivePage.data.keyword as string)
      : ''
  );
  const deferredSearchInput = React.useDeferredValue(searchInput);
  const [searchResults, setSearchResults] = React.useState({
    albums: [],
    artists: [],
    songs: [],
    playlists: [],
    genres: [],
    availableResults: [],
  } as SearchResult);
  const [activeFilter, setActiveFilter] = React.useState(
    'All' as SearchFilters
  );

  const changeActiveFilter = React.useCallback(
    (filterType: SearchFilters) => setActiveFilter(filterType),
    []
  );

  const filters = filterTypes.map((filterType, index) => {
    return (
      <SearchResultsFilter
        key={index}
        filterType={filterType}
        isCurrentActiveFilter={filterType === activeFilter}
        changeActiveFilter={changeActiveFilter}
      />
    );
  });

  const timeOutIdRef = React.useRef(undefined as NodeJS.Timer | undefined);
  const fetchSearchResults = React.useCallback(() => {
    if (deferredSearchInput !== '') {
      if (timeOutIdRef.current) clearTimeout(timeOutIdRef.current);
      timeOutIdRef.current = setTimeout(
        () =>
          window.api
            .search(activeFilter, deferredSearchInput)
            .then((results) => {
              return setSearchResults(results);
            }),
        250
      );
    } else
      setSearchResults({
        albums: [],
        artists: [],
        songs: [],
        playlists: [],
        genres: [],
        availableResults: [],
      });
  }, [activeFilter, deferredSearchInput, timeOutIdRef]);

  React.useEffect(() => {
    fetchSearchResults();
    const manageSearchResultsUpdatesInSearchPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'songs' ||
            event.dataType === 'artists' ||
            event.dataType === 'albums' ||
            event.dataType === 'playlists/newPlaylist' ||
            event.dataType === 'playlists/deletedPlaylist' ||
            event.dataType === 'genres/newGenre' ||
            event.dataType === 'genres/deletedGenre'
          )
            fetchSearchResults();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageSearchResultsUpdatesInSearchPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSearchResultsUpdatesInSearchPage
      );
    };
  }, [fetchSearchResults]);

  const updateSearchInput = React.useCallback(
    (input: string) => setSearchInput(input),
    []
  );

  return (
    <MainContainer>
      <>
        <div className="search-bar-container appear-from-bottom mb-4 flex w-1/2 items-center rounded-3xl bg-background-color-2 py-1 px-2 dark:bg-dark-background-color-2">
          <span
            className="material-icons-round icon flex cursor-help items-center justify-center p-2 text-2xl text-font-color-highlight dark:text-dark-font-color-highlight"
            title={`Use ' ; ' to separate keywords in Search.`}
          >
            search
          </span>
          {/* SEARCH INPUT */}
          <input
            type="search"
            name="search"
            id="searchBar"
            className="h-full w-full border-2 border-[transparent] bg-[transparent] text-font-color-black outline-none placeholder:text-font-color-highlight dark:text-font-color-white dark:placeholder:text-dark-font-color-highlight"
            aria-label="Search"
            placeholder="Search for anything"
            value={searchInput}
            onChange={(e) => {
              updateCurrentlyActivePageData((currentData) => ({
                ...currentData,
                keyword: e.target.value,
              }));
              setSearchInput(e.target.value);
            }}
            onKeyDown={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
        {/* SEARCH FILTERS */}
        <div className="search-filters-container mb-6">
          <ul className="flex items-center">{filters}</ul>
        </div>
        <div className="search-results-container relative">
          {/* MOST RELEVANT SEARCH RESULTS */}
          <MostRelevantSearchResultsContainer searchResults={searchResults} />
          {/* SONG SEARCH RESULTS */}
          <SongSearchResultsContainer
            songs={searchResults.songs}
            searchInput={searchInput}
          />
          {/* ARTIST SEARCH RESULTS */}
          <ArtistsSearchResultsContainer
            artists={searchResults.artists}
            searchInput={searchInput}
          />
          {/* ALBUM SEARCH RESULTS */}
          <AlbumSearchResultsContainer
            albums={searchResults.albums}
            searchInput={searchInput}
          />
          {/* PLAYLIST SEARCH RESULTS */}
          <PlaylistSearchResultsContainer
            playlists={searchResults.playlists}
            searchInput={searchInput}
          />
          {/* GENRE SEARCH RESULTS */}
          <GenreSearchResultsContainer
            genres={searchResults.genres}
            searchInput={searchInput}
          />
          {/* NO SEARCH RESULTS PLACEHOLDER */}
          <NoSearchResultsContainer
            searchInput={searchInput}
            searchResults={searchResults}
            updateSearchInput={updateSearchInput}
          />
          {/* SEARCH START PLACEHOLDER */}
          <SearchStartPlaceholder
            searchResults={searchResults}
            searchInput={searchInput}
            updateSearchInput={updateSearchInput}
          />
        </div>
      </>
    </MainContainer>
  );
};

export default SearchPage;
