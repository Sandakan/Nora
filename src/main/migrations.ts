import type Conf from 'conf';
import { BLACKLIST_TEMPLATE, PLAYLIST_DATA_TEMPLATE, USER_DATA_TEMPLATE } from './filesystem';
import { encrypt } from './utils/safeStorage';
import logger from './logger';

type StoreNames =
  | 'songs.json'
  | 'artists.json'
  | 'playlists.json'
  | 'genres.json'
  | 'albums.json'
  | 'userData.json'
  | 'blacklist.json'
  | 'listening_data.json';

export const generateMigrationMessage = (
  storeName: StoreNames,
  context: { fromVersion: string; toVersion: string }
) => {
  logger.debug(
    `Migrating ${storeName} from app versions ${context.fromVersion} → ${context.toVersion}`
  );
};

export const songMigrations = {
  '3.0.0-stable': (store: Conf<{ version?: string; songs: SavableSongData[] }>) => {
    logger.debug('Starting the songs.json migration process.', {
      version: '3.0.0-stable'
    });
    store.set('songs', []);
  },
  '2.0.0-stable': (store: Conf<{ version?: string; songs: SavableSongData[] }>) => {
    logger.debug('Starting the songs.json migration process.', {
      version: '2.0.0-stable'
    });
    store.set('songs', []);
  },
  '1.0.0-alpha': (store: Conf<{ version?: string; songs: SavableSongData[] }>) => {
    logger.debug('Starting the songs.json migration process.', {
      version: '>=1.0.0-alpha;'
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
              : song.createdDate
        };
      });
      store.set('songs', updatedSongs);
    }
  }
};

export const artistMigrations = {
  // ? This migration is added to fix as a fix to https://github.com/Sandakan/Nora/issues/191
  '3.0.0-stable': (store: Conf<{ version?: string; artists: SavableArtist[] }>) => {
    logger.debug('Starting the artists.json migration process.', {
      version: '3.0.0-stable'
    });
    store.set('artists', []);
  },
  '2.4.0-stable': (store: Conf<{ version?: string; artists: SavableArtist[] }>) => {
    logger.debug('Starting the artists.json migration process.', {
      version: '2.4.0-stable'
    });

    const artists = store.get('artists');
    for (const artist of artists) {
      if (Array.isArray(artist.albums)) {
        const duplicateAlbumsFilteredArr = artist.albums.filter((album, index, albumsArr) => {
          return albumsArr.map((mapObj) => mapObj.albumId).indexOf(album.albumId) === index;
        });

        artist.albums = duplicateAlbumsFilteredArr;
      }
    }

    store.set('artists', artists);
  },
  '2.0.0-stable': (store: Conf<{ version?: string; artists: SavableArtist[] }>) => {
    logger.debug('Starting the artists.json migration process.', {
      version: '2.0.0-stable'
    });
    store.set('artists', []);
  },
  '0.8.0-alpha+2022091400': (store: Conf<{ version?: string; artists: SavableArtist[] }>) => {
    logger.debug(
      'Starting the artists.json migration process.\nVERSION :>=0.8.0-alpha+2022091400;'
    );
    const artists = store.get('artists') as SavableArtist[];
    if (Array.isArray(artists) && artists.length > 0) {
      const updatedArtists: SavableArtist[] = artists.map((artist) => {
        return {
          ...artist,
          isAFavorite: artist.isAFavorite ?? false
        };
      });
      store.set('artists', updatedArtists);
    }
  }
};

export const albumMigrations = {
  '3.0.0-stable': (store: Conf<{ version?: string; albums: SavableAlbum[] }>) => {
    logger.debug('Starting the albums.json migration process.', {
      version: '3.0.0-stable'
    });
    store.set('albums', []);
  },
  '2.0.0-stable': (store: Conf<{ version?: string; albums: SavableAlbum[] }>) => {
    logger.debug('Starting the albums.json migration process.', {
      version: '2.0.0-stable'
    });
    store.set('albums', []);
  }
};

