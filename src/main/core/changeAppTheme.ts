import { nativeTheme } from 'electron';
import { dataUpdateEvent, getBackgroundColor, mainWindow } from '../main';
import { getUserData, setUserData } from '../filesystem';
import logger from '../logger';

export const changeAppTheme = (theme?: AppTheme) => {
  const { theme: themeData } = getUserData();
  logger.debug(`Theme update requested`, { theme });

  const isDarkMode =
    theme === undefined
      ? !themeData.isDarkMode
      : theme === 'light'
        ? false
        : theme === 'dark'
          ? true
          : nativeTheme.shouldUseDarkColors;
  const useSystemTheme = theme === 'system';

  if (mainWindow?.webContents)
    mainWindow.webContents.send('app/systemThemeChange', isDarkMode, useSystemTheme);

  setUserData('theme', {
    isDarkMode,
    useSystemTheme
  });
  mainWindow?.setBackgroundColor(getBackgroundColor());
  dataUpdateEvent('userData/theme', [theme ?? 'system']);
};

export default changeAppTheme;
