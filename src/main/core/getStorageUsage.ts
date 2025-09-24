import path from 'path';
import { app } from 'electron';

import getRootSize from '../utils/getRootSize';
import getDirSize from '../utils/getDirSize';
import logger from '../logger';
import { DB_PATH } from '@main/db/db';

const getAppDataStorageMetrics = async (): Promise<AppDataStorageMetrics> => {
  const appDataPath = app.getPath('userData');

  const appDataSize = await getDirSize(appDataPath);

  const artworkCacheSize = await getDirSize(path.join(appDataPath, 'song_covers'));
  const tempArtworkCacheSize = await getDirSize(path.join(appDataPath, 'temp_artworks'));

  const totalArtworkCacheSize = artworkCacheSize + tempArtworkCacheSize;

  const logSize = await getDirSize(path.join(appDataPath, 'logs'));

  const databaseSize = await getDirSize(DB_PATH);

  const totalKnownItemsSize = databaseSize + totalArtworkCacheSize + logSize;

  const otherSize = appDataSize - totalKnownItemsSize;

  return {
    appDataSize,
    artworkCacheSize,
    tempArtworkCacheSize,
    totalArtworkCacheSize,
    logSize,
    databaseSize,
    totalKnownItemsSize,
    otherSize
  };
};

const getStorageUsage = async () => {
  try {
    const appPath = app.getAppPath();
    const { dir: appFolderPath } = path.parse(appPath);

    logger.debug(`appPath to generate storage usage`, { appPath });

    const appRootSize = await getRootSize(appPath);
    const dataRootSize = await getRootSize(appPath);

    const rootSizes: Omit<typeof appRootSize, 'rootDir'> =
      appRootSize.rootDir === dataRootSize.rootDir
        ? appRootSize
        : {
            size: appRootSize.size + dataRootSize.size,
            freeSpace: appRootSize.freeSpace + dataRootSize.freeSpace
          };

    console.time('appFolder');
    const appFolderSize = await getDirSize(appFolderPath);
    console.timeEnd('appFolder');

    const remainingSize = rootSizes.size - appFolderSize;

    console.time('appData');
    const appDataSizes = await getAppDataStorageMetrics();
    console.timeEnd('appData');

    const totalSize = appDataSizes.appDataSize + appFolderSize;

    const storageMetrics: StorageMetrics = {
      rootSizes,
      remainingSize,
      appFolderSize,
      appDataSizes,
      totalSize,
      generatedDate: new Date().toISOString()
    };

    return storageMetrics;
  } catch (error) {
    logger.error('Failed to generate storage usage.', { error });
    return undefined;
  }
};

export default getStorageUsage;
