import electronUpdater from 'electron-updater';
import log from './log';
// import { IS_DEVELOPMENT } from './main';

export default async function checkForUpdates() {
  electronUpdater.autoUpdater.logger = {
    info: (mes) => log(mes, undefined, 'INFO'),
    warn: (mes) => log(mes, undefined, 'WARN'),
    error: (mes) => log(mes, undefined, 'ERROR'),
    debug: (mes) => log(mes, undefined, 'INFO')
  };
  electronUpdater.autoUpdater.autoDownload = false;
  //   electronUpdater.autoUpdater.forceDevUpdateConfig = IS_DEVELOPMENT;

  const result = await electronUpdater.autoUpdater.checkForUpdatesAndNotify();

  return result;
}
