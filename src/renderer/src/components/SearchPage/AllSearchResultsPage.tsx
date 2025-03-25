import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import log from '../../utils/log';

import Button from '../Button';
import MainContainer from '../MainContainer';

import AllSongResults from './All_Search_Result_Containers/AllSongResults';
import AllArtistResults from './All_Search_Result_Containers/AllArtistResults';
import AllPlaylistResults from './All_Search_Result_Containers/AllPlaylistResults';
import AllAlbumResults from './All_Search_Result_Containers/AllAlbumResults';
import AllGenreResults from './All_Search_Result_Containers/AllGenreResults';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

type AllSearchResultProp = {
  searchQuery: string;
  searchFilter: SearchFilters;
  isPredictiveSearchEnabled: boolean;
};

const AllSearchResultsPage = () => {
  const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );

  const { toggleMultipleSelections } = useContext(AppUpdateContext);
  const data = currentlyActivePage.data as AllSearchResultProp;
  const { t } = useTranslation();

  const [searchResults, setSearchResults] = useState({
    albums: [],
    artists: [],
    songs: [],
    playlists: [],
    genres: [],
    availableResults: []
  } as SearchResult);

  const selectedType = useMemo((): QueueTypes | undefined => {
    if (data.searchFilter === 'Songs') return 'songs';
    if (data.searchFilter === 'Artists') return 'artist';
    if (data.searchFilter === 'Playlists') return 'playlist';
    if (data.searchFilter === 'Albums') return 'album';
    if (data.searchFilter === 'Genres') return 'genre';
    return undefined;
  }, [data.searchFilter]);

  const fetchSearchResults = useCallback(() => {
    if (data.searchQuery.trim() !== '') {
      window.api.search
        .search(data.searchFilter, data.searchQuery, false, data.isPredictiveSearchEnabled)
        .then((results) => {
          return setSearchResults(results);
        })
        .catch((err) => log(err, undefined, 'WARN'));
    } else
      setSearchResults({
        albums: [],
        artists: [],
        songs: [],
        playlists: [],
        genres: [],
        availableResults: []
      });
  }, [data]);

  useEffect(() => {
    fetchSearchResults();
    const manageSearchResultsUpdatesInAllSearchResultsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
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
    document.addEventListener('app/dataUpdates', manageSearchResultsUpdatesInAllSearchResultsPage);
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSearchResultsUpdatesInAllSearchResultsPage
      );
    };
  }, [fetchSearchResults]);

  return (
    <MainContainer className="main-container all-search-results-container h-full! pb-0!">
      <>
        <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
          <div className="container flex">
            <Trans
              i18nKey={`searchPage.${
                data.searchFilter === 'All' ? 'showingResultsFor' : 'showingResultsForWithFilter'
              }`}
              values={{
                query: data.searchQuery,
                filter: t(
                  `common.${
                    selectedType === undefined || selectedType === 'songs' ? 'song' : selectedType
                  }_other`
                )
              }}
              components={{
                span: (
                  <span className="search-query mx-2 text-font-color-highlight dark:text-dark-font-color-highlight" />
                )
              }}
            />
          </div>
          <div className="other-controls-container flex">
            <Button
              label={t(`common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`)}
              className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName={isMultipleSelectionEnabled ? 'remove_done' : 'checklist'}
              clickHandler={() => {
                toggleMultipleSelections(!isMultipleSelectionEnabled, selectedType);
              }}
              isDisabled={selectedType === undefined}
              tooltipLabel={t(`common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`)}
            />
          </div>
        </div>

        {data.searchFilter === 'Songs' && <AllSongResults songData={searchResults.songs} />}
        {data.searchFilter === 'Artists' && <AllArtistResults artistData={searchResults.artists} />}
        {data.searchFilter === 'Playlists' && (
          <AllPlaylistResults playlistData={searchResults.playlists} />
        )}
        {data.searchFilter === 'Albums' && <AllAlbumResults albumData={searchResults.albums} />}
        {data.searchFilter === 'Genres' && <AllGenreResults genreData={searchResults.genres} />}
      </>
    </MainContainer>
  );
};

export default AllSearchResultsPage;
