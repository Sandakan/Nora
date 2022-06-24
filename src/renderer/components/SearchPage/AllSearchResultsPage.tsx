/* eslint-disable react/no-array-index-key */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { Album } from '../AlbumsPage/Album';
import { Artist } from '../ArtistPage/Artist';
import { Song } from '../SongsPage/Song';

const AllSearchResultsPage = () => {
  const { currentlyActivePage } = React.useContext(AppContext);
  const data = currentlyActivePage.data as {
    allSearchResultsPage?: {
      searchQuery: string;
      searchFilter: SearchFilters;
      searchResults: (SongData | Artist | Album)[];
    };
  };

  return (
    <>
      {data && data.allSearchResultsPage && (
        <div className="main-container all-search-results-container">
          <div className="title-container">
            <div className="container">
              Showing results for{' '}
              <span className="search-query">
                &apos;
                {data.allSearchResultsPage.searchQuery}
                &apos;
              </span>{' '}
              {(data.allSearchResultsPage.searchFilter as SearchFilters) !==
                'All' && (
                <>
                  on{' '}
                  <span className="search-filter">
                    {data.allSearchResultsPage.searchFilter}
                  </span>
                </>
              )}
            </div>
          </div>

          {data.allSearchResultsPage.searchFilter === 'Songs' && (
            <div className="songs-list-container">
              <div className="songs-container">
                {data.allSearchResultsPage.searchResults.map(
                  (result, index) => {
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
                      />
                    );
                  }
                )}
              </div>
            </div>
          )}
          {data.allSearchResultsPage.searchFilter === 'Artists' && (
            <div className="artists-list-container">
              <div className="artists-container">
                {data.allSearchResultsPage.searchResults.map((result) => {
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
                })}
              </div>
            </div>
          )}
          {data.allSearchResultsPage.searchFilter === 'Albums' && (
            <div className="albums-list-container">
              <div className="albums-container">
                {data.allSearchResultsPage.searchResults.map(
                  (result, index) => {
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
                  }
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AllSearchResultsPage;
