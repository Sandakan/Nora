/* eslint-disable import/no-unresolved */
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
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import { Album } from '../AlbumsPage/Album';
import { Artist } from '../ArtistPage/Artist';
import { MostRelevantResult } from './MostRelevantResult';
import SearchResultsFilter from './SearchResultsFilter';
import SearchSomethingImage from '../../../../assets/images/Flying kite_Monochromatic.svg';
import NoResultsImage from '../../../../assets/images/Sad face_Monochromatic.svg';
import Button from '../Button';
import { Playlist } from '../PlaylistsPage/Playlist';
import Genre from '../GenresPage/Genre';
import RecentSearchResult from './RecentSearchResult';
import { Song } from '../SongsPage/Song';
import MainContainer from '../MainContainer';
import SecondaryContainer from '../SecondaryContainer';

const filterTypes = 'All Songs Albums Artists Playlists Genres'.split(
  ' '
) as SearchFilters[];

const SearchPage = () => {
  const { currentSongData, currentlyActivePage, queue } =
    useContext(AppContext);
  const {
    playSong,
    changeCurrentActivePage,
    updateCurrentlyActivePageData,
    updateQueueData,
    createQueue,
    updateNotificationPanelData,
  } = React.useContext(AppUpdateContext);

  const [searchInput, setSearchInput] = React.useState(
    currentlyActivePage.data && currentlyActivePage.data.searchPage
      ? (currentlyActivePage.data.searchPage.keyword as string)
      : ''
  );
  const deferredSearchInput = React.useDeferredValue(searchInput);
  const [searchResults, setSearchResults] = React.useState({
    albums: [],
    artists: [],
    songs: [],
    playlists: [],
    genres: [],
    availableResults: [],
  } as SearchResult);
  const [activeFilter, setActiveFilter] = React.useState(
    'All' as SearchFilters
  );
  const [recentSearchResults, setRecentSearchResults] = React.useState(
    [] as string[]
  );

  const MostRelevantResults = [];

  const changeActiveFilter = React.useCallback(
    (filterType: SearchFilters) => setActiveFilter(filterType),
    []
  );

  const filters = filterTypes.map((filterType, index) => {
    return (
      <SearchResultsFilter
        key={index}
        filterType={filterType}
        isCurrentActiveFilter={filterType === activeFilter}
        changeActiveFilter={changeActiveFilter}
      />
    );
  });

  const timeOutIdRef = React.useRef(undefined as NodeJS.Timer | undefined);
  const fetchSearchResults = React.useCallback(() => {
    if (deferredSearchInput !== '') {
      if (timeOutIdRef.current) clearTimeout(timeOutIdRef.current);
      timeOutIdRef.current = setTimeout(
        () =>
          window.api
            .search(activeFilter, deferredSearchInput)
            .then((results) => {
              return setSearchResults(results);
            }),
        200
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
  }, [activeFilter, deferredSearchInput, timeOutIdRef]);

  const fetchRecentSearchResults = React.useCallback(() => {
    window.api.getUserData().then((userData) => {
      if (userData && Array.isArray(userData.recentSearches))
        return setRecentSearchResults(userData.recentSearches);
      return undefined;
    });
  }, []);

  React.useEffect(() => fetchRecentSearchResults(), [fetchRecentSearchResults]);

  React.useEffect(() => {
    fetchSearchResults();
    const manageSearchResultsUpdates = (
      _: unknown,
      eventType: DataUpdateEventTypes
    ) => {
      if (
        eventType === 'songs' ||
        eventType === 'artists' ||
        eventType === 'albums' ||
        eventType === 'playlists/newPlaylist' ||
        eventType === 'playlists/deletedPlaylist' ||
        eventType === 'genres/newGenre' ||
        eventType === 'genres/deletedGenre'
      )
        fetchSearchResults();
      if (eventType === 'userData/recentSearches') fetchRecentSearchResults();
    };
    window.api.dataUpdateEvent(manageSearchResultsUpdates);
    return () => {
      window.api.removeDataUpdateEventListener(manageSearchResultsUpdates);
    };
  }, [fetchSearchResults, fetchRecentSearchResults]);

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
              updateQueueData(undefined, [...queue.queue, firstResult.songId]);
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
      />
    );
  }
  const songResults = React.useMemo(
    () =>
      searchResults.songs.length > 0
        ? searchResults.songs
            .map((song, index) => {
              if (index < 5)
                return (
                  <Song
                    key={`${song.songId}-${index}`}
                    index={index}
                    title={song.title}
                    artists={song.artists}
                    artworkPath={song.artworkPath}
                    duration={song.duration}
                    songId={song.songId}
                    path={song.path}
                    isAFavorite={song.isAFavorite}
                  />
                );
              else return undefined;
            })
            .filter((song) => song !== undefined)
        : [],
    [searchResults.songs]
  );
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
        contextMenuItems={[
          {
            label: 'Play all Songs',
            iconName: 'play_arrow',
            handlerFunction: () =>
              createQueue(
                firstResult.songs.map((song) => song.songId),
                'artist',
                false,
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
              updateQueueData(undefined, [
                ...queue.queue,
                ...firstResult.songs.map((song) => song.songId),
              ]);
            },
          },
        ]}
      />
    );
  }
  const artistResults = React.useMemo(
    () =>
      searchResults.artists.length > 0
        ? searchResults.artists
            .map((artist, index) => {
              if (index < 5)
                return (
                  <Artist
                    key={`${artist.artistId}-${index}`}
                    name={artist.name}
                    artworkPath={artist.artworkPath}
                    artistId={artist.artistId}
                    songIds={artist.songs.map((song) => song.songId)}
                    onlineArtworkPaths={artist.onlineArtworkPaths}
                    className="mb-4"
                  />
                );
              else return undefined;
            })
            .filter((artist) => artist !== undefined)
        : [],
    [searchResults.artists]
  );

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
        contextMenuItems={[
          {
            label: 'Play',
            iconName: 'play_arrow',
            handlerFunction: () =>
              createQueue(
                firstResult.songs.map((song) => song.songId),
                'album',
                false,
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
      />
    );
  }

  const albumResults = React.useMemo(
    () =>
      searchResults.albums.length > 0
        ? searchResults.albums
            .map((album, index) => {
              if (index < 4)
                return (
                  <Album
                    key={`${album.albumId}-${index}`}
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
            .filter((album) => album !== undefined)
        : [],
    [searchResults.albums]
  );

  if (searchResults.playlists.length > 0) {
    const firstResult = searchResults.playlists[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="playlist"
        title={firstResult.name}
        key={3}
        id={firstResult.playlistId}
        artworkPath={firstResult.artworkPath}
        infoType1={`${firstResult.songs.length} song${
          firstResult.songs.length === 1 ? '' : 's'
        }`}
        contextMenuItems={[
          {
            label: 'Play',
            iconName: 'play_arrow',
            handlerFunction: () =>
              createQueue(
                firstResult.songs,
                'playlist',
                false,
                firstResult.playlistId,
                true
              ),
          },
        ]}
      />
    );
  }

  const playlistResults = React.useMemo(
    () =>
      searchResults.playlists.length > 0
        ? searchResults.playlists
            .map((playlist, index) => {
              if (index < 4)
                return (
                  <Playlist
                    key={`${playlist.playlistId}-${index}`}
                    name={playlist.name}
                    playlistId={playlist.playlistId}
                    createdDate={playlist.createdDate}
                    songs={playlist.songs}
                    artworkPath={playlist.artworkPath}
                  />
                );
              return undefined;
            })
            .filter((x) => x !== undefined)
        : [],
    [searchResults.playlists]
  );

  if (searchResults.genres.length > 0) {
    const firstResult = searchResults.genres[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="genre"
        title={firstResult.name}
        key={4}
        id={firstResult.genreId}
        artworkPath={firstResult.artworkPath}
        infoType1={`${firstResult.songs.length} song${
          firstResult.songs.length === 1 ? '' : 's'
        }`}
        contextMenuItems={[
          {
            label: 'Play',
            iconName: 'play_arrow',
            handlerFunction: () =>
              createQueue(
                firstResult.songs.map((song) => song.songId),
                'playlist',
                false,
                firstResult.genreId,
                true
              ),
          },
        ]}
      />
    );
  }

  const genreResults = React.useMemo(
    () =>
      searchResults.genres.length > 0
        ? searchResults.genres
            .map((genre, index) => {
              if (index < 4)
                return (
                  <Genre
                    key={`${genre.genreId}-${index}`}
                    title={genre.name}
                    genreId={genre.genreId}
                    noOfSongs={genre.songs.length}
                    artworkPath={genre.artworkPath}
                    backgroundColor={genre.backgroundColor}
                  />
                );
              return undefined;
            })
            .filter((x) => x !== undefined)
        : [],
    [searchResults.genres]
  );

  const recentSearchResultComponents = React.useMemo(
    () =>
      recentSearchResults.length > 0
        ? recentSearchResults.map((result, index) => (
            <RecentSearchResult
              key={index}
              result={result}
              clickHandler={() => {
                setSearchInput(result);
              }}
            />
          ))
        : [],
    [recentSearchResults]
  );

  const availableSearchResultComponents = React.useMemo(
    () =>
      searchResults.availableResults.length > 0
        ? searchResults.availableResults.map((result, index) => (
            <RecentSearchResult
              key={index}
              result={result}
              clickHandler={() => {
                setSearchInput(result);
              }}
            />
          ))
        : [],
    [searchResults.availableResults]
  );

  return (
    <MainContainer>
      <>
        <div className="search-bar-container appear-from-bottom flex items-center bg-background-color-2 dark:bg-dark-background-color-2 rounded-3xl py-1 px-2 w-1/2 mb-4">
          <span className="material-icons-round icon p-2 text-2xl text-[#cccccc99] flex items-center justify-center">
            search
          </span>
          <input
            type="search"
            name="search"
            id="searchBar"
            className="w-full h-full outline-none border-2 border-[transparent] bg-[transparent] text-font-color-black dark:text-font-color-white placeholder:text-[#ccc]"
            aria-label="Search"
            placeholder="Search for anything"
            value={searchInput}
            onChange={(e) => {
              updateCurrentlyActivePageData({
                searchPage: { keyword: e.target.value },
              });
              setSearchInput(e.target.value);
            }}
            onKeyDown={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
        <div className="search-filters-container mb-6">
          <ul className="flex items-center">{filters}</ul>
        </div>
        <div className="search-results-container relative">
          <SecondaryContainer
            className={`most-relevant-results-container mt-4 ${
              MostRelevantResults.length > 0
                ? 'active visible relative'
                : 'invisible absolute'
            }`}
          >
            <>
              <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-2xl font-medium dark:text-font-color-white">
                Most Relevant
              </div>
              <div
                className={`results-container overflow-x-auto tranlate-y-8 opacity-0 invisible transition-[transform,opacity] ${
                  MostRelevantResults.length > 0 &&
                  'opacity-100 flex visible translate-y-0 pb-4 [&>div]:hidden [&>div.active]:flex'
                }`}
              >
                {MostRelevantResults}
              </div>
            </>
          </SecondaryContainer>
          <SecondaryContainer
            className={`secondary-container songs-list-container ${
              songResults.length > 0 ? 'active relative mt-8' : 'absolute mt-4'
            }`}
          >
            <>
              <div
                className={`title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-2xl font-medium dark:text-font-color-white ${
                  songResults.length > 0
                    ? 'opacity-100 visible'
                    : 'opacity-0 invisible'
                }`}
              >
                <div className="container flex">
                  Songs{' '}
                  <div className="other-stats-container text-xs ml-12 flex items-center">
                    {searchResults.songs && searchResults.songs.length > 0 && (
                      <span className="no-of-songs">
                        {searchResults.songs.length} results
                      </span>
                    )}
                  </div>
                </div>
                <div className="other-controls-container flex">
                  {searchResults.songs.length > 5 && (
                    <Button
                      label="Show All"
                      iconName="apps"
                      className="show-all-btn text-sm font-normal"
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
              <div
                className={`songs-container mb-12 ${
                  songResults.length > 0
                    ? 'opacity-100 visible translate-y-0'
                    : 'opacity-0 invisible translate-y-8 transition-transform'
                }`}
              >
                {songResults}
              </div>
            </>
          </SecondaryContainer>
          <SecondaryContainer
            className={`secondary-container artists-list-container mt-4 ${
              artistResults.length > 0
                ? 'active relative'
                : 'opacity-0 invisible absolute'
            }`}
          >
            <>
              <div
                className={`title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-2xl font-medium dark:text-font-color-white ${
                  artistResults.length > 0 && 'opacity-100 visible'
                }`}
              >
                <div className="container flex">
                  Artists{' '}
                  <div className="other-stats-container text-xs ml-12 flex items-center">
                    {searchResults.artists &&
                      searchResults.artists.length > 0 && (
                        <span className="no-of-songs">
                          {searchResults.artists.length} results
                        </span>
                      )}
                  </div>
                </div>
                <div className="other-controls-container flex">
                  {searchResults.artists.length > 5 && (
                    <Button
                      label="Show All"
                      iconName="apps"
                      className="show-all-btn text-sm font-normal"
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
              <div className="artists-container flex flex-wrap mb-12">
                {artistResults}
              </div>
            </>
          </SecondaryContainer>
          <SecondaryContainer
            className={`secondary-container albums-list-container mt-4 ${
              albumResults.length > 0
                ? 'active relative'
                : 'opacity-0 invisible absolute'
            }`}
          >
            <>
              <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-2xl font-medium dark:text-font-color-white">
                <div className="container flex">
                  Albums{' '}
                  <div className="other-stats-container text-xs ml-12 flex items-center">
                    {searchResults.albums &&
                      searchResults.albums.length > 0 && (
                        <span className="no-of-songs">
                          {searchResults.albums.length} results
                        </span>
                      )}
                  </div>
                </div>
                <div className="other-controls-container flex">
                  {searchResults.albums.length > 4 && (
                    <Button
                      label="Show All"
                      iconName="apps"
                      className="show-all-btn text-sm font-normal"
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
              <div className="albums-container flex flex-wrap">
                {albumResults}
              </div>
            </>
          </SecondaryContainer>
          <SecondaryContainer
            className={`secondary-container playlists-list-container mt-4 ${
              playlistResults.length > 0
                ? 'active relative'
                : 'absolute invisible'
            }`}
          >
            <>
              <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-2xl font-medium dark:text-font-color-white">
                <div className="container flex">
                  Playlists{' '}
                  <div className="other-stats-container text-xs ml-12 flex items-center">
                    {searchResults.playlists &&
                      searchResults.playlists.length > 0 && (
                        <span className="no-of-songs">
                          {searchResults.playlists.length} results
                        </span>
                      )}
                  </div>
                </div>
                <div className="other-controls-container flex">
                  {searchResults.playlists.length > 4 && (
                    <Button
                      label="Show All"
                      iconName="apps"
                      className="show-all-btn text-sm font-normal"
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
              <div className="playlists-container  h-full flex flex-wrap">
                {playlistResults}
              </div>
            </>
          </SecondaryContainer>
          <SecondaryContainer
            className={`secondary-container genres-list-container appear-from=bottom mt-4 text-font-color-black dark:text-font-color-white ${
              genreResults.length > 0 ? 'active relative' : 'invisible absolute'
            }`}
          >
            <>
              <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-2xl font-medium dark:text-font-color-white">
                <div className="container flex">
                  Genres
                  <div className="other-stats-container text-xs ml-12 flex items-center">
                    {searchResults.genres.length > 0 && (
                      <div className="no-of-genres">{`${
                        searchResults.genres.length
                      } genre${
                        searchResults.genres.length === 1 ? '' : 's'
                      }`}</div>
                    )}
                  </div>
                </div>
                <div className="other-controls-container flex">
                  {searchResults.genres.length > 4 && (
                    <Button
                      label="Show All"
                      iconName="apps"
                      className="show-all-btn text-sm font-normal"
                      clickHandler={() =>
                        currentlyActivePage.pageTitle === 'AllSearchResults' &&
                        currentlyActivePage.data.allSearchResultsPage
                          .searchQuery === searchInput
                          ? changeCurrentActivePage('Home')
                          : changeCurrentActivePage('AllSearchResults', {
                              allSearchResultsPage: {
                                searchQuery: searchInput,
                                searchFilter: 'Genres' as SearchFilters,
                                searchResults: searchResults.genres,
                              },
                            })
                      }
                    />
                  )}
                </div>
                <div className="other-controls-container flex"></div>
              </div>
              {searchResults.genres.length > 0 && (
                <div className="genres-container flex flex-wrap">
                  {genreResults}
                </div>
              )}
            </>
          </SecondaryContainer>
          {searchResults.songs.length === 0 &&
            searchResults.artists.length === 0 &&
            searchResults.albums.length === 0 &&
            searchResults.playlists.length === 0 &&
            searchResults.genres.length === 0 &&
            searchInput !== '' && (
              <div className="no-search-results-container w-full flex flex-col items-center justify-center text-center mt-16 active relative appear-from-bottom">
                <img
                  src={NoResultsImage}
                  className={
                    searchResults.songs.length === 0 &&
                    searchResults.artists.length === 0 &&
                    searchResults.albums.length === 0 &&
                    searchResults.playlists.length === 0 &&
                    searchResults.genres.length === 0 &&
                    searchInput !== ''
                      ? 'w-60 max-w-full mb-4'
                      : ''
                  }
                  alt="Flying kite"
                />
                <div className="description text-2xl text-[#ccc] dark:text-[#ccc]">
                  Hmm... There&apos;s nothing that matches with what you look
                  for.
                </div>
                <div className="recent-search-results-container flex flex-wrap items-center justify-center px-[15%]">
                  {availableSearchResultComponents}
                </div>
              </div>
            )}
          {searchInput.trim() === '' && (
            <div className="no-search-results-container w-full flex flex-col items-center justify-center text-center mt-16 active relative appear-from-bottom">
              <img
                src={SearchSomethingImage}
                className={
                  searchResults.songs.length === 0 &&
                  searchResults.artists.length === 0 &&
                  searchResults.albums.length === 0 &&
                  searchResults.playlists.length === 0 &&
                  searchResults.genres.length === 0 &&
                  searchInput === ''
                    ? 'w-60 max-w-full mb-4'
                    : ''
                }
                alt="Flying kite"
              />
              <div className="description text-2xl text-[#ccc] dark:text-[#ccc]">
                Why thinking... Search something...
              </div>
              <div className="recent-search-results-container flex flex-wrap items-center justify-center px-[15%]">
                {recentSearchResultComponents}
              </div>
            </div>
          )}
        </div>
      </>
    </MainContainer>
  );
};

export default SearchPage;
