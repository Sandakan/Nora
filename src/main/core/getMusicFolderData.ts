import sortFolders from '../utils/sortFolders';
import { getSongsData, getUserData } from '../filesystem';
import { isFolderBlacklisted } from '../utils/isBlacklisted';

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
  folderStructures: FolderStructure[],
): MusicFolder[] => {
  const foldersData: MusicFolder[] = [];

  for (const structure of folderStructures) {
    const songIds = getRelevantSongsofFolders(structure.path);
    const folderData: MusicFolder = {
      ...structure,
      subFolders: createFolderData(structure.subFolders),
      songIds,
      isBlacklisted: isFolderBlacklisted(structure.path),
    };

    if (structure.subFolders.length > 0) {
      const subFolderData = createFolderData(structure.subFolders);
      folderData.subFolders = subFolderData;
    }

    foldersData.push(folderData);
  }

  return foldersData;
};

const selectStructure = (
  folderPath: string,
  folders: FolderStructure[],
): FolderStructure | undefined => {
  for (const folder of folders) {
    if (folder.path === folderPath) return folder;
    if (folder.subFolders.length > 0) {
      const selectedSubFolder = selectStructure(folderPath, folder.subFolders);
      if (selectedSubFolder) return selectedSubFolder;
    }
  }
  return undefined;
};

const selectStructures = (folderPaths: string[]) => {
  const { musicFolders } = getUserData();
  const output: FolderStructure[] = [];

  for (const folderPath of folderPaths) {
    const selectedFolder = selectStructure(folderPath, musicFolders);
    if (selectedFolder) output.push(selectedFolder);
  }

  return output;
};

const getMusicFolderData = (
  folderPaths: string[] = [],
  sortType?: FolderSortTypes,
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
