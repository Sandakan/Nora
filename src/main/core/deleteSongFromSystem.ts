import { shell } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { supportedMusicExtensions } from '../filesystem';
import log from '../log';
import removeSongsFromLibrary from '../removeSongsFromLibrary';

const deleteSongFromSystem = async (
  absoluteFilePath: string,
  isPermanentDelete = false
) => {
  const pathBaseName = path.basename(absoluteFilePath);
  const pathExtension = path.extname(absoluteFilePath);

  log(`Started the deletion process of '${pathBaseName}' song.`);

  if (!supportedMusicExtensions.includes(pathExtension)) {
    log(
      `Tried to delete a resource which is recognized as a song.`,
      { path: absoluteFilePath },
      'WARN'
    );
    return {
      success: false,
      message: `'${pathBaseName}' is not a song.`,
    };
  }

  try {
    const res = await removeSongsFromLibrary([absoluteFilePath], false);

    if (res && res.success) {
      if (!isPermanentDelete) await shell.trashItem(absoluteFilePath);
      else await fs.unlink(absoluteFilePath);
    }

    return {
      success: true,
      message: `'${pathBaseName}' successfully ${
        isPermanentDelete
          ? 'deleted from the system'
          : 'moved to the recycle bin'
      }.`,
    };
  } catch (error) {
    log(
      `Error occurred when removing a song from the system`,
      undefined,
      'ERROR'
    );
    log(error as Error, undefined, 'ERROR');
    return { success: false };
  }
};

export default deleteSongFromSystem;
