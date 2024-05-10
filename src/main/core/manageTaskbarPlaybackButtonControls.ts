import { BrowserWindow, nativeImage, nativeTheme } from 'electron';

import skipBackLightIconPath from '../../../resources/taskbar buttons/baseline_skip_previous_white_24dp.png?asset';
import playLightIconPath from '../../../resources/taskbar buttons/baseline_play_arrow_white_24dp.png?asset';
import pauseLightIconPath from '../../../resources/taskbar buttons/outline_pause_white_24dp.png?asset';
import skipForwardLightIconPath from '../../../resources/taskbar buttons/baseline_skip_next_white_24dp.png?asset';
import skipBackDarkIconPath from '../../../resources/taskbar buttons/baseline_skip_previous_black_24dp.png?asset';
import playDarkIconPath from '../../../resources/taskbar buttons/baseline_play_arrow_black_24dp.png?asset';
import pauseDarkIconPath from '../../../resources/taskbar buttons/outline_pause_black_24dp.png?asset';
import skipForwardDarkIconPath from '../../../resources/taskbar buttons/baseline_skip_next_black_24dp.png?asset';

const skipBackLightIcon = nativeImage.createFromPath(skipBackLightIconPath);
const playLightIcon = nativeImage.createFromPath(playLightIconPath);
const pauseLightIcon = nativeImage.createFromPath(pauseLightIconPath);
const skipForwardLightIcon = nativeImage.createFromPath(skipForwardLightIconPath);
const skipBackDarkIcon = nativeImage.createFromPath(skipBackDarkIconPath);
const playDarkIcon = nativeImage.createFromPath(playDarkIconPath);
const pauseDarkIcon = nativeImage.createFromPath(pauseDarkIconPath);
const skipForwardDarkIcon = nativeImage.createFromPath(skipForwardDarkIconPath);

const manageTaskbarPlaybackButtonControls = (
  mainWindow: BrowserWindow,
  isPlaybackSupported = true,
  isPlaying: boolean
) => {
  if (mainWindow) {
    const isDarkMode = nativeTheme.shouldUseDarkColors;
    mainWindow.setThumbarButtons([
      {
        tooltip: 'Skip Back',
        icon: isDarkMode ? skipBackLightIcon : skipBackDarkIcon,
        flags: isPlaybackSupported ? undefined : ['disabled'],
        click() {
          console.log('Skip back button clicked');
          mainWindow.webContents.send('app/player/skipBackward');
        }
      },
      {
        tooltip: isPlaying ? 'Pause' : 'Play',
        // eslint-disable-next-line no-nested-ternary
        icon: isDarkMode
          ? isPlaying
            ? pauseLightIcon
            : playLightIcon
          : isPlaying
            ? pauseDarkIcon
            : playDarkIcon,
        flags: isPlaybackSupported ? undefined : ['disabled'],
        click: () => {
          console.log('Play button clicked');
          mainWindow.webContents.send('app/player/toggleSongPlaybackState');
        }
      },
      {
        tooltip: 'Skip forward',
        icon: isDarkMode ? skipForwardLightIcon : skipForwardDarkIcon,
        flags: isPlaybackSupported ? undefined : ['disabled'],
        click() {
          console.log('Skip forward button clicked');
          mainWindow.webContents.send('app/player/skipForward');
        }
      }
    ]);
  }
};

export default manageTaskbarPlaybackButtonControls;
