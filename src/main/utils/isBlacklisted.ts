import path from 'path';

import { getBlacklistedSongIds } from '@main/db/queries/blacklist';
import { getBlacklistedFolderPaths } from '@main/db/queries/folders';

const normalizePath = (folderPath: string) => path.normalize(folderPath);

export const isParentFolderBlacklisted = async (folderPath: string) => {
  const blacklistedFolderPaths = await getBlacklistedFolderPaths();
  const normalizedParentPath = normalizePath(path.dirname(folderPath));

  return blacklistedFolderPaths.some(
    (blacklistedFolderPath) => normalizePath(blacklistedFolderPath) === normalizedParentPath
  );
};

export const isFolderBlacklisted = async (folderPath: string) => {
  const blacklistedFolderPaths = await getBlacklistedFolderPaths();
  const normalizedFolderPath = normalizePath(folderPath);
  const normalizedParentPath = normalizePath(path.dirname(folderPath));

  const isBlacklisted = blacklistedFolderPaths.some(
    (blacklistedFolderPath) => normalizePath(blacklistedFolderPath) === normalizedFolderPath
  );
  const isParentBlacklisted = blacklistedFolderPaths.some(
    (blacklistedFolderPath) => normalizePath(blacklistedFolderPath) === normalizedParentPath
  );

  return isBlacklisted || isParentBlacklisted;
};

export const isSongBlacklisted = async (songId: number, songPath: string) => {
  const [blacklistedFolderPaths, blacklistedSongIds] = await Promise.all([
    getBlacklistedFolderPaths(),
    getBlacklistedSongIds()
  ]);

  const normalizedSongPath = normalizePath(songPath);
  const isFolderInBlacklist = blacklistedFolderPaths.some((folderPath) =>
    normalizedSongPath.includes(normalizePath(folderPath))
  );

  const isSongInBlacklist = blacklistedSongIds.includes(songId);

  return isFolderInBlacklist || isSongInBlacklist;
};
