/* eslint-disable no-nested-ternary */

import { getBlacklistData } from '../filesystem';

const isFolderBlacklisted = (folderPath: string) => {
  const { folderBlacklist } = getBlacklistData();

  return folderBlacklist.includes(folderPath);
};

const sortFolders = <T extends MusicFolder[]>(
  musicFolders: T,
  sortType: FolderSortTypes
) => {
  if (musicFolders.length > 0) {
    for (const musicFolder of musicFolders) {
      if (musicFolder.subFolders.length > 0) {
        musicFolder.subFolders = sortFolders(musicFolder.subFolders, sortType);
      }
    }

    if (sortType === 'aToZ')
      return musicFolders.sort((a, b) =>
        a.path > b.path ? 1 : a.path < b.path ? -1 : 0
      );
    if (sortType === 'zToA')
      return musicFolders.sort((a, b) =>
        a.path < b.path ? 1 : a.path > b.path ? -1 : 0
      );
    if (sortType === 'noOfSongsDescending')
      return musicFolders
        .sort((a, b) => (a.path > b.path ? 1 : a.path < b.path ? -1 : 0))
        .sort((a, b) =>
          a.songIds.length < b.songIds.length
            ? 1
            : a.songIds.length > b.songIds.length
            ? -1
            : 0
        );
    if (sortType === 'noOfSongsAscending')
      return musicFolders
        .sort((a, b) => (a.path > b.path ? 1 : a.path < b.path ? -1 : 0))
        .sort((a, b) =>
          a.songIds.length > b.songIds.length
            ? 1
            : a.songIds.length < b.songIds.length
            ? -1
            : 0
        );
    if (sortType === 'blacklistedFolders')
      return musicFolders
        .filter((folder) => isFolderBlacklisted(folder.path))
        .sort((a, b) => (a.path > b.path ? 1 : a.path < b.path ? -1 : 0));
    if (sortType === 'whitelistedFolders')
      return musicFolders
        .filter((folder) => !isFolderBlacklisted(folder.path))
        .sort((a, b) => (a.path > b.path ? 1 : a.path < b.path ? -1 : 0));
  }
  return musicFolders;
};

export default sortFolders;
