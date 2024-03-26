/* eslint-disable no-await-in-loop */
import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import log from './log';

const resourcePaths = [
  'songs.json',
  'artists.json',
  'albums.json',
  'genres.json',
  'playlists.json',
  'userData.json',
  'listening_data.json',
  'blacklist.json',
  'song_covers'
];
const userDataPath = app.getPath('userData');

const manageErrors = (err: any) => {
  if ('code' in err && err.code === 'ENOENT') {
    return log(`A RECOVERABLE ERROR OCURRED WHEN RESETTING AN APP DATA MODULE.\nERROR : ${err}`);
  }
  throw err;
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
    log(`AN UNRECOVERABLE ERROR OCCURRED WHEN RESETTING THE APP.`, { error }, 'ERROR');
    throw error;
  }
};

export default resetAppData;
