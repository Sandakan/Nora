import { getBlacklistData, setBlacklist } from '../filesystem';
import log from '../log';
import { dataUpdateEvent } from '../main';

const blacklistFolders = (folderPaths: string[]) => {
  const blacklist = getBlacklistData();

  blacklist.folderBlacklist = Array.from(new Set([...blacklist.folderBlacklist, ...folderPaths]));
  setBlacklist(blacklist);

  dataUpdateEvent('blacklist/folderBlacklist');
  log('Folder blacklist updated because a new songs got blacklisted.', { folderPaths }, 'INFO');
};

export default blacklistFolders;
