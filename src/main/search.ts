import stringSimilarity, { ReturnTypeEnums } from 'didyoumean2';
// eslint-disable-next-line import/no-cycle
import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getSongsData,
  getPlaylistData,
  getUserData,
  setUserData,
  getBlacklistData,
} from './filesystem';
import {
  getAlbumArtworkPath,
  getArtistArtworkPath,
  getPlaylistArtworkPath,
  getSongArtworkPath,
} from './fs/resolveFilePaths';
import log from './log';
import filterUniqueObjects from './utils/filterUniqueObjects';

const getSongSearchResults = (
  songs: SavableSongData[],
  keyword: string,
  filter: SearchFilters
): SongData[] => {
  if (
    Array.isArray(songs) &&
    songs.length > 0 &&
    (filter === 'Songs' || filter === 'All')
  ) {
    const { songBlacklist } = getBlacklistData();
    let returnValue = stringSimilarity(
      keyword,
      songs as unknown as Record<string, unknown>[],
      {
        caseSensitive: false,
        matchPath: ['title'],
        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES,
      }
    ) as unknown as SavableSongData[];

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
        isBlacklisted,
      };
    });
  }
  return [];
};

const getArtistSearchResults = (
  artists: SavableArtist[],
  keyword: string,
  filter: SearchFilters
): Artist[] => {
  if (
    Array.isArray(artists) &&
    artists.length > 0 &&
    (filter === 'Artists' || filter === 'All')
  ) {
    let returnValue = stringSimilarity(
      keyword,
      artists as unknown as Record<string, unknown>[],
      {
        caseSensitive: false,
        matchPath: ['name'],
        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES,
      }
    ) as unknown as SavableArtist[];

    if (returnValue.length === 0) {
      returnValue = artists.filter((artist) =>
        new RegExp(keyword, 'gim').test(artist.name)
      );
    }

    return returnValue.map((x) => ({
      ...x,
      artworkPaths: getArtistArtworkPath(x.artworkName),
    }));
  }
  return [];
};

const getAlbumSearchResults = (
  albums: SavableAlbum[],
  keyword: string,
  filter: SearchFilters
): Album[] => {
  if (
    Array.isArray(albums) &&
    albums.length > 0 &&
    (filter === 'Albums' || filter === 'All')
  ) {
    let returnValue = stringSimilarity(
      keyword,
      albums as unknown as Record<string, unknown>[],
      {
        caseSensitive: false,
        matchPath: ['title'],
        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES,
      }
    ) as unknown as SavableAlbum[];

    if (returnValue.length === 0) {
      returnValue = albums.filter((album) =>
        new RegExp(keyword, 'gim').test(album.title)
      );
    }

    return returnValue.map((x) => ({
      ...x,
      artworkPaths: getAlbumArtworkPath(x.artworkName),
    }));
  }
  return [];
};

const getPlaylistSearchResults = (
  playlists: SavablePlaylist[],
  keyword: string,
  filter: SearchFilters
): Playlist[] => {
  if (
    Array.isArray(playlists) &&
    playlists.length > 0 &&
    (filter === 'Playlists' || filter === 'All')
  ) {
    let returnValue = stringSimilarity(
      keyword,
      playlists as unknown as Record<string, unknown>[],
      {
        caseSensitive: false,
        matchPath: ['name'],
        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES,
      }
    ) as unknown as SavablePlaylist[];

    if (returnValue.length === 0) {
      returnValue = playlists.filter((playlist) =>
        new RegExp(keyword, 'gim').test(playlist.name)
      );
    }

    return returnValue.map((x) => ({
      ...x,
      artworkPaths: getPlaylistArtworkPath(x.playlistId, x.isArtworkAvailable),
    }));
  }
  return [];
};

