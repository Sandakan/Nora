import path from 'path';
import { getUserData } from '../filesystem';
import removeMusicFolder from '../core/removeMusicFolder';
import { dirExistsSync } from '../utils/dirExists';
import log from '../log';
import { getAllFoldersFromFolderStructures } from './parseFolderStructuresForSongPaths';

const checkForFolderModifications = (foldername: string) => {
  const { musicFolders } = getUserData();

  const folders = getAllFoldersFromFolderStructures(musicFolders);
  const musicFolderPaths = folders.map((folder) => folder.path);
  const foldersWithDeletedFolderName = musicFolderPaths.filter(
    (dir) => path.basename(dir) === path.basename(foldername)
  );
  if (foldersWithDeletedFolderName.length > 0) {
    for (let i = 0; i < foldersWithDeletedFolderName.length; i += 1) {
      try {
        const folderPath = foldersWithDeletedFolderName[i];
        const folderExists = dirExistsSync(folderPath);

        if (!folderExists) removeMusicFolder(folderPath);
      } catch (error) {
        log(
          'Error occurred when checking for folder modifications.',
          { error },
          'ERROR'
        );
      }
    }
  }
};

export default checkForFolderModifications;
