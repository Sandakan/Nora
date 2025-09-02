import { getUserData, setUserData } from './filesystem';
import {
  parseAlbumArtworks,
  parseArtistArtworks,
  parseGenreArtworks,
  parsePlaylistArtworks
} from './fs/resolveFilePaths';
import logger from './logger';
import {
  searchAlbumsByName,
  searchArtistsByName,
  searchGenresByName,
  searchPlaylistsByName,
  searchSongsByName
} from './db/queries/search';
import { timeEnd, timeStart } from './utils/measureTimeUsage';
import { convertToSongData } from '../common/convert';

let recentSearchesTimeoutId: NodeJS.Timeout;
const search = async (
  filter: SearchFilters,
  value: string,
  updateSearchHistory = true,
  isIsPredictiveSearchEnabled = true
): Promise<SearchResult> => {
  const timer = timeStart();
  const [songs, artists, albums, playlists, genres] = await Promise.all([
    searchSongsByName(value).then((data) => data.map((song) => convertToSongData(song))),
    searchArtistsByName(value).then((data) =>
      data.map((artist) => {
        const artworks = artist.artworks.map((a) => a.artwork);
        return {
          artistId: String(artist.id),
          name: artist.name,
          artworkPaths: parseArtistArtworks(artworks),
          songs: artist.songs.map((s) => ({
            title: s.song.title,
            songId: String(s.song.id)
          })),
          isAFavorite: false
        } satisfies Artist;
      })
    ),
    searchAlbumsByName(value).then((data) =>
      data.map((album) => {
        const artworks = album.artworks.map((a) => a.artwork);
        return {
          albumId: String(album.id),
          title: album.title,
          artworkPaths: parseAlbumArtworks(artworks),
          songs: album.songs.map((s) => ({
            title: s.song.title,
            songId: String(s.song.id)
          }))
        } satisfies Album;
      })
    ),
    searchPlaylistsByName(value).then((data) =>
      data.map((playlist) => {
        const artworks = playlist.artworks.map((a) => a.artwork);
        return {
          playlistId: String(playlist.id),
          name: playlist.name,
          artworkPaths: parsePlaylistArtworks(artworks),
          songs: playlist.songs.map((s) => String(s.song.id)),
          isArtworkAvailable: artworks.length > 0,
          createdDate: playlist.createdAt
        } satisfies Playlist;
      })
    ),
    searchGenresByName(value).then((data) =>
      data.map((genre) => {
        const artworks = genre.artworks.map((a) => a.artwork);
        return {
          genreId: String(genre.id),
          name: genre.name,
          artworkPaths: parseGenreArtworks(artworks),
          songs: genre.songs.map((s) => ({
            title: s.song.title,
            songId: String(s.song.id)
          }))
        } satisfies Genre;
      })
    )
  ]);
  timeEnd(timer, 'Total Search');

  logger.debug(`Searching for results.`, {
    keyword: value,
    filter,
    isIsPredictiveSearchEnabled,
    totalResults: songs.length + artists.length + albums.length + playlists.length,
    songsResults: songs.length,
    artistsResults: artists.length,
    albumsResults: albums.length,
    playlistsResults: playlists.length,
    genresResults: genres.length
  });

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

  // const availableResults: string[] = [];
  // if (
  //   songs.length === 0 &&
  //   artists.length === 0 &&
  //   albums.length === 0 &&
  //   playlists.length === 0 &&
  //   genres.length === 0
  // ) {
  //   let input = value;
  //   while (availableResults.length < 5 && input.length > 0) {
  //     input = input.substring(0, input.length - 1);
  //     const results = getSongSearchResults(songsData, input, filter);
  //     if (results.length > 0) {
  //       for (let i = 0; i < results.length; i += 1) {
  //         const element = results[i].title.split(' ').slice(0, 3).join(' ');
  //         if (!availableResults.includes(element)) {
  //           availableResults.push(element);
  //           break;
  //         }
  //       }
  //     }
  //   }
  // }

  return {
    songs,
    artists,
    albums,
    playlists,
    genres,
    availableResults: []
  };
};

export default search;
