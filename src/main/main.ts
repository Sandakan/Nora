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
  powerMonitor,
  net,
  powerSaveBlocker,
  screen,
  session as electronSession,
  type OpenDialogOptions,
  type SaveDialogOptions,
  type Display
} from 'electron';

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
import changeAppTheme from './core/changeAppTheme';
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
import logger from './logger';
import roundTo from '../common/roundTo';
// import { fileURLToPath, pathToFileURL } from 'url';
import { closeDatabaseInstance } from './db/db';
import { pathToFileURL } from 'url';
import { stat } from 'fs/promises';

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
  logger.warn('Another app instance is currently active. Quitting this instance.');
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
// debug();
const BYTES_TO_GB = 1024 * 1024 * 1024;
const APP_INFO = {
  environment: IS_DEVELOPMENT ? 'DEV' : 'PRODUCTION',
  appVersion: `v${version}`,
  systemInfo: {
    cpu: os.cpus()[0].model.trim(),
    os: os.release(),
    architechture: os.arch(),
    platform: os.platform(),
    totalMemory: `${os.totalmem()} (${roundTo(os.totalmem() / BYTES_TO_GB, 2)} GB)`
  }
};

logger.debug(`Starting up Nora`, { APP_INFO });

function launchExtensionBackgroundWorkers(session = electronSession.defaultSession) {
  return Promise.all(
    session.extensions.getAllExtensions().map(async (extension) => {
      const manifest = extension.manifest;
      if (manifest.manifest_version === 3 && manifest?.background?.service_worker) {
        await session.serviceWorkers.startWorkerForScope(extension.url);
      }
    })
  );
}

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
    logger.debug(`Added Extension: ${ext}`);
    await launchExtensionBackgroundWorkers();
  } catch (error) {
    logger.error(`Failed to install extensions to devtools`, { error });
  }
};

export const getBackgroundColor = () => {
  const userData = getUserData();
  if (userData.theme.isDarkMode) return '#212226';
  return '#FFFFFF';
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
    mainWindow.loadFile(join(import.meta.dirname, '../renderer/index.html'));
  }
  mainWindow.once('ready-to-show', () => {
    if (app.hasSingleInstanceLock()) {
      logger.info('Started checking for new songs during the application start.');
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

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'nora',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true
    }
  }
]);

app
  .whenReady()
  .then(async () => {
    const userData = getUserData();

    if (BrowserWindow.getAllWindows().length === 0) await createWindow();

    if (userData.windowState === 'maximized') mainWindow.maximize();

    if (!app.isDefaultProtocolClient(DEFAULT_APP_PROTOCOL)) {
      logger.info(
        'No default protocol registered. Starting the default protocol registration process.'
      );
      const res = app.setAsDefaultProtocolClient(DEFAULT_APP_PROTOCOL);

      if (res) logger.info('Default protocol registered successfully.');
      else logger.warn('Default protocol registration failed.');
    }

    // protocol.registerFileProtocol('nora', registerFileProtocol);
    protocol.handle('nora', handleFileProtocol);

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

    app.on('will-quit', closeDatabaseInstance);

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
      logger.debug(`App startup command line arguments`, { args: process.argv });
    });

    mainWindow.webContents.addListener('zoom-changed', (_, dir) =>
      logger.debug(`Renderer zoomed ${dir}. ${mainWindow.webContents.getZoomLevel()}`)
    );

    // ? / / / / / / / / /  IPC RENDERER EVENTS  / / / / / / / / / / / /
    if (mainWindow) {
      initializeIPC(mainWindow, abortController.signal);
      checkForUpdates();
      //  / / / / / / / / / / / GLOBAL SHORTCUTS / / / / / / / / / / / / / /
      // globalShortcut.register('F5', () => {
      //   const isFocused = mainWindow.isFocused();
      //   logger('USER REQUESTED RENDERER REFRESH USING GLOBAL SHORTCUT.', {
      //     isFocused,
      //   });
      //   if (isFocused) restartRenderer();
      // });

      globalShortcut.register('F12', () => {
        logger.debug('User requested for devtools using global shortcut. Request wont be served.');
        // mainWindow.webContents.openDevTools({ mode: 'detach', activate: true });
      });
    }
    return undefined;
  })
  .catch((error) => logger.error('Error occurred when starting the app.', { error }));

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

  logger.debug(`Starting up the renderer.`);

  manageTaskbarPlaybackButtonControls(mainWindow, true, false);

  nativeTheme.addListener('updated', () => {
    watchForSystemThemeChanges();
    manageTaskbarPlaybackButtonControls(mainWindow, true, isAudioPlaying);
  });
}

