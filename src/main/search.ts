import { default as stringSimilarity, ReturnTypeEnums } from 'didyoumean2';
import { getUserData, setUserData, getBlacklistData } from './filesystem';
import {
  getAlbumArtworkPath,
  getArtistArtworkPath,
  getPlaylistArtworkPath,
  getSongArtworkPath,
  parseAlbumArtworks,
  parseArtistArtworks,
  parseGenreArtworks,
  parsePlaylistArtworks,
  parseSongArtworks
} from './fs/resolveFilePaths';
import logger from './logger';
import {
  searchAlbumsByName,
  searchArtistsByName,
  searchGenresByName,
  searchPlaylistsByName,
  searchSongsByName
} from './db/queries/search';
import { parsePaletteFromArtworks } from './core/getAllSongs';
import { timeEnd, timeStart } from './utils/measureTimeUsage';

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
const search = async (
  filter: SearchFilters,
  value: string,
  updateSearchHistory = true,
  isIsPredictiveSearchEnabled = true
): Promise<SearchResult> => {
  const timer = timeStart();
  const [songs, artists, albums, playlists, genres] = await Promise.all([
    searchSongsByName(value).then((data) =>
      data.map((song) => {
        const artists =
          song.artists?.map((a) => ({ artistId: String(a.artist.id), name: a.artist.name })) ?? [];

        // Album (pick first if multiple)
        const albumObj = song.albums?.[0]?.album;
        const album = albumObj ? { albumId: String(albumObj.id), name: albumObj.title } : undefined;

        // Blacklist
        const isBlacklisted = !!song.blacklist;
        // Track number
        const trackNo = song.trackNumber ?? undefined;
        // Added date
        const addedDate = song.createdAt ? new Date(song.createdAt).getTime() : 0;
        // isAFavorite: You must join your favorites table if you have one. Here we default to false.
        const isAFavorite = false;

        const artworks = song.artworks.map((a) => a.artwork);
        return {
          title: song.title,
          artists,
          album,
          duration: Number(song.duration),
          artworkPaths: parseSongArtworks(artworks),
          path: song.path,
          songId: String(song.id),
          addedDate,
          isAFavorite,
          year: song.year ?? undefined,
          paletteData: parsePaletteFromArtworks(artworks),
          isBlacklisted,
          trackNo,
          isArtworkAvailable: artworks.length > 0
        } satisfies SongData;
      })
    ),
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
