import logger from './logger';
import {
  searchAlbumsByName,
  searchArtistsByName,
  searchForAvailableResults,
  searchGenresByName,
  searchPlaylistsByName,
  searchSongsByName
} from './db/queries/search';
import { timeEnd, timeStart } from './utils/measureTimeUsage';
import {
  convertToAlbum,
  convertToArtist,
  convertToGenre,
  convertToPlaylist,
  convertToSongData
} from './utils/convert';
import { getUserSettings, saveUserSettings } from './db/queries/settings';
import { dataUpdateEvent } from './main';

let recentSearchesTimeoutId: NodeJS.Timeout;
const search = async (
  filter: SearchFilters,
  keyword: string,
  updateSearchHistory = true,
  isSimilaritySearchEnabled = true
): Promise<SearchResult> => {
  const timer = timeStart();
  const [songs, artists, albums, playlists, genres] = await Promise.all([
    searchSongsByName({ keyword, isSimilaritySearchEnabled }).then((data) =>
      data.map((song) => convertToSongData(song))
    ),
    searchArtistsByName({ keyword, isSimilaritySearchEnabled }).then((data) =>
      data.map((artist) => convertToArtist(artist))
    ),
    searchAlbumsByName({ keyword, isSimilaritySearchEnabled }).then((data) =>
      data.map((album) => convertToAlbum(album))
    ),
    searchPlaylistsByName({ keyword, isSimilaritySearchEnabled }).then((data) =>
      data.map((playlist) => convertToPlaylist(playlist))
    ),
    searchGenresByName({ keyword, isSimilaritySearchEnabled }).then((data) =>
      data.map((genre) => convertToGenre(genre))
    )
  ]);
  timeEnd(timer, 'Total Search');

  logger.debug(`Searching for results.`, {
    keyword,
    filter,
    isSimilaritySearchEnabled,
    totalResults: songs.length + artists.length + albums.length + playlists.length,
    songsResults: songs.length,
    artistsResults: artists.length,
    albumsResults: albums.length,
    playlistsResults: playlists.length,
    genresResults: genres.length
  });

  if (updateSearchHistory) {
    if (recentSearchesTimeoutId) clearTimeout(recentSearchesTimeoutId);
    recentSearchesTimeoutId = setTimeout(async () => {
      const { recentSearches } = await getUserSettings();

      if (Array.isArray(recentSearches)) {
        if (recentSearches.length > 10) recentSearches.pop();
        if (recentSearches.includes(keyword))
          recentSearches.splice(recentSearches.indexOf(keyword), 1);
        recentSearches.unshift(keyword);
      }

      await saveUserSettings({ recentSearches });
      dataUpdateEvent('userData/recentSearches');
    }, 2000);
  }

  const availableResults = new Set<string>();
  if (
    songs.length === 0 &&
    artists.length === 0 &&
    albums.length === 0 &&
    playlists.length === 0 &&
    genres.length === 0
  ) {
    let input = keyword;
    while (availableResults.size < 5 && input.length > 0) {
      input = input.substring(0, input.length - 1);
      const results = await searchForAvailableResults(input, 5);

      if (results.length > 0) {
        for (let i = 0; i < results.length; i += 1) {
          const result = results[i];

          availableResults.add(result);
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
    availableResults: Array.from(availableResults)
  };
};

export default search;
