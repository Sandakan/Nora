/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/first */
/* eslint-disable default-param-last */
/* eslint-disable no-use-before-define */
/* eslint-disable global-require */
import path, { join } from 'path';
import os from 'os';
import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  shell,
  protocol,
  crashReporter,
  nativeTheme,
  Tray,
  Menu,
  nativeImage,
  OpenDialogOptions,
  powerMonitor,
  SaveDialogOptions,
  net,
  powerSaveBlocker,
  screen,
  Display
  // session
} from 'electron';
import debug from 'electron-debug';
// import { pathToFileURL } from 'url';

// import * as Sentry from '@sentry/electron';
import log from './log';
import {
  getSongsData,
  getUserData,
  setUserData as saveUserData,
  resetAppCache,
  setUserData
} from './filesystem';
import { version, appPreferences } from '../../package.json';
import { savePendingMetadataUpdates } from './updateSongId3Tags';
import addWatchersToFolders from './fs/addWatchersToFolders';

import addWatchersToParentFolders from './fs/addWatchersToParentFolders';
import manageTaskbarPlaybackButtonControls from './core/manageTaskbarPlaybackButtonControls';
import checkForStartUpSongs from './core/checkForStartUpSongs';
import checkForNewSongs from './core/checkForNewSongs';
import { changeAppTheme } from './core/changeAppTheme';
import { savePendingSongLyrics } from './saveLyricsToSong';
import { closeAllAbortControllers, saveAbortController } from './fs/controlAbortControllers';
import resetAppData from './resetAppData';
import { clearTempArtworkFolder } from './other/artworks';

import manageLastFmAuth from './auth/manageLastFmAuth';
import { initializeIPC } from './ipc';
import checkForUpdates from './update';
import { clearDiscordRpcActivity } from './other/discordRPC';
import { is } from '@electron-toolkit/utils';

import noraAppIcon from '../../resources/logo_light_mode.png?asset';

// / / / / / / / CONSTANTS / / / / / / / / /
const DEFAULT_APP_PROTOCOL = 'nora';

const MAIN_WINDOW_MIN_SIZE_X = 700;
const MAIN_WINDOW_MIN_SIZE_Y = 500;
const MAIN_WINDOW_MAX_SIZE_X = 10000;
const MAIN_WINDOW_MAX_SIZE_Y = 5000;
const MAIN_WINDOW_ASPECT_RATIO = 0;

const MAIN_WINDOW_DEFAULT_SIZE_X = 1280;
const MAIN_WINDOW_DEFAULT_SIZE_Y = 720;

const MINI_PLAYER_MIN_SIZE_X = 270;
const MINI_PLAYER_MIN_SIZE_Y = 200;
const MINI_PLAYER_MAX_SIZE_X = 510;
const MINI_PLAYER_MAX_SIZE_Y = 300;
const MINI_PLAYER_ASPECT_RATIO = 17 / 10;
const abortController = new AbortController();
const DEFAULT_OPEN_DIALOG_OPTIONS: OpenDialogOptions = {
  title: 'Select a Music Folder',
  buttonLabel: 'Add folder',
  filters: [
    {
      name: 'Audio Files',
      extensions: appPreferences.supportedMusicExtensions
    }
  ],
  properties: ['openDirectory', 'multiSelections']
};
const DEFAULT_SAVE_DIALOG_OPTIONS: SaveDialogOptions = {
  title: 'Select the destination to Save',
  buttonLabel: 'Save',
  properties: ['createDirectory', 'showOverwriteConfirmation']
};

// / / / / / / VARIABLES / / / / / / /
// eslint-disable-next-line import/no-mutable-exports
export let mainWindow: BrowserWindow;
let tray: Tray;
let playerType: PlayerTypes = 'normal';
// let isConnectedToInternet = false;
let isAudioPlaying = false;
let isOnBatteryPower = false;
let currentSongPath: string;
let powerSaveBlockerId: number | null;

// / / / / / / INITIALIZATION / / / / / / /

// Behaviour on second instance for parent process
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  log('Another app instance is currently active. Quitting this instance.', undefined, 'WARN');
  app.quit();
} else app.on('second-instance', handleSecondInstances);

