import fsSync, { type WatchEventType } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

import { getAllFolderStructures } from '@main/db/queries/folders';

import { supportedMusicExtensions } from '../filesystem';
import checkFolderForUnknownModifications from './checkFolderForUnknownContentModifications';
import checkForFolderModifications from './checkForFolderModifications';
import { saveAbortController, registerWatcherCleanup } from './controlAbortControllers';
import getParentFolderPaths from './getParentFolderPaths';
import logger from '../logger';

const createParentFolderWatcherFunction = (parentFolderPath: string) => {
  let isScanning = false;
  let dirtyScan = false;
  let dirtyPath: string | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const findContainingMusicFolder = async (fullPath: string): Promise<string | undefined> => {
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

  const runScan = (containingFolder: string) => {
    isScanning = true;
    void checkFolderForUnknownModifications(containingFolder)
      .catch((error) => {
        logger.error('Debounced folder scan failed.', { error, containingFolder });
      })
      .finally(() => {
        isScanning = false;
        if (dirtyScan && dirtyPath) {
          dirtyScan = false;
          const next = dirtyPath;
          dirtyPath = null;
          runScan(next);
        }
      });
  };

  const scheduleScan = (containingFolder: string) => {
    dirtyPath = containingFolder;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (isScanning) {
        dirtyScan = true;
        return;
      }
      dirtyScan = false;
      runScan(containingFolder);
    }, 1500);
  };

  return {
    handler: async (eventType: WatchEventType, filename?: string | null) => {
      if (filename) {
        if (eventType === 'rename') {
          const fullPath = path.normalize(path.join(parentFolderPath, filename));
          const fullPathStat = await stat(fullPath).catch(() => null);

          if (fullPathStat?.isDirectory()) {
            const containingFolder = await findContainingMusicFolder(fullPath);
            if (containingFolder) {
              logger.debug(`New directory detected inside music folder.`, {
                path: fullPath,
                musicFolder: containingFolder
              });
              scheduleScan(containingFolder);
              return;
            }
            await checkForFolderModifications(filename);
          } else if (fullPathStat === null) {
            await checkForFolderModifications(filename);
          } else if (
            fullPathStat.isFile() &&
            supportedMusicExtensions.includes(path.extname(fullPath))
          ) {
            const containingFolder = await findContainingMusicFolder(fullPath);
            if (containingFolder) {
              scheduleScan(containingFolder);
            }
          }
        }
      } else {
        logger.warn('Failed to watch parent folders because watcher sent an undefined filename', {
          eventType,
          filename
        });
      }
    },
    // Cancel a pending debounced scan so a watcher reset cannot run a stale
    // scan with outdated event state after the watcher is closed.
    cleanup: () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
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
    const watcherFunctions = createParentFolderWatcherFunction(parentFolderPath);
    // fs.watch recursive mode is not supported on Linux (ENOSYS or silently
    // non-recursive depending on kernel/backend). Fall back to a non-recursive
    // watch on Linux and rely on the top-level scan / manual resync for nested
    // discovery, while logging the limitation once per folder.
    const isRecursiveSupported = process.platform !== 'linux';
    if (!isRecursiveSupported) {
      logger.warn(
        'Recursive parent-folder watching is not supported on Linux; nested discovery falls back to the library scan / manual resync.',
        { parentFolderPath }
      );
    }
    const watcher = fsSync.watch(
      parentFolderPath,
      {
        signal: abortController.signal,
        recursive: isRecursiveSupported
      },
      (eventType, filename) => {
        void watcherFunctions.handler(eventType, filename).catch((error) => {
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
    registerWatcherCleanup(parentFolderPath, watcherFunctions.cleanup);
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
