import fs from 'fs/promises';
import path from 'path';

import { app } from 'electron';

import { appPreferences } from '../../package.json';
import logger from './logger';
import isPathADir from './utils/isPathADir';

import '@db/db';

export const DEFAULT_ARTWORK_SAVE_LOCATION = path.join(app.getPath('userData'), 'song_covers');
export const DEFAULT_FILE_URL = 'nora://localfiles/';

export const supportedMusicExtensions = appPreferences.supportedMusicExtensions.map((x) => `.${x}`);

// $ AUDIO LIBRARY MANAGEMENT

function flattenPathArrays<Type extends string[][]>(lists: Type) {
  return lists.reduce((a, b) => a.concat(b), []);
}

export const getDirectories = async (srcpath: string) => {
  try {
    const dirs = await fs.readdir(srcpath, { withFileTypes: true });
    const filteredDirs = dirs.filter((dir) => isPathADir(dir));
    const dirsWithFullPaths = filteredDirs.map((dir) => path.join(srcpath, dir.name));

    return dirsWithFullPaths;
  } catch (error) {
    logger.error('Failed to parse directories of a path.', { error, srcpath });
    return [];
  }
};

export async function getDirectoriesRecursive(srcpath: string): Promise<string[]> {
  try {
    const dirs = await getDirectories(srcpath);
    if (dirs)
      return [srcpath, ...flattenPathArrays(await Promise.all(dirs.map(getDirectoriesRecursive)))];
    return [];
  } catch (error) {
    logger.error('Failed to parse directories.', { error, srcpath });
    return [];
  }
}
