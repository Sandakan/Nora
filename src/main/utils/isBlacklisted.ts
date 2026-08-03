import path from 'path';

import { getBlacklistedSongIds } from '@main/db/queries/blacklist';
import { getBlacklistedFolderPaths } from '@main/db/queries/folders';

const normalizePath = (folderPath: string) => path.normalize(folderPath);

const isSubpathOrEqual = (targetPath: string, folderPath: string) => {
  const normTarget = normalizePath(targetPath);
  const normFolder = normalizePath(folderPath);
  const folderWithSep = normFolder.endsWith(path.sep) ? normFolder : normFolder + path.sep;
  return normTarget === normFolder || normTarget.startsWith(folderWithSep);
};

const isStrictSubpath = (targetPath: string, folderPath: string) => {
  const normTarget = normalizePath(targetPath);
  const normFolder = normalizePath(folderPath);
  const folderWithSep = normFolder.endsWith(path.sep) ? normFolder : normFolder + path.sep;
  return normTarget !== normFolder && normTarget.startsWith(folderWithSep);
};

export const isParentFolderBlacklisted = async (folderPath: string) => {
  const blacklistedFolderPaths = await getBlacklistedFolderPaths();

  return blacklistedFolderPaths.some((blacklistedFolderPath) =>
    isStrictSubpath(folderPath, blacklistedFolderPath)
  );
};

export const isFolderBlacklisted = async (folderPath: string) => {
  const blacklistedFolderPaths = await getBlacklistedFolderPaths();

  return blacklistedFolderPaths.some((blacklistedFolderPath) =>
    isSubpathOrEqual(folderPath, blacklistedFolderPath)
  );
};

export const isSongBlacklisted = async (songId: number, songPath: string) => {
  const [blacklistedFolderPaths, blacklistedSongIds] = await Promise.all([
    getBlacklistedFolderPaths(),
    getBlacklistedSongIds()
  ]);

  const isFolderInBlacklist = blacklistedFolderPaths.some((folderPath) =>
    isSubpathOrEqual(songPath, folderPath)
  );

  const isSongInBlacklist = blacklistedSongIds.includes(songId);

  return isFolderInBlacklist || isSongInBlacklist;
};
