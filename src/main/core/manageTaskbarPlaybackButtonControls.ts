import { BrowserWindow, nativeImage, nativeTheme } from 'electron';
import getAssetPath from '../utils/getAssetPath';

const skipBackLightIcon = nativeImage.createFromPath(
  getAssetPath(
    'images',
    'taskbar buttons',
    'baseline_skip_previous_white_24dp.png'
  )
);
const playLightIcon = nativeImage.createFromPath(
  getAssetPath(
    'images',
    'taskbar buttons',
    'baseline_play_arrow_white_24dp.png'
  )
);
const pauseLightIcon = nativeImage.createFromPath(
  getAssetPath('images', 'taskbar buttons', 'outline_pause_white_24dp.png')
);
const skipForwardLightIcon = nativeImage.createFromPath(
  getAssetPath('images', 'taskbar buttons', 'baseline_skip_next_white_24dp.png')
);
const skipBackDarkIcon = nativeImage.createFromPath(
  getAssetPath(
    'images',
    'taskbar buttons',
    'baseline_skip_previous_black_24dp.png'
  )
);
const playDarkIcon = nativeImage.createFromPath(
  getAssetPath(
    'images',
    'taskbar buttons',
    'baseline_play_arrow_black_24dp.png'
  )
);
const pauseDarkIcon = nativeImage.createFromPath(
  getAssetPath('images', 'taskbar buttons', 'outline_pause_black_24dp.png')
);
const skipForwardDarkIcon = nativeImage.createFromPath(
  getAssetPath('images', 'taskbar buttons', 'baseline_skip_next_black_24dp.png')
);
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
        },
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
        },
      },
      {
        tooltip: 'Skip forward',
        icon: isDarkMode ? skipForwardLightIcon : skipForwardDarkIcon,
        flags: isPlaybackSupported ? undefined : ['disabled'],
        click() {
          console.log('Skip forward button clicked');
          mainWindow.webContents.send('app/player/skipForward');
        },
      },
    ]);
  }
};

export default manageTaskbarPlaybackButtonControls;
