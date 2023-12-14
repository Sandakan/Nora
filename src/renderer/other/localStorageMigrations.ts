import {
  LOCAL_STORAGE_DEFAULT_TEMPLATE,
  MigrationData,
} from 'renderer/utils/localStorage';

const localStorageMigrationData: MigrationData = {
  '2.4.2-stable': (storage) => {
    storage.equalizerPreset = LOCAL_STORAGE_DEFAULT_TEMPLATE.equalizerPreset;
    return storage;
  },
};

export default localStorageMigrationData;
