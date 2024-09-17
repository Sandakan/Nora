import localStorageMigrationData from '../other/localStorageMigrations';
import debounce from './debounce';

import { version } from '../../../../package.json';
import log from './log';
import addMissingPropsToAnObject from './addMissingPropsToAnObject';
import isLatestVersion from './isLatestVersion';
// import isLatestVersion from './isLatestVersion';

export const LOCAL_STORAGE_DEFAULT_TEMPLATE: LocalStorage = {
  preferences: {
    seekbarScrollInterval: 5,
    isSongIndexingEnabled: false,
    disableBackgroundArtworks: false,
    doNotShowBlacklistSongConfirm: false,
    doNotVerifyWhenOpeningLinks: false,
    isReducedMotion: false,
    showArtistArtworkNearSongControls: false,
    showSongRemainingTime: false,
    noUpdateNotificationForNewUpdate: '',
    defaultPageOnStartUp: 'Home',
    enableArtworkFromSongCovers: false,
    shuffleArtworkFromSongCovers: false,
    removeAnimationsOnBatteryPower: false,
    isPredictiveSearchEnabled: true,
    lyricsAutomaticallySaveState: 'NONE',
    showTrackNumberAsSongIndex: true,
    allowToPreventScreenSleeping: true,
    enableImageBasedDynamicThemes: false,
    doNotShowHelpPageOnLyricsEditorStartUp: false
  },
  playback: {
    currentSong: {
      songId: '',
      stoppedPosition: 0
    },
    isRepeating: 'false',
    isShuffling: false,
    volume: {
      isMuted: false,
      value: 50
    },
    playbackRate: 1.0
  },
  queue: { currentSongIndex: null, queue: [], queueType: 'songs' },
  ignoredSeparateArtists: [],
  ignoredSongsWithFeatArtists: [],
  ignoredDuplicates: {
    albums: [],
    artists: [],
    genres: []
  },
  sortingStates: {
    albumsPage: 'aToZ',
    artistsPage: 'aToZ',
    genresPage: 'aToZ',
    playlistsPage: 'aToZ',
    songsPage: 'aToZ',
    musicFoldersPage: 'aToZ'
  },
  equalizerPreset: {
    thirtyTwoHertzFilter: 0,
    sixtyFourHertzFilter: 0,
    hundredTwentyFiveHertzFilter: 0,
    twoHundredFiftyHertzFilter: 0,
    fiveHundredHertzFilter: 0,
    thousandHertzFilter: 0,
    twoThousandHertzFilter: 0,
    fourThousandHertzFilter: 0,
    eightThousandHertzFilter: 0,
    sixteenThousandHertzFilter: 0
  },
  lyricsEditorSettings: {
    offset: 0,
    editNextAndCurrentStartAndEndTagsAutomatically: true
  }
};

const resetLocalStorage = () => {
  try {
    localStorage.clear();
    const template = JSON.stringify(LOCAL_STORAGE_DEFAULT_TEMPLATE);
    localStorage.setItem('version', version);
    localStorage.setItem('localStorage', template);

    debounce(() => {
      const customEvent = new CustomEvent('localStorage');
      document.dispatchEvent(customEvent);
    }, 100);
  } catch (error) {
    console.error(error);
  }
};

export type MigrationData = Record<
  /** Version of the app */
  string,
  (localStorage: LocalStorage) => LocalStorage
>;

const migrateLocalStorage = (migrationData: MigrationData, storage: LocalStorage) => {
  let currentLocalStorage = storage;
  let localStorageVersion = localStorage.getItem('version') ?? '1.0.0';

  for (const [migrationVersion, migrationFunction] of Object.entries(migrationData)) {
    const isLocalStorageUpToDate = isLatestVersion(migrationVersion, localStorageVersion);
    if (!isLocalStorageUpToDate) {
      log(
        `Migrating local storage ${localStorageVersion} => ${migrationVersion}`,
        undefined,
        'WARN'
      );
      currentLocalStorage = migrationFunction(currentLocalStorage);
      localStorageVersion = migrationVersion;
    }
  }

  return {
    migratedLocalStorage: currentLocalStorage,
    migratedVersion: localStorageVersion
  };
};

const repairInvalidLocalStorage = (isASupportedStoreVersion: boolean, store: string | null) => {
  try {
    localStorage.setItem('version', version);
    localStorage.setItem('localStorage', JSON.stringify(LOCAL_STORAGE_DEFAULT_TEMPLATE));
    return log(
      'Inavalid or outdated local storage found. Resetting the local storage to default properties.',
      { isASupportedStoreVersion, store },
      'WARN'
    );
  } catch (error) {
    log(
      'Error occurred when trying to save default templated for local storage.',
      { error },
      'WARN'
    );
    throw error;
  }
};

