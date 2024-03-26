import log from '../log';
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
  log(
    `Requested to ${
      isBlacklistFolder !== undefined
        ? isBlacklistFolder
          ? 'blacklist'
          : 'whilelist'
        : 'toggle blacklist'
    } ${folderPaths.length} folders.`,
    { folderPaths }
  );

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
        log(
          `Request to blacklist a folder but it is already blacklisted.`,
          { folderPath, isFolderBlacklisted, isBlacklistFolder },
          'ERROR'
        );
    } else if (isFolderBlacklisted) {
      blacklist.folderBlacklist = blacklist.folderBlacklist.filter(
        (blacklistedFolderPath) => blacklistedFolderPath !== folderPath
      );
      result.whitelists.push(folderPath);
    } else
      log(
        `Request to whitelist a folder but it is already whitelisted.`,
        { folderPath, isFolderBlacklisted, isBlacklistFolder },
        'ERROR'
      );
  }

  setBlacklist(blacklist);
  dataUpdateEvent('blacklist/folderBlacklist', [...result.blacklists, ...result.whitelists]);
  return result;
};

export default toggleBlacklistFolders;
