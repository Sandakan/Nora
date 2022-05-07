/* eslint-disable jsx-a11y/no-autofocus */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-else-return */
/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { Album } from '../AlbumsPage/Album';
import { Artist } from '../ArtistPage/Artist';
import { Song } from '../SongsPage/song';
import { MostRelevantResult } from './MostRelevantResult';
import { ResultFilter } from './ResultFilter';

export const SearchPage = () => {
  const {
    playSong,
    currentSongData,
    updateContextMenuData,
    currentlyActivePage,
    changeCurrentActivePage,
  } = useContext(AppContext);
  const [searchInput, setSearchInput] = React.useState('');
  const [searchResults, setSearchResults] = React.useState({
    albums: [],
    artists: [],
    songs: [],
  } as SearchResult);
  const [activeFilter, setActiveFilter] = React.useState('All');
  const filterTypes = 'All Songs Albums Artists Playlists'.split(' ');
  const MostRelevantResults = [];
  let songResults: any[] = [];
  let artistResults: any[] = [];
  let albumResults: any[] = [];
  const changeActiveFilter = (filterType: string) =>
    setActiveFilter(filterType);
  const filters = filterTypes.map((filterType, index) => {
    return (
      <ResultFilter
        key={index}
        filterType={filterType}
        isCurrentActiveFilter={filterType === activeFilter}
        changeActiveFilter={changeActiveFilter}
      />
    );
  });

  React.useEffect(() => {
    if (searchInput !== '')
      window.api
        .search(activeFilter.toLowerCase(), searchInput)
        .then((results) => setSearchResults(results));
  }, [searchInput, activeFilter]);

  // console.log(searchResults);

  if (searchResults.songs.length > 0) {
    const firstResult = searchResults.songs[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="song"
        title={firstResult.title}
        key={0}
        id={firstResult.songId}
        artworkPath={firstResult.artworkPath}
        infoType1={firstResult.artists}
        infoType2={firstResult.album}
        playSong={playSong}
        updateContextMenuData={updateContextMenuData}
        contextMenuItems={[
          {
            label: 'Play',
            iconName: 'play_arrow',
            handlerFunction: () => playSong(currentSongData.songId),
          },
          {
            label: 'Reveal in File Explorer',
            class: 'reveal-file-explorer',
            iconName: 'folder_open',
            handlerFunction: () =>
              window.api.revealSongInFileExplorer(currentSongData.songId),
          },
        ]}
        currentlyActivePage={currentlyActivePage}
        changeCurrentActivePage={changeCurrentActivePage}
      />
    );

    songResults = searchResults.songs
      .map((song, index) => {
        if (index < 5)
          return (
            <Song
              key={song.songId}
              title={song.title}
              artists={song.artists}
              artworkPath={song.artworkPath}
              duration={song.duration}
              songId={song.songId}
              playSong={playSong}
              currentSongData={currentSongData}
              updateContextMenuData={updateContextMenuData}
              currentlyActivePage={currentlyActivePage}
              changeCurrentActivePage={changeCurrentActivePage}
            />
          );
        else return undefined;
      })
      .filter((song) => song !== undefined);
  }
  if (searchResults.artists.length > 0) {
    const firstResult = searchResults.artists[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="artist"
        title={firstResult.name}
        key={1}
        id={firstResult.artistId}
        artworkPath={firstResult.artworkPath}
        infoType1={`${firstResult.songs.length} song${
          firstResult.songs.length === 1 ? '' : 's'
        }`}
        updateContextMenuData={updateContextMenuData}
        contextMenuItems={[]}
        currentlyActivePage={currentlyActivePage}
        changeCurrentActivePage={changeCurrentActivePage}
      />
    );

    artistResults = searchResults.artists
      .map((artist, index) => {
        if (index < 5)
          return (
            <Artist
              key={artist.artistId}
              name={artist.name}
              artworkPath={artist.artworkPath}
              changeCurrentActivePage={changeCurrentActivePage}
              currentlyActivePage={currentlyActivePage}
            />
          );
        else return undefined;
      })
      .filter((artist) => artist !== undefined);
  }
  if (searchResults.albums.length > 0) {
    const firstResult = searchResults.albums[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="album"
        title={firstResult.title}
        key={2}
        id={firstResult.albumId}
        artworkPath={firstResult.artworkPath}
        infoType1={firstResult.artists}
        infoType2={`${firstResult.songs.length} song${
          firstResult.songs.length === 1 ? '' : 's'
        }`}
        updateContextMenuData={updateContextMenuData}
        contextMenuItems={[]}
        currentlyActivePage={currentlyActivePage}
        changeCurrentActivePage={changeCurrentActivePage}
      />
    );

    albumResults = searchResults.albums
      .map((album, index) => {
        if (index < 3)
          return (
            <Album
              key={album.albumId}
              albumId={album.albumId}
              artists={album.artists}
              artworkPath={album.artworkPath}
              songs={album.songs}
              title={album.title}
              year={album.year}
              changeCurrentActivePage={changeCurrentActivePage}
              currentlyActivePage={currentlyActivePage}
            />
          );
        else return undefined;
      })
      .filter((album) => album !== undefined);
  }

  return (
    <div className="main-container search-container">
      <div className="search-bar-container">
        <span className="material-icons-round icon">search</span>
        <input
          type="search"
          name="search"
          id="searchBar"
          aria-label="Search"
          placeholder="Search for anything"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => e.stopPropagation()}
          autoFocus
        />
      </div>
      <div className="search-filters-container">
        <ul>{filters} </ul>
      </div>
      <div className="search-results-container">
        <div
          className={`secondary-container most-relevant-results-container ${
            MostRelevantResults.length > 0 && 'active'
          }`}
        >
          <div className="title-container">Most Relevant</div>
          <div className="results-container">{MostRelevantResults}</div>
        </div>
        <div
          className={`secondary-container songs-list-container ${
            songResults.length > 0 && 'active'
          }`}
        >
          <div className="title-container">Songs</div>
          <div className="songs-container">{songResults}</div>
        </div>
        <div
          className={`secondary-container artists-list-container ${
            artistResults.length > 0 && 'active'
          }`}
        >
          <div className="title-container">Artists</div>
          <div className="artists-container">{artistResults}</div>
        </div>
        <div
          className={`secondary-container albums-list-container ${
            albumResults.length > 0 && 'active'
          }`}
        >
          <div className="title-container">Albums</div>
          <div className="albums-container">{albumResults}</div>
        </div>
        {searchResults.songs.length === 0 &&
          searchResults.artists.length === 0 &&
          searchResults.albums.length === 0 &&
          searchInput !== '' && (
            <div className="no-search-results-container active">
              <div>
                We couldn't find any songs related to your search result. Please
                try again with different keywords.
              </div>
            </div>
          )}
      </div>
    </div>
  );
};