export const IS_DEVELOPMENT = !app.isPackaged || process.env.NODE_ENV === 'development';

const appIcon = nativeImage.createFromPath(noraAppIcon);

// dotenv.config({ debug: true });
saveAbortController('main', abortController);

// Sentry.init({
//   dsn: import.meta.env.MAIN_VITE_SENTRY_DSN,
// });
// ? / / / / / / / / / / / / / / / / / / / / / / /
debug();
const APP_INFO = {
  environment: IS_DEVELOPMENT ? 'DEV' : 'PRODUCTION',
  appVersion: `v${version}`,
  systemInfo: {
    cpu: os.cpus()[0].model,
    os: os.release(),
    architechture: os.arch(),
    platform: os.platform(),
    totalMemory: `${os.totalmem()} (~${Math.floor(os.totalmem() / (1024 * 1024 * 1024))} GB)`
  }
};

log(`STARTING UP NORA`, APP_INFO, 'WARN');

const installExtensions = async () => {
  try {
    const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import(
      'electron-devtools-installer'
    );
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;

    const ext = await installExtension(REACT_DEVELOPER_TOOLS, {
      loadExtensionOptions: { allowFileAccess: true },
      forceDownload
    });
    log(`Added Extension: ${ext}`);
  } catch (error) {
    log(
      `====== ERROR OCCURRED WHEN TRYING TO INSTALL EXTENSIONS TO DEVTOOLS ======\nERROR : ${error}`
    );
  }
};

const getBackgroundColor = () => {
  const userData = getUserData();
  if (userData.theme.isDarkMode) return 'hsla(228, 7%, 14%, 100%)';
  return 'hsl(0, 0%, 100%)';
};

const createWindow = async () => {
  if (IS_DEVELOPMENT) await installExtensions();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 700,
    minHeight: 500,
    minWidth: 700,
    title: 'Nora',
    webPreferences: {
      zoomFactor: 0.9,
      preload: path.resolve(import.meta.dirname, '../preload/index.mjs')
    },
    visualEffectState: 'followWindow',
    roundedCorners: true,
    frame: false,
    backgroundColor: getBackgroundColor(),
    icon: appIcon,
    titleBarStyle: 'hidden',
    show: false
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
  mainWindow.once('ready-to-show', () => {
    if (app.hasSingleInstanceLock()) {
      log('Started checking for new songs during the application start.');
      checkForNewSongs();
      addWatchersToFolders();
      addWatchersToParentFolders();
    }
  });
  mainWindow.webContents.setWindowOpenHandler((data: { url: string }) => {
    shell.openExternal(data.url);
    return { action: 'deny' };
  });

  // mainWindow.on('closed', () => {
  //   // Dereference the window object
  //   mainWindow = null;
  // });
};

// protocol.registerSchemesAsPrivileged([
//   {
//     scheme: 'nora',
//     privileges: {
//       standard: true,
//       secure: true,
//       supportFetchAPI: true,
//       stream: true,
//       bypassCSP: true
//     }
//   }
// ])