const checkLocalStorage = () => {
  const store = localStorage.getItem('localStorage');
  const currentLocalStorageVersion = localStorage.getItem('version');
  const isASupportedStoreVersion = currentLocalStorageVersion !== null;
  const isAValidStore = store && isASupportedStoreVersion;

  if (!isAValidStore) {
    repairInvalidLocalStorage(isASupportedStoreVersion, store);
  } else {
    const jsonStore = JSON.parse(store);
    const { migratedLocalStorage, migratedVersion } = migrateLocalStorage(
      localStorageMigrationData,
      jsonStore
    );

    const updatedStore = addMissingPropsToAnObject(
      LOCAL_STORAGE_DEFAULT_TEMPLATE,
      migratedLocalStorage,
      (key) => console.warn(`Added missing '${key}' property to localStorage.`)
    );

    localStorage.setItem('localStorage', JSON.stringify(updatedStore));
    localStorage.setItem('version', migratedVersion);
  }
  return console.log('local storage check successful.');
};

const getAllItems = (): LocalStorage => {
  const storageString = localStorage.getItem('localStorage');
  if (storageString) {
    try {
      const storage = JSON.parse(storageString) as LocalStorage;
      return storage;
    } catch (error) {
      console.error(error);
    }
  }
  return LOCAL_STORAGE_DEFAULT_TEMPLATE;
};

const setAllItems = (storage: LocalStorage) => {
  try {
    const updatedStorageString = JSON.stringify(storage);
    localStorage.setItem('localStorage', updatedStorageString);

    const customEvent = new CustomEvent('localStorage');
    document.dispatchEvent(customEvent);
  } catch (error) {
    console.error(error);
  }
};

const setFullItem = <ItemType extends keyof LocalStorage, Data extends LocalStorage[ItemType]>(
  itemType: ItemType,
  data: Data
) => {
  const storage = getAllItems();
  try {
    if (itemType in storage || itemType in LOCAL_STORAGE_DEFAULT_TEMPLATE) {
      storage[itemType] = data;

      setAllItems(storage);
    } else throw new Error(`option ${String(itemType)} doesn't exist on localStorage.`);
  } catch (error) {
    console.error(error);
  }
};

const getFullItem = <ItemType extends keyof LocalStorage>(itemType: ItemType) => {
  const storage = getAllItems();
  if (itemType in storage) return storage[itemType];

  if (itemType in LOCAL_STORAGE_DEFAULT_TEMPLATE) {
    storage[itemType] = LOCAL_STORAGE_DEFAULT_TEMPLATE[itemType];
    setAllItems(storage);
    return LOCAL_STORAGE_DEFAULT_TEMPLATE[itemType];
  }

  throw new Error(
    `requested item type '${itemType}' or type '${String(
      itemType
    )}' didn't exist in the local storage.`
  );
};

const setItem = <
  ItemType extends keyof LocalStorage,
  Type extends keyof LocalStorage[ItemType],
  Data extends LocalStorage[ItemType][Type]
>(
  itemType: ItemType,
  type: Type,
  data: Data
) => {
  const storage = getAllItems();
  try {
    if (
      (itemType in storage && type in storage[itemType]) ||
      (itemType in LOCAL_STORAGE_DEFAULT_TEMPLATE &&
        type in LOCAL_STORAGE_DEFAULT_TEMPLATE[itemType])
    ) {
      storage[itemType][type] = data;

      setAllItems(storage);
    } else throw new Error(`option ${String(type)} doesn't exist on localStorage.`);
  } catch (error) {
    console.error(error);
  }
};

const getItem = <ItemType extends keyof LocalStorage, Type extends keyof LocalStorage[ItemType]>(
  itemType: ItemType,
  type: Type
) => {
  const storage = getAllItems();
  if (itemType in storage && type in storage[itemType]) return storage[itemType][type];

  if (
    itemType in LOCAL_STORAGE_DEFAULT_TEMPLATE &&
    type in LOCAL_STORAGE_DEFAULT_TEMPLATE[itemType]
  ) {
    storage[itemType][type] = LOCAL_STORAGE_DEFAULT_TEMPLATE[itemType][type];
    setAllItems(storage);
    return LOCAL_STORAGE_DEFAULT_TEMPLATE[itemType][type];
  }

  throw new Error(
    `requested item type '${itemType}' or type '${String(type)}' didn't exist in the local storage.`
  );
};

// PREFERENCES

const setPreferences = <Type extends keyof Preferences, Data extends Preferences[Type]>(
  type: Type,
  data: Data
) => setItem('preferences', type, data);

