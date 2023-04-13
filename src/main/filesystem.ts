import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import Store from 'electron-store';
import log from './log';
import { dataUpdateEvent } from './main';
import { appPreferences, version } from '../../package.json';
import {
  artistMigrations,
  generateMigrationMessage,
  songMigrations,
} from './migrations';

export const DEFAULT_ARTWORK_SAVE_LOCATION = path.join(
  app.getPath('userData'),
  'song_covers'
);
export const DEFAULT_FILE_URL = 'nora://localFiles/';

const USER_DATA_TEMPLATE: UserData = {
  theme: { isDarkMode: false, useSystemTheme: true },
  musicFolders: [],
  preferences: {
    autoLaunchApp: false,
    isMiniPlayerAlwaysOnTop: false,
    isMusixmatchLyricsEnabled: false,
    hideWindowOnClose: false,
    openWindowAsHiddenOnSystemStart: false,
  },
  windowPositions: {},
  windowDiamensions: {},
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

const BLACKLIST_TEMPLATE: Blacklist = {
  songBlacklist: [],
  folderBlacklist: [],
};

const songStore = new Store({
  name: 'songs',
  defaults: {
    version,
    songs: [],
  },
  schema: {
    version: { type: ['string', 'null'] },
    songs: {
      type: 'array',
    },
  },
  beforeEachMigration: (_, context) =>
    generateMigrationMessage('songs.json', context),
  migrations: songMigrations,
});

const artistStore = new Store({
  name: 'artists',
  defaults: {
    version,
    artists: [],
  },
  schema: {
    version: { type: ['string', 'null'] },
    artists: {
      type: 'array',
    },
  },
  beforeEachMigration: (_, context) =>
    generateMigrationMessage('artists.json', context),
  migrations: artistMigrations,
});

const genreStore = new Store({
  name: 'genres',
  defaults: {
    version,
    genres: [],
  },
  schema: {
    version: { type: ['string', 'null'] },
    genres: {
      type: 'array',
    },
  },
  beforeEachMigration: (_, context) =>
    generateMigrationMessage('genres.json', context),
});

const albumStore = new Store({
  name: 'albums',
  defaults: {
    version,
    albums: [],
  },
  schema: {
    version: { type: ['string', 'null'] },
    albums: {
      type: 'array',
    },
  },
  beforeEachMigration: (_, context) =>
    generateMigrationMessage('albums.json', context),
});

const playlistDataStore = new Store({
  name: 'playlists',
  defaults: {
    version,
    playlists: PLAYLIST_DATA_TEMPLATE,
  },
  schema: {
    version: { type: ['string', 'null'] },
    playlists: {
      type: 'array',
    },
  },
  beforeEachMigration: (_, context) =>
    generateMigrationMessage('playlists.json', context),
});

const userDataStore = new Store({
  name: 'userData',
  defaults: {
    version,
    userData: USER_DATA_TEMPLATE,
  },
  schema: {
    version: { type: ['string', 'null'] },
    userData: {
      type: 'object',
    },
  },
  beforeEachMigration: (_, context) =>
    generateMigrationMessage('userData.json', context),
});

const listeningDataStore = new Store({
  name: 'listening_data',
  clearInvalidConfig: true,
  defaults: {
    version,
    listeningData: [],
  },
  schema: {
    version: { type: ['string', 'null'] },
    listeningData: {
      type: 'array',
    },
  },
  beforeEachMigration: (_, context) =>
    generateMigrationMessage('listening_data.json', context),
});

const blacklistStore = new Store({
  name: 'blacklist',
  clearInvalidConfig: true,
  defaults: {
    version,
    blacklist: BLACKLIST_TEMPLATE,
  },
  schema: {
    version: { type: ['string', 'null'] },
    blacklist: {
      type: 'object',
      properties: {
        songBlacklist: {
          type: 'array',
        },
        folderBlacklist: {
          type: 'array',
        },
      },
    },
  },
  beforeEachMigration: (_, context) =>
    generateMigrationMessage('blacklist.json', context),
});

const songStoreVersion = songStore.get('version');
log('song store version', { songStoreVersion }, 'WARN');

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
let cachedBlacklist = blacklistStore.get(
  'blacklist',
  BLACKLIST_TEMPLATE
) as Blacklist;

// ? USER DATA GETTERS AND SETTERS

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
    else if (dataType === 'musicFolders' && Array.isArray(data)) {
      userData.musicFolders = data;
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
    } else if (dataType === 'recentSearches' && Array.isArray(data)) {
      userData.recentSearches = data as string[];
    } else if (
      dataType === 'preferences.autoLaunchApp' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.autoLaunchApp = data;
    } else if (
      dataType === 'preferences.isMusixmatchLyricsEnabled' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.isMusixmatchLyricsEnabled = data;
    } else if (
      dataType === 'preferences.isMiniPlayerAlwaysOnTop' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.isMiniPlayerAlwaysOnTop = data;
    } else if (
      dataType === 'preferences.hideWindowOnClose' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.hideWindowOnClose = data;
    } else if (
      dataType === 'preferences.openWindowAsHiddenOnSystemStart' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.openWindowAsHiddenOnSystemStart = data;
    } else if (
      dataType === 'customMusixmatchUserToken' &&
      typeof data === 'string'
    ) {
      userData.customMusixmatchUserToken = data;
    } else if (dataType === 'storageMetrics' && typeof data === 'object') {
      userData.storageMetrics = data as StorageMetrics;
    } else
      return log(
        'Error occurred in setUserData function due ot invalid dataType or data.'
      );

    cachedUserData = userData;
    userDataStore.set('userData', userData);

    if (dataType === 'musicFolders') dataUpdateEvent('userData/musicFolder');
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
  return undefined;
}

