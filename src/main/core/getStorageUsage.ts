import { Worker } from 'worker_threads';
import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import { getUserData, setUserData } from '../filesystem';

import log from '../log';

const getDirSize = async (dir: string): Promise<number> =>
  new Promise((resolve, reject) => {
    const workerLocation = path.join(
      __dirname,
      '../workers/getDirSize.worker.js'
    );
    const worker = new Worker(workerLocation);

    worker.postMessage(dir);

    worker.on('message', (data) => {
      if (typeof data === 'number') return resolve(data);
      return reject(new Error('No data sent from the worker'));
    });

    worker.on('error', (err) => reject(err));
  });

const getFileSize = async (filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return 0;
    log(
      'Error occurred when trying to calculate file size of a file.',
      { error, filePath },
      'ERROR'
    );
  }
  return 0;
};

const getAppDataStorageMetrics = async () => {
  const appDataPath = app.getPath('userData');

  const appDataSize = await getDirSize(appDataPath);

  const artworkCacheSize = await getDirSize(
    path.join(appDataPath, 'song_covers')
  );
  const tempArtworkCacheSize = await getDirSize(
    path.join(appDataPath, 'temp_artworks')
  );

  const totalArtworkCacheSize = artworkCacheSize + tempArtworkCacheSize;

  const logSize = await getFileSize(path.join(appDataPath, 'logs.txt'));

  const songDataSize = await getFileSize(path.join(appDataPath, 'songs.json'));
  const artistDataSize = await getFileSize(
    path.join(appDataPath, 'artists.json')
  );
  const albumDataSize = await getFileSize(
    path.join(appDataPath, 'albums.json')
  );
  const genreDataSize = await getFileSize(
    path.join(appDataPath, 'genres.json')
  );
  const playlistDataSize = await getFileSize(
    path.join(appDataPath, 'playlists.json')
  );
  const userDataSize = await getFileSize(
    path.join(appDataPath, 'userData.json')
  );

  const librarySize =
    songDataSize +
    artistDataSize +
    albumDataSize +
    genreDataSize +
    playlistDataSize;
  const totalKnownItemsSize =
    librarySize + totalArtworkCacheSize + userDataSize + logSize;

  const otherSize = appDataSize - totalKnownItemsSize;

  return {
    appDataSize,
    artworkCacheSize,
    tempArtworkCacheSize,
    totalArtworkCacheSize,
    logSize,
    songDataSize,
    artistDataSize,
    albumDataSize,
    genreDataSize,
    playlistDataSize,
    userDataSize,
    librarySize,
    totalKnownItemsSize,
    otherSize,
  };
};

const getStorageUsage = async (forceRefresh = false) => {
  const userData = getUserData();
  let { storageMetrics } = userData;

  if (!forceRefresh) return storageMetrics;

  try {
    const appPath = app.getAppPath();
    const { dir: appFolderPath } = path.parse(appPath);

    log(`appPath to be used to generate storage usage - ${appPath}`);
    // const rootSize = await getDirSize(appPathRoot);
    console.time('appFolder');
    const appFolderSize = await getDirSize(appFolderPath);
    console.timeEnd('appFolder');
    // const remainingSize = rootSize - appFolderSize;

    console.time('appData');
    const appDataSizes = await getAppDataStorageMetrics();
    console.timeEnd('appData');

    const totalSize = appDataSizes.appDataSize + appFolderSize;

    storageMetrics = {
      // rootSize,
      // remainingSize,
      appFolderSize,
      appDataSizes,
      totalSize,
      generatedDate: new Date().toUTCString(),
    };

    setUserData('storageMetrics', storageMetrics);

    return storageMetrics;
  } catch (error) {
    log('Error occurred when generating storage usage.', { error }, 'ERROR');
    throw error;
  }
};

export default getStorageUsage;
