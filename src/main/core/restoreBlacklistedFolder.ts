import { dataUpdateEvent } from '../main';
import { getBlacklistData, setBlacklist } from '../filesystem';
import log from '../log';

const restoreBlacklistedFolders = async (blacklistedFolderPaths: string[]) => {
  const blacklist = getBlacklistData();

  blacklist.folderBlacklist = blacklist.folderBlacklist.filter(
    (blacklistedFolderPath) =>
      !blacklistedFolderPaths.includes(blacklistedFolderPath)
  );

  setBlacklist(blacklist);
  dataUpdateEvent('blacklist/folderBlacklist');
  log(
    'Folder blacklist updated because some songs got removed from the blacklist.',
    { blacklistedFolderPaths },
    'INFO'
  );
};

export default restoreBlacklistedFolders;
