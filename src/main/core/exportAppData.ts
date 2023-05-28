import { OpenDialogOptions } from 'electron';
import fs from 'fs/promises';
import path from 'path';

import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getListeningData,
  getPlaylistData,
  getSongsData,
} from '../filesystem';
import { showOpenDialog } from '../main';
import log from '../log';

const DEFAULT_EXPORT_DIALOG_OPTIONS: OpenDialogOptions = {
  title: 'Select a Destination to Export App Data',
  buttonLabel: 'Select Destination',
  properties: ['openDirectory', 'createDirectory'],
};

const exportAppData = async (localStorageData: string) => {
  const destinations = await showOpenDialog(DEFAULT_EXPORT_DIALOG_OPTIONS);
  try {
    if (Array.isArray(destinations) && destinations.length > 0) {
      const destination = path.join(destinations[0], 'Nora exports');
      await fs.mkdir(destination);

      // SONG DATA
      const songData = getSongsData();
      const songDataString = JSON.stringify({ songs: songData });

      await fs.writeFile(path.join(destination, 'songs.json'), songDataString);

      // ARTIST DATA
      const artistData = getArtistsData();
      const artistDataString = JSON.stringify({ artists: artistData });

      await fs.writeFile(
        path.join(destination, 'artists.json'),
        artistDataString
      );

      // PLAYLIST DATA
      const playlistData = getPlaylistData();
      const playlistDataString = JSON.stringify({ playlists: playlistData });

      await fs.writeFile(
        path.join(destination, 'playlists.json'),
        playlistDataString
      );

      // ALBUM DATA
      const albumData = getAlbumsData();
      const albumDataString = JSON.stringify({ albums: albumData });

      await fs.writeFile(
        path.join(destination, 'genres.json'),
        albumDataString
      );

      // GENRE DATA
      const genreData = getGenresData();
      const genreDataString = JSON.stringify({ genres: genreData });

      await fs.writeFile(
        path.join(destination, 'genres.json'),
        genreDataString
      );

      // LISTENING DATA
      const listeningData = getListeningData();
      const listeningDataString = JSON.stringify({ listeningData });

      await fs.writeFile(
        path.join(destination, 'listenings.json'),
        listeningDataString
      );

      // LOCAL STORAGE DATA
      await fs.writeFile(
        path.join(destination, 'localStorageData.json'),
        localStorageData
      );

      return log('Exported app data successfully.', undefined, 'INFO', {
        sendToRenderer: true,
      });
    }
    return log(
      `Failed to export app data because user didn't select a destination.`,
      undefined,
      'WARN',
      { sendToRenderer: true }
    );
  } catch (err) {
    log(
      'Error occurred when exporting app data.',
      { err, destinations },
      'ERROR',
      { sendToRenderer: true }
    );
    throw err;
  }
};

export default exportAppData;
