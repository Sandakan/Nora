import fs from 'fs/promises';
import path from 'path';
import { OpenDialogOptions, app } from 'electron';

import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getListeningData,
  getPlaylistData,
  getSongsData,
  getBlacklistData,
  getUserData,
  getPaletteData
} from '../filesystem';
import { showOpenDialog } from '../main';
import log from '../log';
import copyDir from '../utils/copyDir';
import makeDir from '../utils/makeDir';

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

  const operations = [
    // SONG DATA
    {
      filename: 'songs.json',
      dataString: JSON.stringify({ songs: getSongsData() })
    },
    // PALETTE DATA
    {
      filename: 'palettes.json',
      dataString: JSON.stringify({ palettes: getPaletteData() })
    },
    // BLACKLIST DATA
    {
      filename: 'blacklist.json',
      dataString: JSON.stringify({ blacklists: getBlacklistData() })
    },
    // ARTIST DATA
    {
      filename: 'artists.json',
      dataString: JSON.stringify({ artists: getArtistsData() })
    },
    // PLAYLIST DATA
    {
      filename: 'playlists.json',
      dataString: JSON.stringify({ playlists: getPlaylistData() })
    },
    // ALBUM DATA
    {
      filename: 'albums.json',
      dataString: JSON.stringify({ albums: getAlbumsData() })
    },
    // GENRE DATA
    {
      filename: 'genres.json',
      dataString: JSON.stringify({ genres: getGenresData() })
    },
    // USER DATA
    {
      filename: 'userData.json',
      dataString: JSON.stringify({ userData: getUserData() })
    },
    // LISTENING DATA
    {
      filename: 'listening_data.json',
      dataString: JSON.stringify({ listeningData: getListeningData() })
    },
    // LOCAL STORAGE DATA
    {
      filename: 'localStorageData.json',
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

      if (exist) log(`'Nora exports' folder already exists. Will re-write contents of the folder.`);

      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];

        if (operation?.directory)
          await copyDir(operation.directory, path.join(destination, 'song_covers'));
        else if (operation?.dataString)
          await fs.writeFile(path.join(destination, operation.filename), operation.dataString);
        else throw new Error('Invalid operation');

        log('Exporting app data. Please wait...', undefined, undefined, {
          sendToRenderer: {
            messageCode: 'APPDATA_EXPORT_STARTED',
            data: { total: operations.length, value: i + 1 }
          }
        });
      }

      return log('Exported app data successfully.', undefined, 'INFO', {
        sendToRenderer: { messageCode: 'APPDATA_EXPORT_SUCCESS' }
      });
    }
    return log(
      `Failed to export app data because user didn't select a destination.`,
      undefined,
      'WARN',
      { sendToRenderer: { messageCode: 'DESTINATION_NOT_SELECTED' } }
    );
  } catch (err) {
    log('Error occurred when exporting app data.', { err, destinations }, 'ERROR', {
      sendToRenderer: { messageCode: 'APPDATA_EXPORT_FAILED' }
    });
    throw err;
  }
};

export default exportAppData;
