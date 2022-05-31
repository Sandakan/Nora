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
import { Song } from '../SongsPage/Song';
import { MostRelevantResult } from './MostRelevantResult';
import { ResultFilter } from './ResultFilter';
import SearchSomethingImage from '../../../../assets/images/Flying kite_Monochromatic.svg';
import NoResultsImage from '../../../../assets/images/Sad face_Monochromatic.svg';
import Button from '../Button';
import { Playlist } from '../PlaylistsPage/Playlist';

export const SearchPage = () => {
  const {
    playSong,
    currentSongData,
    updateContextMenuData,
    currentlyActivePage,
    changeCurrentActivePage,
    updateCurrentlyActivePageData,
    queue,
    updateQueueData,
    createQueue,
    updateNotificationPanelData,
  } = useContext(AppContext);
  const [searchInput, setSearchInput] = React.useState(
    currentlyActivePage.data && currentlyActivePage.data.searchPage
      ? (currentlyActivePage.data.searchPage.keyword as string)
      : ''
  );
  const [searchResults, setSearchResults] = React.useState({
    albums: [],
    artists: [],
    songs: [],
    playlists: [],
  } as SearchResult);
  const [activeFilter, setActiveFilter] = React.useState(
    'All' as SearchFilters
  );
  const filterTypes = 'All Songs Albums Artists Playlists'.split(' ');
  const MostRelevantResults = [];
  let songResults: any[] = [];
  let artistResults: any[] = [];
  let albumResults: any[] = [];
  let playlistResults: any[] = [];
  const changeActiveFilter = (filterType: SearchFilters) =>
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
        .search(activeFilter, searchInput)
        .then((results) => setSearchResults(results));
    else
      setSearchResults({ albums: [], artists: [], songs: [], playlists: [] });
  }, [searchInput, activeFilter]);

  if (searchResults.songs.length > 0) {
    const firstResult = searchResults.songs[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="song"
        title={firstResult.title}
        key={0}
        id={firstResult.songId}
        artworkPath={firstResult.artworkPath}
        infoType1={
          firstResult.artists
            ? firstResult.artists.map((artist) => artist.name).join(',')
            : 'Unknown Artist'
        }
        infoType2={firstResult.album ? firstResult.album.name : 'Unknown Album'}
        playSong={playSong}
        updateContextMenuData={updateContextMenuData}
        contextMenuItems={[
          {
            label: 'Play',
            handlerFunction: () => playSong(firstResult.songId),
            iconName: 'play_arrow',
          },
          {
            label: 'Play Next',
            iconName: 'shortcut',
            handlerFunction: () => {
              const newQueue = queue.queue.filter(
                (songId) => songId !== firstResult.songId
              );
              newQueue.splice(
                queue.queue.indexOf(currentSongData.songId) + 1 || 0,
                0,
                firstResult.songId
              );
              updateQueueData(undefined, newQueue);
              updateNotificationPanelData(
                5000,
                <span>
                  &apos;{firstResult.title}&apos; will be played next.
                </span>,
                <span className="material-icons-round">shortcut</span>
              );
            },
          },
          {
            label: 'Add to queue',
            iconName: 'queue',
            handlerFunction: () => {
              updateQueueData(
                undefined,
                [...queue.queue, firstResult.songId],
                false
              );
              updateNotificationPanelData(
                5000,
                <span>Added 1 song to the queue.</span>,
                <img
                  src={`otoMusic://localFiles/${firstResult.artworkPath?.replace(
                    '.webp',
                    '-optimized.webp'
                  )}`}
                  alt="Song Artwork"
                />
                // <span className="material-icons-round icon">playlist_add</span>
              );
            },
          },
          {
            label: 'Reveal in File Explorer',
            class: 'reveal-file-explorer',
            iconName: 'folder_open',
            handlerFunction: () =>
              window.api.revealSongInFileExplorer(firstResult.songId),
          },
          {
            label: 'Info',
            class: 'info',
            iconName: 'info_outline',
            handlerFunction: () =>
              changeCurrentActivePage('SongInfo', {
                songInfo: { songId: firstResult.songId },
              }),
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
              path={song.path}
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
        onlineArtworkPath={
          firstResult.onlineArtworkPaths
            ? firstResult.onlineArtworkPaths.picture_medium
            : undefined
        }
        infoType1={`${firstResult.songs.length} song${
          firstResult.songs.length === 1 ? '' : 's'
        }`}
        updateContextMenuData={updateContextMenuData}
        contextMenuItems={[
          {
            label: 'Play all Songs',
            iconName: 'play_arrow',
            handlerFunction: () =>
              createQueue(
                firstResult.songs.map((song) => song.songId),
                'artist',
                firstResult.artistId,
                true
              ),
          },
          {
            label: 'Info',
            iconName: 'info',
            handlerFunction: () =>
              currentlyActivePage.pageTitle === 'ArtistInfo' &&
              currentlyActivePage.data.artistName === firstResult.name
                ? changeCurrentActivePage('Home')
                : changeCurrentActivePage('ArtistInfo', {
                    artistName: firstResult.name,
                  }),
          },
          {
            label: 'Add to queue',
            iconName: 'queue',
            handlerFunction: () => {
              updateQueueData(
                undefined,
                [
                  ...queue.queue,
                  ...firstResult.songs.map((song) => song.songId),
                ],
                false
              );
            },
          },
        ]}
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
              artistId={artist.artistId}
              songIds={artist.songs.map((song) => song.songId)}
              onlineArtworkPaths={artist.onlineArtworkPaths}
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
        infoType1={
          firstResult.artists
            ? firstResult.artists.map((artist) => artist.name).join(',')
            : 'Unknown Artist'
        }
        infoType2={`${firstResult.songs.length} song${
          firstResult.songs.length === 1 ? '' : 's'
        }`}
        updateContextMenuData={updateContextMenuData}
        contextMenuItems={[
          {
            label: 'Play',
            iconName: 'play_arrow',
            handlerFunction: () =>
              createQueue(
                firstResult.songs.map((song) => song.songId),
                'album',
                firstResult.albumId,
                true
              ),
          },
          {
            label: 'Add to queue',
            iconName: 'queue',
            handlerFunction: () => {
              queue.queue.push(...firstResult.songs.map((song) => song.songId));
              updateQueueData(undefined, queue.queue, false);
              updateNotificationPanelData(
                5000,
                <span>
                  Added {firstResult.songs.length} song
                  {firstResult.songs.length === 1 ? '' : 's'} to the queue.
                </span>
              );
            },
          },
        ]}
        currentlyActivePage={currentlyActivePage}
        changeCurrentActivePage={changeCurrentActivePage}
      />
    );

    albumResults = searchResults.albums
      .map((album, index) => {
        if (index < 4)
          return (
            <Album
              key={album.albumId}
              albumId={album.albumId}
              artists={album.artists}
              artworkPath={album.artworkPath}
              songs={album.songs}
              title={album.title}
              year={album.year}
            />
          );
        else return undefined;
      })
      .filter((album) => album !== undefined);
  }

  if (searchResults.playlists.length > 0) {
    const firstResult = searchResults.playlists[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="playlist"
        title={firstResult.name}
        key={2}
        id={firstResult.playlistId}
        artworkPath={firstResult.artworkPath}
        infoType1={`${firstResult.songs.length} song${
          firstResult.songs.length === 1 ? '' : 's'
        }`}
        updateContextMenuData={updateContextMenuData}
        contextMenuItems={[
          {
            label: 'Play',
            iconName: 'play_arrow',
            handlerFunction: () =>
              createQueue(
                firstResult.songs,
                'playlist',
                firstResult.playlistId,
                true
              ),
          },
        ]}
        currentlyActivePage={currentlyActivePage}
        changeCurrentActivePage={changeCurrentActivePage}
      />
    );

    playlistResults = searchResults.playlists
      .map((playlist, index) => {
        if (index < 4)
          return (
            <Playlist
              key={index}
              name={playlist.name}
              playlistId={playlist.playlistId}
              createdDate={playlist.createdDate}
              songs={playlist.songs}
              artworkPath={playlist.artworkPath}
            />
          );
        return undefined;
      })
      .filter((x) => x !== undefined);
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
          onChange={(e) => {
            updateCurrentlyActivePageData({
              searchPage: { keyword: e.target.value },
            });
            setSearchInput(e.target.value);
          }}
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
          <div className="title-container">
            <div className="container">
              <div className="container">
                Songs{' '}
                <div className="other-stats-container">
                  {searchResults.songs && searchResults.songs.length > 0 && (
                    <span className="no-of-songs">
                      {searchResults.songs.length} results
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="other-controls-container">
              {searchResults.songs.length > 5 && (
                <Button
                  label="Show All"
                  iconName="apps"
                  className="show-all-btn"
                  clickHandler={() =>
                    currentlyActivePage.pageTitle === 'AllSearchResults' &&
                    currentlyActivePage.data.allSearchResultsPage
                      .searchQuery === searchInput
                      ? changeCurrentActivePage('Home')
                      : changeCurrentActivePage('AllSearchResults', {
                          allSearchResultsPage: {
                            searchQuery: searchInput,
                            searchFilter: 'Songs' as SearchFilters,
                            searchResults: searchResults.songs,
                          },
                        })
                  }
                />
              )}
            </div>
          </div>
          <div className="songs-container">{songResults}</div>
        </div>
        <div
          className={`secondary-container artists-list-container ${
            artistResults.length > 0 && 'active'
          }`}
        >
          <div className="title-container">
            <div className="container">
              Artists{' '}
              <div className="other-stats-container">
                {searchResults.artists && searchResults.artists.length > 0 && (
                  <span className="no-of-songs">
                    {searchResults.artists.length} results
                  </span>
                )}
              </div>
            </div>
            <div className="other-controls-container">
              {searchResults.artists.length > 5 && (
                <Button
                  label="Show All"
                  iconName="apps"
                  className="show-all-btn"
                  clickHandler={() =>
                    currentlyActivePage.pageTitle === 'AllSearchResults' &&
                    currentlyActivePage.data.allSearchResultsPage
                      .searchQuery === searchInput
                      ? changeCurrentActivePage('Home')
                      : changeCurrentActivePage('AllSearchResults', {
                          allSearchResultsPage: {
                            searchQuery: searchInput,
                            searchFilter: 'Artists' as SearchFilters,
                            searchResults: searchResults.artists,
                          },
                        })
                  }
                />
              )}
            </div>
          </div>
          <div className="artists-container">{artistResults}</div>
        </div>
        <div
          className={`secondary-container albums-list-container ${
            albumResults.length > 0 && 'active'
          }`}
        >
          <div className="title-container">
            <div className="container">
              Albums{' '}
              <div className="other-stats-container">
                {searchResults.albums && searchResults.albums.length > 0 && (
                  <span className="no-of-songs">
                    {searchResults.albums.length} results
                  </span>
                )}
              </div>
            </div>
            <div className="other-controls-container">
              {searchResults.albums.length > 4 && (
                <Button
                  label="Show All"
                  iconName="apps"
                  className="show-all-btn"
                  clickHandler={() =>
                    currentlyActivePage.pageTitle === 'AllSearchResults' &&
                    currentlyActivePage.data.allSearchResultsPage
                      .searchQuery === searchInput
                      ? changeCurrentActivePage('Home')
                      : changeCurrentActivePage('AllSearchResults', {
                          allSearchResultsPage: {
                            searchQuery: searchInput,
                            searchFilter: 'Albums' as SearchFilters,
                            searchResults: searchResults.albums,
                          },
                        })
                  }
                />
              )}
            </div>
          </div>
          <div className="albums-container">{albumResults}</div>
        </div>
        <div
          className={`secondary-container playlists-list-container ${
            playlistResults.length > 0 && 'active'
          }`}
        >
          <div className="title-container">
            <div className="container">
              Playlists{' '}
              <div className="other-stats-container">
                {searchResults.playlists &&
                  searchResults.playlists.length > 0 && (
                    <span className="no-of-songs">
                      {searchResults.playlists.length} results
                    </span>
                  )}
              </div>
            </div>
            <div className="other-controls-container">
              {searchResults.playlists.length > 4 && (
                <Button
                  label="Show All"
                  iconName="apps"
                  className="show-all-btn"
                  clickHandler={() =>
                    currentlyActivePage.pageTitle === 'AllSearchResults' &&
                    currentlyActivePage.data.allSearchResultsPage
                      .searchQuery === searchInput
                      ? changeCurrentActivePage('Home')
                      : changeCurrentActivePage('AllSearchResults', {
                          allSearchResultsPage: {
                            searchQuery: searchInput,
                            searchFilter: 'Albums' as SearchFilters,
                            searchResults: searchResults.playlists,
                          },
                        })
                  }
                />
              )}
            </div>
          </div>
          <div className="playlists-container">{playlistResults}</div>
        </div>
        {searchResults.songs.length === 0 &&
          searchResults.artists.length === 0 &&
          searchResults.albums.length === 0 &&
          searchResults.playlists.length === 0 &&
          searchInput !== '' && (
            <div className="no-search-results-container active">
              <img src={NoResultsImage} alt="Flying kite" />
              <div>
                Hmm... There&apos;s nothing that matches with what you look for.
              </div>
            </div>
          )}
        {searchInput === '' && (
          <div className="no-search-results-container active">
            <img src={SearchSomethingImage} alt="Flying kite" />
            <div>Why thinking... Search something...</div>
          </div>
        )}
      </div>
    </div>
  );
};
