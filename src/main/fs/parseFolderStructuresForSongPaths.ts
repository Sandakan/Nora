import path from 'path';
import fsSync from 'fs';
import { supportedMusicExtensions } from '../filesystem';
import logger from '../logger';
import { closeAbortController } from './controlAbortControllers';
import addWatchersToFolders from './addWatchersToFolders';
import { sendMessageToRenderer } from '../main';
import { getAllFolderStructures, saveAllFolderStructures } from '@main/db/queries/folders';
import { db } from '@main/db/db';

export const getAllFoldersFromFolderStructures = (folderStructures: FolderStructure[]) => {
  const folderData: MusicFolderData[] = [];

  for (const structure of folderStructures) {
    const { path: folderPath, stats } = structure;
    folderData.push({ path: folderPath, stats });

    if (structure.subFolders.length > 0) {
      const subFolders = getAllFoldersFromFolderStructures(structure.subFolders);
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
    logger.error(`Failed to get file paths from a folder`, { error, folderPath });
    return [];
  }
};

export const getAllFilesFromFolderStructures = (folderStructures: FolderStructure[]) => {
  const allFolders = getAllFoldersFromFolderStructures(folderStructures);
  const allFiles = allFolders.map((folder) => getAllFilePathsFromFolder(folder.path)).flat();

  return allFiles;
};

export const doesFolderExistInFolderStructure = async (
  dir: string,
  folders?: FolderStructure[]
) => {
  let songFolders: FolderStructure[] = [];
  if (folders === undefined) songFolders = await getAllFolderStructures();
  else songFolders = folders;

  for (const folder of songFolders) {
    if (folder.path === dir) return true;
    if (folder.subFolders.length > 0) {
      const isFolderExistInSubDirs = await doesFolderExistInFolderStructure(dir, folder.subFolders);
      if (isFolderExistInSubDirs) return true;
    }
  }
  return false;
};

const updateStructure = (
  structure: FolderStructure,
  musicFolders: FolderStructure[]
): FolderStructure[] => {
  let isFound = false;

  for (const folder of musicFolders) {
    if (folder.path === structure.path) {
      folder.stats = structure.stats;

      const filteredFolderSubFolders = folder.subFolders.filter(
        (folderSubFolder) =>
          !structure.subFolders.some(
            (structureSubFolder) => structureSubFolder.path === folderSubFolder.path
          )
      );

      filteredFolderSubFolders.push(...structure.subFolders);
      folder.subFolders = filteredFolderSubFolders;
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

const clearAllFolderWatches = async () => {
  const musicFolders = await getAllFolderStructures();
  const folderPaths = getAllFoldersFromFolderStructures(musicFolders);

  for (const folderPath of folderPaths) {
    closeAbortController(folderPath.path);
  }
  logger.info('Closed all folders watches successfully.');
};

export const saveFolderStructures = async (
  structures: FolderStructure[],
  resetWatchers = false
) => {
  const data = await db.transaction(async (trx) => {
    let musicFolders = await getAllFolderStructures(trx);

    for (const structure of structures) {
      musicFolders = updateStructure(structure, musicFolders);
    }
    if (resetWatchers) clearAllFolderWatches();

    const result = await saveAllFolderStructures(musicFolders, trx);
    return result;
  });

  if (resetWatchers) addWatchersToFolders();
  return data;
};

const parseFolderStructuresForSongPaths = async (folderStructures: FolderStructure[]) => {
  const foldersWithStatData = getAllFoldersFromFolderStructures(folderStructures);

  sendMessageToRenderer({
    messageCode: 'FOLDER_PARSED_FOR_DIRECTORIES',
    data: {
      count: foldersWithStatData.length,
      folderCount: folderStructures.length
    }
  });

  const { addedFolders } = await saveFolderStructures(folderStructures, true);

  const allFilesData = addedFolders
    .map((folder) =>
      getAllFilePathsFromFolder(folder.path).map((songPath) => ({ songPath, folder }))
    )
    .flat();
  const allSongPaths = allFilesData.filter((file) => {
    const fileExtension = path.extname(file.songPath);
    return supportedMusicExtensions.includes(fileExtension);
  });

  logger.info(`Parsed selected folders successfully.`, {
    songCount: allSongPaths.length,
    totalFileCount: allFilesData.length,
    subFolderCount: foldersWithStatData.length,
    selectedFolderCount: folderStructures.length
  });

  return allSongPaths;
};

export default parseFolderStructuresForSongPaths;
