import path from 'path';
import { statSync } from 'fs';
import logger from '../logger';
import { appPreferences } from '../../../package.json';
import sendAudioDataFromPath from './sendAudioDataFromPath';

let songsOnStartUp: string[] = [];

const checkForStartUpSongs = async () => {
  logger.info('Started the startup song checking process.');
  songsOnStartUp = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    const argPath = process.argv[i];
    if (
      typeof argPath === 'string' &&
      appPreferences.supportedMusicExtensions.some((ext) => path.extname(argPath).includes(ext))
    ) {
      try {
        const stats = statSync(argPath);
        if (stats.isFile()) {
          process.argv = process.argv.filter((argv) => argv !== argPath);
          songsOnStartUp.push(argPath);
        }
      } catch (error) {
        logger.error(`Failed to process arguments for startup song playback requests.`, { error });
      }
    }
  }
  logger.debug(`User requested ${songsOnStartUp.length} number of songs to be played on startup.`, {
    songsOnStartUp
  });
  if (songsOnStartUp.length > 0) {
    const audioData = await sendAudioDataFromPath(songsOnStartUp[0]).catch((err) =>
      logger.error(`Failed to read song data from path.`, { error: err, songsOnStartUp })
    );
    if (audioData) {
      return audioData;
    }
  }
  return undefined;
};

export default checkForStartUpSongs;
