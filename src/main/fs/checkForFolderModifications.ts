import path from 'path';
import { getUserData } from '../filesystem';
import removeMusicFolder from '../core/removeMusicFolder';
import { dirExistsSync } from '../utils/dirExists';
import logger from '../logger';
import { getAllFoldersFromFolderStructures } from './parseFolderStructuresForSongPaths';
import { getAllFolders } from '@main/db/queries/folders';

const checkForFolderModifications = async (folderName: string) => {
  const musicFolders = await getAllFolders();

  const musicFolderPaths = musicFolders.map((folder) => folder.path);
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