app
  .whenReady()
  .then(async () => {
    const userData = getUserData();

    if (BrowserWindow.getAllWindows().length === 0) await createWindow();

    if (userData.windowState === 'maximized') mainWindow.maximize();

    if (!app.isDefaultProtocolClient(DEFAULT_APP_PROTOCOL)) {
      log('No default protocol registered. Starting the default protocol registration process.');
      const res = app.setAsDefaultProtocolClient(DEFAULT_APP_PROTOCOL);
      if (res) log('Default protocol registered successfully.');
      else log('Default protocol registration failed.');
    }

    // protocol.handle('nora', registerFileProtocol)

    // protocol.handle('nora', async (req) => {
    //   const { href } = new URL(req.url)

    //   const urlWithQueries = href.replace(/nora:[/\\]{1,2}localfiles[/\\]{1,2}/gm, '')
    //   const [url] = urlWithQueries.split('?')
    //   const fileUrl = pathToFileURL(url).toString()

    //   try {
    //     const res = await net.fetch(url)
    //     console.log('c')
    //     return res
    //   } catch (error) {
    //     log(
    //       `====== ERROR OCCURRED WHEN TRYING TO LOCATE A RESOURCE IN THE SYSTEM. =======\nREQUEST : ${urlWithQueries}\nFILE URL : ${fileUrl}\nERROR : ${error}`
    //     )
    //     return new Response('bad', {
    //       status: 400,
    //       headers: { 'content-type': 'text/html' }
    //     })
    //   }
    // })
    protocol.registerFileProtocol('nora', registerFileProtocol);

    tray = new Tray(appIcon);
    const trayContextMenu = Menu.buildFromTemplate([
      {
        label: 'Show/Hide Nora',
        type: 'normal',
        click: () => (mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()),
        role: 'hide'
      },
      { type: 'separator' },
      { label: 'Exit', type: 'normal', click: () => app.quit(), role: 'close' }
    ]);

    tray.setContextMenu(trayContextMenu);
    tray.setToolTip('Nora');

    tray.addListener('click', () => tray.popUpContextMenu(trayContextMenu));
    tray.addListener('double-click', () => {
      if (mainWindow.isVisible()) mainWindow.hide();
      else mainWindow.show();
    });

    // powerMonitor.addListener('shutdown', (e) => e.preventDefault());

    mainWindow.webContents.once('did-finish-load', manageWindowFinishLoad);

    app.on('before-quit', handleBeforeQuit);

    mainWindow.on('moved', manageAppMoveEvent);

    mainWindow.on('resized', () => {
      manageAppMoveEvent();
      manageAppResizeEvent();
    });

    mainWindow.on('maximize', () => recordWindowState('maximized'));

    mainWindow.on('minimize', () => recordWindowState('minimized'));

    mainWindow.on('unmaximize', () => recordWindowState('normal'));

    mainWindow.on('restore', () => recordWindowState('normal'));

    // app.setPath('crashDumps', path.join(app.getPath('userData'), 'crashDumps'));

    app.on('will-finish-launching', () => {
      crashReporter.start({ uploadToServer: false });
      log(`APP STARTUP COMMAND LINE ARGUMENTS\nARGS : [ ${process.argv.join(', ')} ]`);
    });

    mainWindow.webContents.addListener('zoom-changed', (_, dir) =>
      log(`Renderer zoomed ${dir}. ${mainWindow.webContents.getZoomLevel()}`)
    );

    // ? / / / / / / / / /  IPC RENDERER EVENTS  / / / / / / / / / / / /
    if (mainWindow) {
      initializeIPC(mainWindow, abortController.signal);
      checkForUpdates();
      //  / / / / / / / / / / / GLOBAL SHORTCUTS / / / / / / / / / / / / / /
      // globalShortcut.register('F5', () => {
      //   const isFocused = mainWindow.isFocused();
      //   log('USER REQUESTED RENDERER REFRESH USING GLOBAL SHORTCUT.', {
      //     isFocused,
      //   });
      //   if (isFocused) restartRenderer();
      // });

      globalShortcut.register('F12', () => {
        log('USER REQUESTED FOR DEVTOOLS USING GLOBAL SHORTCUT. - REQUEST WONT BE SERVED.');
        // mainWindow.webContents.openDevTools({ mode: 'detach', activate: true });
      });
    }
    return undefined;
  })
  .catch((err) => console.log(err));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// / / / / / / / / / / / / / / / / / / / / / / / / / / / /
function manageWindowFinishLoad() {
  const { windowDiamensions, windowPositions } = getUserData();
  if (windowPositions.mainWindow) {
    const { x, y } = windowPositions.mainWindow;
    mainWindow.setPosition(x, y, true);
  } else {
    mainWindow.center();
    const [x, y] = mainWindow.getPosition();
    saveUserData('windowPositions.mainWindow', { x, y });
  }

  if (windowDiamensions.mainWindow) {
    const { x, y } = windowDiamensions.mainWindow;
    mainWindow.setSize(x || MAIN_WINDOW_DEFAULT_SIZE_X, y || MAIN_WINDOW_DEFAULT_SIZE_Y, true);
  }

  mainWindow.show();
  manageWindowPositionInMonitor();

  if (IS_DEVELOPMENT) mainWindow.webContents.openDevTools({ mode: 'detach', activate: true });

  log(`STARTING UP THE RENDERER.`, undefined, 'WARN');

  manageTaskbarPlaybackButtonControls(mainWindow, true, false);

  nativeTheme.addListener('updated', () => {
    watchForSystemThemeChanges();
    manageTaskbarPlaybackButtonControls(mainWindow, true, isAudioPlaying);
  });
}

