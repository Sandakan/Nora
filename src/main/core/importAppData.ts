import fs from 'fs/promises';
import path from 'path';
import type { OpenDialogOptions } from 'electron';

import { restartApp, sendMessageToRenderer, showOpenDialog } from '../main';
import logger from '../logger';
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
  setPaletteData
} from '../filesystem';

const requiredItemsForImport = [
  'songs.json',
  'artists.json',
  'playlists.json',
  'genres.json',
  'albums.json',
  'userData.json',
  'song_covers'
];

const optionalItemsForImport = ['localStorageData.json', 'blacklist.json', 'listening_data.json'];

const DEFAULT_EXPORT_DIALOG_OPTIONS: OpenDialogOptions = {
  title: `Select a Destination where you saved Nora's Exported App Data`,
  buttonLabel: 'Select Destination',
  properties: ['openDirectory', 'createDirectory']
};

const importRequiredData = async (importDir: string) => {
  try {
    // SONG DATA
    const songDataString = await fs.readFile(path.join(importDir, 'songs.json'), {
      encoding: 'utf-8'
    });
    const songData: SavableSongData[] = JSON.parse(songDataString).songs;

    // PALETTE DATA
    const paletteDataString = await fs.readFile(path.join(importDir, 'palettes.json'), {
      encoding: 'utf-8'
    });
    const paletteData: PaletteData[] = JSON.parse(paletteDataString).palettes;

    // ARTIST DATA
    const artistDataString = await fs.readFile(path.join(importDir, 'artists.json'), {
      encoding: 'utf-8'
    });
    const artistData: SavableArtist[] = JSON.parse(artistDataString).artists;

    // PLAYLIST DATA
    const playlistDataString = await fs.readFile(path.join(importDir, 'playlists.json'), {
      encoding: 'utf-8'
    });
    const playlistData: SavablePlaylist[] = JSON.parse(playlistDataString).playlists;

    // ALBUM DATA
    const albumDataString = await fs.readFile(path.join(importDir, 'albums.json'), {
      encoding: 'utf-8'
    });
    const albumData: SavableAlbum[] = JSON.parse(albumDataString).albums;

    // GENRE DATA
    const genreDataString = await fs.readFile(path.join(importDir, 'genres.json'), {
      encoding: 'utf-8'
    });
    const genreData: SavableGenre[] = JSON.parse(genreDataString).genres;

    // SONG COVERS
    await copyDir(path.join(importDir, 'song_covers'), songCoversFolderPath);

    // SAVING IMPORTED DATA
    setSongsData(songData);
    setPaletteData(paletteData);
    setArtistsData(artistData);
    setPlaylistData(playlistData);
    setAlbumsData(albumData);
    setGenresData(genreData);
  } catch (error) {
    logger.error('Failed to copy required data from import destination', { error, importDir });
  }
};
const importOptionalData = async (
  entries: string[],
  importDir: string
): Promise<LocalStorage | undefined> => {
  try {
    // LISTENING DATA
    if (entries.includes('listening_data.json')) {
      const listeningDataString = await fs.readFile(path.join(importDir, 'listening_data.json'), {
        encoding: 'utf-8'
      });
      const blacklistData: SongListeningData[] = JSON.parse(listeningDataString).listeningData;
      saveListeningData(blacklistData);
    }

    // BLACKLIST DATA
    if (entries.includes('blacklist.json')) {
      const blacklistDataString = await fs.readFile(path.join(importDir, 'blacklist.json'), {
        encoding: 'utf-8'
      });
      const blacklistData: Blacklist = JSON.parse(blacklistDataString).blacklists;
      setBlacklist(blacklistData);
    }

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
