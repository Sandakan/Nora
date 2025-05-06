import Button from '@renderer/components/Button';
import MainContainer from '@renderer/components/MainContainer';
import AllAlbumResults from '@renderer/components/SearchPage/All_Search_Result_Containers/AllAlbumResults';
import AllArtistResults from '@renderer/components/SearchPage/All_Search_Result_Containers/AllArtistResults';
import AllGenreResults from '@renderer/components/SearchPage/All_Search_Result_Containers/AllGenreResults';
import AllPlaylistResults from '@renderer/components/SearchPage/All_Search_Result_Containers/AllPlaylistResults';
import AllSongResults from '@renderer/components/SearchPage/All_Search_Result_Containers/AllSongResults';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import { store } from '@renderer/store';
import log from '@renderer/utils/log';
import { searchPageSchema } from '@renderer/utils/zod/searchPageSchema';
import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { zodValidator } from '@tanstack/zod-adapter';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

export const Route = createFileRoute('/main-player/search/all/')({
  validateSearch: zodValidator(searchPageSchema),
  component: RouteComponent
});

function RouteComponent() {
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );

  const { toggleMultipleSelections } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const { keyword, isPredictiveSearchEnabled, filterBy } = Route.useSearch();

  const [searchResults, setSearchResults] = useState({
    albums: [],
    artists: [],
    songs: [],
    playlists: [],
    genres: [],
    availableResults: []
  } as SearchResult);

  const selectedType = useMemo((): QueueTypes | undefined => {
    if (filterBy === 'Songs') return 'songs';
    if (filterBy === 'Artists') return 'artist';
    if (filterBy === 'Playlists') return 'playlist';
    if (filterBy === 'Albums') return 'album';
    if (filterBy === 'Genres') return 'genre';
    return undefined;
  }, [filterBy]);

  const fetchSearchResults = useCallback(() => {
    if (keyword.trim() !== '') {
      window.api.search
        .search(filterBy, keyword, false, isPredictiveSearchEnabled)
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
  }, [filterBy, isPredictiveSearchEnabled, keyword]);

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
        <div className="title-container text-font-color-black dark:text-font-color-white mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
          <div className="container flex">
            <Trans
              i18nKey={`searchPage.${
                filterBy === 'All' ? 'showingResultsFor' : 'showingResultsForWithFilter'
              }`}
              values={{
                query: keyword,
                filter: t(
                  `common.${
                    selectedType === undefined || selectedType === 'songs' ? 'song' : selectedType
                  }_other`
                )
              }}
              components={{
                span: (
                  <span className="search-query text-font-color-highlight dark:text-dark-font-color-highlight mx-2" />
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

        {filterBy === 'Songs' && <AllSongResults songData={searchResults.songs} />}
        {filterBy === 'Artists' && <AllArtistResults artistData={searchResults.artists} />}
        {filterBy === 'Playlists' && <AllPlaylistResults playlistData={searchResults.playlists} />}
        {filterBy === 'Albums' && <AllAlbumResults albumData={searchResults.albums} />}
        {filterBy === 'Genres' && <AllGenreResults genreData={searchResults.genres} />}
      </>
    </MainContainer>
  );
}
