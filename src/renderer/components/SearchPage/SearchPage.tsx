/* eslint-disable jsx-a11y/no-autofocus */
import React, { useContext } from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import debounce from 'renderer/utils/debounce';
import storage from 'renderer/utils/localStorage';

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
import Button from '../Button';

const filterTypes: SearchFilters[] = [
  'All',
  'Songs',
  'Albums',
  'Artists',
  'Playlists',
  'Genres',
];
const ARTIST_WIDTH = 175;
const ALBUM_WIDTH = 210;
const PLAYLIST_WIDTH = 160;
const GENRE_WIDTH = 300;

const SearchPage = () => {
  const { currentlyActivePage, localStorageData } = useContext(AppContext);
  const { updateCurrentlyActivePageData } = React.useContext(AppUpdateContext);

  const [searchInput, setSearchInput] = React.useState(
    currentlyActivePage?.data?.keyword
      ? (currentlyActivePage.data.keyword as string)
      : ''
  );
  const [isPredictiveSearchEnabled, setIsPredictiveSearchEnabled] =
    React.useState(
      localStorageData?.preferences?.isPredictiveSearchEnabled ?? true
    );

  const searchContainerRef = React.useRef(null);
  const { width } = useResizeObserver(searchContainerRef);

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

  const { noOfArtists, noOfPlaylists, noOfAlbums, noOfGenres } =
    React.useMemo(() => {
      return {
        noOfPlaylists: Math.floor(width / PLAYLIST_WIDTH) || 4,
        noOfArtists: Math.floor(width / ARTIST_WIDTH) || 5,
        noOfAlbums: Math.floor(width / ALBUM_WIDTH) || 4,
        noOfGenres: Math.floor(width / GENRE_WIDTH) || 3,
      };
    }, [width]);

  const changeActiveFilter = React.useCallback(
    (filterType: SearchFilters) => setActiveFilter(filterType),
    []
  );

  const filters = filterTypes.map((filterType) => {
    return (
      <SearchResultsFilter
        key={filterType}
        filterType={filterType}
        isCurrentActiveFilter={filterType === activeFilter}
        changeActiveFilter={changeActiveFilter}
      />
    );
  });

  const timeOutIdRef = React.useRef(undefined as NodeJS.Timer | undefined);
  const fetchSearchResults = React.useCallback(() => {
    if (deferredSearchInput.trim() !== '') {
      if (timeOutIdRef.current) clearTimeout(timeOutIdRef.current);
      timeOutIdRef.current = setTimeout(
        () =>
          window.api
            .search(
              activeFilter,
              deferredSearchInput,
              true,
              isPredictiveSearchEnabled
            )
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
  }, [
    activeFilter,
    deferredSearchInput,
    timeOutIdRef,
    isPredictiveSearchEnabled,
  ]);

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
            event.dataType === 'genres/deletedGenre' ||
            event.dataType === 'blacklist/songBlacklist'
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
    <MainContainer className="!h-full !pb-0" ref={searchContainerRef}>
      <div className="appear-from-bottom mb-4 flex items-center">
        <div className="search-bar-container flex w-1/2 min-w-[25rem] max-w-xl items-center rounded-3xl bg-background-color-2 px-2 py-1 shadow-md dark:bg-dark-background-color-2">
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
              debounce(
                () =>
                  updateCurrentlyActivePageData((currentData) => ({
                    ...currentData,
                    keyword: e.target.value,
                  })),
                500
              );
              setSearchInput(e.target.value);
            }}
            onKeyDown={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
        <Button
          className="!mr-0 ml-2 !border-none !p-2 outline-1 outline-offset-1 hover:bg-background-color-2/80 focus-visible:!outline dark:hover:bg-dark-background-color-2/80"
          iconName={isPredictiveSearchEnabled ? 'auto_fix' : 'auto_fix_off'}
          tooltipLabel={`${
            isPredictiveSearchEnabled ? 'Disable' : 'Enable'
          } predictive search`}
          iconClassName="material-icons-round-outlined"
          clickHandler={() =>
            setIsPredictiveSearchEnabled((state) => {
              storage.preferences.setPreferences(
                'isPredictiveSearchEnabled',
                !state
              );
              return !state;
            })
          }
        />
      </div>
      {/* SEARCH FILTERS */}
      <div className="search-filters-container mb-6">
        <ul className="flex items-center">{filters}</ul>
      </div>
      <div className="search-results-container relative !h-full">
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
          noOfVisibleArtists={noOfArtists}
        />
        {/* ALBUM SEARCH RESULTS */}
        <AlbumSearchResultsContainer
          albums={searchResults.albums}
          searchInput={searchInput}
          noOfVisibleAlbums={noOfAlbums}
        />
        {/* PLAYLIST SEARCH RESULTS */}
        <PlaylistSearchResultsContainer
          playlists={searchResults.playlists}
          searchInput={searchInput}
          noOfVisiblePlaylists={noOfPlaylists}
        />
        {/* GENRE SEARCH RESULTS */}
        <GenreSearchResultsContainer
          genres={searchResults.genres}
          searchInput={searchInput}
          noOfVisibleGenres={noOfGenres}
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
    </MainContainer>
  );
};

export default SearchPage;
