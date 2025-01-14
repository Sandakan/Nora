import path from 'path';
import fs from 'fs/promises';
import { getBlacklistData, getSongsData, supportedMusicExtensions } from '../filesystem';
import logger from '../logger';
import removeSongsFromLibrary from '../removeSongsFromLibrary';
import { tryToParseSong } from '../parseSong/parseSong';
import { saveAbortController } from './controlAbortControllers';
import { generatePalettes } from '../other/generatePalette';

const abortController = new AbortController();
saveAbortController('checkFolderForUnknownContentModifications', abortController);

const getSongPathsRelativeToFolder = (folderPath: string) => {
  const songPaths = getSongsData()?.map((song) => song.path) ?? [];

  const blacklistedSongPaths = getBlacklistData().songBlacklist ?? [];
  if (Array.isArray(songPaths)) {
    const allSongPaths = songPaths.concat(blacklistedSongPaths);
    const relevantSongPaths = allSongPaths.filter(
      (songPath) => path.dirname(songPath) === folderPath
    );
    return relevantSongPaths;
  }
  return [];
};

const getFullPathsOfFolderDirs = async (folderPath: string) => {
  try {
    const dirs = await fs.readdir(folderPath);
    const supportedDirs = dirs.filter((filePath) =>
      supportedMusicExtensions.includes(path.extname(filePath))
    );
    const fullPaths = supportedDirs.map((filePath) => path.join(folderPath, filePath));
    return fullPaths;
  } catch (error) {
    logger.error(`Failed to read directory.`, { error, folderPath });
    return [];
  }
};

const removeDeletedSongsFromLibrary = async (
  deletedSongPaths: string[],
  abortSignal: AbortSignal
) => {
  try {
    await removeSongsFromLibrary(deletedSongPaths, abortSignal);
  } catch (error) {
    logger.error(`Failed to remove deleted songs from library.`, { error, deletedSongPaths });
  }
};

const addNewlyAddedSongsToLibrary = async (
  newlyAddedSongPaths: string[],
  abortSignal: AbortSignal
) => {
  for (let i = 0; i < newlyAddedSongPaths.length; i += 1) {
    const newlyAddedSongPath = newlyAddedSongPaths[i];

    if (abortSignal?.aborted) {
      logger.warn('Parsing songs in the music folder aborted by an abortController signal.', {
        reason: abortSignal?.reason,
        newlyAddedSongPath
      });
      break;
    }

    try {
      await tryToParseSong(newlyAddedSongPath, false, false);
      logger.debug(`${path.basename(newlyAddedSongPath)} song added.`, {
        songPath: newlyAddedSongPath
      });
    } catch (error) {
      logger.error(`Failed to parse song added before application launch`, {
        error,
        newlyAddedSongPath
      });
    }
  }
  if (newlyAddedSongPaths.length > 0) setTimeout(generatePalettes, 1500);
};

const checkFolderForUnknownModifications = async (folderPath: string) => {
  const relevantFolderSongPaths = getSongPathsRelativeToFolder(folderPath);

  if (relevantFolderSongPaths.length > 0) {
    const dirs = await getFullPathsOfFolderDirs(folderPath);

    if (dirs) {
      // checks for newly added songs that got added before application launch
      const newlyAddedSongPaths = dirs.filter(
        (dir) => !relevantFolderSongPaths.some((songPath) => songPath === dir)
      );
      // checks for deleted songs that got deleted before application launch
      const deletedSongPaths = relevantFolderSongPaths.filter(
        (songPath) => !dirs.some((dir) => dir === songPath)
      );

      logger.debug(`New song additions/deletions detected.`, {
        newlyAddedSongPathsCount: newlyAddedSongPaths.length,
        deletedSongPathsCount: deletedSongPaths.length,
        newlyAddedSongPaths,
        deletedSongPaths,
        folderPath
      });

      // Prioritises deleting songs before adding new songs to prevent data clashes.
      if (deletedSongPaths.length > 0) {
        // deleting songs from the library that got deleted before application launch
        await removeDeletedSongsFromLibrary(deletedSongPaths, abortController.signal);
      }

      if (newlyAddedSongPaths.length > 0) {
        // parses new songs that added before application launch
        await addNewlyAddedSongsToLibrary(newlyAddedSongPaths, abortController.signal);
      }
    }
  }
};

export default checkFolderForUnknownModifications;
