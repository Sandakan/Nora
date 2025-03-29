import electronUpdater from 'electron-updater';
import logger from './logger';
// import { IS_DEVELOPMENT } from './main';

export default async function checkForUpdates() {
  electronUpdater.autoUpdater.logger = {
    info: (mes) => logger.info(mes),
    warn: (mes) => logger.warn(mes),
    error: (mes) => logger.error(mes),
    debug: (mes) => logger.debug(mes)
  };
  electronUpdater.autoUpdater.autoDownload = false;
  // electronUpdater.autoUpdater.forceDevUpdateConfig = IS_DEVELOPMENT;

  const result = await electronUpdater.autoUpdater.checkForUpdatesAndNotify();

  return result;
}
