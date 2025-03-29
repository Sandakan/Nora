import type { MigrationData } from '../utils/localStorage';
import { LOCAL_STORAGE_DEFAULT_TEMPLATE } from './appReducer';

const localStorageMigrationData: MigrationData = {
  '2.4.2-stable': (storage) => {
    storage.equalizerPreset = LOCAL_STORAGE_DEFAULT_TEMPLATE.equalizerPreset;
    return storage;
  }
};

export default localStorageMigrationData;
