/* eslint-disable react/no-array-index-key */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { Album } from '../AlbumsPage/Album';
import { Artist } from '../ArtistPage/Artist';
import Genre from '../GenresPage/Genre';
import MainContainer from '../MainContainer';
import { Song } from '../SongsPage/Song';

const AllSearchResultsPage = () => {
  const { currentlyActivePage } = React.useContext(AppContext);
  const data = currentlyActivePage.data as {
    allSearchResultsPage?: {
      searchQuery: string;
      searchFilter: SearchFilters;
      searchResults: (SongData | Artist | Album | Genre)[];
    };
  };

  const allSongResults = React.useMemo(() => {
    if (
      data.allSearchResultsPage &&
      data.allSearchResultsPage.searchFilter === 'Songs'
    ) {
      return data.allSearchResultsPage.searchResults.map((result, index) => {
        const songData = result as SongData;
        return (
          <Song
            key={songData.songId}
            index={index}
            songId={songData.songId}
            title={songData.title}
            duration={songData.duration}
            artists={songData.artists}
            path={songData.path}
            artworkPath={songData.artworkPath}
            isAFavorite={songData.isAFavorite}
          />
        );
      });
    }
    return [];
  }, [data.allSearchResultsPage]);

  const allArtistResults = React.useMemo(() => {
    if (
      data.allSearchResultsPage &&
      data.allSearchResultsPage.searchFilter === 'Artists'
    ) {
      return data.allSearchResultsPage.searchResults.map((result) => {
        const artistData = result as Artist;
        return (
          <Artist
            key={artistData.artistId}
            name={artistData.name}
            artistId={artistData.artistId}
            songIds={artistData.songs.map((song) => song.songId)}
            artworkPath={artistData.artworkPath}
            onlineArtworkPaths={artistData.onlineArtworkPaths}
          />
        );
      });
    }
    return [];
  }, [data.allSearchResultsPage]);

  const allAlbumResults = React.useMemo(() => {
    if (
      data.allSearchResultsPage &&
      data.allSearchResultsPage.searchFilter === 'Albums'
    ) {
      return data.allSearchResultsPage.searchResults.map((result, index) => {
        const albumData = result as Album;
        return (
          <Album
            key={index}
            albumId={albumData.albumId}
            title={albumData.title}
            songs={albumData.songs}
            artworkPath={albumData.artworkPath}
            artists={albumData.artists}
            year={albumData.year}
          />
        );
      });
    }
    return [];
  }, [data.allSearchResultsPage]);

  const allGenreResults = React.useMemo(() => {
    if (
      data.allSearchResultsPage &&
      data.allSearchResultsPage.searchFilter === 'Genres'
    ) {
      return data.allSearchResultsPage.searchResults.map((result, index) => {
        const genreData = result as Genre;
        return (
          <Genre
            key={index}
            genreId={genreData.genreId}
            title={genreData.name}
            noOfSongs={genreData.songs.length}
            artworkPath={genreData.artworkPath}
            backgroundColor={genreData.backgroundColor}
          />
        );
      });
    }
    return [];
  }, [data.allSearchResultsPage]);

  return (
    <>
      {data && data.allSearchResultsPage && (
        <MainContainer className="main-container all-search-results-container">
          <>
            <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
              <div className="container flex">
                Showing results for{' '}
                <span className="search-query text-background-color-3 dark:text-dark-background-color-3 mx-2">
                  &apos;
                  {data.allSearchResultsPage.searchQuery}
                  &apos;
                </span>{' '}
                {(data.allSearchResultsPage.searchFilter as SearchFilters) !==
                  'All' && (
                  <>
                    on{' '}
                    <span className="search-filter text-background-color-3 dark:text-dark-background-color-3 mx-2">
                      {data.allSearchResultsPage.searchFilter}
                    </span>
                  </>
                )}
              </div>
            </div>

            {data.allSearchResultsPage.searchFilter === 'Songs' && (
              <div className="songs-list-container">
                <div className="songs-container">{allSongResults}</div>
              </div>
            )}
            {data.allSearchResultsPage.searchFilter === 'Artists' && (
              <div className="artists-list-container">
                <div className="artists-container">{allArtistResults}</div>
              </div>
            )}
            {data.allSearchResultsPage.searchFilter === 'Albums' && (
              <div className="albums-list-container">
                <div className="albums-container flex flex-wrap">
                  {allAlbumResults}
                </div>
              </div>
            )}
            {data.allSearchResultsPage.searchFilter === 'Genres' && (
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
