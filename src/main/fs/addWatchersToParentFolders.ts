import fsSync, { type WatchEventType } from 'fs';
import path from 'path';
import logger from '../logger';
import getParentFolderPaths from './getParentFolderPaths';
import checkForFolderModifications from './checkForFolderModifications';
import { saveAbortController } from './controlAbortControllers';
import { getAllFolderStructures } from '@main/db/queries/folders';

const fileNameRegex = /^.{1,}\.\w{1,}$/;

const parentFolderWatcherFunction = async (eventType: WatchEventType, filename?: string | null) => {
  if (filename) {
    if (eventType === 'rename') {
      // if not a filename, it should be a directory
      const isADirectory = !fileNameRegex.test(filename);

      if (isADirectory) {
        // possible folder addition or deletion
        checkForFolderModifications(filename);
      }
    }
  } else {
    logger.warn('Failed to watch parent folders because watcher sent an undefined filename', {
      eventType,
      filename
    });
  }
};

const addWatcherToParentFolder = (parentFolderPath: string) => {
  try {
    const abortController = new AbortController();
    const watcher = fsSync.watch(
      parentFolderPath,
      {
        signal: abortController.signal,
        // TODO - recursive mode won't work on linux
        recursive: true
      },
      (eventType, filename) => parentFolderWatcherFunction(eventType, filename)
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
