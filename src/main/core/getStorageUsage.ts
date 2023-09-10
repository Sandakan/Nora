import path from 'path';
import { app } from 'electron';

import { getUserData, setUserData } from '../filesystem';

import getRootSize from '../utils/getRootSize';
import getDirSize from '../utils/getDirSize';
import getFileSize from '../utils/getFileSize';
import log from '../log';

const getAppDataStorageMetrics = async () => {
  const appDataPath = app.getPath('userData');

  const appDataSize = await getDirSize(appDataPath);

  const artworkCacheSize = await getDirSize(
    path.join(appDataPath, 'song_covers'),
  );
  const tempArtworkCacheSize = await getDirSize(
    path.join(appDataPath, 'temp_artworks'),
  );

  const totalArtworkCacheSize = artworkCacheSize + tempArtworkCacheSize;

  const logSize = await getDirSize(path.join(appDataPath, 'logs'));

  const songDataSize = await getFileSize(path.join(appDataPath, 'songs.json'));
  const artistDataSize = await getFileSize(
    path.join(appDataPath, 'artists.json'),
  );
  const albumDataSize = await getFileSize(
    path.join(appDataPath, 'albums.json'),
  );
  const genreDataSize = await getFileSize(
    path.join(appDataPath, 'genres.json'),
  );
  const playlistDataSize = await getFileSize(
    path.join(appDataPath, 'playlists.json'),
  );
  const userDataSize = await getFileSize(
    path.join(appDataPath, 'userData.json'),
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

    const rootSizes = await getRootSize(appPath);

    console.time('appFolder');
    const appFolderSize = await getDirSize(appFolderPath);
    console.timeEnd('appFolder');

    const remainingSize = rootSizes.size - appFolderSize;

    console.time('appData');
    const appDataSizes = await getAppDataStorageMetrics();
    console.timeEnd('appData');

    const totalSize = appDataSizes.appDataSize + appFolderSize;

    storageMetrics = {
      rootSizes,
      remainingSize,
      appFolderSize,
      appDataSizes,
      totalSize,
      generatedDate: new Date().toISOString(),
    };

    setUserData('storageMetrics', storageMetrics);

    return storageMetrics;
  } catch (error) {
    log('Error occurred when generating storage usage.', { error }, 'ERROR');
    throw error;
  }
};

export default getStorageUsage;
