import fsSync, { WatchEventType } from 'fs';
import path from 'path';
import { getUserData } from '../filesystem';
import log from '../log';
import getParentFolderPaths from './getParentFolderPaths';
import checkForFolderModifications from './checkForFolderModifications';
import { saveAbortController } from './controlAbortControllers';

const fileNameRegex = /^.{1,}\.\w{1,}$/;

const parentFolderWatcherFunction = async (
  eventType: WatchEventType,
  filename: string
) => {
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
    log(
      'ERROR OCCURRED WHEN TRYING TO WATCH PARENT FOLDERS. FILE WATCHER FUNCTION SENT A FILENAME OF undefined.',
      undefined,
      'ERROR'
    );
  }
};

const addWatcherToParentFolder = (folderPath: string) => {
  try {
    const abortController = new AbortController();
    const watcher = fsSync.watch(
      folderPath,
      {
        signal: abortController.signal,
        recursive: true,
      },
      (eventType, filename) => parentFolderWatcherFunction(eventType, filename)
    );
    watcher.addListener('error', (e) =>
      log(`ERROR OCCURRED WHEN WATCHING A FOLDER.`, { e }, 'ERROR')
    );
    saveAbortController(folderPath, abortController);
  } catch (error) {
    log(`ERROR OCCURRED WHEN WATCHING A FOLDER.`, { error }, 'ERROR');
    throw error;
  }
};

const addWatchersToParentFolders = async () => {
  const { musicFolders } = getUserData();

  const musicFolderPaths = musicFolders.map((folder) => folder.path);
  const parentFolderPaths = getParentFolderPaths(musicFolderPaths);
  log(`${parentFolderPaths.length} parent folders of music folders found.`);

  if (Array.isArray(parentFolderPaths) && parentFolderPaths.length > 0) {
    for (let i = 0; i < parentFolderPaths.length; i += 1) {
      try {
        addWatcherToParentFolder(parentFolderPaths[i]);
      } catch (error) {
        log(
          `ERROR OCCURRED WHEN ADDING WATCHER TO '${path.basename(
            parentFolderPaths[i]
          )}' PARENT FOLDER.`,
          { error },
          'ERROR'
        );
      }
    }
    return;
  }
  log(
    `ERROR OCCURRED WHEN TRYING TO ADD WATCHERS TO PARENT FOLDERS OF MUSIC FOLDERS. NO PARENT FOLDERS FOUND.`,
    undefined,
    'ERROR'
  );
};

export default addWatchersToParentFolders;
