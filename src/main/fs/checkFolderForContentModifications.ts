import path from 'path';
import fs from 'fs/promises';
import log from '../log';
import { sendMessageToRenderer } from '../main';
import { tryToParseSong } from '../parseSong';
import { getSongsData, supportedMusicExtensions } from '../filesystem';
import removeSongsFromLibrary from '../removeSongsFromLibrary';

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
    const songPath = path.normalize(path.join(folderPath, filename));
    // checks whether the songs is newly added or deleted.
    const isNewlyAddedSong =
      dirs.some((dir) => dir === filename) &&
      supportedMusicExtensions.includes(path.extname(filename));
    const isADeletedSong = songs.some((song) => song.path === songPath);

    if (isNewlyAddedSong) return tryToParseSong(songPath);
    if (isADeletedSong)
      return tryToRemoveSongFromLibrary(folderPath, filename, abortSignal);
  }
  return undefined;
};

export default checkFolderForContentModifications;
