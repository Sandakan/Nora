/* eslint-disable no-await-in-loop */
import { shell } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { supportedMusicExtensions } from '../filesystem';
import log from '../log';
import removeSongsFromLibrary from '../removeSongsFromLibrary';

const deleteSongFromSystem = async (
  absoluteFilePaths: string[],
  abortSignal: AbortSignal,
  isPermanentDelete = false
) => {
  if (abortSignal.aborted) {
    log(`Song deletion process aborted because abort event triggered.`);
    throw new Error(
      'Song deletion process aborted because abort event triggered.'
    );
  }

  log(`Started the deletion process of '${absoluteFilePaths.length}' songs.`, {
    absoluteFilePaths,
  });

  const isEveryPathASong = absoluteFilePaths.every((filePath) => {
    const ext = path.extname(filePath);
    return supportedMusicExtensions.includes(ext);
  });

  if (!isEveryPathASong) {
    log(
      `Tried to delete a resource which is recognized as a song.`,
      { path: absoluteFilePaths },
      'WARN'
    );
    throw new Error(`Prevented deleting files which are not songs.`);
  }

  try {
    const res = await removeSongsFromLibrary(absoluteFilePaths, abortSignal);

    if (res && res.success) {
      for (const filePath of absoluteFilePaths) {
        if (!isPermanentDelete) await shell.trashItem(filePath);
        else await fs.unlink(filePath);
      }
    }

    return {
      success: true,
      message: `Successfully ${
        isPermanentDelete
          ? `deleted ${absoluteFilePaths.length} songs from the system`
          : `moved ${absoluteFilePaths.length} songs to the recycle bin`
      }.`,
    };
  } catch (error) {
    log(
      `Error occurred when removing a song from the system`,
      undefined,
      'ERROR'
    );
    log(error as Error, undefined, 'ERROR');
    throw error;
  }
};

export default deleteSongFromSystem;
