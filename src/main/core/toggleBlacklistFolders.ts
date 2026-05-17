import path from 'path';

import {
  addFoldersToBlacklist,
  getFoldersByPaths,
  removeFoldersFromBlacklist
} from '@main/db/queries/folders';

import logger from '../logger';
import { dataUpdateEvent } from '../main';

interface toggleBlacklistFoldersReturnValue {
  blacklists: string[];
  whitelists: string[];
}

const toggleBlacklistFolders = async (folderPaths: string[], isBlacklistFolder?: boolean) => {
  const normalizedFolderPaths = [
    ...new Set(folderPaths.map((folderPath) => path.normalize(folderPath)))
  ];
  const folders = await getFoldersByPaths(normalizedFolderPaths);
  const foldersByPath = new Map(folders.map((folder) => [path.normalize(folder.path), folder]));
  const foldersToBlacklist: number[] = [];
  const foldersToWhitelist: number[] = [];

  const result: toggleBlacklistFoldersReturnValue = {
    blacklists: [],
    whitelists: []
  };
  logger.debug(`Requested to modify folder blacklist status`, {
    folderPaths: normalizedFolderPaths,
    isBlacklistFolder
  });

  for (const folderPath of normalizedFolderPaths) {
    const folder = foldersByPath.get(folderPath);

    if (!folder) {
      logger.error(`Requested to modify a folder that does not exist in the database.`, {
        folderPath,
        isBlacklistFolder
      });
      continue;
    }

    const isFolderBlacklisted = folder.isBlacklisted;

    if (isBlacklistFolder === undefined) {
      if (isFolderBlacklisted) {
        foldersToWhitelist.push(folder.id);
        result.whitelists.push(folderPath);
      } else {
        foldersToBlacklist.push(folder.id);
        result.blacklists.push(folderPath);
      }
    } else if (isBlacklistFolder) {
      if (!isFolderBlacklisted) {
        foldersToBlacklist.push(folder.id);
        result.blacklists.push(folderPath);
      } else
        logger.error(`Request to blacklist a folder but it is already blacklisted.`, {
          folderPath,
          isFolderBlacklisted,
          isBlacklistFolder
        });
    } else if (isFolderBlacklisted) {
      foldersToWhitelist.push(folder.id);
      result.whitelists.push(folderPath);
    } else
      logger.error(`Request to whitelist a folder but it is already whitelisted.`, {
        folderPath,
        isFolderBlacklisted,
        isBlacklistFolder
      });
  }

  if (foldersToBlacklist.length > 0) await addFoldersToBlacklist(foldersToBlacklist);
  if (foldersToWhitelist.length > 0) await removeFoldersFromBlacklist(foldersToWhitelist);

  dataUpdateEvent('blacklist/folderBlacklist');
  return result;
};

export default toggleBlacklistFolders;
