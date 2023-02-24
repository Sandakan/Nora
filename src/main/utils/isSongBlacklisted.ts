import path from 'path';
import { getBlacklistData } from '../filesystem';

const isSongBlacklisted = (songId: string, songPath: string) => {
  const { folderBlacklist, songBlacklist } = getBlacklistData();

  const isFolderBlacklisted = folderBlacklist.some((folderPath) =>
    path.normalize(songPath).includes(path.normalize(folderPath))
  );

  const isSongInBlacklist = songBlacklist.includes(songId);

  return isFolderBlacklisted || isSongInBlacklist;
};

export default isSongBlacklisted;
