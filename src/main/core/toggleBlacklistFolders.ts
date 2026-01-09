import logger from '../logger';
import { getBlacklistData, setBlacklist } from '../filesystem';
import { dataUpdateEvent } from '../main';

interface toggleBlacklistFoldersReturnValue {
  blacklists: string[];
  whitelists: string[];
}

const toggleBlacklistFolders = async (folderPaths: string[], isBlacklistFolder?: boolean) => {
  const blacklist = getBlacklistData();

  const result: toggleBlacklistFoldersReturnValue = {
    blacklists: [],
    whitelists: []
  };
  logger.debug(`Requested to modify folder blacklist status`, { folderPaths, isBlacklistFolder });

  for (const folderPath of folderPaths) {
    const isFolderBlacklisted = blacklist.folderBlacklist.includes(folderPath);

    if (isBlacklistFolder === undefined) {
      if (isFolderBlacklisted) {
        blacklist.folderBlacklist = blacklist.folderBlacklist.filter(
          (blacklistedFolderPath) => blacklistedFolderPath !== folderPath
        );
        result.whitelists.push(folderPath);
      } else {
        blacklist.folderBlacklist.push(folderPath);
        result.blacklists.push(folderPath);
      }
    } else if (isBlacklistFolder) {
      if (!isFolderBlacklisted) {
        blacklist.folderBlacklist.push(folderPath);
        result.blacklists.push(folderPath);
      } else
        logger.error(`Request to blacklist a folder but it is already blacklisted.`, {
          folderPath,
          isFolderBlacklisted,
          isBlacklistFolder
        });
    } else if (isFolderBlacklisted) {
      blacklist.folderBlacklist = blacklist.folderBlacklist.filter(
        (blacklistedFolderPath) => blacklistedFolderPath !== folderPath
      );
      result.whitelists.push(folderPath);
    } else
      logger.error(`Request to whitelist a folder but it is already whitelisted.`, {
        folderPath,
        isFolderBlacklisted,
        isBlacklistFolder
      });
  }

  setBlacklist(blacklist);
  dataUpdateEvent('blacklist/folderBlacklist');
  return result;
};

export default toggleBlacklistFolders;
