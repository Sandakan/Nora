import type { MigrationData } from '../utils/localStorage';
import { LOCAL_STORAGE_DEFAULT_TEMPLATE } from './appReducer';

const localStorageMigrationData: MigrationData = {
  '4.0.0-alpha.3': (_) => {
    return LOCAL_STORAGE_DEFAULT_TEMPLATE;
  }
};

export default localStorageMigrationData;
