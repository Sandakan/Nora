import path from 'path';
import { getUserData } from '../filesystem';
import removeMusicFolder from '../core/removeMusicFolder';
import { dirExistsSync } from '../utils/dirExists';
import log from '../log';

const checkForFolderModifications = (foldername: string) => {
  const { musicFolders } = getUserData();
  const musicFolderPaths = musicFolders.map((folder) => folder.path);
  const foldersWithDeletedFolderName = musicFolderPaths.filter(
    (dir) => path.basename(dir) === foldername
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
