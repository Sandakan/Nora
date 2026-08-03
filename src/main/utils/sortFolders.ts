const sortAtoZ = <T extends MusicFolder[]>(arr: T) =>
  arr.sort((a, b) =>
    a.path.toLowerCase().replace(/\W/gi, '') > b.path.toLowerCase().replace(/\W/gi, '')
      ? 1
      : a.path.toLowerCase().replace(/\W/gi, '') < b.path.toLowerCase().replace(/\W/gi, '')
        ? -1
        : 0
  );
const sortZtoA = <T extends MusicFolder[]>(arr: T) =>
  arr.sort((a, b) =>
    a.path.toLowerCase().replace(/\W/gi, '') < b.path.toLowerCase().replace(/\W/gi, '')
      ? 1
      : a.path.toLowerCase().replace(/\W/gi, '') > b.path.toLowerCase().replace(/\W/gi, '')
        ? -1
        : 0
  );

const sortFolders = <T extends MusicFolder[]>(
  musicFolders: T,
  sortType: FolderSortTypes,
  isParentBlacklisted = false
) => {
  if (musicFolders.length > 0) {
    for (const musicFolder of musicFolders) {
      const isFolderOrParentBlacklisted = musicFolder.isBlacklisted || isParentBlacklisted;
      if (musicFolder.subFolders.length > 0) {
        musicFolder.subFolders = sortFolders(
          musicFolder.subFolders,
          sortType,
          isFolderOrParentBlacklisted
        );
      }
    }

    if (sortType === 'aToZ') return sortAtoZ(musicFolders);
    if (sortType === 'zToA') return sortZtoA(musicFolders);
    if (sortType === 'noOfSongsDescending')
      return sortAtoZ(musicFolders).sort((a, b) =>
        a.songIds.length < b.songIds.length ? 1 : a.songIds.length > b.songIds.length ? -1 : 0
      );
    if (sortType === 'noOfSongsAscending')
      return sortAtoZ(musicFolders).sort((a, b) =>
        a.songIds.length > b.songIds.length ? 1 : a.songIds.length < b.songIds.length ? -1 : 0
      );
    if (sortType === 'blacklistedFolders')
      return sortAtoZ(musicFolders.filter((folder) => folder.isBlacklisted || isParentBlacklisted));

    if (sortType === 'whitelistedFolders')
      return sortAtoZ(
        musicFolders.filter((folder) => !folder.isBlacklisted && !isParentBlacklisted)
      );
  }
  return musicFolders;
};

export default sortFolders;