function handleBeforeQuit() {
  try {
    savePendingSongLyrics(currentSongPath, true);
    savePendingMetadataUpdates(currentSongPath, true);
    closeAllAbortControllers();
    clearTempArtworkFolder();
    clearDiscordRpcActivity();
    mainWindow.webContents.send('app/beforeQuitEvent');
    log(`QUITING NORA`, { uptime: `${Math.floor(process.uptime())} seconds` }, 'WARN');
  } catch (error) {
    console.log(error);
  }
}

export function toggleAudioPlayingState(isPlaying: boolean) {
  console.log(`Player playback status : ${isPlaying}`);
  isAudioPlaying = isPlaying;
  manageTaskbarPlaybackButtonControls(mainWindow, true, isPlaying);
}

export function toggleOnBatteryPower() {
  isOnBatteryPower = powerMonitor.isOnBatteryPower();
  mainWindow.webContents.send('app/isOnBatteryPower', isOnBatteryPower);
}

export function sendMessageToRenderer(props: MessageToRendererProps) {
  const { messageCode, data } = props;

  mainWindow.webContents.send('app/sendMessageToRendererEvent', messageCode, data);
}

let dataUpdateEventTimeOutId: NodeJS.Timeout;
let dataEventsCache: DataUpdateEvent[] = [];
export function dataUpdateEvent(
  dataType: DataUpdateEventTypes,
  data = [] as string[],
  message?: string
) {
  if (dataUpdateEventTimeOutId) clearTimeout(dataUpdateEventTimeOutId);
  log(
    `Data update event fired with updated '${dataType}'.${data.length > 0 || message ? '\n' : ''}${
      data.length > 0 ? `DATA : ${data}; ` : ''
    }${message ? `MESSAGE : ${data}; ` : ''}`
  );
  addEventsToCache(dataType, data, message);
  dataUpdateEventTimeOutId = setTimeout(() => {
    console.log(dataEventsCache);
    mainWindow.webContents.send('app/dataUpdateEvent', dataEventsCache, data, message);
    dataEventsCache = [];
  }, 1000);
}

function addEventsToCache(dataType: DataUpdateEventTypes, data = [] as string[], message?: string) {
  for (let i = 0; i < dataEventsCache.length; i += 1) {
    if (dataEventsCache[i].dataType === dataType) {
      if (data.length > 0 || message) {
        return dataEventsCache[i].eventData.push({ data, message });
      }
      return undefined;
    }
  }

  const obj = {
    dataType,
    eventData: data.length > 0 || message ? [{ data, message }] : []
  } as DataUpdateEvent;
  return dataEventsCache.push(obj);
}

function registerFileProtocol(request: { url: string }, callback: (arg: string) => void) {
  const urlWithQueries = decodeURI(request.url).replace(
    /nora:[/\\]{1,2}localfiles[/\\]{1,2}/gm,
    ''
  );

  try {
    const [url] = urlWithQueries.split('?');
    return callback(url);
  } catch (error) {
    log(
      `====== ERROR OCCURRED WHEN TRYING TO LOCATE A RESOURCE IN THE SYSTEM. =======\nREQUEST : ${urlWithQueries}\nERROR : ${error}`
    );
    return callback('404');
  }
}

export const setCurrentSongPath = (songPath: string) => {
  currentSongPath = songPath;
  savePendingSongLyrics(currentSongPath, false);
  savePendingMetadataUpdates(currentSongPath, true);
};

export const getCurrentSongPath = () => currentSongPath;

