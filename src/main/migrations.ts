import type Conf from 'conf/dist/source/index';
import log from './log';

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
  log(
    `Migrating ${storeName} from app versions ${context.fromVersion} → ${context.toVersion}`
  );
};

export const songMigrations = {
  '1.0.0-alpha': (store: Conf<{ songs: unknown }>) => {
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
};

export const artistMigrations = {
  '0.8.0-alpha+2022091400': (store: Conf<{ artists: unknown }>) => {
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
};
