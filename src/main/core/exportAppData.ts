import { OpenDialogOptions, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getListeningData,
  getPlaylistData,
  getSongsData,
  getBlacklistData,
  getUserData,
} from '../filesystem';
import { showOpenDialog } from '../main';
import log from '../log';
import copyDir from '../utils/copyDir';
import makeDir from '../utils/makeDir';

const DEFAULT_EXPORT_DIALOG_OPTIONS: OpenDialogOptions = {
  title: 'Select a Destination to Export App Data',
  buttonLabel: 'Select Destination',
  properties: ['openDirectory', 'createDirectory'],
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

  log('Started to export app data. Please wait...', undefined, undefined, {
    sendToRenderer: true,
  });

  try {
    if (Array.isArray(destinations) && destinations.length > 0) {
      const destination = path.join(destinations[0], 'Nora exports');
      const { exist } = await makeDir(destination);

      if (exist)
        log(
          `'Nora exports' folder already exists. Will re-write contents of the folder.`
        );

      // SONG DATA
      const songData = getSongsData();
      const songDataString = JSON.stringify({ songs: songData });

      await fs.writeFile(path.join(destination, 'songs.json'), songDataString);

      // BLACKLIST DATA
      const blacklistData = getBlacklistData();
      const blacklistDataString = JSON.stringify({ blacklists: blacklistData });

      await fs.writeFile(
        path.join(destination, 'blacklist.json'),
        blacklistDataString
      );

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
        path.join(destination, 'albums.json'),
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
      const userData = getUserData();
      const userDataString = JSON.stringify({ userData });

      await fs.writeFile(
        path.join(destination, 'userData.json'),
        userDataString
      );

      // LISTENING DATA
      const listeningData = getListeningData();
      const listeningDataString = JSON.stringify({ listeningData });

      await fs.writeFile(
        path.join(destination, 'listening_data.json'),
        listeningDataString
      );

      // LOCAL STORAGE DATA
      await fs.writeFile(
        path.join(destination, 'localStorageData.json'),
        localStorageData
      );

      // SONG ARTWORKS
      await copyDir(
        songCoversFolderPath,
        path.join(destination, 'song_covers')
      );

      // WARNING TEXT MESSAGE
      await fs.writeFile(
        path.join(
          destination,
          'IMPORTANT - DO NOT EDIT CONTENTS IN THIS DIRECTORY.txt'
        ),
        warningMessage
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
