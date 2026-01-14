import path from 'path';
import { getBlacklistData } from '../filesystem';

export const isParentFolderBlacklisted = (folderPath: string) => {
  const { folderBlacklist } = getBlacklistData();

  const isParentBlacklisted = folderBlacklist.some(
    (blacklistedFolderPath) => path.dirname(folderPath) === blacklistedFolderPath
  );

  return isParentBlacklisted;
};

export const isFolderBlacklisted = (folderPath: string) => {
  const { folderBlacklist } = getBlacklistData();

  const isBlacklisted = folderBlacklist.includes(path.normalize(folderPath));
  const isParentBlacklisted = isParentFolderBlacklisted(folderPath);

  return isBlacklisted || isParentBlacklisted;
};

export const isSongBlacklisted = (songId: number, songPath: string) => {
  const { folderBlacklist, songBlacklist } = getBlacklistData();

  const isFolderInBlacklist = folderBlacklist.some((folderPath) =>
    path.normalize(songPath).includes(path.normalize(folderPath))
  );

  const isSongInBlacklist = songBlacklist.includes(songId);

  return isFolderInBlacklist || isSongInBlacklist;
};
