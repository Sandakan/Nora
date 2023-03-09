import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import Button from '../Button';
import MainContainer from '../MainContainer';

import AllSongResults from './All_Search_Result_Containers/AllSongResults';
import AllArtistResults from './All_Search_Result_Containers/AllArtistResults';
import AllPlaylistResults from './All_Search_Result_Containers/AllPlaylistResults';
import AllAlbumResults from './All_Search_Result_Containers/AllAlbumResults';
import AllGenreResults from './All_Search_Result_Containers/AllGenreResults';

const AllSearchResultsPage = () => {
  const { currentlyActivePage, isMultipleSelectionEnabled } =
    React.useContext(AppContext);
  const { toggleMultipleSelections } = React.useContext(AppUpdateContext);
  const data = currentlyActivePage.data as {
    searchQuery: string;
    searchFilter: SearchFilters;
    searchResults: (SongData | Artist | Album | Genre | Playlist)[];
  };

  const selectType = React.useMemo((): QueueTypes | undefined => {
    if (data.searchFilter === 'Songs') return 'songs';
    if (data.searchFilter === 'Artists') return 'artist';
    if (data.searchFilter === 'Playlists') return 'playlist';
    if (data.searchFilter === 'Albums') return 'album';
    if (data.searchFilter === 'Genres') return 'genre';
    return undefined;
  }, [data.searchFilter]);

  return (
    <MainContainer className="main-container all-search-results-container !h-full !pb-0">
      <>
        <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
          <div className="container flex">
            Showing results for{' '}
            <span className="search-query mx-2 text-font-color-highlight dark:text-dark-font-color-highlight">
              &apos;
              {data.searchQuery}
              &apos;
            </span>{' '}
            {(data.searchFilter as SearchFilters) !== 'All' && (
              <>
                on{' '}
                <span className="search-filter mx-2 text-font-color-highlight dark:text-dark-font-color-highlight">
                  {data.searchFilter}
                </span>
              </>
            )}
          </div>
          <div className="other-controls-container flex">
            <Button
              label={isMultipleSelectionEnabled ? 'Unselect All' : 'Select'}
              className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName={
                isMultipleSelectionEnabled ? 'remove_done' : 'checklist'
              }
              clickHandler={() => {
                toggleMultipleSelections(
                  !isMultipleSelectionEnabled,
                  selectType
                );
              }}
              isDisabled={selectType === undefined}
              tooltipLabel={
                isMultipleSelectionEnabled ? 'Unselect All' : 'Select'
              }
            />
          </div>
        </div>

        {data.searchFilter === 'Songs' && (
          <AllSongResults songData={data.searchResults as SongData[]} />
        )}
        {data.searchFilter === 'Artists' && (
          <AllArtistResults artistData={data.searchResults as Artist[]} />
        )}
        {data.searchFilter === 'Playlists' && (
          <AllPlaylistResults playlistData={data.searchResults as Playlist[]} />
        )}
        {data.searchFilter === 'Albums' && (
          <AllAlbumResults albumData={data.searchResults as Album[]} />
        )}
        {data.searchFilter === 'Genres' && (
          <AllGenreResults genreData={data.searchResults as Genre[]} />
        )}
      </>
    </MainContainer>
  );
};

export default AllSearchResultsPage;
