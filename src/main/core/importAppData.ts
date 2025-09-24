import fs from 'fs/promises';
import path from 'path';
import type { OpenDialogOptions } from 'electron';

import { restartApp, sendMessageToRenderer, showOpenDialog } from '../main';
import logger from '../logger';
import copyDir from '../utils/copyDir';
import { songCoversFolderPath } from './exportAppData';
import { importDatabase } from '@main/db/db';

const requiredItemsForImport = ['nora.pglite.db.sql', 'song_covers'];

const optionalItemsForImport = ['local_storage.json'];

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
    logger.error('Failed to copy required data from import destination', { error, importDir });
  }
};
const importOptionalData = async (
  entries: string[],
  importDir: string
): Promise<LocalStorage | undefined> => {
  try {
    // LOCAL STORAGE DATA
    if (entries.includes('localStorageData.json')) {
      const localStorageDataString = await fs.readFile(
        path.join(importDir, 'localStorageData.json'),
        {
          encoding: 'utf-8'
        }
      );
      const localStorageData: LocalStorage = JSON.parse(localStorageDataString);
      return localStorageData;
    }
    return undefined;
  } catch (error) {
    logger.error('Failed to copy optional data from import destination', { error, importDir });
    return undefined;
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

        if (availableOptionalEntries.length > 0)
          localStorageData = await importOptionalData(availableOptionalEntries, importDir);

        await importRequiredData(importDir);

        logger.info('Successfully imported app data.');
        sendMessageToRenderer({ messageCode: 'APPDATA_IMPORT_SUCCESS' });

        if (localStorageData) {
          logger.info('Successfully imported app data. Restarting app in 5 seconds');
          sendMessageToRenderer({ messageCode: 'APPDATA_IMPORT_SUCCESS_WITH_PENDING_RESTART' });
          setTimeout(restartFunc, 5000);
          return localStorageData;
        }
        return restartFunc();
      }
      logger.error('Failed to import app data. Missing required files in the selected folder.', {
        missingEntries
      });
      return sendMessageToRenderer({ messageCode: 'APPDATA_IMPORT_FAILED_DUE_TO_MISSING_FILES' });
    }
    return logger.debug('User cancelled the prompt to select the import data.');
  } catch (error) {
    logger.error('Failed to import app data.', { error });
    return sendMessageToRenderer({ messageCode: 'APPDATA_IMPORT_FAILED' });
  }
};

export default importAppData;

