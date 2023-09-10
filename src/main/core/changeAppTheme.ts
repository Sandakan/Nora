import { nativeTheme } from 'electron';
import { dataUpdateEvent, mainWindow } from '../main';
import { getUserData, setUserData } from '../filesystem';

export const changeAppTheme = (theme?: AppTheme) => {
  const { theme: themeData } = getUserData();
  console.log(`Theme update requested : theme : ${theme}`);
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
    mainWindow.webContents.send(
      'app/systemThemeChange',
      isDarkMode,
      useSystemTheme,
    );

  setUserData('theme', {
    isDarkMode,
    useSystemTheme,
  });
  dataUpdateEvent('userData/theme', [theme ?? 'system']);
};

export default changeAppTheme;