function manageAuthServices(url: string) {
  log('URL selected for auth service', { url });
  const { searchParams } = new URL(url);

  if (searchParams.has('service')) {
    if (searchParams.get('service') === 'lastfm') {
      const token = searchParams.get('token');
      if (token) return manageLastFmAuth(token);
    }
  }
  return undefined;
}

export async function showOpenDialog(openDialogOptions = DEFAULT_OPEN_DIALOG_OPTIONS) {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, openDialogOptions);

  if (canceled) {
    log('User cancelled the folder selection popup.');
    throw new Error('PROMPT_CLOSED_BEFORE_INPUT' as MessageCodes);
  }
  return filePaths;
}

export async function showSaveDialog(saveDialogOptions = DEFAULT_SAVE_DIALOG_OPTIONS) {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, saveDialogOptions);

  if (canceled) {
    log('User cancelled the folder selection popup.');
    throw new Error('PROMPT_CLOSED_BEFORE_INPUT' as MessageCodes);
  }
  return filePath;
}

function manageAppMoveEvent() {
  const [x, y] = mainWindow.getPosition();
  log(
    `User moved the ${
      playerType === 'mini'
        ? 'mini-player'
        : playerType === 'full'
          ? 'full-screen-player'
          : 'main-player'
    } window to (x: ${x}, y: ${y}) coordinates.`
  );
  if (playerType === 'mini') saveUserData('windowPositions.miniPlayer', { x, y });
  else if (playerType === 'normal') saveUserData('windowPositions.mainWindow', { x, y });
}

function manageAppResizeEvent() {
  const [x, y] = mainWindow.getSize();
  log(
    `User resized the ${
      playerType === 'mini'
        ? 'mini-player'
        : playerType === 'full'
          ? 'full-screen-player'
          : 'main-player'
    } to (x: ${x}, y: ${y}) diamensions.`
  );
  if (playerType === 'mini') saveUserData('windowDiamensions.miniPlayer', { x, y });
  else if (playerType === 'normal') saveUserData('windowDiamensions.mainWindow', { x, y });
}

async function handleSecondInstances(_: unknown, argv: string[]) {
  log('User requested for a second instance of the app.');
  if (app.hasSingleInstanceLock()) {
    if (mainWindow?.isMinimized()) mainWindow?.restore();
    mainWindow?.focus();
  }
  process.argv = argv;

  manageSecondInstanceArgs(argv);
  mainWindow?.webContents.send('app/playSongFromUnknownSource', await checkForStartUpSongs());
}

function manageSecondInstanceArgs(args: string[]) {
  for (const arg of args) {
    if (arg.includes('nora://auth')) return manageAuthServices(arg);
  }
  return undefined;
}

export function restartApp(reason: string, noQuitEvents = false) {
  log(`REQUESTED A FULL APP REFRESH.\nREASON : ${reason}`);

  if (!noQuitEvents) {
    mainWindow.webContents.send('app/beforeQuitEvent');
    savePendingSongLyrics(currentSongPath, true);
    savePendingMetadataUpdates(currentSongPath, true);
    closeAllAbortControllers();
  }
  app.relaunch();
  app.exit(0);
}

export async function revealSongInFileExplorer(songId: string) {
  const songs = getSongsData();

  for (let x = 0; x < songs.length; x += 1) {
    if (songs[x].songId === songId) return shell.showItemInFolder(songs[x].path);
  }
  return log(
    `Revealing song file in explorer failed because song couldn't be found in the library.`,
    { songId },
    'WARN',
    { sendToRenderer: { messageCode: 'OPEN_SONG_IN_EXPLORER_FAILED' } }
  );
}

const songsOutsideLibraryData: SongOutsideLibraryData[] = [];

export const getSongsOutsideLibraryData = () => songsOutsideLibraryData;

export const addToSongsOutsideLibraryData = (data: SongOutsideLibraryData) =>
  songsOutsideLibraryData.push(data);

