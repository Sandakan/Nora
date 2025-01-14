import path from 'path';
import { getUserData } from '../filesystem';
import removeMusicFolder from '../core/removeMusicFolder';
import { dirExistsSync } from '../utils/dirExists';
import logger from '../logger';
import { getAllFoldersFromFolderStructures } from './parseFolderStructuresForSongPaths';

const checkForFolderModifications = (folderName: string) => {
  const { musicFolders } = getUserData();

  const folders = getAllFoldersFromFolderStructures(musicFolders);
  const musicFolderPaths = folders.map((folder) => folder.path);
  const foldersWithDeletedFolderName = musicFolderPaths.filter(
    (dir) => path.basename(dir) === path.basename(folderName)
  );
  if (foldersWithDeletedFolderName.length > 0) {
    for (let i = 0; i < foldersWithDeletedFolderName.length; i += 1) {
      try {
        const folderPath = foldersWithDeletedFolderName[i];
        const folderExists = dirExistsSync(folderPath);

        if (!folderExists) removeMusicFolder(folderPath);
      } catch (error) {
        logger.error('Failed to check for folder modifications.', { error, folderName });
      }
    }
  }
};

export default checkForFolderModifications;
