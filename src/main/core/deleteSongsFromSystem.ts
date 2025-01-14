import path from 'path';
import fs from 'fs/promises';
import { shell } from 'electron';
import { supportedMusicExtensions } from '../filesystem';
import logger from '../logger';
import removeSongsFromLibrary from '../removeSongsFromLibrary';

const deleteSongsFromSystem = async (
  absoluteFilePaths: string[],
  abortSignal: AbortSignal,
  isPermanentDelete = false
) => {
  if (abortSignal.aborted) {
    logger.debug(`Song deletion process aborted because abort event triggered.`);
    throw new Error('Song deletion process aborted because abort event triggered.');
  }

  logger.debug(`Started the deletion process of '${absoluteFilePaths.length}' songs.`, {
    absoluteFilePaths
  });

  const isEveryPathASong = absoluteFilePaths.every((filePath) => {
    const ext = path.extname(filePath);
    return supportedMusicExtensions.includes(ext);
  });

  if (!isEveryPathASong) {
    const errMessage = `Tried to delete a resource which is recognized as a song.`;
    logger.error(errMessage, {
      path: absoluteFilePaths
    });
    throw new Error(errMessage);
  }

  try {
    const res = await removeSongsFromLibrary(absoluteFilePaths, abortSignal);

    if (res?.success) {
      for (const filePath of absoluteFilePaths) {
        if (isPermanentDelete) await fs.unlink(filePath);
        else await shell.trashItem(filePath);
      }
    }

    return {
      success: true,
      message: `Successfully ${
        isPermanentDelete
          ? `deleted ${absoluteFilePaths.length} songs from the system`
          : `moved ${absoluteFilePaths.length} songs to the recycle bin`
      }.`
    };
  } catch (error) {
    logger.error(`Failed to remove a song from the system`, { error });
    return { success: false };
  }
};

export default deleteSongsFromSystem;
