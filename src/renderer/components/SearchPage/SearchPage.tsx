/* eslint-disable jsx-a11y/no-autofocus */
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import { AppContext } from '../../contexts/AppContext';
import useResizeObserver from '../../hooks/useResizeObserver';
import debounce from '../../utils/debounce';
import storage from '../../utils/localStorage';
import i18n from '../../i18n';

import SearchResultsFilter, { SearchResultFilter } from './SearchResultsFilter';
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

const searchFilter: SearchResultFilter[] = [
  { label: i18n.t('searchPage.allFilter'), icon: 'select_all', value: 'All' },
  { label: i18n.t('common.song_other'), icon: 'music_note', value: 'Songs' },
  { label: i18n.t('common.album_other'), icon: 'people', value: 'Albums' },
  { label: i18n.t('common.artist_other'), icon: 'album', value: 'Artists' },
  {
    label: i18n.t('common.playlist_other'),
    icon: 'track_changes',
    value: 'Playlists',
  },
  { label: i18n.t('common.genre_other'), icon: 'queue_music', value: 'Genres' },
];
const ARTIST_WIDTH = 175;
const ALBUM_WIDTH = 210;
const PLAYLIST_WIDTH = 160;
const GENRE_WIDTH = 300;

const SearchPage = () => {
  const { currentlyActivePage, localStorageData } = useContext(AppContext);
  const { updateCurrentlyActivePageData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [searchInput, setSearchInput] = React.useState(
    currentlyActivePage?.data?.keyword || '',
  );
  const [isPredictiveSearchEnabled, setIsPredictiveSearchEnabled] =
    React.useState(
      localStorageData?.preferences?.isPredictiveSearchEnabled ?? true,
    );

  const searchContainerRef = React.useRef(null);
  const { width } = useResizeObserver(searchContainerRef);

  const [searchResults, setSearchResults] = React.useState({
    albums: [],
    artists: [],
    songs: [],
    playlists: [],
    genres: [],
    availableResults: [],
  } as SearchResult);
  const [activeFilter, setActiveFilter] = React.useState(
    'All' as SearchFilters,
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
    [],
  );

  const filters = searchFilter.map((filter) => {
    return (
      <SearchResultsFilter
        key={filter.value}
        label={filter.label}
        icon={filter.icon}
        value={filter.value}
        isCurrentActiveFilter={filter.value === activeFilter}
        changeActiveFilter={changeActiveFilter}
      />
    );
  });

  const timeOutIdRef = React.useRef(undefined as NodeJS.Timeout | undefined);
  const fetchSearchResults = React.useCallback(() => {
    if (searchInput.trim() !== '') {
      if (timeOutIdRef.current) clearTimeout(timeOutIdRef.current);
      timeOutIdRef.current = setTimeout(
        () =>
          window.api.search
            .search(activeFilter, searchInput, true, isPredictiveSearchEnabled)
            .then((results) => {
              return setSearchResults(results);
            }),
        250,
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
  }, [activeFilter, searchInput, timeOutIdRef, isPredictiveSearchEnabled]);

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
      manageSearchResultsUpdatesInSearchPage,
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSearchResultsUpdatesInSearchPage,
      );
    };
  }, [fetchSearchResults]);

  const updateSearchInput = React.useCallback(
    (input: string) => setSearchInput(input),
    [],
  );

  return (
    <MainContainer
      className="!h-full !pb-0 [scrollbar-gutter:stable]"
      ref={searchContainerRef}
    >
      <div className="search-controls-container">
        <div className="search-input-container appear-from-bottom mb-4 flex items-center">
          <div className="search-bar-container flex w-1/2 min-w-[25rem] max-w-xl items-center rounded-3xl bg-background-color-2 px-2 py-1 dark:bg-dark-background-color-2">
            <Button
              className={`!my-1 !ml-1 !mr-2 !rounded-3xl border-none !px-4 !py-2 shadow-sm outline-1 outline-offset-1 focus-visible:!outline ${
                isPredictiveSearchEnabled
                  ? 'bg-background-color-3 !text-black dark:bg-dark-background-color-3'
                  : 'bg-background-color-1/50 !text-font-color-highlight hover:bg-background-color-1 focus-visible:bg-background-color-1 dark:bg-dark-background-color-1/50 dark:!text-dark-font-color-highlight dark:hover:bg-dark-background-color-1 dark:focus-visible:bg-dark-background-color-1'
              }`}
              iconName={isPredictiveSearchEnabled ? 'auto_fix' : 'auto_fix_off'}
              tooltipLabel={t(
                `searchPage.${
                  isPredictiveSearchEnabled
                    ? 'disablePredictiveSearch'
                    : 'enablePredictiveSearch'
                }`,
              )}
              iconClassName="material-icons-round-outlined"
              clickHandler={() =>
                setIsPredictiveSearchEnabled((state) => {
                  storage.preferences.setPreferences(
                    'isPredictiveSearchEnabled',
                    !state,
                  );
                  return !state;
                })
              }
            />
            {/* SEARCH INPUT */}
            <input
              type="search"
              name="search"
              id="searchBar"
              className="h-full w-full border-2 border-[transparent] bg-[transparent] text-font-color-black outline-none placeholder:text-font-color-highlight dark:text-font-color-white dark:placeholder:text-dark-font-color-highlight"
              aria-label="Search"
              placeholder={t('searchPage.searchForAnything')}
              value={searchInput}
              onChange={(e) => {
                debounce(
                  () =>
                    updateCurrentlyActivePageData((currentData) => ({
                      ...currentData,
                      keyword: e.target.value,
                    })),
                  500,
                );
                setSearchInput(e.target.value);
              }}
              onKeyDown={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <span
            className="material-icons-round-outlined ml-4 cursor-help text-2xl text-font-color-highlight dark:text-dark-font-color-highlight"
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
      <div className="search-results-container relative !h-full">
        {/* MOST RELEVANT SEARCH RESULTS */}
        <MostRelevantSearchResultsContainer searchResults={searchResults} />
        {/* SONG SEARCH RESULTS */}
        <SongSearchResultsContainer
          songs={searchResults.songs}
          searchInput={searchInput}
          isPredictiveSearchEnabled={isPredictiveSearchEnabled}
        />
        {/* ARTIST SEARCH RESULTS */}
        <ArtistsSearchResultsContainer
          artists={searchResults.artists}
          searchInput={searchInput}
          noOfVisibleArtists={noOfArtists}
          isPredictiveSearchEnabled={isPredictiveSearchEnabled}
        />
        {/* ALBUM SEARCH RESULTS */}
        <AlbumSearchResultsContainer
          albums={searchResults.albums}
          searchInput={searchInput}
          noOfVisibleAlbums={noOfAlbums}
          isPredictiveSearchEnabled={isPredictiveSearchEnabled}
        />
        {/* PLAYLIST SEARCH RESULTS */}
        <PlaylistSearchResultsContainer
          playlists={searchResults.playlists}
          searchInput={searchInput}
          noOfVisiblePlaylists={noOfPlaylists}
          isPredictiveSearchEnabled={isPredictiveSearchEnabled}
        />
        {/* GENRE SEARCH RESULTS */}
        <GenreSearchResultsContainer
          genres={searchResults.genres}
          searchInput={searchInput}
          noOfVisibleGenres={noOfGenres}
          isPredictiveSearchEnabled={isPredictiveSearchEnabled}
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