let asyncOperationDone = false;
async function handleBeforeQuit() {
  if (!asyncOperationDone) {
    try {
      try {
        await clearDiscordRpcActivity();
      } catch (error) {
        logger.error('Optional cleanup functions failed when quiting the app.', { error });
      }

      savePendingSongLyrics(currentSongPath, true);
      savePendingMetadataUpdates(currentSongPath, true);
      closeAllAbortControllers();
      clearTempArtworkFolder();
      mainWindow.webContents.send('app/beforeQuitEvent');
      await closeDatabaseInstance();

      logger.debug(`Quiting Nora`, { uptime: `${Math.floor(process.uptime())} seconds` });
      asyncOperationDone = true;
    } catch (error) {
      asyncOperationDone = true;
      console.error(error);
      logger.error('Error occurred when quiting the app.', { error });
    }
  }
}

export function toggleAudioPlayingState(isPlaying: boolean) {
  logger.debug(`Player playback status : ${isPlaying}`, { isPlaying });
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
  logger.debug(`Data update event fired.`, { dataType, data, message });
  addEventsToCache(dataType, data, message);
  dataUpdateEventTimeOutId = setTimeout(() => {
    logger.verbose('Data Events Cache', { dataEventsCache });
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
    logger.error(`Failed to locate a resource in the system.`, { urlWithQueries, error });
    return callback('404');
  }
}

// const handleFileProtocol = async (request: GlobalRequest): Promise<GlobalResponse> => {
//   try {
//     const urlWithQueries = decodeURI(request.url).replace(
//       /(nora:[\/\\]{1,2}localfiles[\/\\]{1,2})|(\?ts\=\d+$)?/gm,
//       ''
//     );
//     let [fileDir] = urlWithQueries.split('?');

//     if (os.platform() === 'darwin') fileDir = '/' + fileDir;

//     // logger.verbose('Serving file from nora://', { filePath });

//     const asFileUrl = pathToFileURL(fileDir).toString();
//     const filePath = fileURLToPath(asFileUrl);

//     if (filePath.startsWith('..')) {
//       return new Response('Invalid URL (not absolute)', {
//         status: 400
//       });
//     }

//     const rangeHeader = request.headers.get('Range');
//     let response;
//     if (!rangeHeader) {
//       response = await net.fetch(asFileUrl);
//     } else {
//       response = await net.fetch(asFileUrl, {
//         headers: {
//           Range: rangeHeader
//         }
//       });
//     }

//     response.headers.set('X-Content-Type-Options', 'nosniff');

//     return response;
//   } catch (error) {
//     logger.error('Error handling media protocol:', { error });
//     return new Response('Internal Server Error', { status: 500 });
//   }
// };

const handleFileProtocol = async (req: GlobalRequest) => {
  try {
    logger.debug('Serving file from nora://', { url: req.url });
    const { pathname } = new URL(req.url);
    const filePath = decodeURI(pathname).replace(/^[/\\]{1,2}/gm, '');

    const pathToServe = path.resolve(import.meta.dirname, filePath);
    // const relativePath = path.relative(import.meta.dirname, pathToServe);
    // const isSafe = relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);

    // if (!isSafe) {
    //   return new Response('bad', {
    //     status: 400,
    //     headers: { 'content-type': 'text/html' }
    //   });
    // }

    const fileUrl = pathToFileURL(pathToServe).toString();
    const stats = await stat(pathToServe);
    req.headers.append('Content-Length', stats.size.toString());
    const res = await net.fetch(fileUrl, req);
    res.headers.append('Content-Length', stats.size.toString());

    return res;
  } catch (error) {
    logger.error('Error handling media protocol:', { error });
    return new Response('Internal Server Error', { status: 500 });
  }
};

export const setCurrentSongPath = (songPath: string) => {
  currentSongPath = songPath;
  savePendingSongLyrics(currentSongPath, false);
  savePendingMetadataUpdates(currentSongPath, true);
};

export const getCurrentSongPath = () => currentSongPath;

function manageAuthServices(url: string) {
  logger.debug('URL selected for auth service', { url });
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
    logger.debug('User cancelled the folder selection popup.');
    throw new Error('PROMPT_CLOSED_BEFORE_INPUT' as MessageCodes);
  }
  return filePaths;
}

