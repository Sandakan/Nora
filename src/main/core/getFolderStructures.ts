import fs from 'fs/promises';
import path from 'path';

import log from '../log';
import { getDirectories, supportedMusicExtensions } from '../filesystem';
import { showOpenDialog } from '../main';
import getAllSettledPromises from '../utils/getAllSettledPromises';
import { getAllFilePathsFromFolder } from '../fs/parseFolderStructuresForSongPaths';

const getSongPathsInAFolder = (folderPath: string) => {
  const allFiles = getAllFilePathsFromFolder(folderPath);

  const allSongPaths = allFiles.filter((filePath) => {
    const fileExtension = path.extname(filePath);
    return supportedMusicExtensions.includes(fileExtension);
  });

  return allSongPaths;
};

export const generateFolderStructure = async (dir: string) => {
  try {
    const stats = await fs.stat(dir);

    const structure: FolderStructure = {
      path: dir,
      stats: {
        lastModifiedDate: stats.mtime,
        lastChangedDate: stats.ctime,
        fileCreatedDate: stats.birthtime,
        lastParsedDate: new Date(),
      },
      subFolders: [],
      noOfSongs: getSongPathsInAFolder(dir).length,
    };

    const subDirs = await getDirectories(dir);
    if (Array.isArray(subDirs) && subDirs.length > 0) {
      const subDirsStructurePromise = subDirs.map((subDir) =>
        generateFolderStructure(subDir),
      );
      const { fulfilled: subDirsStructures } = await getAllSettledPromises(
        subDirsStructurePromise,
      );

      structure.subFolders.push(...subDirsStructures);

      const subDirNoOfSongs = subDirsStructures
        .map((x) => x.noOfSongs || 0)
        .reduce((prevValue, currValue) => prevValue + currValue, 0);

      if (structure.noOfSongs) structure.noOfSongs += subDirNoOfSongs;
      else structure.noOfSongs = subDirNoOfSongs;
    }
    return structure;
  } catch (error) {
    log('Error occurred when analysing folder structure.', { error }, 'ERROR');
    throw error;
  }
};

export const getFolderStructures = async () => {
  const musicFolderPaths = await showOpenDialog();

  const { fulfilled: folderStructures } = await getAllSettledPromises(
    musicFolderPaths.map((folderPath) => generateFolderStructure(folderPath)),
  );

  return folderStructures;
};
