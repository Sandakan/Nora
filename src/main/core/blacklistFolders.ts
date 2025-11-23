import logger from '../logger';
import { dataUpdateEvent } from '../main';
import { addFoldersToBlacklist, getFoldersByPaths } from '@main/db/queries/folders';

const blacklistFolders = async (folderPaths: string[]) => {
  const folders = await getFoldersByPaths(folderPaths);
  const selectWhitelistedFolders = folders.filter((folder) => !folder.isBlacklisted);

  if (selectWhitelistedFolders.length === 0) {
    return logger.info('No new folder paths to blacklist.', { folderPaths });
  }
  await addFoldersToBlacklist(selectWhitelistedFolders.map((f) => f.id));

  dataUpdateEvent('blacklist/folderBlacklist');
  logger.info('Folder blacklist updated because a new songs got blacklisted.', { folderPaths });
};

export default blacklistFolders;
