import { getBlacklistedSongIds } from '@main/db/queries/blacklist';
import { getBlacklistedFolderPaths } from '@main/db/queries/folders';

const getBlacklistData = async (): Promise<Blacklist> => {
  const [songBlacklist, folderBlacklist] = await Promise.all([
    getBlacklistedSongIds(),
    getBlacklistedFolderPaths()
  ]);

  return {
    songBlacklist,
    folderBlacklist
  };
};

export default getBlacklistData;
