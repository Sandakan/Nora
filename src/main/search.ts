// using require because an error is displayed saying 'stringSimilarity' is not a function when using import.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: stringSimilarity, ReturnTypeEnums } = require('didyoumean2');
import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getSongsData,
  getPlaylistData,
  getUserData,
  setUserData,
  getBlacklistData
} from './filesystem';
import {
  getAlbumArtworkPath,
  getArtistArtworkPath,
  getPlaylistArtworkPath,
  getSongArtworkPath
} from './fs/resolveFilePaths';
import log from './log';
import filterUniqueObjects from './utils/filterUniqueObjects';

const getSongSearchResults = (
  songs: SavableSongData[],
  keyword: string,
  filter: SearchFilters,
  isPredictiveSearchEnabled = true
): SongData[] => {
  if (Array.isArray(songs) && songs.length > 0 && (filter === 'Songs' || filter === 'All')) {
    const { songBlacklist } = getBlacklistData();
    let returnValue: SavableSongData[] = [];

    if (isPredictiveSearchEnabled)
      returnValue = stringSimilarity(keyword, songs as unknown as Record<string, unknown>[], {
        caseSensitive: false,
        matchPath: ['title'],
        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES
      }) as unknown as SavableSongData[];

    if (returnValue.length === 0) {
      const regex = new RegExp(keyword, 'gim');
      const results = songs.filter((song) => {
        const isTitleAMatch = regex.test(song.title);
        const isArtistsAMatch = song.artists
          ? regex.test(song.artists.map((artist) => artist.name).join(' '))
          : false;

        return isTitleAMatch || isArtistsAMatch;
      });

      returnValue = results;
    }
    return returnValue.map((x) => {
      const isBlacklisted = songBlacklist?.includes(x.songId);
      return {
        ...x,
        artworkPaths: getSongArtworkPath(x.songId, x.isArtworkAvailable),
        isBlacklisted
      };
    });
  }
  return [];
};

const getArtistSearchResults = (
  artists: SavableArtist[],
  keyword: string,
  filter: SearchFilters,
  isPredictiveSearchEnabled = true
): Artist[] => {
  if (Array.isArray(artists) && artists.length > 0 && (filter === 'Artists' || filter === 'All')) {
    let returnValue: SavableArtist[] = [];

    if (isPredictiveSearchEnabled)
      returnValue = stringSimilarity(keyword, artists as unknown as Record<string, unknown>[], {
        caseSensitive: false,
        matchPath: ['name'],
        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES
      }) as unknown as SavableArtist[];

    if (returnValue.length === 0) {
      returnValue = artists.filter((artist) => new RegExp(keyword, 'gim').test(artist.name));
    }

    return returnValue.map((x) => ({
      ...x,
      artworkPaths: getArtistArtworkPath(x.artworkName)
    }));
  }
  return [];
};

const getAlbumSearchResults = (
  albums: SavableAlbum[],
  keyword: string,
  filter: SearchFilters,
  isPredictiveSearchEnabled = true
): Album[] => {
  if (Array.isArray(albums) && albums.length > 0 && (filter === 'Albums' || filter === 'All')) {
    let returnValue: SavableAlbum[] = [];

    if (isPredictiveSearchEnabled)
      returnValue = stringSimilarity(keyword, albums as unknown as Record<string, unknown>[], {
        caseSensitive: false,
        matchPath: ['title'],
        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES
      }) as unknown as SavableAlbum[];

    if (returnValue.length === 0) {
      returnValue = albums.filter((album) => new RegExp(keyword, 'gim').test(album.title));
    }

    return returnValue.map((x) => ({
      ...x,
      artworkPaths: getAlbumArtworkPath(x.artworkName)
    }));
  }
  return [];
};