export const playlistMigrations = {
  '3.0.0-stable': (store: Conf<{ version?: string; playlists: SavablePlaylist[] }>) => {
    logger.debug('Starting the playlists.json migration process.', {
      version: '3.0.0-stable'
    });
    store.set('playlists', PLAYLIST_DATA_TEMPLATE);
  },
  '2.0.0-stable': (store: Conf<{ version?: string; playlists: SavablePlaylist[] }>) => {
    logger.debug('Starting the playlists.json migration process.', {
      version: '2.0.0-stable'
    });
    store.set('playlists', PLAYLIST_DATA_TEMPLATE);
  }
};

export const genreMigrations = {
  '3.0.0-stable': (store: Conf<{ version?: string; genres: SavableGenre[] }>) => {
    logger.debug('Starting the genres.json migration process.', {
      version: '3.0.0-stable'
    });
    store.set('genres', []);
  },
  '2.0.0-stable': (store: Conf<{ version?: string; genres: SavableGenre[] }>) => {
    logger.debug('Starting the genres.json migration process.', {
      version: '2.0.0-stable'
    });
    store.set('genres', []);
  }
};

export const userDataMigrations = {
  '3.0.0-stable': (store: Conf<{ version?: string; userData: UserData }>) => {
    logger.debug('Starting the userData.json migration process.', {
      version: '3.0.0-stable'
    });
    store.set('userData', USER_DATA_TEMPLATE);
  },
  '2.5.0-stable': (store: Conf<{ version?: string; userData: UserData }>) => {
    logger.debug('Starting the userData.json migration process.', {
      version: '2.5.0-stable'
    });
    const userData = store.get('userData');
    userData.language = 'en';

    store.set('userData', userData);
  },
  '2.4.0-stable': (store: Conf<{ version?: string; userData: UserData }>) => {
    logger.debug('Starting the userData.json migration process.', {
      version: '2.4.0-stable'
    });

    const userData = store.get('userData');

    userData.windowState = 'normal';
    userData.preferences.sendSongScrobblingDataToLastFM = false;
    userData.preferences.sendSongFavoritesDataToLastFM = false;
    userData.preferences.sendNowPlayingSongDataToLastFM = false;
    try {
      if (userData.customMusixmatchUserToken && userData.customMusixmatchUserToken.length === 54)
        userData.customMusixmatchUserToken = encrypt(userData.customMusixmatchUserToken);
    } catch (error) {
      logger.debug('Error occurred when encrypting customMusixmatchUserToken', {
        error
      });
      userData.customMusixmatchUserToken = undefined;
    }

    store.set('userData', userData);
  },
  '2.0.0-stable': (store: Conf<{ version?: string; userData: UserData }>) => {
    logger.debug('Starting the userData.json migration process.', {
      version: '2.0.0-stable'
    });
    store.set('userData', USER_DATA_TEMPLATE);
  }
};

export const listeningDataMigrations = {
  '3.0.0-stable': (store: Conf<{ version?: string; listeningData: SongListeningData[] }>) => {
    logger.debug('Starting the listeningData.json migration process.', {
      version: '3.0.0-stable'
    });
    store.set('listeningData', []);
  },
  '2.0.0-stable': (store: Conf<{ version?: string; listeningData: SongListeningData[] }>) => {
    logger.debug('Starting the listeningData.json migration process.', {
      version: '2.0.0-stable'
    });
    store.set('listeningData', []);
  }
};

export const blacklistMigrations = {
  '3.0.0-stable': (store: Conf<{ version?: string; blacklist: Blacklist }>) => {
    logger.debug('Starting the blacklist.json migration process.', {
      version: '3.0.0-stable'
    });
    store.set('blacklist', BLACKLIST_TEMPLATE);
  },
  '2.0.0-stable': (store: Conf<{ version?: string; blacklist: Blacklist }>) => {
    logger.debug('Starting the blacklist.json migration process.', {
      version: '2.0.0-stable'
    });
    store.set('blacklist', BLACKLIST_TEMPLATE);
  }
};
