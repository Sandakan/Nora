import fsSync, { type WatchEventType } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

import { getAllFolderStructures } from '@main/db/queries/folders';

import checkFolderForUnknownModifications from './checkFolderForUnknownContentModifications';
import checkForFolderModifications from './checkForFolderModifications';
import { saveAbortController } from './controlAbortControllers';
import getParentFolderPaths from './getParentFolderPaths';
import logger from '../logger';

const createParentFolderWatcherFunction = (
  parentFolderPath: string,
  initialFolderPaths: string[]
) => {
  const musicFolderPaths = initialFolderPaths;
  let isScanning = false;

  const findContainingMusicFolder = (fullPath: string): string | undefined => {
    const sorted = [...musicFolderPaths].sort((a, b) => b.length - a.length);
    return sorted.find((folderPath) => {
      if (!fullPath.startsWith(folderPath)) return false;
      if (fullPath.length === folderPath.length) return true;
      return fullPath[folderPath.length] === path.sep;
    });
  };

  return async (eventType: WatchEventType, filename?: string | null) => {
    if (filename) {
      if (eventType === 'rename') {
        const fullPath = path.normalize(path.join(parentFolderPath, filename));
        const fullPathStat = await stat(fullPath).catch(() => null);

        if (fullPathStat?.isDirectory()) {
          const containingFolder = findContainingMusicFolder(fullPath);

          if (containingFolder) {
            if (isScanning) return;
            isScanning = true;

            try {
              logger.debug(`New directory detected inside music folder.`, {
                path: fullPath,
                musicFolder: containingFolder
              });
              await checkForFolderModifications(filename);
              await checkFolderForUnknownModifications(containingFolder);
            } finally {
              isScanning = false;
            }
            return;
          }

          await checkForFolderModifications(filename);
        } else if (fullPathStat === null) {
          // Path was deleted — check if a known folder was removed
          await checkForFolderModifications(filename);
        }
      }
    } else {
      logger.warn('Failed to watch parent folders because watcher sent an undefined filename', {
        eventType,
        filename
      });
    }
  };
};

const getAllPathsFromStructures = (structures: FolderStructure[], paths: string[] = []): string[] => {
  for (const structure of structures) {
    paths.push(structure.path);
    for (const sub of structure.subFolders) {
      getAllPathsFromStructures([sub], paths);
    }
  }
  return paths;
};

const addWatcherToParentFolder = (parentFolderPath: string, folderPaths: string[]) => {
  try {
    const abortController = new AbortController();
    const watcherFunction = createParentFolderWatcherFunction(parentFolderPath, folderPaths);
    const watcher = fsSync.watch(
      parentFolderPath,
      {
        signal: abortController.signal,
        // TODO - recursive mode won't work on linux
        recursive: true
      },
      (eventType, filename) => watcherFunction(eventType, filename)
    );
    logger.debug('Added watcher to a parent folder successfully.', { parentFolderPath });

    watcher.addListener('error', (error) =>
      logger.error(`Error occurred when watching a folder.`, { error, parentFolderPath })
    );
    watcher.addListener('close', () =>
      logger.debug(`Successfully closed the parent folder watcher.`, { parentFolderPath })
    );
    saveAbortController(parentFolderPath, abortController);
  } catch (error) {
    logger.error(`Error occurred when watching a folder.`, { error, parentFolderPath });
  }
};

/* Parent folder watchers only watch for folder modifications (not file modifications) inside the parent folder. */
const addWatchersToParentFolders = async () => {
  const musicFolders = await getAllFolderStructures();

  const musicFolderPaths = musicFolders.map((folder) => folder.path);
  const parentFolderPaths = getParentFolderPaths(musicFolderPaths);
  logger.debug(`${parentFolderPaths.length} parent folders of music folders found.`);

  if (parentFolderPaths.length > 0) {
    const allFolderPaths = getAllPathsFromStructures(musicFolders);
    for (const parentFolderPath of parentFolderPaths) {
      try {
        addWatcherToParentFolder(parentFolderPath, allFolderPaths);
      } catch (error) {
        logger.error(
          `Failed to add watcher to '${path.basename(parentFolderPath)}' parent folder.`,
          { error, parentFolderPath }
        );
      }
    }
    return;
  }
  logger.warn(
    `Failed to add watchers to parent folders of music folders. No parent folders found.`,
    { parentFolderPaths, musicFolderPaths }
  );
};

export default addWatchersToParentFolders;
