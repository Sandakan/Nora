import { nativeTheme } from 'electron';
import { dataUpdateEvent, getBackgroundColor, mainWindow } from '../main';
import logger from '../logger';
import { getUserSettings, saveUserSettings } from '@main/db/queries/settings';

const changeAppTheme = async (theme?: AppTheme) => {
  const { isDarkMode } = await getUserSettings();
  logger.debug(`Theme update requested`, { theme });

  const updatedIsDarkMode =
    theme === undefined
      ? !isDarkMode
      : theme === 'light'
        ? false
        : theme === 'dark'
          ? true
          : nativeTheme.shouldUseDarkColors;
  const updatedUseSystemTheme = theme === 'system';

  if (mainWindow?.webContents)
    mainWindow.webContents.send('app/systemThemeChange', updatedIsDarkMode, updatedUseSystemTheme);

  await saveUserSettings({ isDarkMode: updatedIsDarkMode, useSystemTheme: updatedUseSystemTheme });

  mainWindow?.setBackgroundColor(await getBackgroundColor());
  dataUpdateEvent('userData/theme');
};

export default changeAppTheme;
