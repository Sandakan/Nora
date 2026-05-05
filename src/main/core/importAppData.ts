import fs from 'fs/promises';
import path from 'path';

import { importDatabase } from '@main/db/db';
import type { OpenDialogOptions } from 'electron';

import logger from '../logger';
import { restartApp, sendMessageToRenderer, showOpenDialog } from '../main';
import copyDir from '../utils/copyDir';
import { songCoversFolderPath } from './exportAppData';
import { type ExportedUserPreferences, importUserPreferences } from './userPreferencesExportImport';

const requiredItemsForImport = ['nora.pglite.db.sql', 'song_covers'];

const optionalItemsForImport = ['local_storage.json', 'user_preferences.json'];

const DEFAULT_EXPORT_DIALOG_OPTIONS: OpenDialogOptions = {
  title: `Select a Destination where you saved Nora's Exported App Data`,
  buttonLabel: 'Select Destination',
  properties: ['openDirectory', 'createDirectory']
};

const importRequiredData = async (importDir: string) => {
  try {
    // DATABASE IMPORT
    const dbQuery = await fs.readFile(path.join(importDir, 'nora.pglite.db.sql'), {
      encoding: 'utf-8'
    });
    await importDatabase(dbQuery);

    // SONG COVERS
    await copyDir(path.join(importDir, 'song_covers'), songCoversFolderPath);
  } catch (error) {
    logger.error('Failed to copy required data from import destination', {
      error,
      importDir
    });
  }
};
const importOptionalData = async (
  entries: string[],
  importDir: string
): Promise<{ localStorageData?: LocalStorage; userPreferences?: ExportedUserPreferences }> => {
  try {
    const result: {
      localStorageData?: LocalStorage;
      userPreferences?: ExportedUserPreferences;
    } = {};

    // LOCAL STORAGE DATA
    if (entries.includes('local_storage.json')) {
      const localStorageDataString = await fs.readFile(path.join(importDir, 'local_storage.json'), {
        encoding: 'utf-8'
      });
      result.localStorageData = JSON.parse(localStorageDataString);
    }

    // USER PREFERENCES DATA
    if (entries.includes('user_preferences.json')) {
      const userPreferencesString = await fs.readFile(
        path.join(importDir, 'user_preferences.json'),
        {
          encoding: 'utf-8'
        }
      );
      result.userPreferences = JSON.parse(userPreferencesString);
    }

    return result;
  } catch (error) {
    logger.error('Failed to copy optional data from import destination', {
      error,
      importDir
    });
    return {};
  }
};

const restartFunc = () => restartApp('Applying imported app data', true);

const importAppData = async () => {
  try {
    const destinations = await showOpenDialog(DEFAULT_EXPORT_DIALOG_OPTIONS);
    const missingEntries: string[] = [];

    logger.debug('Started to import app data.');
    sendMessageToRenderer({ messageCode: 'APPDATA_IMPORT_STARTED' });

    if (Array.isArray(destinations) && destinations.length > 0) {
      const importDir = destinations[0];

      const entries = await fs.readdir(importDir);

      const doesRequiredItemsExist = requiredItemsForImport.every((item) => {
        const isExist = entries.includes(item);
        if (!isExist) missingEntries.push(item);

        return isExist;
      });
      const availableOptionalEntries = optionalItemsForImport.filter((item) =>
        entries.includes(item)
      );

      if (doesRequiredItemsExist) {
        let localStorageData: LocalStorage | undefined;
        let userPreferences: ExportedUserPreferences | undefined;

        if (availableOptionalEntries.length > 0) {
          const optionalData = await importOptionalData(availableOptionalEntries, importDir);
          localStorageData = optionalData.localStorageData;
          userPreferences = optionalData.userPreferences;
        }

        await importRequiredData(importDir);

        // Import user preferences if available
        if (userPreferences) {
          await importUserPreferences(userPreferences);
          logger.info('Imported user preferences from backup');
        }

        logger.info('Successfully imported app data.');
        sendMessageToRenderer({ messageCode: 'APPDATA_IMPORT_SUCCESS' });

        if (localStorageData) {
          logger.info('Successfully imported app data. Restarting app in 5 seconds');
          sendMessageToRenderer({
            messageCode: 'APPDATA_IMPORT_SUCCESS_WITH_PENDING_RESTART'
          });
          setTimeout(restartFunc, 5000);
          return localStorageData;
        }
        return restartFunc();
      }
      logger.error('Failed to import app data. Missing required files in the selected folder.', {
        missingEntries
      });
      return sendMessageToRenderer({
        messageCode: 'APPDATA_IMPORT_FAILED_DUE_TO_MISSING_FILES'
      });
    }
    return logger.debug('User cancelled the prompt to select the import data.');
  } catch (error) {
    logger.error('Failed to import app data.', { error });
    return sendMessageToRenderer({ messageCode: 'APPDATA_IMPORT_FAILED' });
  }
};

export default importAppData;