const getPreferences = <Type extends keyof Preferences>(type: Type) => getItem('preferences', type);

// PLAYBACK

const setPlaybackOptions = <Type extends keyof Playback, Data extends Playback[Type]>(
  type: Type,
  data: Data
) => setItem('playback', type, data);

const getPlaybackOptions = <Type extends keyof Playback>(type: Type) => getItem('playback', type);

const setCurrentSongOptions = <Type extends keyof CurrentSong, Data extends CurrentSong[Type]>(
  type: Type,
  data: Data
) => {
  const currentSong = getPlaybackOptions('currentSong');
  if (type in currentSong) {
    currentSong[type] = data;
    setPlaybackOptions('currentSong', currentSong);
  }
};

const setVolumeOptions = <Type extends keyof Volume, Data extends Volume[Type]>(
  type: Type,
  data: Data
) => {
  const volume = getPlaybackOptions('volume');
  if (type in volume) {
    volume[type] = data;
    setPlaybackOptions('volume', volume);
  }
};

// QUEUE

const setQueue = (queue: Queue) => {
  const allItems = getAllItems();
  setAllItems({ ...allItems, queue });
};

const getQueue = () => getAllItems().queue;

const setCurrentSongIndex = (index: number | null) => setItem('queue', 'currentSongIndex', index);

// IGNORED SEPARATE ARTISTS

const setIgnoredSeparateArtists = (artists: string[]) => {
  const allItems = getAllItems();
  setAllItems({
    ...allItems,
    ignoredSeparateArtists: [...allItems.ignoredSeparateArtists, ...artists]
  });
};

const getIgnoredSeparateArtists = () => getFullItem('ignoredSeparateArtists');

// IGNORED SONGS WITH FEATURING ARTISTS

const setIgnoredSongsWithFeatArtists = (ignoredSongIds: string[]) => {
  const allItems = getAllItems();
  setAllItems({
    ...allItems,
    ignoredSongsWithFeatArtists: [...allItems.ignoredSongsWithFeatArtists, ...ignoredSongIds]
  });
};

const getIgnoredSongsWithFeatArtists = () => getFullItem('ignoredSongsWithFeatArtists');

// IGNORED DUPLICATES

const setIgnoredDuplicates = <
  Type extends keyof IgnoredDuplicates,
  Data extends IgnoredDuplicates[Type]
>(
  type: Type,
  data: Data
) => setItem('ignoredDuplicates', type, data);

const getIgnoredDuplicates = <Type extends keyof IgnoredDuplicates>(type: Type) =>
  getItem('ignoredDuplicates', type);

// SORTING STATES

const setSortingStates = <Type extends keyof SortingStates, Data extends SortingStates[Type]>(
  type: Type,
  data: Data
) => setItem('sortingStates', type, data);

const getSortingStates = <Type extends keyof SortingStates>(type: Type) =>
  getItem('sortingStates', type);

// EQUALIZER PRESET

const setEqualizerPreset = <Data extends Equalizer>(data: Data) =>
  setFullItem('equalizerPreset', data);

const getEqualizerPreset = () => getFullItem('equalizerPreset');

// LYRICS EDITOR

const setLyricsEditorSettings = <
  Type extends keyof LyricsEditorSettings,
  Data extends LyricsEditorSettings[Type]
>(
  type: Type,
  data: Data
) => setItem('lyricsEditorSettings', type, data);

const getLyricsEditorSettings = <Type extends keyof LyricsEditorSettings>(type: Type) =>
  getItem('lyricsEditorSettings', type);

// / / / / / / / / / /

export default {
  preferences: { setPreferences, getPreferences },
  playback: {
    setPlaybackOptions,
    getPlaybackOptions,
    setCurrentSongOptions,
    setVolumeOptions
  },
  queue: { setQueue, getQueue, setCurrentSongIndex },
  ignoredSeparateArtists: {
    setIgnoredSeparateArtists,
    getIgnoredSeparateArtists
  },
  ignoredSongsWithFeatArtists: {
    setIgnoredSongsWithFeatArtists,
    getIgnoredSongsWithFeatArtists
  },
  ignoredDuplicates: { setIgnoredDuplicates, getIgnoredDuplicates },
  sortingStates: { setSortingStates, getSortingStates },
  equalizerPreset: { setEqualizerPreset, getEqualizerPreset },
  lyricsEditorSettings: { setLyricsEditorSettings, getLyricsEditorSettings },
  checkLocalStorage,
  resetLocalStorage,
  getAllItems,
  setAllItems,
  getFullItem,
  setFullItem,
  getItem,
  setItem
};
