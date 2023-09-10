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
      sendMessageToRenderer(
        `Couldn't whitelist '${path.basename(
          blacklistedFolderPath,
        )}' folder because its parent folder '${path.basename(
          path.dirname(blacklistedFolderPath),
        )}' is also blacklisted. Whitelist the parent folder to whitelist this folder.`,
      );
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
