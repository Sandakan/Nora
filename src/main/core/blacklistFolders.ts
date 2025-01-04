import { getBlacklistData, setBlacklist } from '../filesystem';
import logger from '../logger';
import { dataUpdateEvent } from '../main';

const blacklistFolders = (folderPaths: string[]) => {
  const blacklist = getBlacklistData();

  blacklist.folderBlacklist = Array.from(new Set([...blacklist.folderBlacklist, ...folderPaths]));
  setBlacklist(blacklist);

  dataUpdateEvent('blacklist/folderBlacklist');
  logger.info('Folder blacklist updated because a new songs got blacklisted.', { folderPaths });
};

export default blacklistFolders;
