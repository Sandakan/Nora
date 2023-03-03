import path from 'path';
import { getBlacklistData } from '../filesystem';

export const isFolderBlacklisted = (folderPath: string) => {
  const { folderBlacklist } = getBlacklistData();

  return folderBlacklist.includes(path.normalize(folderPath));
};

export const isSongBlacklisted = (songId: string, songPath: string) => {
  const { folderBlacklist, songBlacklist } = getBlacklistData();

  const isFolderInBlacklist = folderBlacklist.some((folderPath) =>
    path.normalize(songPath).includes(path.normalize(folderPath))
  );

  const isSongInBlacklist = songBlacklist.includes(songId);

  return isFolderInBlacklist || isSongInBlacklist;
};
