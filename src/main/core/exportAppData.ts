import fs from 'fs/promises';
import path from 'path';
import { type OpenDialogOptions, app } from 'electron';

import { sendMessageToRenderer, showOpenDialog } from '../main';
import logger from '../logger';
import copyDir from '../utils/copyDir';
import makeDir from '../utils/makeDir';
import { exportDatabase } from '@main/db/db';

const DEFAULT_EXPORT_DIALOG_OPTIONS: OpenDialogOptions = {
  title: 'Select a Destination to Export App Data',
  buttonLabel: 'Select Destination',
  properties: ['openDirectory', 'createDirectory']
};

const userDataPath = app.getPath('userData');
export const songCoversFolderPath = path.join(userDataPath, 'song_covers');

const warningMessage = `***** IMPORTANT *****

Please do not try to edit the contents of the 'Nora exports' folder.

This will most likely break the app in your system and you won't be able
to restore your data in Nora again.

These files are in plain-text to show users that there's nothing to hide 
in these config files.

***** ***** ***** *****
`;

const exportAppData = async (localStorageData: string) => {
  const destinations = await showOpenDialog(DEFAULT_EXPORT_DIALOG_OPTIONS);
  const dbDump = await exportDatabase();

  const operations = [
    // SONG DATA
    {
      filename: 'nora.pglite.db.sql',
      dataString: dbDump
    },
    // LOCAL STORAGE DATA
    {
      filename: 'local_storage.json',
      dataString: localStorageData
    },
    // WARNING MESSAGE
    {
      filename: 'IMPORTANT - DO NOT EDIT CONTENTS IN THIS DIRECTORY.txt',
      dataString: warningMessage
    },
    // SONG COVERS
    {
      filename: 'song_covers',
      directory: songCoversFolderPath
    }
  ];

  try {
    if (Array.isArray(destinations) && destinations.length > 0) {
      const destination =
        path.basename(destinations[0]) === 'Nora exports'
          ? destinations[0]
          : path.join(destinations[0], 'Nora exports');
      const { exist } = await makeDir(destination);

      if (exist)
        logger.debug(`'Nora exports' folder already exists. Will re-write contents of the folder.`);

      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];

        if (operation?.directory)
          await copyDir(operation.directory, path.join(destination, 'song_covers'));
        else if (operation?.dataString)
          await fs.writeFile(path.join(destination, operation.filename), operation.dataString);
        else throw new Error('Invalid operation');

        logger.debug('Exporting app data. Please wait');
        sendMessageToRenderer({
          messageCode: 'APPDATA_EXPORT_STARTED',
          data: { total: operations.length, value: i + 1 }
        });
      }

      logger.debug('Exported app data successfully.');
      return sendMessageToRenderer({ messageCode: 'APPDATA_EXPORT_SUCCESS' });
    }
    logger.warn(`Failed to export app data because user didn't select a destination.`);
    return sendMessageToRenderer({ messageCode: 'DESTINATION_NOT_SELECTED' });
  } catch (err) {
    logger.error('Failed to export app data.', { err, destinations });
    sendMessageToRenderer({ messageCode: 'APPDATA_EXPORT_FAILED' });
  }
};

export default exportAppData;
