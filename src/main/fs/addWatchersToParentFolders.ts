import fsSync, { type WatchEventType } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

import { getAllFolderStructures } from '@main/db/queries/folders';

import checkFolderForUnknownModifications from './checkFolderForUnknownContentModifications';
import checkForFolderModifications from './checkForFolderModifications';
import { saveAbortController } from './controlAbortControllers';
import getParentFolderPaths from './getParentFolderPaths';
import logger from '../logger';

const createParentFolderWatcherFunction = (parentFolderPath: string) => {
  let isScanning = false;

  const findContainingMusicFolder = async (fullPath: string): Promise<string | undefined> => {
    // Fetch the current music folder set lazily so newly-added library
    // folders (added after the watcher was created) are picked up.
    const structures = await getAllFolderStructures();
    const allPaths: string[] = [];
    getAllPathsFromStructures(structures, allPaths);
    const sorted = [...allPaths].sort((a, b) => b.length - a.length);
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
          if (isScanning) return;
          isScanning = true;
          try {
            const containingFolder = await findContainingMusicFolder(fullPath);

            if (containingFolder) {
              logger.debug(`New directory detected inside music folder.`, {
                path: fullPath,
                musicFolder: containingFolder
              });
              await checkForFolderModifications(filename);
              await checkFolderForUnknownModifications(containingFolder);
              return;
            }

            await checkForFolderModifications(filename);
          } finally {
            isScanning = false;
          }
        } else if (fullPathStat === null) {
          // Path was deleted — check if a known folder was removed
          if (isScanning) return;
          isScanning = true;
          try {
            await checkForFolderModifications(filename);
          } finally {
            isScanning = false;
          }
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
    getAllPathsFromStructures(structure.subFolders, paths);
  }
  return paths;
};

const addWatcherToParentFolder = (parentFolderPath: string) => {
  try {
    const abortController = new AbortController();
    const watcherFunction = createParentFolderWatcherFunction(parentFolderPath);
    const watcher = fsSync.watch(
      parentFolderPath,
      {
        signal: abortController.signal,
        // TODO - recursive mode won't work on linux
        recursive: true
      },
      (eventType, filename) => {
        void watcherFunction(eventType, filename).catch((error) => {
          logger.error('Failed to process parent-folder watcher event.', {
            error,
            parentFolderPath,
            eventType,
            filename
          });
        });
      }
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

  if (musicFolders.length === 0) {
    logger.warn('addWatchersToParentFolders: no music folders found — nothing to watch.');
    return;
  }

  const musicFolderPaths = musicFolders.map((folder) => folder.path);
  const parentFolderPaths = getParentFolderPaths(musicFolderPaths);
  logger.debug(`${parentFolderPaths.length} parent folders of music folders found.`);

  if (parentFolderPaths.length > 0) {
    for (const parentFolderPath of parentFolderPaths) {
      try {
        addWatcherToParentFolder(parentFolderPath);
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
