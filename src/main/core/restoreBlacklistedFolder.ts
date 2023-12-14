import path from 'path';

import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import { getBlacklistData, setBlacklist } from '../filesystem';
import log from '../log';
import { isParentFolderBlacklisted } from '../utils/isBlacklisted';

const restoreBlacklistedFolders = async (blacklistedFolderPaths: string[]) => {
  const blacklist = getBlacklistData();

  for (const blacklistedFolderPath of blacklistedFolderPaths) {
    const isParentBlacklisted = isParentFolderBlacklisted(
      blacklistedFolderPath,
    );
    const isParentNotInFolderPaths = !blacklistedFolderPaths.includes(
      path.dirname(blacklistedFolderPath),
    );

    if (isParentBlacklisted && isParentNotInFolderPaths)
      sendMessageToRenderer({
        messageCode:
          'WHITELISTING_FOLDER_FAILED_DUE_TO_BLACKLISTED_PARENT_FOLDER',
        data: {
          folderName: path.basename(blacklistedFolderPath),
          parentFolderName: path.dirname(blacklistedFolderPath),
        },
      });
  }

  blacklist.folderBlacklist = blacklist.folderBlacklist.filter(
    (blacklistedFolderPath) =>
      !blacklistedFolderPaths.includes(blacklistedFolderPath),
  );

  setBlacklist(blacklist);
  dataUpdateEvent('blacklist/folderBlacklist');
  log(
    'Folder blacklist updated because some songs got removed from the blacklist.',
    { blacklistedFolderPaths },
    'INFO',
  );
};

export default restoreBlacklistedFolders;
