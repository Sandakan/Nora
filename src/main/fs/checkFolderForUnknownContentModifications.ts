import fs from 'fs/promises';
import path from 'path';

import { getAllFolders, getFolderFromPath } from '@main/db/queries/folders';
import { getSongsInFolders } from '@main/db/queries/songs';

import { supportedMusicExtensions } from '../filesystem';
import logger from '../logger';
import { generatePalettes } from '../other/generatePalette';
import { tryToParseSong } from '../parseSong/parseSong';
import removeSongsFromLibrary from '../removeSongsFromLibrary';

const getSongPathsUnderFolder = async (
  folderPath: string,
  allFolders: FolderRow[]
) => {
  const topFolder = allFolders.find((f) => f.path === folderPath);
  if (!topFolder) return [];

  const descendantIds = allFolders
    .filter((f) => f.path.startsWith(folderPath + path.sep) || f.path === folderPath)
    .filter((f) => !f.isBlacklisted)
    .map((f) => f.id);

  if (descendantIds.length === 0) return [];

  const songs = await getSongsInFolders(descendantIds, {
    skipBlacklistedFolders: true,
    skipBlacklistedSongs: true
  });
  return songs.map((song) => song.path);
};

const getFullPathsOfFolderDirs = async (
  folderPath: string
): Promise<string[] | undefined> => {
  try {
    const dirs = await fs.readdir(folderPath, { withFileTypes: true });
    const fullPaths: string[] = [];

    for (const dir of dirs) {
      const fullPath = path.join(folderPath, dir.name);
      if (dir.isDirectory()) {
        const subDirPaths = await getFullPathsOfFolderDirs(fullPath);
        if (subDirPaths === undefined) return undefined;
        fullPaths.push(...subDirPaths);
      } else if (supportedMusicExtensions.includes(path.extname(dir.name))) {
        fullPaths.push(fullPath);
      }
    }

    return fullPaths;
  } catch (error) {
    logger.error(`Failed to read directory. Skipping scan for this folder.`, {
      error,
      folderPath
    });
    return undefined;
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

type FolderRow = { id: number; path: string; isBlacklisted: boolean };

const addNewlyAddedSongsToLibrary = async (
  folderPath: string,
  newlyAddedSongPaths: string[],
  abortSignal: AbortSignal,
  allMusicFolders: FolderRow[]
) => {
  const folder = await getFolderFromPath(folderPath);

  // Defensive: skip blacklisted folders even when the DB has 0 songs on disk
  if (folder?.isBlacklisted) {
    logger.debug(`Skipping blacklisted folder.`, { folderPath });
    return;
  }

  // Fix BUG 2b: Resolve correct folderId per song so nested songs get
  // the closest known folder, not always the ancestor's id.
  // Also track blacklist status so songs under blacklisted children are skipped.
  const folderPathToMeta = new Map<
    string,
    { id: number; isBlacklisted: boolean }
  >(
    allMusicFolders.map((f) => [f.path, { id: f.id, isBlacklisted: f.isBlacklisted }])
  );

  const getClosestFolderId = (songPath: string): number | undefined => {
    let dir = path.dirname(songPath);
    while (dir.length >= folderPath.length) {
      const meta = folderPathToMeta.get(dir);
      if (meta !== undefined) {
        if (meta.isBlacklisted) return undefined;
        return meta.id;
      }
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

      if (resolvedFolderId === undefined) {
        logger.debug(`Skipping song under blacklisted folder.`, {
          songPath: newlyAddedSongPath
        });
        continue;
      }

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
  const abortController = new AbortController();

  try {
    const allMusicFolders = await getAllFolders();

    const relevantFolderSongPaths = await getSongPathsUnderFolder(
      folderPath,
      allMusicFolders
    );

    const dirs = await getFullPathsOfFolderDirs(folderPath);

    if (dirs === undefined) {
      logger.warn(`Disk inventory failed. Skipping reconciliation for this folder.`, {
        folderPath
      });
      return;
    }

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
        await addNewlyAddedSongsToLibrary(
          folderPath,
          newlyAddedSongPaths,
          abortController.signal,
          allMusicFolders
        );
      }
    }
  } finally {
    // Always abort the in-flight abortController, even when the scan completed
    // successfully. Any pending async work spawned by the scan that checks
    // abortSignal will observe the abort and bail out instead of stacking.
    abortController.abort();
  }
};

export default checkFolderForUnknownModifications;
