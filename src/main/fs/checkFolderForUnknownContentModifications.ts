import fs from 'fs/promises';
import path from 'path';

import { getAllFolders, getFolderFromPath } from '@main/db/queries/folders';
import { getSongsRelativeToFolder } from '@main/db/queries/songs';

import { supportedMusicExtensions } from '../filesystem';
import logger from '../logger';
import { generatePalettes } from '../other/generatePalette';
import { tryToParseSong } from '../parseSong/parseSong';
import removeSongsFromLibrary from '../removeSongsFromLibrary';
import { saveAbortController } from './controlAbortControllers';

const abortController = new AbortController();
saveAbortController('checkFolderForUnknownContentModifications', abortController);

const getSongPathsRelativeToFolder = async (folderPath: string) => {
  const relevantSongs = await getSongsRelativeToFolder(folderPath, {
    skipBlacklistedFolders: true,
    skipBlacklistedSongs: true
  });

  const relevantSongPaths = relevantSongs.map((song) => song.path);

  return relevantSongPaths;
};

const getFullPathsOfFolderDirs = async (folderPath: string): Promise<string[]> => {
  try {
    const dirs = await fs.readdir(folderPath, { withFileTypes: true });
    const fullPaths: string[] = [];

    for (const dir of dirs) {
      const fullPath = path.join(folderPath, dir.name);
      if (dir.isDirectory()) {
        const subDirPaths = await getFullPathsOfFolderDirs(fullPath);
        fullPaths.push(...subDirPaths);
      } else if (supportedMusicExtensions.includes(path.extname(dir.name))) {
        fullPaths.push(fullPath);
      }
    }

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
  folderPath: string,
  newlyAddedSongPaths: string[],
  abortSignal: AbortSignal
) => {
  const folder = await getFolderFromPath(folderPath);

  // Fix BUG 3: Skip if folder is blacklisted — even when DB has 0 songs
  if (folder?.isBlacklisted) {
    logger.debug(`Skipping blacklisted folder.`, { folderPath });
    return;
  }

  // Fix BUG 2b: Resolve correct folderId per song so nested songs get
  // the closest known folder, not always the ancestor's id
  const allMusicFolders = await getAllFolders();
  const folderPathToId = new Map<string, number>(
    allMusicFolders.map((f) => [f.path, f.id])
  );

  const getClosestFolderId = (songPath: string): number | undefined => {
    let dir = path.dirname(songPath);
    while (dir.length >= folderPath.length) {
      const matchedId = folderPathToId.get(dir);
      if (matchedId !== undefined) return matchedId;
      const parentDir = path.dirname(dir);
      if (parentDir === dir) break;
      dir = parentDir;
    }
    return folder?.id;
  };

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
      const resolvedFolderId = getClosestFolderId(newlyAddedSongPath);
      await tryToParseSong(newlyAddedSongPath, resolvedFolderId, false, false);
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
  const relevantFolderSongPaths = await getSongPathsRelativeToFolder(folderPath);

  const dirs = await getFullPathsOfFolderDirs(folderPath);

  if (dirs) {
    if (relevantFolderSongPaths.length > 0) {
      const deletedSongPaths = relevantFolderSongPaths.filter(
        (songPath) => !dirs.some((dir) => dir === songPath)
      );

      if (deletedSongPaths.length > 0) {
        logger.debug(`Song deletions detected.`, {
          deletedSongPathsCount: deletedSongPaths.length,
          deletedSongPaths,
          folderPath
        });
        await removeDeletedSongsFromLibrary(deletedSongPaths, abortController.signal);
      }
    }

    if (dirs.length > 0) {
      const newlyAddedSongPaths = dirs.filter(
        (dir) => !relevantFolderSongPaths.some((songPath) => songPath === dir)
      );

      if (newlyAddedSongPaths.length > 0) {
        logger.debug(`New song additions detected.`, {
          newlyAddedSongPathsCount: newlyAddedSongPaths.length,
          newlyAddedSongPaths,
          folderPath
        });
        await addNewlyAddedSongsToLibrary(folderPath, newlyAddedSongPaths, abortController.signal);
      }
    }
  }
};

export default checkFolderForUnknownModifications;
