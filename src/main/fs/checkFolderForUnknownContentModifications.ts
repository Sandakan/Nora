/* eslint-disable no-await-in-loop */
import path from 'path';
import fs from 'fs/promises';
import {
  getSongsData,
  getUserData,
  supportedMusicExtensions,
} from '../filesystem';
import log from '../log';
import removeSongsFromLibrary from '../removeSongsFromLibrary';
import { parseSong } from '../parseSong';

const getSongPathsRelativeToFolder = (folderPath: string) => {
  const songPaths = getSongsData()?.map((song) => song.path) ?? [];

  const blacklistedSongPaths = getUserData().songBlacklist ?? [];
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
    const fullPaths = supportedDirs.map((filePath) =>
      path.join(folderPath, filePath)
    );
    return fullPaths;
  } catch (error) {
    log(
      `ERROR OCCURRED WHEN TRYING TO READ THE DIRECTORY.`,
      { error },
      'ERROR'
    );
    throw error;
  }
};

const removeDeletedSongsFromLibrary = async (deletedSongPaths: string[]) => {
  try {
    await removeSongsFromLibrary(deletedSongPaths, false);
  } catch (error) {
    log(
      `ERROR OCCURRED WHEN PARSING THE SONG TO GET METADATA`,
      { error },
      'ERROR'
    );
  }
};

const addNewlyAddedSongsToLibrary = async (newlyAddedSongPaths: string[]) => {
  for (let i = 0; i < newlyAddedSongPaths.length; i += 1) {
    const newlyAddedSongPath = newlyAddedSongPaths[i];
    try {
      await parseSong(newlyAddedSongPath);
      log(`${path.basename(newlyAddedSongPath)} song added.`);
    } catch (error) {
      log(
        `ERROR OCCURRED WHEN PARSING SONGS ADDED BEFORE APPLICATION LAUNCH `,
        { error },
        'ERROR'
      );
    }
  }
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

      log(
        `${newlyAddedSongPaths.length} newly added songs found. ${
          deletedSongPaths.length
        } song deletions found.${
          newlyAddedSongPaths.length > 0 || deletedSongPaths.length > 0
            ? `\nNewSongs : '${newlyAddedSongPaths}';\n DeletedSongs : '${deletedSongPaths}';`
            : ''
        }`
      );

      // Prioritises deleting songs before adding new songs to prevent data clashes.
      if (deletedSongPaths.length > 0) {
        // deleting songs from the library that got deleted before application launch
        await removeDeletedSongsFromLibrary(deletedSongPaths);
      }

      if (newlyAddedSongPaths.length > 0) {
        // parses new songs that added before application launch
        await addNewlyAddedSongsToLibrary(newlyAddedSongPaths);
      }
    }
  }
};

export default checkFolderForUnknownModifications;
