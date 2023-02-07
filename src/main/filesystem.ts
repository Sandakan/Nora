/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { app } from 'electron';
import Store from 'electron-store';
import log from './log';
import { dataUpdateEvent } from './main';
import { appPreferences } from '../../package.json';

// const RESOURCES_PATH = app.isPackaged
//   ? path.join(process.resourcesPath, 'assets')
//   : path.join(__dirname, '../../assets');

export const DEFAULT_ARTWORK_SAVE_LOCATION = path.join(
  app.getPath('userData'),
  'song_covers'
);
export const DEFAULT_FILE_URL = 'nora://localFiles/';

const USER_DATA_TEMPLATE: UserData = {
  theme: { isDarkMode: false, useSystemTheme: true },
  currentSong: { songId: null, stoppedPosition: 0 },
  volume: { isMuted: false, value: 100 },
  musicFolders: [],
  songBlacklist: [],
  defaultPage: 'Home',
  isShuffling: false,
  isRepeating: 'false',
  preferences: {
    doNotShowRemoveSongFromLibraryConfirm: false,
    isReducedMotion: false,
    songIndexing: false,
    autoLaunchApp: false,
    isMiniPlayerAlwaysOnTop: false,
    doNotVerifyWhenOpeningLinks: false,
    showSongRemainingTime: false,
    showArtistArtworkNearSongControls: false,
    isMusixmatchLyricsEnabled: false,
    disableBackgroundArtworks: false,
  },
  windowPositions: {},
  windowDiamensions: {},
  sortingStates: {},
  recentSearches: [],
};
export const HISTORY_PLAYLIST_TEMPLATE: SavablePlaylist = {
  name: 'History',
  playlistId: 'History',
  createdDate: new Date(),
  songs: [],
  isArtworkAvailable: true,
};
export const FAVORITES_PLAYLIST_TEMPLATE: SavablePlaylist = {
  name: 'Favorites',
  playlistId: 'Favorites',
  createdDate: new Date(),
  songs: [],
  isArtworkAvailable: true,
};
const PLAYLIST_DATA_TEMPLATE: SavablePlaylist[] = [
  HISTORY_PLAYLIST_TEMPLATE,
  FAVORITES_PLAYLIST_TEMPLATE,
];

const songStore = new Store({
  name: 'songs',
  defaults: {
    songs: [],
  },
  schema: {
    songs: {
      type: 'array',
    },
  },
  beforeEachMigration: (_store, context) => {
    log(
      `Migrating songs.json from app versions ${context.fromVersion} → ${context.toVersion}`
    );
  },
  migrations: {
    '1.0.0-alpha': (store) => {
      log('Starting the songs.json migration process.', {
        version: '>=1.0.0-alpha;',
      });
      const songs = store.get('songs') as SavableSongData[];
      if (Array.isArray(songs) && songs.length > 0) {
        const updatedSongs: SavableSongData[] = songs.map((song) => {
          return {
            ...song,
            addedDate:
              typeof song.addedDate === 'string'
                ? new Date(song.addedDate).getTime()
                : song.addedDate,
            modifiedDate:
              typeof song.modifiedDate === 'string'
                ? new Date(song.modifiedDate).getTime()
                : song.modifiedDate,
            createdDate:
              typeof song.createdDate === 'string'
                ? new Date(song.createdDate).getTime()
                : song.createdDate,
          };
        });
        store.set('songs', updatedSongs);
      }
    },
  },
});
const artistStore = new Store({
  name: 'artists',
  defaults: {
    artists: [],
  },
  schema: {
    artists: {
      type: 'array',
    },
  },
  beforeEachMigration: (_store, context) => {
    log(
      `Migrating artists.json from app versions ${context.fromVersion} → ${context.toVersion}`
    );
  },
  migrations: {
    '0.8.0-alpha+2022091400': (store) => {
      log(
        'Starting the artists.json migration process.\nVERSION :>=0.8.0-alpha+2022091400;'
      );
      const artists = store.get('artists') as SavableArtist[];
      if (Array.isArray(artists) && artists.length > 0) {
        const updatedArtists: SavableArtist[] = artists.map((artist) => {
          return {
            ...artist,
            isAFavorite: artist.isAFavorite ?? false,
          };
        });
        store.set('artists', updatedArtists);
      }
    },
  },
});
const genreStore = new Store({
  name: 'genres',
  defaults: {
    genres: [],
  },
  schema: {
    genres: {
      type: 'array',
    },
  },
  beforeEachMigration: (_store, context) => {
    log(
      `Migrating genres.json from app versions ${context.fromVersion} → ${context.toVersion}`
    );
  },
});
const albumStore = new Store({
  name: 'albums',
  defaults: {
    albums: [],
  },
  schema: {
    albums: {
      type: 'array',
    },
  },
  beforeEachMigration: (_store, context) => {
    log(
      `Migrating albums.json from app versions ${context.fromVersion} → ${context.toVersion}`
    );
  },
});

