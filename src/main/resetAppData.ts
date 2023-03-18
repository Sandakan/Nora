import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import log from './log';

const resetAppData = async () => {
  const manageErrors = (err: any) => {
    if ('code' in err && err.code === 'ENOENT') {
      return log(
        `A RECOVERABLE ERROR OCURRED WHEN RESETTING AN APP DATA MODULE.\nERROR : ${err}`
      );
    }
    throw err;
  };
  try {
    const userDataPath = app.getPath('userData');
    await fs.unlink(path.join(userDataPath, 'songs.json')).catch(manageErrors);
    await fs
      .unlink(path.join(userDataPath, 'artists.json'))
      .catch(manageErrors);
    await fs.unlink(path.join(userDataPath, 'albums.json')).catch(manageErrors);
    await fs.unlink(path.join(userDataPath, 'genres.json')).catch(manageErrors);
    await fs
      .unlink(path.join(userDataPath, 'playlists.json'))
      .catch(manageErrors);
    await fs
      .unlink(path.join(userDataPath, 'userData.json'))
      .catch(manageErrors);
    await fs
      .unlink(path.join(userDataPath, 'listening_data.json'))
      .catch(manageErrors);
    await fs
      .rm(path.join(userDataPath, 'song_covers'), {
        recursive: true,
      })
      .catch(manageErrors);
  } catch (error) {
    log(
      `AN UNRECOVERABLE ERROR OCCURRED WHEN RESETTING THE APP.`,
      { error },
      'ERROR'
    );
    throw error;
  }
};

export default resetAppData;
