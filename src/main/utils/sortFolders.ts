/* eslint-disable no-nested-ternary */

import { getBlacklistData } from '../filesystem';

const isFolderBlacklisted = (folderPath: string) => {
  const { folderBlacklist } = getBlacklistData();

  return folderBlacklist.includes(folderPath);
};

const sortAtoZ = <T extends MusicFolder[]>(arr: T) =>
  arr.sort((a, b) =>
    a.path.toLowerCase().replace(/\W/gi, '') >
    b.path.toLowerCase().replace(/\W/gi, '')
      ? 1
      : a.path.toLowerCase().replace(/\W/gi, '') <
          b.path.toLowerCase().replace(/\W/gi, '')
        ? -1
        : 0,
  );
const sortZtoA = <T extends MusicFolder[]>(arr: T) =>
  arr.sort((a, b) =>
    a.path.toLowerCase().replace(/\W/gi, '') <
    b.path.toLowerCase().replace(/\W/gi, '')
      ? 1
      : a.path.toLowerCase().replace(/\W/gi, '') >
          b.path.toLowerCase().replace(/\W/gi, '')
        ? -1
        : 0,
  );

const sortFolders = <T extends MusicFolder[]>(
  musicFolders: T,
  sortType: FolderSortTypes,
) => {
  if (musicFolders.length > 0) {
    for (const musicFolder of musicFolders) {
      if (musicFolder.subFolders.length > 0) {
        musicFolder.subFolders = sortFolders(musicFolder.subFolders, sortType);
      }
    }

    if (sortType === 'aToZ') return sortAtoZ(musicFolders);
    if (sortType === 'zToA') return sortZtoA(musicFolders);
    if (sortType === 'noOfSongsDescending')
      return sortAtoZ(musicFolders).sort((a, b) =>
        a.songIds.length < b.songIds.length
          ? 1
          : a.songIds.length > b.songIds.length
            ? -1
            : 0,
      );
    if (sortType === 'noOfSongsAscending')
      return sortAtoZ(musicFolders).sort((a, b) =>
        a.songIds.length > b.songIds.length
          ? 1
          : a.songIds.length < b.songIds.length
            ? -1
            : 0,
      );
    if (sortType === 'blacklistedFolders')
      return sortAtoZ(
        musicFolders.filter((folder) => isFolderBlacklisted(folder.path)),
      );

    if (sortType === 'whitelistedFolders')
      return sortAtoZ(
        musicFolders.filter((folder) => !isFolderBlacklisted(folder.path)),
      );
  }
  return musicFolders;
};

export default sortFolders;