const playlistDataStore = new Store({
  name: 'playlists',
  defaults: {
    playlists: PLAYLIST_DATA_TEMPLATE,
  },
  schema: {
    playlists: {
      type: 'array',
    },
  },
  beforeEachMigration: (_store, context) => {
    log(
      `Migrating playlists.json from app versions ${context.fromVersion} → ${context.toVersion}`
    );
  },
});

const userDataStore = new Store({
  name: 'userData',
  defaults: {
    userData: USER_DATA_TEMPLATE,
  },
  schema: {
    userData: {
      type: 'object',
    },
  },
  beforeEachMigration: (_store, context) => {
    log(
      `Migrating userData.json from app versions ${context.fromVersion} → ${context.toVersion}`
    );
  },
});

const listeningDataStore = new Store({
  name: 'listening_data',
  clearInvalidConfig: true,
  defaults: {
    listeningData: [],
  },
  schema: {
    listeningData: {
      type: 'array',
    },
  },
  beforeEachMigration: (_store, context) => {
    log(
      `Migrating listeningData.json from app versions ${context.fromVersion} → ${context.toVersion}`
    );
  },
});

export const supportedMusicExtensions =
  appPreferences.supportedMusicExtensions.map((x) => `.${x}`);

let cachedSongsData = songStore.get('songs', []) as SavableSongData[];
let cachedArtistsData = artistStore.get('artists', []) as SavableArtist[];
let cachedAlbumsData = albumStore.get('albums', []) as SavableAlbum[];
let cachedGenresData = genreStore.get('genres', []) as SavableGenre[];
let cachedPlaylistsData = playlistDataStore.get(
  'playlists',
  PLAYLIST_DATA_TEMPLATE
) as SavablePlaylist[];
let cachedUserData: UserData = userDataStore.get(
  'userData',
  USER_DATA_TEMPLATE
) as UserData;
let cachedListeningData = listeningDataStore.get(
  'listeningData',
  []
) as SongListeningData[];

export const getUserData = () => {
  if (cachedUserData && Object.keys(cachedUserData).length !== 0)
    return cachedUserData;
  return userDataStore.get('userData', USER_DATA_TEMPLATE) as UserData;
};

