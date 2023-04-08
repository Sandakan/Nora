import sortFolders from '../utils/sortFolders';
import { getBlacklistData, getSongsData, getUserData } from '../filesystem';

const getRelevantSongsofFolders = (folderPath: string) => {
  const songs = getSongsData();
  const isSongsAvailable = songs.length > 0;

  const songIds: string[] = [];
  if (isSongsAvailable) {
    for (let i = 0; i < songs.length; i += 1) {
      const song = songs[i];
      if (song.path.includes(folderPath)) songIds.push(song.songId);
    }
  }

  return songIds;
};

const createFolderData = (
  folderStructures: FolderStructure[]
): MusicFolder[] => {
  const { folderBlacklist } = getBlacklistData();

  const foldersData: MusicFolder[] = [];

  for (const structure of folderStructures) {
    const songIds = getRelevantSongsofFolders(structure.path);
    const folderData: MusicFolder = {
      ...structure,
      subFolders: createFolderData(structure.subFolders),
      songIds,
      isBlacklisted: folderBlacklist.includes(structure.path),
    };

    if (structure.subFolders.length > 0) {
      const subFolderData = createFolderData(structure.subFolders);
      folderData.subFolders = subFolderData;
    }

    foldersData.push(folderData);
  }

  return foldersData;
};

const selectStructures = (
  folderPaths: string[],
  selectedFolders?: FolderStructure[]
) => {
  const musicFolders = selectedFolders ?? getUserData().musicFolders;
  const output: FolderStructure[] = [];

  for (const folder of musicFolders) {
    const subFoldersOutput =
      folder.subFolders.length > 0
        ? selectStructures(folderPaths, folder.subFolders)
        : [];

    if (folderPaths.includes(folder.path)) {
      output.push({ ...folder, subFolders: subFoldersOutput });
    }
  }

  return output;
};

const getMusicFolderData = (
  folderPaths: string[] = [],
  sortType?: FolderSortTypes
) => {
  const userData = getUserData();

  if (userData) {
    const { musicFolders } = userData;

    if (Array.isArray(musicFolders) && musicFolders?.length > 0) {
      const selectedMusicFolders =
        folderPaths.length === 0 ? musicFolders : selectStructures(folderPaths);

      const folders: MusicFolder[] = createFolderData(selectedMusicFolders);

      if (sortType) return sortFolders(folders, sortType);
      return folders;
    }
  }
  return [];
};

export default getMusicFolderData;
