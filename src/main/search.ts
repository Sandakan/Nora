import stringSimilarity, { ReturnTypeEnums } from 'didyoumean2';
// eslint-disable-next-line import/no-cycle
import {
  getData,
  getPlaylistData,
  getUserData,
  setUserData,
} from './filesystem';
import log from './log';

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

const getSongSearchResults = (
  songs: SongData[],
  keyword: string,
  filter: SearchFilters
) => {
  if (
    Array.isArray(songs) &&
    songs.length > 0 &&
    (filter === 'Songs' || filter === 'All')
  ) {
    // const regex = new RegExp(keyword, 'gim');
    // const results = songs.filter(
    //   (data: SongData) =>
    //     regex.test(data.title) ||
    //     (data.artists
    //       ? regex.test(data.artists.map((artist) => artist.name).join(' '))
    //       : false)
    // );
    const returnValue = stringSimilarity(
      keyword,
      songs as unknown as Record<string, unknown>[],
      {
        caseSensitive: false,
        matchPath: ['title'],
        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES,
      }
    );
    return returnValue as unknown as SongData[];
  }
  return [];
};

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