export function setUserData(dataType: UserDataTypes, data: unknown) {
  const userData = getUserData();
  if (userData) {
    if (dataType === 'theme' && typeof data === 'object')
      userData.theme = data as typeof userData.theme;
    else if (
      dataType === 'currentSong.songId' &&
      (typeof data === 'string' || data === null)
    )
      userData.currentSong.songId = data;
    else if (
      dataType === 'currentSong.stoppedPosition' &&
      typeof data === 'number'
    )
      userData.currentSong.stoppedPosition = data;
    else if (dataType === 'volume.value' && typeof data === 'number')
      userData.volume.value = data;
    else if (dataType === 'volume.isMuted' && typeof data === 'boolean')
      userData.volume.isMuted = data;
    else if (dataType === 'musicFolders' && Array.isArray(data)) {
      userData.musicFolders = data;
    } else if (dataType === 'defaultPage' && typeof data === 'string') {
      userData.defaultPage = data as DefaultPages;
    } else if (dataType === 'isRepeating' && typeof data === 'string') {
      userData.isRepeating = data as RepeatTypes;
    } else if (dataType === 'isShuffling' && typeof data === 'boolean') {
      userData.isShuffling = data;
    } else if (dataType === 'queue' && typeof data === 'object') {
      userData.queue = data as Queue;
    } else if (
      dataType === 'windowPositions.mainWindow' &&
      typeof data === 'object'
    ) {
      userData.windowPositions.mainWindow = data as WindowCordinates;
    } else if (
      dataType === 'windowPositions.miniPlayer' &&
      typeof data === 'object'
    ) {
      userData.windowPositions.miniPlayer = data as WindowCordinates;
    } else if (
      dataType === 'windowDiamensions.mainWindow' &&
      typeof data === 'object'
    ) {
      userData.windowDiamensions.mainWindow = data as WindowCordinates;
    } else if (
      dataType === 'windowDiamensions.miniPlayer' &&
      typeof data === 'object'
    ) {
      userData.windowDiamensions.miniPlayer = data as WindowCordinates;
    } else if (dataType === 'songBlacklist' && Array.isArray(data)) {
      userData.songBlacklist = data as string[];
    } else if (dataType === 'recentSearches' && Array.isArray(data)) {
      userData.recentSearches = data as string[];
    } else if (
      dataType === 'preferences.doNotShowRemoveSongFromLibraryConfirm' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.doNotShowRemoveSongFromLibraryConfirm = data;
    } else if (
      dataType === 'preferences.isReducedMotion' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.isReducedMotion = data;
    } else if (
      dataType === 'preferences.songIndexing' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.songIndexing = data;
    } else if (
      dataType === 'preferences.autoLaunchApp' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.autoLaunchApp = data;
    } else if (
      dataType === 'preferences.isMiniPlayerAlwaysOnTop' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.isMiniPlayerAlwaysOnTop = data;
    } else if (
      dataType === 'preferences.doNotVerifyWhenOpeningLinks' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.doNotVerifyWhenOpeningLinks = data;
    } else if (
      dataType === 'preferences.noUpdateNotificationForNewUpdate' &&
      typeof data === 'string'
    ) {
      userData.preferences.noUpdateNotificationForNewUpdate = data;
    } else if (
      dataType === 'preferences.showArtistArtworkNearSongControls' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.showArtistArtworkNearSongControls = data;
    } else if (
      dataType === 'preferences.showSongRemainingTime' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.showSongRemainingTime = data;
    } else if (
      dataType === 'preferences.isMusixmatchLyricsEnabled' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.isMusixmatchLyricsEnabled = data;
    } else if (
      dataType === 'preferences.disableBackgroundArtworks' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.disableBackgroundArtworks = data;
    } else if (
      dataType === 'sortingStates.songsPage' &&
      typeof data === 'string'
    ) {
      userData.sortingStates.songsPage = data as SongSortTypes;
    } else if (
      dataType === 'sortingStates.artistsPage' &&
      typeof data === 'string'
    ) {
      userData.sortingStates.artistsPage = data as ArtistSortTypes;
    } else if (
      dataType === 'sortingStates.albumsPage' &&
      typeof data === 'string'
    ) {
      userData.sortingStates.albumsPage = data as AlbumSortTypes;
    } else if (
      dataType === 'sortingStates.genresPage' &&
      typeof data === 'string'
    ) {
      userData.sortingStates.genresPage = data as GenreSortTypes;
    } else if (
      dataType === 'customMusixmatchUserToken' &&
      typeof data === 'string'
    ) {
      userData.customMusixmatchUserToken = data;
    } else
      return log(
        'Error occurred in setUserData function due ot invalid dataType or data.'
      );

    cachedUserData = userData;
    userDataStore.set('userData', userData);

    if (dataType === 'musicFolders') dataUpdateEvent('userData/musicFolder');
    else if (
      dataType === 'currentSong.songId' ||
      dataType === 'currentSong.stoppedPosition'
    )
      dataUpdateEvent('userData/currentSong');
    else if (dataType === 'queue') dataUpdateEvent('userData/queue');
    else if (dataType === 'volume.isMuted' || dataType === 'volume.value')
      dataUpdateEvent('userData/volume');
    else if (
      dataType === 'windowDiamensions.mainWindow' ||
      dataType === 'windowDiamensions.miniPlayer'
    )
      dataUpdateEvent('userData/windowDiamension');
    else if (
      dataType === 'windowPositions.mainWindow' ||
      dataType === 'windowPositions.miniPlayer'
    )
      dataUpdateEvent('userData/windowPosition');
    else if (dataType.includes('sortingStates'))
      dataUpdateEvent('userData/sortingStates');
    else if (dataType.includes('preferences'))
      dataUpdateEvent('settings/preferences');
    else if (dataType === 'recentSearches')
      dataUpdateEvent('userData/recentSearches');
    else dataUpdateEvent('userData');
  } else {
    log(
      `ERROR OCCURRED WHEN READING USER DATA. USER DATA ARRAY IS EMPTY.`,
      { userData },
      'ERROR'
    );
  }
}

