import Button from '@renderer/components/Button';
import MainContainer from '@renderer/components/MainContainer';
import AllAlbumResults from '@renderer/components/SearchPage/All_Search_Result_Containers/AllAlbumResults';
import AllArtistResults from '@renderer/components/SearchPage/All_Search_Result_Containers/AllArtistResults';
import AllGenreResults from '@renderer/components/SearchPage/All_Search_Result_Containers/AllGenreResults';
import AllLyricResults from '@renderer/components/SearchPage/All_Search_Result_Containers/AllLyricResults';
import AllPlaylistResults from '@renderer/components/SearchPage/All_Search_Result_Containers/AllPlaylistResults';
import AllSongResults from '@renderer/components/SearchPage/All_Search_Result_Containers/AllSongResults';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import { queryClient } from '@renderer/index';
import { searchQuery } from '@renderer/queries/search';
import { store } from '@renderer/store/store';
import { searchPageSchema } from '@renderer/utils/zod/searchPageSchema';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useContext, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

// eslint-disable-next-line react/only-export-components
export const Route = createFileRoute('/main-player/search/all/')({
  validateSearch: searchPageSchema,
  component: RouteComponent,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    await queryClient.ensureQueryData(
      searchQuery.query({
        keyword: deps.search.keyword,
        filter: deps.search.filterBy,
        isSimilaritySearchEnabled: deps.search.isSimilaritySearchEnabled,
        updateSearchHistory: true
      })
    );
  }
});

function RouteComponent() {
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );

  const { toggleMultipleSelections } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const { keyword, isSimilaritySearchEnabled, filterBy } = Route.useSearch();

  const { data: searchResults } = useSuspenseQuery(
    searchQuery.query({
      keyword: keyword,
      filter: filterBy,
      isSimilaritySearchEnabled: isSimilaritySearchEnabled,
      updateSearchHistory: true
    })
  );

  const selectedType = useMemo((): QueueTypes | undefined => {
    if (filterBy === 'Songs') return 'songs';
    if (filterBy === 'Artists') return 'artist';
    if (filterBy === 'Playlists') return 'playlist';
    if (filterBy === 'Albums') return 'album';
    if (filterBy === 'Genres') return 'genre';
    return undefined;
  }, [filterBy]);

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
                filter: (() => {
                  switch (filterBy) {
                    case 'Artists':
                      return t('common.artist_other');
                    case 'Playlists':
                      return t('common.playlist_other');
                    case 'Albums':
                      return t('common.album_other');
                    case 'Genres':
                      return t('common.genre_other');
                    case 'Lyrics':
                      return t('common.lyric_other');
                    case 'All':
                      return t('searchPage.allFilter');
                    // For song and other types
                    default:
                      return t('common.song_other');
                  }
                })()
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
        {filterBy === 'Lyrics' && <AllLyricResults lyricData={searchResults.lyrics} />}
      </>
    </MainContainer>
  );
}
