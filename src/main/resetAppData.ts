import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import logger from './logger';

const resourcePaths = ['nora.pglite.db', 'listening_data.json', 'song_covers'];
const userDataPath = app.getPath('userData');

const manageErrors = (error: Error) => {
  if ('code' in error && error.code === 'ENOENT') {
    return logger.error(`A recoverable error occurred when resetting an app data module.`, {
      error
    });
  }
  throw error;
};

const resetAppData = async () => {
  try {
    for (const resourcePath of resourcePaths) {
      const isResourcePathADirectory = path.extname(resourcePath) === '';

      if (isResourcePathADirectory)
        await fs
          .rm(path.join(userDataPath, resourcePath), {
            recursive: true
          })
          .catch(manageErrors);
      else await fs.unlink(path.join(userDataPath, resourcePath)).catch(manageErrors);
    }
  } catch (error) {
    logger.error(`An unrecoverable error occurred when resetting the app.`, { error });
  }
};

export default resetAppData;