export const updateSongsOutsideLibraryData = (
  songidOrPath: string,
  data: SongOutsideLibraryData
): void => {
  for (let i = 0; i < songsOutsideLibraryData.length; i += 1) {
    if (
      songsOutsideLibraryData[i].path === songidOrPath ||
      songsOutsideLibraryData[i].songId === songidOrPath
    ) {
      songsOutsideLibraryData[i] = data;
      return undefined;
    }
  }
  log(`songIdOrPath ${songidOrPath} does't exist on songsOutsideLibraryData.`, undefined, 'ERROR');
  throw new Error(`songIdOrPath ${songidOrPath} does't exist on songsOutsideLibraryData.`);
};

export async function getImagefileLocation() {
  const filePaths = await showOpenDialog({
    title: 'Select an Image',
    buttonLabel: 'Select Image',
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'webp', 'png'] }],
    properties: ['openFile']
  });
  return filePaths[0];
}

export async function getFolderLocation() {
  const folderPaths = await showOpenDialog({
    title: 'Select a Folder',
    buttonLabel: 'Select Folder',
    properties: ['createDirectory', 'openDirectory']
  });
  return folderPaths[0];
}

export async function resetApp(isRestartApp = true) {
  log('!-!-!-!-!-!  STARTED THE RESETTING PROCESS OF THE APP.  !-!-!-!-!-!');
  try {
    await mainWindow.webContents.session.clearStorageData();
    resetAppCache();
    await resetAppData();
    log(`########## SUCCESSFULLY RESETTED THE APP. RESTARTING THE APP NOW. ##########`);
    sendMessageToRenderer({ messageCode: 'RESET_SUCCESSFUL' });
  } catch (error) {
    sendMessageToRenderer({ messageCode: 'RESET_FAILED' });
    log(
      `====== ERROR OCCURRED WHEN RESETTING THE APP. RELOADING THE APP NOW.  ======\nERROR : ${error}`
    );
  } finally {
    log(`====== RELOADING THE ${isRestartApp ? 'APP' : 'RENDERER'} ======`);
    if (isRestartApp) restartApp('App resetted.');
    else mainWindow.webContents.reload();
  }
}

export function toggleMiniPlayerAlwaysOnTop(isMiniPlayerAlwaysOnTop: boolean) {
  if (mainWindow) {
    if (playerType === 'mini') mainWindow.setAlwaysOnTop(isMiniPlayerAlwaysOnTop);
    saveUserData('preferences.isMiniPlayerAlwaysOnTop', isMiniPlayerAlwaysOnTop);
  }
}

export async function getRendererLogs(
  mes: string | Error,
  data?: Record<string, unknown>,
  messageType: LogMessageTypes = 'INFO',
  forceWindowRestart = false,
  forceMainRestart = false
) {
  log(mes, data, messageType, undefined, 'UI');

  if (forceWindowRestart) return mainWindow.reload();
  if (forceMainRestart) {
    app.relaunch();
    return app.exit();
  }
  return undefined;
}

function recordWindowState(state: WindowState) {
  log(`Window state changed`, { state });
  setUserData('windowState', state);
}

export function restartRenderer() {
  mainWindow.webContents.send('app/beforeQuitEvent');
  mainWindow.reload();
  if (playerType !== 'normal') {
    changePlayerType('normal');
    log('APP TOGGLED BACK TO THE MAIN WINDOW DUE TO AN APP REFRESH.');
  }
}

function watchForSystemThemeChanges() {
  // This event only occurs when system theme changes
  const userData = getUserData();
  const { useSystemTheme } = userData.theme;

  const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  if (IS_DEVELOPMENT && useSystemTheme)
    sendMessageToRenderer({ messageCode: 'APP_THEME_CHANGE', data: { theme } });

  if (useSystemTheme) changeAppTheme('system');
  else log(`System theme changed to ${theme}`);
}

