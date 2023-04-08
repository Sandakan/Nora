/* eslint-disable no-await-in-loop */
import path from 'path';
import fs from 'fs/promises';
import fsSync, { WatchEventType } from 'fs';
import { getUserData, supportedMusicExtensions } from '../filesystem';
import log from '../log';
import checkFolderForUnknownModifications from './checkFolderForUnknownContentModifications';
import checkFolderForContentModifications from './checkFolderForContentModifications';
import { dirExistsSync } from '../utils/dirExists';
import checkForFolderModifications from './checkForFolderModifications';
import { saveAbortController } from './controlAbortControllers';
import { saveFolderStructures } from './parseFolderForSongPaths';

const checkForFolderUpdates = async (folder: FolderStructure) => {
  try {
    const folderStats = await fs.stat(folder.path);
    const hasFolderModifications =
      folderStats.mtime.toUTCString() !==
      new Date(folder.stats.lastModifiedDate).toUTCString();

    if (hasFolderModifications) {
      log(
        `'${
          path.basename(folder.path) || path
        }' folder has unknown modifications.`
      );

      folder.stats.lastModifiedDate = folderStats.mtime;

      saveFolderStructures([folder]);
      checkFolderForUnknownModifications(folder.path);
    } else
      log(
        `'${path.basename(folder.path) || path}' folder has no modifications.`
      );
  } catch (error) {
    log(
      `ERROR OCCURRED WHEN FETCHING STATS FOR '${path.basename(
        folder.path
      )}' FOLDER.`,
      { error },
      'ERROR'
    );
  }
};

const folderWatcherFunction = async (
  eventType: WatchEventType,
  filename: string,
  folder: MusicFolderData,
  abortSignal: AbortSignal
) => {
  // console.log(`folder event - '${eventType}' - ${filename}`);
  if (filename) {
    if (eventType === 'rename') {
      const doesFilenameHasSongExtension = supportedMusicExtensions.includes(
        path.extname(filename)
      );

      if (doesFilenameHasSongExtension) {
        // possible new song addition
        await checkFolderForContentModifications(
          folder.path,
          filename,
          abortSignal
        );
      }
    }
  } else {
    log(
      'ERROR OCCURRED WHEN TRYING TO READ NEWLY ADDED SONGS. FILE WATCHER FUNCTION SENT A FILENAME OF undefined.',
      undefined,
      'ERROR'
    );
  }
};

export const addWatcherToFolder = async (folder: MusicFolderData) => {
  try {
    const abortController = new AbortController();
    const watcher = fsSync.watch(
      folder.path,
      {
        signal: abortController.signal,
      },
      (eventType, filename) =>
        folderWatcherFunction(
          eventType,
          filename,
          folder,
          abortController.signal
        )
    );
    log(
      'Added watcher to a folder successfully.',
      { folderPath: folder.path },
      'WARN'
    );
    watcher.addListener('error', (e) =>
      log(`ERROR OCCURRED WHEN WATCHING A FOLDER.`, { e }, 'ERROR')
    );
    watcher.addListener('close', () =>
      log(
        `successfully closed the watcher.`,
        { folderPath: folder.path },
        'WARN'
      )
    );
    saveAbortController(folder.path, abortController);
  } catch (error) {
    log(`ERROR OCCURRED WHEN WATCHING A FOLDER.`, { error }, 'ERROR');
    throw error;
  }
};

const addWatchersToFolders = async (folders?: FolderStructure[]) => {
  const musicFolders = folders ?? getUserData().musicFolders;

  if (folders === undefined)
    log(`${musicFolders.length} music folders found in user data.`);

  if (Array.isArray(musicFolders)) {
    for (const musicFolder of musicFolders) {
      try {
        const doesFolderExist = dirExistsSync(musicFolder.path);

        if (doesFolderExist) {
          await checkForFolderUpdates(musicFolder);
          await addWatcherToFolder(musicFolder);
        } else checkForFolderModifications(path.basename(musicFolder.path));

        if (musicFolder.subFolders.length > 0)
          addWatchersToFolders(musicFolder.subFolders);
      } catch (error) {
        log(
          `ERROR OCCURRED WHEN ADDING WATCHER TO '${path.basename(
            musicFolder.path
          )}' MUSIC FOLDER.`,
          { error },
          'ERROR'
        );
      }
    }
    return;
  }
  log(
    `ERROR OCCURRED WHEN TRYING TO READ MUSIC FOLDERS ARRAY IN USER DATA. IT WAS POSSIBLY EMPTY.`,
    undefined,
    'ERROR'
  );
};

export default addWatchersToFolders;