export async function showSaveDialog(saveDialogOptions = DEFAULT_SAVE_DIALOG_OPTIONS) {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, saveDialogOptions);

  if (canceled) {
    logger.debug('User cancelled the folder selection popup.');
    throw new Error('PROMPT_CLOSED_BEFORE_INPUT' as MessageCodes);
  }
  return filePath;
}

function manageAppMoveEvent() {
  const [x, y] = mainWindow.getPosition();
  logger.debug(`User moved the player`, { playerType, coordinates: { x, y } });
  if (playerType === 'mini') saveUserData('windowPositions.miniPlayer', { x, y });
  else if (playerType === 'normal') saveUserData('windowPositions.mainWindow', { x, y });
}

function manageAppResizeEvent() {
  const [x, y] = mainWindow.getSize();
  logger.debug(`User resized the player`, { playerType, coordinates: { x, y } });
  if (playerType === 'mini') saveUserData('windowDiamensions.miniPlayer', { x, y });
  else if (playerType === 'normal') saveUserData('windowDiamensions.mainWindow', { x, y });
}

async function handleSecondInstances(_: unknown, argv: string[]) {
  logger.debug('User requested for a second instance of the app.');
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
  logger.debug(`Requested a full app refresh.`, { reason });

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

  logger.warn(
    `Revealing song file in explorer failed because song couldn't be found in the library.`,
    { songId }
  );
  return sendMessageToRenderer({ messageCode: 'OPEN_SONG_IN_EXPLORER_FAILED' });
}

const songsOutsideLibraryData: AudioPlayerData[] = [];

export const getSongsOutsideLibraryData = () => songsOutsideLibraryData;

export const addToSongsOutsideLibraryData = (data: AudioPlayerData) =>
  songsOutsideLibraryData.push(data);

export const updateSongsOutsideLibraryData = (
  songidOrPath: string,
  data: AudioPlayerData
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

  const errMessage = `songIdOrPath didn't exist on songsOutsideLibraryData.`;
  logger.error(errMessage, { songidOrPath, songsOutsideLibraryData });
  throw new Error(errMessage);
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
  logger.debug('Started the resetting process of the app.');
  try {
    await mainWindow.webContents.session.clearStorageData();
    resetAppCache();
    await resetAppData();
    logger.debug(`Successfully reset the app. Restarting the app now.`);
    sendMessageToRenderer({ messageCode: 'RESET_SUCCESSFUL' });
  } catch (error) {
    sendMessageToRenderer({ messageCode: 'RESET_FAILED' });
    logger.error(`Error occurred when resetting the app. Reloading the app now.`, { error });
  } finally {
    logger.debug(`Reloading the ${isRestartApp ? 'app' : 'renderer'}`);
    if (isRestartApp) restartApp('App reset.');
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
  const message = typeof mes === 'string' ? mes : mes.message;
  const type = messageType.toLowerCase() as Lowercase<LogMessageTypes>;

  logger[type](message, { data });

  if (forceWindowRestart) return mainWindow.reload();
  if (forceMainRestart) {
    app.relaunch();
    return app.exit();
  }
  return undefined;
}

function recordWindowState(state: WindowState) {
  logger.debug(`Window state changed`, { state });
  setUserData('windowState', state);
}

export function restartRenderer() {
  mainWindow.webContents.send('app/beforeQuitEvent');
  mainWindow.reload();
  if (playerType !== 'normal') {
    changePlayerType('normal');
    logger.debug('App toggled back to the main window due to an app refresh.');
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
  else logger.debug(`System theme changed`, { theme });
}

export function changePlayerType(type: PlayerTypes) {
  if (mainWindow) {
    logger.debug(`Changed player type.`, { type });
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

  logger.debug(`Auto launch state changed`, { openAtLogin: options.openAtLogin });

  app.setLoginItemSettings({
    openAtLogin: autoLaunchState,
    name: 'Nora',
    openAsHidden
  });

  saveUserData('preferences.autoLaunchApp', autoLaunchState);
}

export const checkIfConnectedToInternet = () => net.isOnline();

export function allowScreenSleeping() {
  logger.debug('Requested to allow screen sleeping.');
  if (powerSaveBlockerId) {
    powerSaveBlocker.stop(powerSaveBlockerId);
    powerSaveBlockerId = null;
  }
}

export function stopScreenSleeping() {
  allowScreenSleeping();
  powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep');
  logger.debug('Screen sleeping prevented.', { powerSaveBlockerId });
}
