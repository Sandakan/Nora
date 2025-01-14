import path from 'path';
import fs from 'fs/promises';
import fsSync, { WatchEventType } from 'fs';
import { getUserData, supportedMusicExtensions } from '../filesystem';
import logger from '../logger';
import checkFolderForUnknownModifications from './checkFolderForUnknownContentModifications';
import checkFolderForContentModifications from './checkFolderForContentModifications';
import { dirExistsSync } from '../utils/dirExists';
import checkForFolderModifications from './checkForFolderModifications';
import { saveAbortController } from './controlAbortControllers';
import { saveFolderStructures } from './parseFolderStructuresForSongPaths';

const checkForFolderUpdates = async (folder: FolderStructure) => {
  try {
    const folderStats = await fs.stat(folder.path);
    const hasFolderModifications =
      folderStats.mtime.toUTCString() !== new Date(folder.stats.lastModifiedDate).toUTCString();

    if (hasFolderModifications) {
      logger.debug(`'${path.basename(folder.path)}' folder has unknown modifications.`, {
        path: folder.path
      });

      folder.stats.lastModifiedDate = folderStats.mtime;

      saveFolderStructures([folder]);
      checkFolderForUnknownModifications(folder.path);
    } else
      logger.debug(`'${path.basename(folder.path)}' folder has no modifications.`, {
        path: folder.path
      });
  } catch (error) {
    logger.error(`Failed to fetch folder stats to check for folder modifications.`, {
      error,
      path: folder.path
    });
  }
};

const folderWatcherFunction = async (
  eventType: WatchEventType,
  filename: string | null | undefined,
  folder: MusicFolderData,
  abortSignal: AbortSignal
) => {
  // consolelogger.debug(`folder event - '${eventType}' - ${filename}`);
  if (filename) {
    if (eventType === 'rename') {
      const doesFilenameHasSongExtension = supportedMusicExtensions.includes(
        path.extname(filename)
      );

      if (doesFilenameHasSongExtension) {
        // possible new song addition
        await checkFolderForContentModifications(folder.path, filename, abortSignal);
      }
    }
  } else {
    logger.error(
      'Failed to read newly added songs because file watcher function sent undefined as filename.',
      { folderPath: folder.path, eventType, filename }
    );
  }
};

export const addWatcherToFolder = async (folder: MusicFolderData) => {
  try {
    const abortController = new AbortController();
    const watcher = fsSync.watch(
      folder.path,
      {
        signal: abortController.signal
      },
      (eventType, filename) =>
        folderWatcherFunction(eventType, filename, folder, abortController.signal)
    );

    logger.debug('Added watcher to a folder successfully.', { folderPath: folder.path });

    watcher.addListener('error', (error) =>
      logger.warn(`Error occurred when watching a folder.`, { error, folderPath: folder.path })
    );
    watcher.addListener('close', () =>
      logger.debug(`successfully closed the watcher.`, { folderPath: folder.path })
    );
    saveAbortController(folder.path, abortController);
  } catch (error) {
    logger.error(`Error occurred when watching a folder.`, { error, folderPath: folder.path });
  }
};

const addWatchersToFolders = async (folders?: FolderStructure[]) => {
  const musicFolders = folders ?? getUserData().musicFolders;

  if (folders === undefined)
    logger.debug(`${musicFolders.length} music folders found in user data.`);

  if (Array.isArray(musicFolders)) {
    for (const musicFolder of musicFolders) {
      try {
        const doesFolderExist = dirExistsSync(musicFolder.path);

        if (doesFolderExist) {
          await checkForFolderUpdates(musicFolder);
          await addWatcherToFolder(musicFolder);
        } else checkForFolderModifications(path.basename(musicFolder.path));

        if (musicFolder.subFolders.length > 0) addWatchersToFolders(musicFolder.subFolders);
      } catch (error) {
        logger.error(`Failed to add a watcher to a folder.`, {
          error,
          folderPath: musicFolder.path
        });
      }
    }
    return;
  }
  logger.debug(`Failed to read music folders array in user data. Tt was possibly empty.`, {
    musicFolders: typeof musicFolders
  });
};

export default addWatchersToFolders;
