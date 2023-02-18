import { nativeTheme } from 'electron';
import { setUserData } from '../filesystem';

const changeAppTheme = (theme?: AppTheme) => {
  console.log(`Theme update requested : theme : ${theme}`);
  if (theme) {
    nativeTheme.themeSource = theme;
  } else {
    nativeTheme.themeSource = !nativeTheme.shouldUseDarkColors
      ? 'dark'
      : 'light';
  }
  setUserData('theme', {
    isDarkMode: nativeTheme.shouldUseDarkColors,
    useSystemTheme: nativeTheme.themeSource === 'system',
  });
};

export default changeAppTheme;