const getPlaylistSearchResults = (
  playlists: SavablePlaylist[],
  keyword: string,
  filter: SearchFilters,
  isPredictiveSearchEnabled = true
): Playlist[] => {
  if (
    Array.isArray(playlists) &&
    playlists.length > 0 &&
    (filter === 'Playlists' || filter === 'All')
  ) {
    let returnValue: SavablePlaylist[] = [];

    if (isPredictiveSearchEnabled)
      returnValue = stringSimilarity(keyword, playlists as unknown as Record<string, unknown>[], {
        caseSensitive: false,
        matchPath: ['name'],
        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES
      }) as unknown as SavablePlaylist[];

    if (returnValue.length === 0) {
      returnValue = playlists.filter((playlist) => new RegExp(keyword, 'gim').test(playlist.name));
    }

    return returnValue.map((x) => ({
      ...x,
      artworkPaths: getPlaylistArtworkPath(x.playlistId, x.isArtworkAvailable)
    }));
  }
  return [];
};

const getGenreSearchResults = (
  genres: SavableGenre[],
  keyword: string,
  filter: SearchFilters,
  isPredictiveSearchEnabled = true
): Genre[] => {
  if (Array.isArray(genres) && genres.length > 0 && (filter === 'Genres' || filter === 'All')) {
    let returnValue: SavableGenre[] = [];

    if (isPredictiveSearchEnabled)
      returnValue = stringSimilarity(keyword, genres as unknown as Record<string, unknown>[], {
        caseSensitive: false,
        matchPath: ['name'],
        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES
      }) as unknown as SavableGenre[];

    if (returnValue.length === 0) {
      returnValue = genres.filter((genre) => new RegExp(keyword, 'gim').test(genre.name));
    }

    return returnValue.map((x) => ({
      ...x,
      artworkPaths: getAlbumArtworkPath(x.artworkName)
    }));
  }
  return [];
};

let recentSearchesTimeoutId: NodeJS.Timeout;
const search = (
  filter: SearchFilters,
  value: string,
  updateSearchHistory = true,
  isIsPredictiveSearchEnabled = true
): SearchResult => {
  const songsData = getSongsData();
  const artistsData = getArtistsData();
  const albumsData = getAlbumsData();
  const genresData = getGenresData();
  const playlistData = getPlaylistData();

  const keywords = value.split(';');

  let songs: SongData[] = [];
  let artists: Artist[] = [];
  let albums: Album[] = [];
  let playlists: Playlist[] = [];
  let genres: Genre[] = [];

  for (const keyword of keywords) {
    const songsResults = getSongSearchResults(
      songsData,
      keyword,
      filter,
      isIsPredictiveSearchEnabled
    );
    const artistsResults = getArtistSearchResults(
      artistsData,
      keyword,
      filter,
      isIsPredictiveSearchEnabled
    );
    const albumsResults = getAlbumSearchResults(
      albumsData,
      keyword,
      filter,
      isIsPredictiveSearchEnabled
    );
    const playlistsResults = getPlaylistSearchResults(
      playlistData,
      keyword,
      filter,
      isIsPredictiveSearchEnabled
    );
    const genresResults = getGenreSearchResults(
      genresData,
      keyword,
      filter,
      isIsPredictiveSearchEnabled
    );

    songs.push(...songsResults);
    artists.push(...artistsResults);
    albums.push(...albumsResults);
    playlists.push(...playlistsResults);
    genres.push(...genresResults);
  }

  songs = filterUniqueObjects(songs, 'songId');
  artists = filterUniqueObjects(artists, 'artistId');
  albums = filterUniqueObjects(albums, 'albumId');
  playlists = filterUniqueObjects(playlists, 'playlistId');
  genres = filterUniqueObjects(genres, 'genreId');

  log(
    `Searching for results about '${value}' with ${filter} filter with Predictive Search ${
      isIsPredictiveSearchEnabled ? 'enabled' : 'disabled'
    }. Found ${
      songs.length + artists.length + albums.length + playlists.length
    } total results, ${songs.length} songs results, ${
      artists.length
    } artists results, ${albums.length} albums results, ${
      playlists.length
    } playlists results and ${genres.length} genres results.`
  );

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

  const availableResults: string[] = [];
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
      const results = getSongSearchResults(songsData, input, filter);
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
    songs,
    artists,
    albums,
    playlists,
    genres,
    availableResults
  };
};

export default search;