const getGenreSearchResults = (
  genres: SavableGenre[],
  keyword: string,
  filter: SearchFilters
): Genre[] => {
  if (
    Array.isArray(genres) &&
    genres.length > 0 &&
    (filter === 'Genres' || filter === 'All')
  ) {
    let returnValue = stringSimilarity(
      keyword,
      genres as unknown as Record<string, unknown>[],
      {
        caseSensitive: false,
        matchPath: ['name'],
        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES,
      }
    ) as unknown as SavableGenre[];

    if (returnValue.length === 0) {
      returnValue = genres.filter((genre) =>
        new RegExp(keyword, 'gim').test(genre.name)
      );
    }

    return returnValue.map((x) => ({
      ...x,
      artworkPaths: getAlbumArtworkPath(x.artworkName),
    }));
  }
  return [];
};

let recentSearchesTimeoutId: NodeJS.Timer;
const search = (
  filter: SearchFilters,
  value: string,
  updateSearchHistory = true
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

  for (let i = 0; i < keywords.length; i += 1) {
    const keyword = keywords[i];

    const songsResults = getSongSearchResults(songsData, keyword, filter);
    const artistsResults = getArtistSearchResults(artistsData, keyword, filter);
    const albumsResults = getAlbumSearchResults(albumsData, keyword, filter);
    const playlistsResults = getPlaylistSearchResults(
      playlistData,
      keyword,
      filter
    );
    const genresResults = getGenreSearchResults(genresData, keyword, filter);

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
    `Searching for results about '${value}' with ${filter} filter. Found ${
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
    songs: songs || [],
    artists: artists || [],
    albums: albums || [],
    playlists: playlists || [],
    genres: genres || [],
    availableResults,
  };
};

export default search;

// function sortBySimilarity(keyword: string, arr: SongData[]): SongData[] {
//   const key = keyword.split('');
//   const results = arr.map((res) => {
//     let score = 0;
//     const value = res.title;
//     const splitValue = value.split('');

//     // full 100 marks if both are equal
//     if (value === keyword) return { score: 100, res };

//     // 10 marks if both lengths are equal.
//     if (value.length === key.length) score += 20;

//     // max of 40 marks. Scores avg out of value length if each letter of keyword found in value
//     const avgMark1 = 40 / value.length;
//     for (let i = 0; i < key.length; i += 1) {
//       if (splitValue.some((x) => new RegExp(key[i], 'i').test(x)))
//         score += avgMark1;
//     }

//     // max of 40 marks. Scores avg out of value length if each letter of keyword found in value
//     const avgMark2 = 40 / keyword.length;
//     let str = '';
//     for (let i = 0; i < key.length; i += 1) {
//       str += key[i];
//       // eslint-disable-next-line @typescript-eslint/no-loop-func
//       if (splitValue.some((x) => new RegExp(str, 'i').test(x)))
//         score += avgMark2;
//     }

//     return { score, res };
//   });
//   return results
//     .sort((a, b) =>
//       // eslint-disable-next-line no-nested-ternary
//       a.score !== b.score ? (a.score > b.score ? -1 : 1) : 0
//     )
//     .map((x) => x.res);
// }

// / / / / / / /  / / / / /

// const key = 'like';

// const data =
//   'What it feels like, Lush Life, Me, Dear God, Habit, Sleep, Lonely, Count My Blessings, Is that What You Like now'.split(
//     ','
//   );
// console.time('t');
// const keyVal = key.split('');
// const results = data.map((res) => {
//   let score = 0;
//   const result = res.split('');
//   if (res === key) return { score: 100, res };
//   if (result.length === keyVal.length) score += 20;

//   const avgMark1 = 40 / result.length;
//   for (let i = 0; i < keyVal.length; i += 1) {
//     if (result.some((x) => new RegExp(keyVal[i], 'i').test(x)))
//       score += avgMark1;
//   }

//   const avgMark12 = 40 / key.length;
//   let str = '';
//   for (let i = 0; i < key.length; i += 1) {
//     str += key[i];
//     if (result.some((x) => new RegExp(str, 'i').test(x))) score += avgMark12;
//   }
//   return { score, res };
// });
// console.timeEnd('t');

// console.log(
//   results.sort((a, b) =>
//     a.score !== b.score ? (a.score > b.score ? -1 : 1) : 0
//   )
// );
