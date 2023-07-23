/* eslint-disable no-await-in-loop */
import path from 'path';
import fsSync from 'fs';
import {
  getUserData,
  setUserData,
  supportedMusicExtensions,
} from '../filesystem';
import log from '../log';
import { closeAbortController } from './controlAbortControllers';
import addWatchersToFolders from './addWatchersToFolders';
import { sendMessageToRenderer } from '../main';

export const getAllFoldersFromFolderStructures = (
  folderStructures: FolderStructure[],
) => {
  const folderData: MusicFolderData[] = [];

  for (const structure of folderStructures) {
    const { path: folderPath, stats } = structure;
    folderData.push({ path: folderPath, stats });

    if (structure.subFolders.length > 0) {
      const subFolders = getAllFoldersFromFolderStructures(
        structure.subFolders,
      );
      folderData.push(...subFolders);
    }
  }

  return folderData;
};

export const getAllFilePathsFromFolder = (folderPath: string) => {
  try {
    const baseNames = fsSync.readdirSync(folderPath);
    const filePaths = baseNames
      .filter((baseName) => path.extname(baseName))
      .map((baseName) => path.join(folderPath, baseName));

    return filePaths;
  } catch (error) {
    log(
      `Error occurred when getting file paths from '${path.basename(
        folderPath,
      )}' folder`,
      { error },
      'ERROR',
    );
    return [];
  }
};

export const getAllFilesFromFolderStructures = (
  folderStructures: FolderStructure[],
) => {
  const allFolders = getAllFoldersFromFolderStructures(folderStructures);
  const allFiles = allFolders
    .map((folder) => getAllFilePathsFromFolder(folder.path))
    .flat();

  return allFiles;
};

export const doesFolderExistInFolderStructure = (
  dir: string,
  folders?: FolderStructure[],
) => {
  let musicFolders: FolderStructure[] = [];
  if (folders === undefined) musicFolders = getUserData().musicFolders;
  else musicFolders = folders;

  for (const folder of musicFolders) {
    if (folder.path === dir) return true;
    if (folder.subFolders.length > 0) {
      const isFolderExistInSubDirs = doesFolderExistInFolderStructure(
        dir,
        folder.subFolders,
      );
      if (isFolderExistInSubDirs) return true;
    }
  }
  return false;
};

const updateStructure = (
  structure: FolderStructure,
  musicFolders: FolderStructure[],
): FolderStructure[] => {
  let isFound = false;

  for (const folder of musicFolders) {
    if (folder.path === structure.path) {
      folder.stats = structure.stats;

      folder.subFolders = folder.subFolders.filter(
        (folderSubFolder) =>
          !structure.subFolders.some(
            (structureSubFolder) =>
              structureSubFolder.path === folderSubFolder.path,
          ),
      );

      folder.subFolders.push(...structure.subFolders);
      isFound = true;
      break;
    }
    if (structure.path.includes(folder.path)) {
      const updatedSubFolders = updateStructure(structure, folder.subFolders);
      folder.subFolders = updatedSubFolders;
      isFound = true;
      break;
    }
  }

  if (!isFound) musicFolders.push(structure);
  return musicFolders;
};

const clearAllFolderWatches = () => {
  const { musicFolders } = getUserData();
  const folderPaths = getAllFoldersFromFolderStructures(musicFolders);

  for (const folderPath of folderPaths) {
    closeAbortController(folderPath.path);
  }
  log('Closed all folders watches successfully.');
};

export const saveFolderStructures = async (
  structures: FolderStructure[],
  resetWatchers = false,
) => {
  let musicFolders = [...getUserData().musicFolders];

  for (const structure of structures) {
    musicFolders = updateStructure(structure, musicFolders);
  }
  if (resetWatchers) clearAllFolderWatches();

  setUserData('musicFolders', musicFolders);

  if (resetWatchers) return addWatchersToFolders();
  return undefined;
};

const parseFolderStructuresForSongPaths = async (
  folderStructures: FolderStructure[],
) => {
  const foldersWithStatData =
    getAllFoldersFromFolderStructures(folderStructures);

  sendMessageToRenderer(
    `${foldersWithStatData.length} directories found in ${folderStructures.length} selected folders.`,
  );
  log(
    `${foldersWithStatData.length} directories found in ${folderStructures.length} selected folders.`,
  );

  const allFiles = getAllFilesFromFolderStructures(folderStructures);
  log(
    `${allFiles.length} files found in the directory ${folderStructures.length}`,
  );

  await saveFolderStructures(folderStructures, true);

  const allSongPaths = allFiles.filter((filePath) => {
    const fileExtension = path.extname(filePath);
    return supportedMusicExtensions.includes(fileExtension);
  });

  log(
    `${allSongPaths.length} songs found in the directory ${folderStructures.length}`,
  );
  return allSongPaths;
};

export default parseFolderStructuresForSongPaths;
