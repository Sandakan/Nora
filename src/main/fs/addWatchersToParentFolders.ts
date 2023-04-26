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

const addWatcherToParentFolder = (parentFolderPath: string) => {
  try {
    const abortController = new AbortController();
    const watcher = fsSync.watch(
      parentFolderPath,
      {
        signal: abortController.signal,
        // ! TODO - recursive mode won't work on linux
        recursive: true,
      },
      (eventType, filename) => parentFolderWatcherFunction(eventType, filename)
    );
    log(
      'Added watcher to a parent folder successfully.',
      { parentFolderPath },
      'WARN'
    );
    watcher.addListener('error', (e) =>
      log(`ERROR OCCURRED WHEN WATCHING A FOLDER.`, { e }, 'ERROR')
    );
    watcher.addListener('close', () =>
      log(
        `Successfully closed the parent folder watcher.`,
        { parentFolderPath },
        'WARN'
      )
    );
    saveAbortController(parentFolderPath, abortController);
  } catch (error) {
    log(`ERROR OCCURRED WHEN WATCHING A FOLDER.`, { error }, 'ERROR');
    throw error;
  }
};

/* Parent folder watchers only watch for folder modifications (not file modifications) inside the parent folder. */
const addWatchersToParentFolders = async () => {
  const { musicFolders } = getUserData();

  const musicFolderPaths = musicFolders.map((folder) => folder.path);
  const parentFolderPaths = getParentFolderPaths(musicFolderPaths);
  log(`${parentFolderPaths.length} parent folders of music folders found.`);

  if (Array.isArray(parentFolderPaths) && parentFolderPaths.length > 0) {
    for (const parentFolderPath of parentFolderPaths) {
      try {
        addWatcherToParentFolder(parentFolderPath);
      } catch (error) {
        log(
          `ERROR OCCURRED WHEN ADDING WATCHER TO '${path.basename(
            parentFolderPath
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
