import path from 'path';
import fs from 'fs/promises';
import logger from '../logger';
import { sendMessageToRenderer } from '../main';
import { tryToParseSong } from '../parseSong/parseSong';
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
    logger.error(`Failed to read directory.`, { error, folderPath });
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
    sendMessageToRenderer({
      messageCode: 'SONG_DELETED',
      data: { name: filename }
    });
  } catch (error) {
    logger.error(`Failed to remove a song.`, { error, folderPath, filename });
  }
};

const checkFolderForContentModifications = async (
  folderPath: string,
  filename: string,
  abortSignal: AbortSignal
) => {
  logger.debug('Started checking folder for modifications.');

  const dirs = await getFolderDirs(folderPath);
  const songs = getSongsData();
  const isSongExtensionSupported = supportedMusicExtensions.includes(path.extname(filename));

  if (Array.isArray(dirs) && songs && Array.isArray(songs)) {
    const songPath = path.normalize(path.join(folderPath, filename));
    // checks whether the songs is newly added or deleted.
    const isNewlyAddedSong = dirs.some((dir) => dir === filename) && isSongExtensionSupported;
    const isADeletedSong = songs.some((song) => song.path === songPath);

    if (isNewlyAddedSong) return tryToParseSong(songPath, false, true);
    if (isADeletedSong) return tryToRemoveSongFromLibrary(folderPath, filename, abortSignal);
  }
  return undefined;
};

export default checkFolderForContentModifications;

