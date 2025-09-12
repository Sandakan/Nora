import { nativeTheme } from 'electron';
import { dataUpdateEvent, getBackgroundColor, mainWindow } from '../main';
import logger from '../logger';
import { getAllSettings, saveUserThemeSettings } from '@main/db/queries/settings';

const changeAppTheme = async (theme?: AppTheme) => {
  const { isDarkMode } = await getAllSettings();
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

  await saveUserThemeSettings(updatedIsDarkMode, updatedUseSystemTheme);

  mainWindow?.setBackgroundColor(getBackgroundColor());
  dataUpdateEvent('userData/theme', [theme ?? 'system']);
};

export default changeAppTheme;
