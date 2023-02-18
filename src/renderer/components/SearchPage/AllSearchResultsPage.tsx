/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import { Album } from '../AlbumsPage/Album';
import { Artist } from '../ArtistPage/Artist';
import Button from '../Button';
import Genre from '../GenresPage/Genre';
import MainContainer from '../MainContainer';
import Song from '../SongsPage/Song';

const AllSearchResultsPage = () => {
  const { currentlyActivePage, userData, isMultipleSelectionEnabled } =
    React.useContext(AppContext);
  const { toggleMultipleSelections } = React.useContext(AppUpdateContext);
  const data = currentlyActivePage.data as {
    searchQuery: string;
    searchFilter: SearchFilters;
    searchResults: (SongData | Artist | Album | Genre)[];
  };

  const selectType = React.useMemo((): QueueTypes | undefined => {
    if (data.searchFilter === 'Songs') return 'songs';
    if (data.searchFilter === 'Artists') return 'artist';
    if (data.searchFilter === 'Playlists') return 'playlist';
    if (data.searchFilter === 'Albums') return 'album';
    if (data.searchFilter === 'Genres') return 'genre';
    return undefined;
  }, [data.searchFilter]);

  const allSongResults = React.useMemo(() => {
    if (data && data.searchFilter === 'Songs') {
      return data.searchResults.map((result, index) => {
        const songData = result as SongData;
        return (
          <Song
            key={songData.songId}
            index={index}
            isIndexingSongs={
              userData !== undefined && userData.preferences.songIndexing
            }
            songId={songData.songId}
            title={songData.title}
            duration={songData.duration}
            artists={songData.artists}
            path={songData.path}
            artworkPaths={songData.artworkPaths}
            isAFavorite={songData.isAFavorite}
            year={songData.year}
          />
        );
      });
    }
    return [];
  }, [data, userData]);

  const allArtistResults = React.useMemo(() => {
    if (data && data.searchFilter === 'Artists') {
      return data.searchResults.map((result, index) => {
        const artistData = result as Artist;
        return (
          <Artist
            index={index}
            key={artistData.artistId}
            name={artistData.name}
            artistId={artistData.artistId}
            songIds={artistData.songs.map((song) => song.songId)}
            artworkPaths={artistData.artworkPaths}
            onlineArtworkPaths={artistData.onlineArtworkPaths}
            className="mb-4 mr-4"
          />
        );
      });
    }
    return [];
  }, [data]);

  const allAlbumResults = React.useMemo(() => {
    if (data && data.searchFilter === 'Albums') {
      return data.searchResults.map((result, index) => {
        const albumData = result as Album;
        return (
          <Album
            key={index}
            index={index}
            albumId={albumData.albumId}
            title={albumData.title}
            songs={albumData.songs}
            artworkPaths={albumData.artworkPaths}
            artists={albumData.artists}
            year={albumData.year}
          />
        );
      });
    }
    return [];
  }, [data]);

  const allGenreResults = React.useMemo(() => {
    if (data && data.searchFilter === 'Genres') {
      return data.searchResults.map((result, index) => {
        const genreData = result as Genre;
        return (
          <Genre
            key={index}
            index={index}
            genreId={genreData.genreId}
            title={genreData.name}
            songIds={genreData.songs.map((song) => song.songId)}
            artworkPaths={genreData.artworkPaths}
            backgroundColor={genreData.backgroundColor}
          />
        );
      });
    }
    return [];
  }, [data]);

  return (
    <>
      {data && (
        <MainContainer className="main-container all-search-results-container">
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
              <div className="songs-list-container">
                <div className="songs-container">{allSongResults}</div>
              </div>
            )}
            {data.searchFilter === 'Artists' && (
              <div className="artists-list-container">
                <div className="artists-container flex flex-wrap">
                  {allArtistResults}
                </div>
              </div>
            )}
            {data.searchFilter === 'Albums' && (
              <div className="albums-list-container">
                <div className="albums-container flex flex-wrap">
                  {allAlbumResults}
                </div>
              </div>
            )}
            {data.searchFilter === 'Genres' && (
              <div className="genres-list-container text-font-color-black dark:text-font-color-white">
                <div className="genres-container flex flex-wrap">
                  {allGenreResults}
                </div>
              </div>
            )}
          </>
        </MainContainer>
      )}
    </>
  );
};

export default AllSearchResultsPage;