export function changePlayerType(type: PlayerTypes) {
  if (mainWindow) {
    log(`Changed to '${type}-player' type.`);
    playerType = type;
    const { windowPositions, windowDiamensions, preferences } = getUserData();
    if (type === 'mini') {
      if (mainWindow.fullScreen) mainWindow.setFullScreen(false);

      mainWindow.setMaximumSize(MINI_PLAYER_MAX_SIZE_X, MINI_PLAYER_MAX_SIZE_Y);
      mainWindow.setMinimumSize(MINI_PLAYER_MIN_SIZE_X, MINI_PLAYER_MIN_SIZE_Y);
      mainWindow.setAlwaysOnTop(preferences.isMiniPlayerAlwaysOnTop ?? false);
      if (windowDiamensions.miniPlayer) {
        const { x, y } = windowDiamensions.miniPlayer;
        mainWindow.setSize(x, y, true);
      } else mainWindow.setSize(MINI_PLAYER_MIN_SIZE_X, MINI_PLAYER_MIN_SIZE_Y, true);
      if (windowPositions.miniPlayer) {
        const { x, y } = windowPositions.miniPlayer;
        mainWindow.setPosition(x, y, true);
      } else {
        mainWindow.center();
        const [x, y] = mainWindow.getPosition();
        saveUserData('windowPositions.miniPlayer', { x, y });
      }
      mainWindow.setAspectRatio(MINI_PLAYER_ASPECT_RATIO);
    } else if (type === 'normal') {
      mainWindow.setMaximumSize(MAIN_WINDOW_MAX_SIZE_X, MAIN_WINDOW_MAX_SIZE_Y);
      mainWindow.setMinimumSize(MAIN_WINDOW_MIN_SIZE_X, MAIN_WINDOW_MIN_SIZE_Y);
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setFullScreen(false);

      if (windowDiamensions.mainWindow) {
        const { x, y } = windowDiamensions.mainWindow;
        mainWindow.setSize(x, y, true);
      } else mainWindow.setSize(MAIN_WINDOW_DEFAULT_SIZE_X, MAIN_WINDOW_DEFAULT_SIZE_Y, true);
      if (windowPositions.mainWindow) {
        const { x, y } = windowPositions.mainWindow;
        mainWindow.setPosition(x, y, true);
      } else {
        mainWindow.center();
        const [x, y] = mainWindow.getPosition();
        saveUserData('windowPositions.mainWindow', { x, y });
      }
      mainWindow.setAspectRatio(MAIN_WINDOW_ASPECT_RATIO);
    } else {
      mainWindow.setMaximumSize(MAIN_WINDOW_MAX_SIZE_X, MAIN_WINDOW_MAX_SIZE_Y);
      mainWindow.setMinimumSize(MAIN_WINDOW_MIN_SIZE_X, MAIN_WINDOW_MIN_SIZE_Y);
      mainWindow.setFullScreen(true);
    }
  }
}

function manageWindowOnDisplayMetricsChange(primaryDisplay: Display) {
  const currentDisplay = screen.getDisplayMatching(mainWindow.getBounds());
  if (!currentDisplay || currentDisplay.id !== primaryDisplay.id) {
    mainWindow.setPosition(primaryDisplay.workArea.x, primaryDisplay.workArea.y);
  }
}

function manageWindowPositionInMonitor() {
  const primaryDisplay = screen.getPrimaryDisplay();
  manageWindowOnDisplayMetricsChange(primaryDisplay);

  // Event listener for display change events
  screen.on('display-metrics-changed', () => manageWindowOnDisplayMetricsChange(primaryDisplay));
}

export async function toggleAutoLaunch(autoLaunchState: boolean) {
  const options = app.getLoginItemSettings();
  const userData = getUserData();
  const openAsHidden = userData?.preferences?.openWindowAsHiddenOnSystemStart ?? false;

  log(`AUTO LAUNCH STATE : ${options.openAtLogin}`);

  app.setLoginItemSettings({
    openAtLogin: autoLaunchState,
    name: 'Nora',
    openAsHidden
  });

  saveUserData('preferences.autoLaunchApp', autoLaunchState);
}

export const checkIfConnectedToInternet = () => net.isOnline();

export function allowScreenSleeping() {
  log('Requested to allow screen sleeping.');
  if (powerSaveBlockerId) {
    powerSaveBlocker.stop(powerSaveBlockerId);
    powerSaveBlockerId = null;
  }
}

export function stopScreenSleeping() {
  allowScreenSleeping();
  powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep');
  log('Screen sleeping prevented.', { powerSaveBlockerId });
}
