/* eslint-disable no-await-in-loop */
import path from 'path';
import fsSync from 'fs';
import fs from 'fs/promises';
import {
  getDirectoriesRecursive,
  getUserData,
  setUserData,
  supportedMusicExtensions,
} from '../filesystem';
import log from '../log';
import { addWatcherToFolder } from './addWatchersToFolders';

const getAllFilesFromFolders = (allFolderPaths: string[]) => {
  const allFiles = allFolderPaths
    .map((folder) => {
      const x = fsSync.readdirSync(folder).map((y) => path.join(folder, y));
      return x;
    })
    .flat();

  return allFiles;
};

const getFoldersStatData = async (allFolders: string[]) => {
  const foldersWithStatData: MusicFolderData[] = [];

  for (let x = 0; x < allFolders.length; x += 1) {
    const folderPath = allFolders[x];
    try {
      const stats = await fs.stat(folderPath);
      foldersWithStatData.push({
        path: folderPath,
        stats: {
          lastModifiedDate: stats.mtime,
          lastChangedDate: stats.ctime,
          fileCreatedDate: stats.birthtime,
          lastParsedDate: new Date(),
        },
      });
    } catch (error) {
      log(error as Error, undefined, 'ERROR');
    }
  }

  return foldersWithStatData;
};

const parseFolderForSongPaths = async (dir: string) => {
  const { musicFolders } = getUserData();

  const allFolders = await getDirectoriesRecursive(dir).catch((err) => {
    log(err);
    return [];
  });
  log(`${allFolders.length} directories found in the directory ${dir}`);

  const allFiles = getAllFilesFromFolders(allFolders);
  log(`${allFiles.length} files found in the directory ${dir}`);

  let foldersWithStatData = await getFoldersStatData(allFolders);

  foldersWithStatData = foldersWithStatData.filter((folderPath) => {
    for (let i = 0; i < musicFolders.length; i += 1) {
      if (musicFolders[i].path === folderPath.path) return false;
    }
    return true;
  });

  if (foldersWithStatData.length > 0) {
    for (let i = 0; i < foldersWithStatData.length; i += 1) {
      const folderData = foldersWithStatData[i];
      try {
        await addWatcherToFolder(folderData);
      } catch (error) {
        log(
          `ERROR OCCURRED WHEN ADDING WATCHER TO '${path.basename(
            folderData.path
          )}' MUSIC FOLDER.`,
          { error },
          'ERROR'
        );
      }
    }
    setUserData('musicFolders', musicFolders.concat(foldersWithStatData));
  }

  const allSongPaths = allFiles.filter((filePath) => {
    const fileExtension = path.extname(filePath);
    return supportedMusicExtensions.includes(fileExtension);
  });

  log(`${allSongPaths.length} songs found in the directory ${dir}`);
  return allSongPaths;
};

export default parseFolderForSongPaths;
