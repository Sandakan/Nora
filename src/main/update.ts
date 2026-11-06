import electronUpdater from 'electron-updater';

import logger from './logger';
import { sendMessageToRenderer } from './main';

electronUpdater.autoUpdater.autoDownload = false;

electronUpdater.autoUpdater.on('error', (error) => {
  logger.error('AutoUpdater encountered an error during update check/download.', { error });
});

electronUpdater.autoUpdater.on('update-available', (info) => {
  logger.info('AutoUpdater found a new update.', { version: info.version });
  sendMessageToRenderer({
    messageCode: 'APP_UPDATE_AVAILABLE',
    data: { version: info.version }
  });
});

electronUpdater.autoUpdater.on('update-not-available', (info) => {
  logger.info('AutoUpdater: Current version is up-to-date.', { version: info?.version });
  sendMessageToRenderer({
    messageCode: 'APP_UPDATE_NOT_AVAILABLE',
    data: { version: info?.version }
  });
});

electronUpdater.autoUpdater.on('download-progress', (progressObj) => {
  sendMessageToRenderer({
    messageCode: 'APP_UPDATE_PROGRESS',
    data: {
      total: 100,
      value: Math.round(progressObj.percent)
    }
  });
});

electronUpdater.autoUpdater.on('update-downloaded', (info) => {
  logger.info('AutoUpdater update downloaded successfully.', { version: info.version });
  sendMessageToRenderer({
    messageCode: 'APP_UPDATE_DOWNLOADED',
    data: { version: info.version }
  });
});

export async function downloadAppUpdate() {
  logger.info('User requested to download app update.');
  return electronUpdater.autoUpdater.downloadUpdate();
}

export function quitAndInstallAppUpdate() {
  logger.info('User requested to quit and install app update.');
  setImmediate(() => electronUpdater.autoUpdater.quitAndInstall());
}

export default function checkForUpdates() {
  logger.info('Starting background check for app updates.');
  electronUpdater.autoUpdater.checkForUpdates();
}
