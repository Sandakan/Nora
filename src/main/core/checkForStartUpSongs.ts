import path from 'path';
import { statSync } from 'fs';
import log from '../log';
import { appPreferences } from '../../../package.json';
// import { IS_DEVELOPMENT } from '../main';
import sendAudioDataFromPath from './sendAudioDataFromPath';

let songsOnStartUp: string[] = [];

const checkForStartUpSongs = async () => {
  log('Started the startup song checking process.');
  songsOnStartUp = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    const argPath = process.argv[i];
    if (
      typeof argPath === 'string' &&
      appPreferences.supportedMusicExtensions.some((ext) =>
        path.extname(argPath).includes(ext)
      )
    ) {
      try {
        const stats = statSync(argPath);
        if (stats.isFile()) {
          process.argv = process.argv.filter((argv) => argv !== argPath);
          songsOnStartUp.push(argPath);
        }
      } catch (error) {
        log(
          `ERROR OCCURRED WHEN VALIDATING PROCESS ARGUMENTS FOR STARTUP SONG PLAYBACK REQUESTS.\nERROR : ${error}`
        );
      }
    }
  }
  log(
    `User request ${songsOnStartUp.length} number of songs to be played on startup.\nsongsOnStartUp : [ ${songsOnStartUp} ]`
  );
  if (songsOnStartUp.length > 0) {
    const audioData = await sendAudioDataFromPath(songsOnStartUp[0]).catch(
      (err) =>
        log(
          `====== ERROR OCCURRED WHEN TRYING TO READ SONG DATA FROM PATH. =====\nPATH : ${songsOnStartUp[0]}\nERROR : ${err}`
        )
    );
    if (audioData) {
      return audioData;
    }
  }
  return undefined;
};

export default checkForStartUpSongs;
