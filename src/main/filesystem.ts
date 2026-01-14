import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import Store from 'electron-store';
import logger from './logger';
import { dataUpdateEvent } from './main';
import { appPreferences, version } from '../../package.json';
import {
  albumMigrations,
  artistMigrations,
  blacklistMigrations,
  generateMigrationMessage,
  genreMigrations,
  playlistMigrations,
  songMigrations
} from './migrations';
import { DEFAULT_SONG_PALETTE } from './other/generatePalette';
import isPathADir from './utils/isPathADir';
import { SpecialPlaylists } from '../common/playlists.enum';
import '@db/db';

export const DEFAULT_ARTWORK_SAVE_LOCATION = path.join(app.getPath('userData'), 'song_covers');
export const DEFAULT_FILE_URL = 'nora://localfiles/';

// const user: typeof usersTable.$inferInsert = {
//   name: 'John',
//   age: 30,
//   email: 'john@example.com'
// };
// await db.insert(usersTable).values(user);
// console.log('New user created!');
// const users = await db.select().from(usersTable);
// console.log('Getting all users from the database: ', users);

export const HISTORY_PLAYLIST_TEMPLATE: SavablePlaylist = {
  name: 'History',
  playlistId: SpecialPlaylists.History,
  createdDate: new Date(),
  songs: [],
  isArtworkAvailable: true
};
export const FAVORITES_PLAYLIST_TEMPLATE: SavablePlaylist = {
  name: 'Favorites',
  playlistId: SpecialPlaylists.Favorites,
  createdDate: new Date(),
  songs: [],
  isArtworkAvailable: true
};
export const PLAYLIST_DATA_TEMPLATE: SavablePlaylist[] = [
  HISTORY_PLAYLIST_TEMPLATE,
  FAVORITES_PLAYLIST_TEMPLATE
];

export const BLACKLIST_TEMPLATE: Blacklist = {
  songBlacklist: [],
  folderBlacklist: []
};

export const PALETTE_DATA_TEMPLATE: PaletteData[] = [DEFAULT_SONG_PALETTE];

const songStore = new Store({
  name: 'songs',
  defaults: {
    version,
    songs: []
  },
  schema: {
    version: { type: ['string', 'null'] },
    songs: {
      type: 'array'
    }
  },
  beforeEachMigration: (_, context) => generateMigrationMessage('songs.json', context),
  migrations: songMigrations
});

const artistStore = new Store({
  name: 'artists',
  defaults: {
    version,
    artists: []
  },
  schema: {
    version: { type: ['string', 'null'] },
    artists: {
      type: 'array'
    }
  },
  beforeEachMigration: (_, context) => generateMigrationMessage('artists.json', context),
  migrations: artistMigrations
});

const genreStore = new Store({
  name: 'genres',
  defaults: {
    version,
    genres: []
  },
  schema: {
    version: { type: ['string', 'null'] },
    genres: {
      type: 'array'
    }
  },
  beforeEachMigration: (_, context) => generateMigrationMessage('genres.json', context),
  migrations: genreMigrations
});

const albumStore = new Store({
  name: 'albums',
  defaults: {
    version,
    albums: []
  },
  schema: {
    version: { type: ['string', 'null'] },
    albums: {
      type: 'array'
    }
  },
  beforeEachMigration: (_, context) => generateMigrationMessage('albums.json', context),
  migrations: albumMigrations
});

const playlistDataStore = new Store({
  name: 'playlists',
  defaults: {
    version,
    playlists: PLAYLIST_DATA_TEMPLATE
  },
  schema: {
    version: { type: ['string', 'null'] },
    playlists: {
      type: 'array'
    }
  },
  beforeEachMigration: (_, context) => generateMigrationMessage('playlists.json', context),
  migrations: playlistMigrations
});

const blacklistStore = new Store({
  name: 'blacklist',
  clearInvalidConfig: true,
  defaults: {
    version,
    blacklist: BLACKLIST_TEMPLATE
  },
  schema: {
    version: { type: ['string', 'null'] },
    blacklist: {
      type: 'object',
      properties: {
        songBlacklist: {
          type: 'array'
        },
        folderBlacklist: {
          type: 'array'
        }
      }
    }
  },
  beforeEachMigration: (_, context) => generateMigrationMessage('blacklist.json', context),
  migrations: blacklistMigrations
});

const paletteStore = new Store({
  name: 'palettes',
  defaults: {
    version,
    palettes: []
  },
  schema: {
    version: { type: ['string', 'null'] },
    palettes: {
      type: 'array'
    }
  }
  // beforeEachMigration: (_, context) => generateMigrationMessage('songs.json', context),
  // migrations: songMigrations
});

const songStoreVersion = songStore.get('version');
logger.debug('song store version', { songStoreVersion });

export const supportedMusicExtensions = appPreferences.supportedMusicExtensions.map((x) => `.${x}`);

let cachedSongsData = songStore.get('songs', []) as SavableSongData[];
let cachedArtistsData = artistStore.get('artists', []) as SavableArtist[];
let cachedAlbumsData = albumStore.get('albums', []) as SavableAlbum[];
let cachedGenresData = genreStore.get('genres', []) as SavableGenre[];
let cachedPlaylistsData = playlistDataStore.get(
  'playlists',
  PLAYLIST_DATA_TEMPLATE
) as SavablePlaylist[];
let cachedBlacklist = blacklistStore.get('blacklist', BLACKLIST_TEMPLATE) as Blacklist;
let cachedPaletteData = paletteStore.get('palettes', PALETTE_DATA_TEMPLATE) as PaletteData[];

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

// ? PALETTE DATA GETTERS AND SETTERS

export const getPaletteData = () => {
  if (Array.isArray(cachedPaletteData) && cachedPaletteData.length !== 0) {
    return cachedPaletteData;
  }
  return paletteStore.get('palettes', PALETTE_DATA_TEMPLATE) as PaletteData[];
};

export const setPaletteData = (updatedPalette: PaletteData[]) => {
  cachedPaletteData = updatedPalette;
  paletteStore.set('palettes', updatedPalette);
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

// ? PLAYLIST DATA GETTERS AND SETTERS

export const getPlaylistData = (playlistIds = [] as number[]) => {
  logger.debug(`Requesting playlist data for ids`, { playlistIds });
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
  logger.debug('Updating Playlist Data.');
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
    const filteredDirs = dirs.filter((dir) => isPathADir(dir));
    const dirsWithFullPaths = filteredDirs.map((dir) => path.join(srcpath, dir.name));

    return dirsWithFullPaths;
  } catch (error) {
    logger.error('Failed to parse directories of a path.', { error, srcpath });
    return [];
  }
};

export async function getDirectoriesRecursive(srcpath: string): Promise<string[]> {
  try {
    const dirs = await getDirectories(srcpath);
    if (dirs)
      return [srcpath, ...flattenPathArrays(await Promise.all(dirs.map(getDirectoriesRecursive)))];
    return [];
  } catch (error) {
    logger.error('Failed to parse directories.', { error, srcpath });
    return [];
  }
}
