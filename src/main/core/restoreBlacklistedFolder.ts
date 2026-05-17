import path from 'path';

import { getFoldersByPaths, removeFoldersFromBlacklist } from '@main/db/queries/folders';

import logger from '../logger';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';

const restoreBlacklistedFolders = async (blacklistedFolderPaths: string[]) => {
  const normalizedBlacklistedFolderPaths = [
    ...new Set(blacklistedFolderPaths.map((folderPath) => path.normalize(folderPath)))
  ];
  const folderPathsWithParents = [
    ...new Set(
      normalizedBlacklistedFolderPaths.flatMap((folderPath) => [
        folderPath,
        path.dirname(folderPath)
      ])
    )
  ];

  const folders = await getFoldersByPaths(folderPathsWithParents);
  const foldersByPath = new Map(folders.map((folder) => [path.normalize(folder.path), folder]));
  const blacklistedFolderPathSet = new Set(normalizedBlacklistedFolderPaths);

  for (const blacklistedFolderPath of normalizedBlacklistedFolderPaths) {
    const parentFolderPath = path.normalize(path.dirname(blacklistedFolderPath));
    const isParentBlacklisted = foldersByPath.get(parentFolderPath)?.isBlacklisted ?? false;
    const isParentNotInFolderPaths = !blacklistedFolderPathSet.has(parentFolderPath);

    if (isParentBlacklisted && isParentNotInFolderPaths)
      sendMessageToRenderer({
        messageCode: 'WHITELISTING_FOLDER_FAILED_DUE_TO_BLACKLISTED_PARENT_FOLDER',
        data: {
          folderName: path.basename(blacklistedFolderPath),
          parentFolderName: parentFolderPath
        }
      });
  }

  const foldersToWhitelist = folders
    .filter((folder) => blacklistedFolderPathSet.has(path.normalize(folder.path)))
    .map((folder) => folder.id);

  if (foldersToWhitelist.length > 0) await removeFoldersFromBlacklist(foldersToWhitelist);

  dataUpdateEvent('blacklist/folderBlacklist');
  logger.info('Folder blacklist updated because some songs got removed from the blacklist.', {
    blacklistedFolderPaths: normalizedBlacklistedFolderPaths
  });
};

export default restoreBlacklistedFolders;
