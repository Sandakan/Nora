// eslint-disable-next-line import/no-cycle
import {
  getData,
  getPlaylistData,
  getUserData,
  setUserData,
} from './filesystem';
import log from './log';

const getSongSearchResults = (
  songs: SongData[],
  keyword: string,
  filter: SearchFilters
) =>
  Array.isArray(songs) &&
  songs.length > 0 &&
  (filter === 'Songs' || filter === 'All')
    ? songs.filter(
        (data: SongData) =>
          new RegExp(keyword.replace(/[^w ]/, ''), 'gim').test(data.title) ||
          (data.artists
            ? new RegExp(keyword.replace(/[^w ]/, ''), 'gim').test(
                data.artists.map((artist) => artist.name).join(' ')
              )
            : false)
      )
    : [];

const getArtistSearchResults = (
  artists: Artist[],
  keyword: string,
  filter: SearchFilters
) =>
  Array.isArray(artists) &&
  artists.length > 0 &&
  (filter === 'Artists' || filter === 'All')
    ? artists.filter((data: Artist) =>
        new RegExp(keyword, 'gim').test(data.name)
      )
    : [];

const getAlbumSearchResults = (
  albums: Album[],
  keyword: string,
  filter: SearchFilters
) =>
  Array.isArray(albums) &&
  albums.length > 0 &&
  (filter === 'Albums' || filter === 'All')
    ? albums.filter((data: Album) =>
        new RegExp(keyword, 'gim').test(data.title)
      )
    : [];

const getPlaylistSearchResults = (
  playlists: Playlist[],
  keyword: string,
  filter: SearchFilters
) =>
  Array.isArray(playlists) &&
  playlists.length > 0 &&
  (filter === 'Playlists' || filter === 'All')
    ? playlists.filter((data: Playlist) =>
        new RegExp(keyword, 'gim').test(data.name)
      )
    : [];

const getGenreSearchResults = (
  genres: Genre[],
  keyword: string,
  filter: SearchFilters
) =>
  Array.isArray(genres) &&
  genres.length > 0 &&
  (filter === 'Genres' || filter === 'All')
    ? genres.filter((genre: Genre) =>
        new RegExp(keyword, 'gim').test(genre.name)
      )
    : [];

let recentSearchesTimeoutId: NodeJS.Timer;

// eslint-disable-next-line import/prefer-default-export
export const search = (
  filter: SearchFilters,
  value: string,
  updateSearchHistory = true
): SearchResult => {
  const jsonData: Data = getData();
  const playlistData = getPlaylistData();

  const songs = getSongSearchResults(jsonData.songs, value, filter);
  const artists = getArtistSearchResults(jsonData.artists, value, filter);
  const albums = getAlbumSearchResults(jsonData.albums, value, filter);
  const playlists = getPlaylistSearchResults(playlistData, value, filter);
  const genres = getGenreSearchResults(jsonData.genres, value, filter);

  log(
    `Searching for results about '${value}' with ${filter} filter. Found ${
      songs.length + artists.length + albums.length + playlists.length
    } total results, ${songs.length} songs results, ${
      artists.length
    } artists results, ${albums.length} albums results, ${
      playlists.length
    } playlists results and ${genres.length} genres results.`
  );

  const availableResults: string[] = [];
  if (updateSearchHistory) {
    if (recentSearchesTimeoutId) clearTimeout(recentSearchesTimeoutId);
    recentSearchesTimeoutId = setTimeout(() => {
      const userData = getUserData();
      if (userData) {
        const { recentSearches } = userData;
        if (Array.isArray(userData.recentSearches)) {
          if (recentSearches.length > 10) recentSearches.pop();
          if (recentSearches.includes(value))
            recentSearches.splice(recentSearches.indexOf(value), 1);
          recentSearches.unshift(value);
        }
        setUserData('recentSearches', recentSearches);
      }
    }, 2000);
  }

  if (
    songs.length === 0 &&
    artists.length === 0 &&
    albums.length === 0 &&
    playlists.length === 0 &&
    genres.length === 0
  ) {
    let input = value;
    while (availableResults.length < 5 && input.length > 0) {
      input = input.substring(0, input.length - 1);
      const results = getSongSearchResults(jsonData.songs, input, filter);
      if (results.length > 0) {
        for (let i = 0; i < results.length; i += 1) {
          const element = results[i].title.split(' ').slice(0, 3).join(' ');
          if (!availableResults.includes(element)) {
            availableResults.push(element);
            break;
          }
        }
      }
    }
  }

  return {
    songs: songs || [],
    artists: artists || [],
    albums: albums || [],
    playlists: playlists || [],
    genres: genres || [],
    availableResults,
  };
};
