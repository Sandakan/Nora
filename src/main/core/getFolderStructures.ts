import fs from 'fs/promises';
import log from '../log';
import { getDirectories } from '../filesystem';
import { showOpenDialog } from '../main';
import getAllSettledPromises from '../utils/getAllSettledPromises';

export const generateFolderStructure = async (dir: string) => {
  try {
    const stats = await fs.stat(dir);
    const props: FolderStructure = {
      path: dir,
      stats: {
        lastModifiedDate: stats.mtime,
        lastChangedDate: stats.ctime,
        fileCreatedDate: stats.birthtime,
        lastParsedDate: new Date(),
      },
      subFolders: [],
    };

    const subDirs = await getDirectories(dir);
    if (Array.isArray(subDirs) && subDirs.length > 0) {
      const subDirsStructurePromise = subDirs.map((subDir) =>
        generateFolderStructure(subDir)
      );
      const { fulfilled: subDirsStructures } = await getAllSettledPromises(
        subDirsStructurePromise
      );

      props.subFolders.push(...subDirsStructures);
    }
    return props;
  } catch (error) {
    log('Error occurred when analysing folder structure.', { error }, 'ERROR');
    throw error;
  }
};

export const getFolderStructures = async () => {
  const musicFolderPaths = await showOpenDialog();

  const { fulfilled: folderStructures } = await getAllSettledPromises(
    musicFolderPaths.map((folderPath) => generateFolderStructure(folderPath))
  );
  return folderStructures;
};