export const getSongsData = () => {
  if (Array.isArray(cachedSongsData) && cachedSongsData.length !== 0) {
    return cachedSongsData;
  }
  return songStore.get('songs', []) as SavableSongData[];
};

export const setSongsData = (updatedSongs: SavableSongData[]) => {
  cachedSongsData = updatedSongs;
  songStore.set('songs', updatedSongs);
};

export const getArtistsData = () => {
  if (cachedArtistsData && cachedArtistsData.length !== 0) {
    return cachedArtistsData;
  }
  return artistStore.get('artists', []) as SavableArtist[];
};

export const setArtistsData = (updatedArtists: SavableArtist[]) => {
  cachedArtistsData = updatedArtists;
  artistStore.set('artists', updatedArtists);
};

export const getAlbumsData = () => {
  if (cachedAlbumsData && cachedAlbumsData.length !== 0) {
    return cachedAlbumsData;
  }
  return albumStore.get('albums', []) as SavableAlbum[];
};

export const setAlbumsData = (updatedAlbums: SavableAlbum[]) => {
  cachedAlbumsData = updatedAlbums;
  albumStore.set('albums', updatedAlbums);
};

export const getGenresData = () => {
  if (cachedGenresData && cachedGenresData.length !== 0) {
    return cachedGenresData;
  }
  return genreStore.get('genres', []) as SavableGenre[];
};

export const setGenresData = (updatedGenres: SavableGenre[]) => {
  cachedGenresData = updatedGenres;
  genreStore.set('genres', updatedGenres);
};

export const createNewListeningDataInstance = (songId: string) => {
  const date = new Date();
  const currentYear = date.getFullYear();

  const months = Array.from({ length: 12 }, () =>
    Array.from({ length: 30 }, () => 0)
  );

  const newListeningData: SongListeningData = {
    songId,
    skips: 0,
    fullListens: 0,
    inNoOfPlaylists: 0,
    listens: [{ year: currentYear, months }],
  };
  return newListeningData;
};

export const getListeningData = (
  songIds = [] as string[]
): SongListeningData[] => {
  const data =
    cachedListeningData && cachedListeningData.length > 0
      ? cachedListeningData
      : (listeningDataStore.get('listeningData', []) as SongListeningData[]);

  const results =
    songIds.length === 0
      ? data
      : data.filter((x) => songIds.some((songId) => x.songId === songId));

  if (results.length === 0) {
    if (songIds.length === 0) return [];
    const defaultOutputs: SongListeningData[] = songIds.map((id) =>
      createNewListeningDataInstance(id)
    );
    return defaultOutputs;
  }

  const listeningData: SongListeningData[] = results.map((x) => {
    const { songId, skips, fullListens, inNoOfPlaylists, listens } = x;
    // const updatedListens: YearlyListeningRate[] = listens.map((y) => {
    //   const { year, months } = y;
    //   const updatedMonths: number[][] = months.map((z) => {
    //     const dailyListens = z.split('_').map((a) => parseInt(a, 10) || 0);

    //     for (let i = 0; i < 12; i += 1) {
    //       if (dailyListens[i] === undefined) dailyListens[i] = 0;
    //     }
    //     return dailyListens;
    //   });
    //   return {
    //     year,
    //     months: updatedMonths,
    //   };
    // });

    return {
      songId,
      skips: skips ?? 0,
      fullListens: fullListens ?? 0,
      inNoOfPlaylists: inNoOfPlaylists ?? 0,
      listens,
    };
  });

  return listeningData;
};

export const setListeningData = (data: SongListeningData) => {
  const results =
    cachedListeningData && cachedListeningData.length > 0
      ? cachedListeningData
      : (listeningDataStore.get('listeningData', []) as SongListeningData[]);

  // const updatedListens: SavableYearlyListeningRate[] = data.listens.map(
  //   ({ year, months }) => {
  //     const updatedMonths = months.map((z) => {
  //       const str = z.join(',').replaceAll('0', '');
  //       return str;
  //     });
  //     return { year, months: updatedMonths };
  //   }
  // );
  for (let i = 0; i < results.length; i += 1) {
    if (results[i].songId === data.songId) {
      results[i].skips = data.skips;
      results[i].fullListens = data.fullListens;
      results[i].inNoOfPlaylists = data.inNoOfPlaylists;
      results[i].listens = data.listens;

      cachedListeningData = results;
      return listeningDataStore.set('listeningData', results);
    }
  }

  results.push(data);
  cachedListeningData = results;
  listeningDataStore.set('listeningData', results);
  return dataUpdateEvent('songs/listeningData');
};

