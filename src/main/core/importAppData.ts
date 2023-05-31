import { OpenDialogOptions } from 'electron';
import fs from 'fs/promises';
import path from 'path';

import { restartApp, showOpenDialog } from '../main';
import log from '../log';
import copyDir from '../utils/copyDir';
import { songCoversFolderPath } from './exportAppData';
import {
  setSongsData,
  setArtistsData,
  setPlaylistData,
  setAlbumsData,
  setGenresData,
  setBlacklist,
  saveListeningData,
  saveUserData,
} from '../filesystem';

const requiredItemsForImport = [
  'songs.json',
  'artists.json',
  'playlists.json',
  'genres.json',
  'albums.json',
  'userData.json',
  'song_covers',
];

const optionalItemsForImport = [
  'localStorageData.json',
  'blacklist.json',
  'listening_data.json',
];

const DEFAULT_EXPORT_DIALOG_OPTIONS: OpenDialogOptions = {
  title: `Select a Destination where you saved Nora's Exported App Data`,
  buttonLabel: 'Select Destination',
  properties: ['openDirectory', 'createDirectory'],
};

const importRequiredData = async (importDir: string) => {
  try {
    // SONG DATA
    const songDataString = await fs.readFile(
      path.join(importDir, 'songs.json'),
      {
        encoding: 'utf-8',
      }
    );
    const songData: SavableSongData[] = JSON.parse(songDataString).songs;

    // ARTIST DATA
    const artistDataString = await fs.readFile(
      path.join(importDir, 'artists.json'),
      {
        encoding: 'utf-8',
      }
    );
    const artistData: SavableArtist[] = JSON.parse(artistDataString).artists;

    // PLAYLIST DATA
    const playlistDataString = await fs.readFile(
      path.join(importDir, 'playlists.json'),
      {
        encoding: 'utf-8',
      }
    );
    const playlistData: SavablePlaylist[] =
      JSON.parse(playlistDataString).playlists;

    // ALBUM DATA
    const albumDataString = await fs.readFile(
      path.join(importDir, 'albums.json'),
      {
        encoding: 'utf-8',
      }
    );
    const albumData: SavableAlbum[] = JSON.parse(albumDataString).albums;

    // GENRE DATA
    const genreDataString = await fs.readFile(
      path.join(importDir, 'genres.json'),
      {
        encoding: 'utf-8',
      }
    );
    const genreData: SavableGenre[] = JSON.parse(genreDataString).genres;

    // USER DATA
    const userDataString = await fs.readFile(
      path.join(importDir, 'userData.json'),
      {
        encoding: 'utf-8',
      }
    );
    const { userData } = JSON.parse(userDataString);

    // SONG COVERS
    await copyDir(path.join(importDir, 'song_covers'), songCoversFolderPath);

    // SAVING IMPORTED DATA
    setSongsData(songData);
    setArtistsData(artistData);
    setPlaylistData(playlistData);
    setAlbumsData(albumData);
    setGenresData(genreData);
    saveUserData(userData as UserData);
  } catch (error) {
    log(
      'Error occurred when copying required data from import destination',
      { error },
      'ERROR'
    );
    throw error;
  }
};
const importOptionalData = async (
  entries: string[],
  importDir: string
): Promise<LocalStorage | undefined> => {
  try {
    // LISTENING DATA
    if (entries.includes('listening_data.json')) {
      const listeningDataString = await fs.readFile(
        path.join(importDir, 'listening_data.json'),
        {
          encoding: 'utf-8',
        }
      );
      const blacklistData: SongListeningData[] =
        JSON.parse(listeningDataString).listeningData;
      saveListeningData(blacklistData);
    }

    // BLACKLIST DATA
    if (entries.includes('blacklist.json')) {
      const blacklistDataString = await fs.readFile(
        path.join(importDir, 'blacklist.json'),
        {
          encoding: 'utf-8',
        }
      );
      const blacklistData: Blacklist =
        JSON.parse(blacklistDataString).blacklists;
      setBlacklist(blacklistData);
    }

    // LOCAL STORAGE DATA
    if (entries.includes('localStorageData.json')) {
      const localStorageDataString = await fs.readFile(
        path.join(importDir, 'localStorageData.json'),
        {
          encoding: 'utf-8',
        }
      );
      const localStorageData: LocalStorage = JSON.parse(localStorageDataString);
      return localStorageData;
    }
    return undefined;
  } catch (error) {
    log(
      'Error occurred when copying optional data from import destination',
      { error },
      'ERROR'
    );
    return undefined;
  }
};

const restartFunc = () => restartApp('Applying imported app data', true);

const importAppData = async () => {
  try {
    const destinations = await showOpenDialog(DEFAULT_EXPORT_DIALOG_OPTIONS);
    const missingEntries: string[] = [];

    log('Started to import app data. Please wait...', undefined, undefined, {
      sendToRenderer: true,
    });

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
          localStorageData = await importOptionalData(
            availableOptionalEntries,
            importDir
          );
        await importRequiredData(importDir);

        log('Successfully imported app data.', undefined, undefined, {
          sendToRenderer: true,
        });

        if (localStorageData) {
          log('Restarting app in 5 seconds', undefined, 'WARN', {
            sendToRenderer: true,
          });
          setTimeout(restartFunc, 5000);
          return localStorageData;
        }
        return restartFunc();
      }
      return log(
        'Failed to import app data. Missing required files in the selected folder.',
        { missingEntries },
        'WARN',
        { sendToRenderer: true }
      );
    }
    return log(
      'Failed to import data because user cancelled the prompt to select the import data.',
      undefined,
      'WARN'
    );
  } catch (error) {
    return log('Failed to import app data.', { error }, 'ERROR', {
      sendToRenderer: true,
    });
  }
};

export default importAppData;
