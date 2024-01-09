import { autoUpdater } from 'electron-updater';
import log from './log';
// import { IS_DEVELOPMENT } from './main';

export default async function checkForUpdates() {
  autoUpdater.logger = {
    info: (mes) => log(mes, undefined, 'INFO'),
    warn: (mes) => log(mes, undefined, 'WARN'),
    error: (mes) => log(mes, undefined, 'ERROR'),
    debug: (mes) => log(mes, undefined, 'INFO'),
  };
  autoUpdater.autoDownload = false;
  //   autoUpdater.forceDevUpdateConfig = IS_DEVELOPMENT;

  const result = await autoUpdater.checkForUpdatesAndNotify();

  return result;
}
