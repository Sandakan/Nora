import { LOCAL_STORAGE_DEFAULT_TEMPLATE } from '@renderer/other/appReducer';
import PlayerQueue from '@renderer/other/playerQueue';
import { dispatch, store } from '@renderer/store/store';

import { version } from '../../../../package.json';
import localStorageMigrationData from '../other/localStorageMigrations';
import addMissingPropsToAnObject from './addMissingPropsToAnObject';
import isLatestVersion from './isLatestVersion';
import log from './log';

// import isLatestVersion from './isLatestVersion';

const resetLocalStorage = () => {
  try {
    localStorage.clear();
    const template = JSON.stringify(LOCAL_STORAGE_DEFAULT_TEMPLATE);
    localStorage.setItem('version', version);
    localStorage.setItem('localStorage', template);

    dispatch({
      type: 'UPDATE_LOCAL_STORAGE',
      data: LOCAL_STORAGE_DEFAULT_TEMPLATE
    });
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
    } else {
      throw new Error(`option ${String(itemType)} doesn't exist on localStorage.`);
    }
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
    } else {
      throw new Error(`option ${String(type)} doesn't exist on localStorage.`);
    }
  } catch (error) {
    console.error(error);
  }
};

const getItem = <ItemType extends keyof LocalStorage, Type extends keyof LocalStorage[ItemType]>(
  itemType: ItemType,
  type: Type
) => {
  const storage = getAllItems();
  if (itemType in storage && type in storage[itemType]) {
    return storage[itemType][type];
  }

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
  const currentSong = getPlaybackOptions('currentSong') as CurrentSong;
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

/** @deprecated Use PlayerQueue.moveToPosition() instead */
const setCurrentSongIndex = (index: number | null) => setItem('queue', 'position', index ?? 0);

// SORTING STATES

const setSortingStates = <Type extends keyof SortingStates, Data extends SortingStates[Type]>(
  type: Type,
  data: Data
) => setItem('sortingStates', type, data);

const getSortingStates = <Type extends keyof SortingStates>(type: Type) =>
  getItem('sortingStates', type);

// KEYBOARD SHORTCUTS (Legacy - stored in localStorage for backward compat)
// Note: These read/write from the store's initial keyboardShortcuts, not database

const getKeyboardShortcuts = (): ShortcutCategoryList => {
  const localData = getLocalStorage();
  const userShortcuts: ShortcutCategory[] = (localData as any)?.keyboardShortcuts || [];
  const defaults: ShortcutCategory[] = LOCAL_STORAGE_DEFAULT_TEMPLATE.keyboardShortcuts;

  // Match saved categories by stable id first. Legacy data saved before
  // category ids existed has no id and used a translated title; match it by
  // array position (the default categories are always in the same order) so
  // a language change cannot orphan a user's categories. Title matching is a
  // last resort for non-default user categories.
  const findUserCategory = (defaultCategory: ShortcutCategory, index: number) =>
    userShortcuts.find(
      (uc) =>
        uc.id === defaultCategory.id ||
        (uc.id === undefined && userShortcuts.indexOf(uc) === index) ||
        uc.shortcutCategoryTitle === defaultCategory.shortcutCategoryTitle
    );

  const merged: ShortcutCategory[] = [];
  const selectedUserCategoryRefs = new Set<ShortcutCategory>();

  defaults.forEach((defaultCategory, index) => {
    const matchingUserCategory = findUserCategory(defaultCategory, index);

    if (!matchingUserCategory) {
      merged.push(defaultCategory);
      return;
    }

    selectedUserCategoryRefs.add(matchingUserCategory);

    const patchedShortcuts = defaultCategory.shortcuts.map((defaultShortcut) => {
      const matchingUserShortcut = matchingUserCategory.shortcuts.find(
        (us) => us.id === defaultShortcut.id || us.label === defaultShortcut.label
      );
      if (matchingUserShortcut) {
        return { ...defaultShortcut, keys: matchingUserShortcut.keys };
      }
      return defaultShortcut;
    });

    merged.push({ ...defaultCategory, shortcuts: patchedShortcuts });
  });

  // Categories not matching any default (user-created or orphaned legacy
  // categories) are appended as-is, preserving their id/title. Categories
  // already merged above are excluded to avoid duplicates.
  const defaultCategoryIds = new Set(defaults.map((dc) => dc.id));
  const defaultCategoryTitles = new Set(defaults.map((dc) => dc.shortcutCategoryTitle));
  const extraUserCategories = userShortcuts.filter(
    (uc) =>
      !selectedUserCategoryRefs.has(uc) &&
      !defaultCategoryIds.has(uc.id) &&
      !defaultCategoryTitles.has(uc.shortcutCategoryTitle)
  );

  return [...merged, ...extraUserCategories];
};

const setKeyboardShortcuts = (idOrLabel: string, newKeys: string[]): void => {
  const currentData: ShortcutCategoryList = getKeyboardShortcuts();

  const updatedData = currentData.map((category) => ({
    ...category,
    shortcuts: category.shortcuts.map((shortcut) => {
      if (shortcut.id === idOrLabel || shortcut.label === idOrLabel) {
        return { ...shortcut, keys: newKeys };
      }
      return shortcut;
    })
  }));

  try {
    const allItems = getAllItems() as any;
    setAllItems({
      ...allItems,
      keyboardShortcuts: updatedData
    });
  } catch (error) {
    console.error('Failed to update keyboard shortcuts:', error);
  }
};

const resetShortcutsToDefaults = (): void => {
  const allItems = getAllItems() as any;
  const defaultShortcuts = (LOCAL_STORAGE_DEFAULT_TEMPLATE as any).keyboardShortcuts;
  if (defaultShortcuts) {
    setAllItems({
      ...allItems,
      keyboardShortcuts: defaultShortcuts
    });
  }
};

// EQUALIZER PRESET (Legacy - stored in localStorage for backward compat)
// Note: New code should use database via useUserPreferences hook

const setEqualizerPreset = <Data extends Equalizer>(data: Data) => {
  // Store in the local storage root (not under playback)
  const allItems = getAllItems() as any;
  setAllItems({
    ...allItems,
    equalizerPreset: data
  });
};

const getEqualizerPreset = () => {
  const storage = getLocalStorage() as any;
  return storage?.equalizerPreset as Equalizer | undefined;
};

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
  sortingStates: { setSortingStates, getSortingStates },
  lyricsEditorSettings: { setLyricsEditorSettings, getLyricsEditorSettings },
  keyboardShortcuts: {
    resetShortcutsToDefaults,
    getKeyboardShortcuts,
    setKeyboardShortcuts
  },
  equalizerPreset: { setEqualizerPreset, getEqualizerPreset },
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
