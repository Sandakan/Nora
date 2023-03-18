import path from 'path';
import fs from 'fs/promises';
import log from '../log';
import { dataUpdateEvent, sendMessageToRenderer } from '../main';
import { parseSong } from '../parseSong';
import { getSongsData, supportedMusicExtensions } from '../filesystem';
import removeSongsFromLibrary from '../removeSongsFromLibrary';
import { generatePalettes } from '../other/generatePalette';

let pathsQueue: string[] = [];

const getFolderDirs = async (folderPath: string) => {
  try {
    const dirs = await fs.readdir(folderPath);
    const supportedDirs = dirs.filter((dir) =>
      supportedMusicExtensions.includes(path.extname(dir))
    );
    return supportedDirs;
  } catch (error) {
    log(
      `ERROR OCCURRED WHEN READING DIRECTORY '${folderPath}'.`,
      { error },
      'ERROR'
    );
    return undefined;
  }
};

const tryToParseNewlyAddedSong = (folderPath: string, filename: string) => {
  let errRetryCount = 0;
  let timeOutId: NodeJS.Timeout;
  const songPath = path.join(folderPath, filename);
  // Here paths queue is used to prevent parsing the same song multiple times due to the event being fired multiple times for the same song even before they are parsed. So if the same is going to start the parsing process, it will stop the process if the song path is in the songPaths queue.
  if (!pathsQueue.includes(songPath)) {
    pathsQueue.push(songPath);

    const tryParseSong = async (absolutePath: string): Promise<void> => {
      try {
        await parseSong(absolutePath);
        log(`'${filename}' song added to the library.`);
        setTimeout(generatePalettes, 1500);

        dataUpdateEvent('songs/newSong');
        pathsQueue = pathsQueue.filter((x) => x !== songPath);
        return;
      } catch (error) {
        if (errRetryCount < 10) {
          // THIS ERROR OCCURRED WHEN THE APP STARTS READING DATA WHILE THE SONG IS STILL WRITING TO THE DISK. POSSIBLE SOLUTION IS TO SET A TIMEOUT AND REDO THE PROCESS.
          if (timeOutId) clearTimeout(timeOutId);
          log(
            'ERROR OCCURRED WHEN TRYING TO PARSE SONG DATA. RETRYING IN 5 SECONDS. (ERROR: READ ERROR)'
          );
          errRetryCount += 1;
          setTimeout(() => tryParseSong(absolutePath), 5000);
        } else {
          log(
            `ERROR OCCURRED WHEN PARSING A NEWLY ADDED SONG WHILE THE APP IS OPEN. FAILED 10 OF 10 RETRY EFFORTS.`,
            { error },
            'ERROR'
          );
          sendMessageToRenderer(
            `'${filename}' failed when trying to add the song to the library. Go to settings to resync the library.`,
            'PARSE_FAILED'
          );
          throw error;
        }
      }
    };

    return tryParseSong(songPath);
  }
  return undefined;
};

const tryToRemoveSongFromLibrary = async (
  folderPath: string,
  filename: string,
  abortSignal: AbortSignal
) => {
  try {
    const fullPath = path.normalize(path.join(folderPath, filename));
    await removeSongsFromLibrary([fullPath], abortSignal);
    sendMessageToRenderer(
      `'${filename}' song got deleted from the system.`,
      'SONG_DELETED'
    );
  } catch (error) {
    log(`Error occurred when removing a song.`, { error }, 'ERROR');
  }
};

const checkFolderForContentModifications = async (
  folderPath: string,
  filename: string,
  abortSignal: AbortSignal
) => {
  log('Started checking folder for modifications.');

  const dirs = await getFolderDirs(folderPath);
  const songs = getSongsData();
  if (Array.isArray(dirs) && songs && Array.isArray(songs)) {
    // checks whether the songs is newly added or deleted.
    const isNewlyAddedSong =
      dirs.some((dir) => dir === filename) &&
      supportedMusicExtensions.includes(path.extname(filename));
    const isADeletedSong = songs.some(
      (song) => song.path === path.normalize(path.join(folderPath, filename))
    );

    if (isNewlyAddedSong) return tryToParseNewlyAddedSong(folderPath, filename);
    if (isADeletedSong)
      return tryToRemoveSongFromLibrary(folderPath, filename, abortSignal);
  }
  return undefined;
};

export default checkFolderForContentModifications;
