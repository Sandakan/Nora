import localStorageMigrationData from '../other/localStorageMigrations';

import { version } from '../../../../package.json';
import log from './log';
import addMissingPropsToAnObject from './addMissingPropsToAnObject';
import isLatestVersion from './isLatestVersion';
import { dispatch, store } from '@renderer/store/store';
import { LOCAL_STORAGE_DEFAULT_TEMPLATE } from '@renderer/other/appReducer';
import PlayerQueue from '@renderer/other/playerQueue';

// import isLatestVersion from './isLatestVersion';

const resetLocalStorage = () => {
  try {
    localStorage.clear();
    const template = JSON.stringify(LOCAL_STORAGE_DEFAULT_TEMPLATE);
    localStorage.setItem('version', version);
    localStorage.setItem('localStorage', template);

    dispatch({ type: 'UPDATE_LOCAL_STORAGE', data: LOCAL_STORAGE_DEFAULT_TEMPLATE });
  } catch (error) {
    log('An error occurred while resetting the local storage.', { error }, 'ERROR');
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
  log(
    'Inavalid or outdated local storage found. Resetting the local storage to default properties.',
    { isASupportedStoreVersion, store },
    'WARN'
  );
  return resetLocalStorage();
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

const getLocalStorage = (): LocalStorage => {
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

const setLocalStorage = (storage: LocalStorage) => {
  try {
    const updatedStorageString = JSON.stringify(storage);
    localStorage.setItem('localStorage', updatedStorageString);
  } catch (error) {
    console.error(error);
  }
};

const getAllItems = (): LocalStorage => {
  return store.state.localStorage;
};

const setAllItems = (storage: LocalStorage) => {
  try {
    setLocalStorage(storage);
    dispatch({ type: 'UPDATE_LOCAL_STORAGE', data: { ...storage } });
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
  const storage = { ...getAllItems() };
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

const resetItem = <
  ItemType extends keyof LocalStorage,
  Type extends keyof LocalStorage[ItemType] | never
>(
  itemType: ItemType,
  type?: Type
): void => {
  const storage = { ...getAllItems() };

  try {
    if (type) {
      if (
        itemType in LOCAL_STORAGE_DEFAULT_TEMPLATE &&
        type in LOCAL_STORAGE_DEFAULT_TEMPLATE[itemType]
      ) {
        storage[itemType][type] = structuredClone(LOCAL_STORAGE_DEFAULT_TEMPLATE[itemType][type]);
      }
    } else {
      if (itemType in LOCAL_STORAGE_DEFAULT_TEMPLATE) {
        storage[itemType] = structuredClone(LOCAL_STORAGE_DEFAULT_TEMPLATE[itemType]);
      }
    }

    setAllItems(storage);
  } catch (error) {
    console.error(`Reset failed for ${String(itemType)}${type ? `.${String(type)}` : ''}:`, error);
  }
};

// PREFERENCES

const setPreferences = <Type extends keyof Preferences, Data extends Preferences[Type]>(
  type: Type,
  data: Data
) => {
  const preferences = { ...getFullItem('preferences'), [type]: data };
  dispatch({ type: 'UPDATE_LOCAL_STORAGE_PREFERENCES', data: preferences });
};

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

const setQueue = (queue: PlayerQueue | PlayerQueueJson) => {
  const allItems = getAllItems();
  const queueJson = queue instanceof PlayerQueue ? queue.toJSON() : queue;
  setAllItems({ ...allItems, queue: queueJson });
};

const getQueue = () => getAllItems().queue;

/**
 * @deprecated Use PlayerQueue.moveToPosition() instead
 */
const setCurrentSongIndex = (index: number | null) => setItem('queue', 'position', index ?? 0);

// IGNORED SEPARATE ARTISTS

const setIgnoredSeparateArtists = (artists: number[]) => {
  const allItems = getAllItems();
  setAllItems({
    ...allItems,
    ignoredSeparateArtists: [...allItems.ignoredSeparateArtists, ...artists]
  });
};

const getIgnoredSeparateArtists = () => getFullItem('ignoredSeparateArtists');

// IGNORED SONGS WITH FEATURING ARTISTS

const setIgnoredSongsWithFeatArtists = (ignoredSongIds: number[]) => {
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

// KEYBOARD SHORTCUTS
const resetShortcutsToDefaults = (): void => resetItem('keyboardShortcuts');

const getKeyboardShortcuts = (): ShortcutCategoryList => getFullItem('keyboardShortcuts');

const setKeyboardShortcuts = (label: string, newKeys: string[]): void => {
  const currentData: ShortcutCategoryList = getKeyboardShortcuts();

  const updatedData = currentData.map((category) => ({
    ...category,
    shortcuts: category.shortcuts.map((shortcut) => {
      if (shortcut.label === label) {
        return { ...shortcut, keys: newKeys };
      }
      return shortcut;
    })
  }));

  try {
    setAllItems({
      ...getAllItems(),
      keyboardShortcuts: updatedData
    });
  } catch (error) {
    console.error('Failed to update keyboard shortcuts:', error);
  }
};

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
  keyboardShortcuts: { resetShortcutsToDefaults, getKeyboardShortcuts, setKeyboardShortcuts },
  checkLocalStorage,
  getLocalStorage,
  setLocalStorage,
  resetLocalStorage,
  getAllItems,
  setAllItems,
  getFullItem,
  setFullItem,
  getItem,
  setItem
};
