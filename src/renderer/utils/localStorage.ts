import debounce from './debounce';

interface Preferences {
  seekbarScrollInterval: number;
  isSongIndexingEnabled: boolean;
  doNotShowBlacklistSongConfirm: boolean;
  isReducedMotion: boolean;
  doNotVerifyWhenOpeningLinks: boolean;
  showSongRemainingTime: boolean;
  showArtistArtworkNearSongControls: boolean;
  disableBackgroundArtworks: boolean;
}
interface LocalStorage {
  preferences: Preferences;
}

const LOCAL_STORAGE_DEFAULT_TEMPLATE: LocalStorage = {
  preferences: {
    seekbarScrollInterval: 5,
    isSongIndexingEnabled: false,
    disableBackgroundArtworks: false,
    doNotShowBlacklistSongConfirm: false,
    doNotVerifyWhenOpeningLinks: false,
    isReducedMotion: false,
    showArtistArtworkNearSongControls: false,
    showSongRemainingTime: false,
  },
};

export const checkLocalStorage = () => {
  const store = localStorage.getItem('localStorage');
  if (!store) {
    try {
      localStorage.setItem(
        'localStorage',
        JSON.stringify(LOCAL_STORAGE_DEFAULT_TEMPLATE)
      );
      return console.log(
        `local storage data didn't exist. Replaced local storage with default items.`
      );
    } catch (error) {
      window.api.sendLogs(
        'Error occurred when trying to save default templated for local storage.'
      );
      throw error;
    }
  }
  return console.log('local storage check successful.');
};

export const setItem = <
  Type extends keyof Preferences,
  Data extends Preferences[Type]
>(
  type: Type,
  data: Data
) => {
  const storageString = localStorage.getItem('localStorage');
  if (storageString) {
    try {
      const storage = JSON.parse(storageString) as LocalStorage;
      if ('preferences' in storage && type in storage.preferences) {
        storage.preferences[type] = data;

        const updatedStorageString = JSON.stringify(storage);
        localStorage.setItem('localStorage', updatedStorageString);

        debounce(() => {
          const customEvent = new CustomEvent('localStorage');
          document.dispatchEvent(customEvent);
        }, 100);
      }
    } catch (error) {
      console.error(error);
    }
  }
};

export const getItem = <Type extends keyof Preferences>(type: Type) => {
  const storageString = localStorage.getItem('localStorage');
  if (storageString) {
    try {
      const storage = JSON.parse(storageString) as LocalStorage;
      if ('preferences' in storage && type in storage.preferences)
        return storage.preferences[type];

      throw new Error(`requested item type didn't exist in the local storage.`);
    } catch (error) {
      console.error(error);
    }
  }
  return LOCAL_STORAGE_DEFAULT_TEMPLATE.preferences[type];
};
