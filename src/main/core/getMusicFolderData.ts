import sortFolders from '../utils/sortFolders';
import { getAllMusicFolders } from '@main/db/queries/folders';

const selectStructure = (folderPath: string, folders: MusicFolder[]): MusicFolder | undefined => {
  for (const folder of folders) {
    if (folder.path === folderPath) return folder;
    if (folder.subFolders.length > 0) {
      const selectedSubFolder = selectStructure(folderPath, folder.subFolders);
      if (selectedSubFolder) return selectedSubFolder;
    }
  }
  return undefined;
};

const selectStructures = async (folderPaths: string[]) => {
  const musicFolders = await getAllMusicFolders();
  const output: MusicFolder[] = [];

  for (const folderPath of folderPaths) {
    const selectedFolder = selectStructure(folderPath, musicFolders);
    if (selectedFolder) output.push(selectedFolder);
  }

  return output;
};

const getMusicFolderData = async (folderPaths: string[] = [], sortType?: FolderSortTypes) => {
  const musicFolders = await getAllMusicFolders();

  if (Array.isArray(musicFolders) && musicFolders?.length > 0) {
    const selectedMusicFolders =
      folderPaths.length === 0 ? musicFolders : await selectStructures(folderPaths);

    if (sortType) return sortFolders(selectedMusicFolders, sortType);
    return selectedMusicFolders;
  }
  return [];
};

export default getMusicFolderData;