// ? SONG DATA GETTERS AND SETTERS

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

// ? ARTIST DATA GETTERS AND SETTERS

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

// ? ALBUM DATA GETTERS AND SETTERS

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

// ? GENRE DATA GETTERS AND SETTERS

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

// ? SONG LISTENING DATA GETTERS AND SETTERS

export const createNewListeningDataInstance = (songId: string) => {
  const date = new Date();
  const currentYear = date.getFullYear();

  const newListeningData: SongListeningData = {
    songId,
    skips: 0,
    fullListens: 0,
    inNoOfPlaylists: 0,
    listens: [{ year: currentYear, listens: [] }],
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

// ? PLAYLIST DATA GETTERS AND SETTERS

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

// ? BLACKLIST DATA GETTERS AND SETTERS
export const getBlacklistData = (): Blacklist => {
  if (
    cachedBlacklist &&
    'songBlacklist' in cachedBlacklist &&
    'folderBlacklist' in cachedBlacklist
  ) {
    return cachedBlacklist;
  }
  return blacklistStore.get('blacklist') as Blacklist;
};

export const addToBlacklist = (
  str: string,
  blacklistType: 'SONG_BLACKLIST' | 'FOLDER_BLACKLIST'
) => {
  switch (blacklistType) {
    case 'SONG_BLACKLIST':
      cachedBlacklist.songBlacklist.push(str);
      dataUpdateEvent('blacklist/songBlacklist');
      break;

    case 'FOLDER_BLACKLIST':
      cachedBlacklist.folderBlacklist.push(str);
      dataUpdateEvent('blacklist/folderBlacklist');
      break;

    default:
      throw new Error('unknown blacklist type');
  }
  blacklistStore.set('blacklist', cachedBlacklist);
};

export const updateBlacklist = (
  callback: (_prevBlacklist: Blacklist) => Blacklist
) => {
  const updatedBlacklist = callback(cachedBlacklist);
  cachedBlacklist = updatedBlacklist;
  blacklistStore.set('blacklist', updatedBlacklist);
};

export const setBlacklist = (updatedBlacklist: Blacklist) => {
  cachedBlacklist = updatedBlacklist;
  blacklistStore.set('blacklist', updatedBlacklist);
};

// $ AUDIO LIBRARY MANAGEMENT

function flattenPathArrays<Type extends string[][]>(lists: Type) {
  return lists.reduce((a, b) => a.concat(b), []);
}

export const getDirectories = async (srcpath: string) => {
  try {
    const dirs = await fs.readdir(srcpath, { withFileTypes: true });
    const filteredDirs = dirs.filter((dir) => dir.isDirectory());
    const dirsWithFullPaths = filteredDirs.map((dir) =>
      path.join(srcpath, dir.name)
    );

    return dirsWithFullPaths;
  } catch (error) {
    log(
      'Error occurred when parsing directories of a path.',
      { srcpath },
      'ERROR'
    );
    throw error;
  }
};

export async function getDirectoriesRecursive(
  srcpath: string
): Promise<string[]> {
  try {
    const dirs = await getDirectories(srcpath);
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
  songStore.store = { version, songs: [] };
  artistStore.store = { version, artists: [] };
  albumStore.store = { version, albums: [] };
  genreStore.store = { version, genres: [] };
  userDataStore.store = { version, userData: USER_DATA_TEMPLATE };
  playlistDataStore.store = { version, playlists: PLAYLIST_DATA_TEMPLATE };
  log(`In-app cache cleared successfully.`);
};