export const getPlaylistData = (playlistIds = [] as string[]) => {
  log(`Requesting playlist data for ids '${playlistIds.join(',')}'`);
  if (Array.isArray(cachedPlaylistsData) && cachedPlaylistsData.length !== 0) {
    if (playlistIds && playlistIds.length === 0) return cachedPlaylistsData;
    const results: SavablePlaylist[] = [];
    for (let x = 0; x < cachedPlaylistsData.length; x += 1) {
      for (let y = 0; y < playlistIds.length; y += 1) {
        if (cachedPlaylistsData[x].playlistId === playlistIds[y])
          results.push(cachedPlaylistsData[x]);
      }
    }
    return results;
  }
  return playlistDataStore.get('playlists', []) as Playlist[];
};

export const setPlaylistData = (updatedPlaylists: SavablePlaylist[]) => {
  log('Updating Playlist Data.');
  dataUpdateEvent('playlists');
  cachedPlaylistsData = updatedPlaylists;
  playlistDataStore.set('playlists', updatedPlaylists);
};

// $ AUDIO LIBRARY MANAGEMENT

function flattenPathArrays<Type extends string[][]>(lists: Type) {
  return lists.reduce((a, b) => a.concat(b), []);
}

function getDirectories(srcpath: string) {
  try {
    const dirs = fsSync.readdirSync(srcpath);
    return dirs
      .map((file) => path.join(srcpath, file))
      .filter((filePath) => fsSync.statSync(filePath).isDirectory());
  } catch (error) {
    log(
      'Error occurred when parsing directories of a path.',
      { srcpath },
      'ERROR'
    );
    throw error;
  }
}

export async function getDirectoriesRecursive(
  srcpath: string
): Promise<string[]> {
  try {
    const dirs = getDirectories(srcpath);
    if (dirs)
      return [
        srcpath,
        ...flattenPathArrays(
          await Promise.all(dirs.map(getDirectoriesRecursive))
        ),
      ];
    return [];
  } catch (error) {
    log(`Error occurred when parsing directories.`, { error }, 'ERROR');
    return [];
  }
}

export const resetAppCache = () => {
  cachedSongsData = [];
  cachedArtistsData = [];
  cachedAlbumsData = [];
  cachedGenresData = [];
  cachedPlaylistsData = [...PLAYLIST_DATA_TEMPLATE];
  cachedUserData = { ...USER_DATA_TEMPLATE };
  songStore.store = { songs: [] };
  artistStore.store = { artists: [] };
  albumStore.store = { albums: [] };
  genreStore.store = { genres: [] };
  userDataStore.store = { userData: USER_DATA_TEMPLATE };
  playlistDataStore.store = { playlists: PLAYLIST_DATA_TEMPLATE };
  log(`In-app cache cleared successfully.`);
};

export const resetAppData = async () => {
  const manageErrors = (err: any) => {
    if ('code' in err && err.code === 'ENOENT') {
      return log(
        `A RECOVERABLE ERROR OCURRED WHEN RESETTING APP DATA.\nERROR : ${err}`
      );
    }
    throw err;
  };
  try {
    const userDataPath = app.getPath('userData');
    await fs.unlink(path.join(userDataPath, 'songs.json')).catch(manageErrors);
    await fs
      .unlink(path.join(userDataPath, 'artists.json'))
      .catch(manageErrors);
    await fs.unlink(path.join(userDataPath, 'albums.json')).catch(manageErrors);
    await fs.unlink(path.join(userDataPath, 'genres.json')).catch(manageErrors);
    await fs
      .unlink(path.join(userDataPath, 'playlists.json'))
      .catch(manageErrors);
    await fs
      .unlink(path.join(userDataPath, 'userData.json'))
      .catch(manageErrors);
    await fs
      .rm(path.join(userDataPath, 'song_covers'), {
        recursive: true,
      })
      .catch(manageErrors);
  } catch (error) {
    log(
      `AN UNRECOVERABLE ERROR OCCURRED WHEN RESETTING THE APP.`,
      { error },
      'ERROR'
    );
    throw error;
  }
};
