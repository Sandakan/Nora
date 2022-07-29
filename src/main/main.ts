/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable global-require */
/* eslint-disable promise/no-promise-in-callback */
/* eslint-disable promise/no-callback-in-promise */
/* eslint-disable no-console */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable promise/catch-or-return */
/* eslint-disable consistent-return */
/* eslint-disable promise/no-nesting */
/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/return-await */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable promise/always-return */
/* eslint-disable no-else-return */
import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  globalShortcut,
  shell,
  protocol,
  crashReporter,
  nativeImage,
  // nativeTheme,
} from 'electron';
import path from 'path';
import { rm, unlink } from 'fs/promises';
import * as musicMetaData from 'music-metadata';
// import { FixedSizeList } from 'react-window';
import songLyrics, { TLyrics } from 'songlyrics';
import httpsGet from 'simple-get';
import nodeVibrant from 'node-vibrant';
import AutoLaunch from 'auto-launch';
import os from 'os';
// import m3uReader from 'm3u8-reader';
// import fs from 'fs';

import log from './log';
import {
  getUserData,
  setUserData as saveUserData,
  getData,
  getFiles,
  setData,
  getPlaylistData,
  setPlaylistData,
  checkForNewSongs,
  updateSongListeningRate,
  removeAMusicFolder,
  removeSongFromLibrary,
  deleteSongFromSystem,
  restoreBlacklistedSong,
  resetAppCache,
} from './filesystem';
import { parseSong } from './parseSong';
import { generateRandomId } from './randomId';
import { resolveHtmlPath } from './util';
import sortSongs from '../renderer/utils/sortSongs';
import { updateSongId3Tags, getSongId3Tags } from './updateSongId3Tags';
import { version, appPreferences } from '../../package.json';
import { search } from './search';

// / / / / / / CONSTANTS / / / / / / / / / /
const MAIN_WINDOW_MIN_SIZE_X = 700;
const MAIN_WINDOW_MIN_SIZE_Y = 500;
const MAIN_WINDOW_MAX_SIZE_X = 10000;
const MAIN_WINDOW_MAX_SIZE_Y = 5000;
const MINI_PLAYER_MIN_SIZE_X = 250;
const MINI_PLAYER_MIN_SIZE_Y = 250;
const MINI_PLAYER_MAX_SIZE_X = 350;
const MINI_PLAYER_MAX_SIZE_Y = 350;
const MAIN_WINDOW_DEFAULT_SIZE_X = 1280;
const MAIN_WINDOW_DEFAULT_SIZE_Y = 720;
let mainWindow: BrowserWindow;
let isMiniPlayer = false;
let isConnectedToInternet = false;
const autoLauncher = new AutoLaunch({ name: 'Oto Music for Desktop' });

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

export const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

/** Returns the path of the specified asset relative to assets folder. */
export const getAssetPath = (...paths: string[]): string =>
  path.join(RESOURCES_PATH, ...paths);

// ? / / / / / / / / / / / / / / / / / / / / / / /
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
isDevelopment && require('electron-debug')();

log(
  `########## STARTING UP OTO MUSIC FOR DESKTOP ##########\nAPPINFO : version : v${version};\nSYSINFO : cpu: ${
    os.cpus()[0].model
  }; os: ${os.release()}; architecture: ${os.arch()}; platform: ${os.platform()}; totalMemory: ${os.totalmem()} (~${Math.floor(
    os.totalmem() / (1024 * 1024 * 1024)
  )} GB);\nENVIRONMENT : ${isDevelopment ? 'DEV' : 'PRODUCTION'};`
);

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch((err: unknown) =>
      log(
        `====== ERROR OCCURRED WHEN TRYING TO INSTALL EXTENSIONS TO DEVTOOLS ======\nERROR : ${err}`
      )
    );
};

const createWindow = async () => {
  if (isDevelopment) {
    installExtensions();
  }
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 700,
    minHeight: 500,
    minWidth: 700,
    title: 'Oto Music for Desktop',
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      devTools: isDevelopment,
    },
    visualEffectState: 'followWindow',
    roundedCorners: true,
    frame: false,
    backgroundColor: '#212226',
    icon: getAssetPath('images', 'logo_light_mode.ico'),
    titleBarStyle: 'hidden',
    show: false,
  });
  mainWindow.webContents.openDevTools({
    mode: 'detach',
  });
  mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow.once('ready-to-show', () => {
    log('Started checking for new songs during the application start.');
    checkForNewSongs();
  });
  mainWindow.webContents.setWindowOpenHandler((edata: { url: string }) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

app.setPath('crashDumps', path.join(app.getPath('userData'), 'crashDumps'));

app.on('will-finish-launching', () => {
  crashReporter.start({ uploadToServer: false });
  console.log(process.argv);
});

app.whenReady().then(() => {
  protocol.registerFileProtocol(
    'otomusic',
    (request: { url: string }, callback: (arg0: string) => any) => {
      const url = decodeURI(request.url).replace('otomusic://localFiles/', '');
      try {
        return callback(url);
      } catch (error) {
        log(
          `====== ERROR OCCURRED WHEN TRYING TO LOCATE A RESOURCE IN THE SYSTEM. =======\nREQUEST : ${url}\nERROR : ${error}`
        );
        return callback('404');
      }
    }
  );
  createWindow();
  mainWindow.webContents.once('did-finish-load', () => {
    const userData = getUserData();
    if (userData.windowPositions.mainWindow) {
      const { x, y } = userData.windowPositions.mainWindow;
      mainWindow.setPosition(x, y, true);
    } else {
      mainWindow.center();
      const [x, y] = mainWindow.getPosition();
      saveUserData('windowPositions.mainWindow', { x, y });
    }
    mainWindow.show();
    log(`########## STARTING UP THE RENDERER. ##########`);
    manageTaskbarPlaybackControls(true, false);
    // nativeTheme.addListener('updated', () => {
    //   sendMessageToRenderer(
    //     `System theme changed to ${nativeTheme.themeSource}`
    //   );
    // });
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('before-quit', () => {
    mainWindow.webContents.send('app/beforeQuitEvent');
    log(
      `########## QUITING OTO MUSIC FOR DESKTOP ########## \nUPTIME : ${Math.floor(
        process.uptime()
      )} seconds`
    );
  });

  if (!app.requestSingleInstanceLock()) app.quit();

  // Behaviour on second instance for parent process- Pretty much optional
  app.on('second-instance', () => {
    log('User requested for a second instance of the app.');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  const manageAppMoveEvent = () => {
    const [x, y] = mainWindow.getPosition();
    log(
      `User moved the ${
        isMiniPlayer ? 'mini-player' : 'main window'
      } to (x: ${x}, y: ${y}) coordinates.`
    );
    if (isMiniPlayer) saveUserData('windowPositions.miniPlayer', { x, y });
    else saveUserData('windowPositions.mainWindow', { x, y });
  };

  mainWindow.on('moved', manageAppMoveEvent);

  const manageAppResizeEvent = () => {
    const [x, y] = mainWindow.getSize();
    log(
      `User resized the ${
        isMiniPlayer ? 'mini-player' : 'main window'
      } to (x: ${x}, y: ${y}) diamensions.`
    );
    if (isMiniPlayer) saveUserData('windowDiamensions.miniPlayer', { x, y });
    else saveUserData('windowDiamensions.mainWindow', { x, y });
  };

  mainWindow.on('resized', () => {
    manageAppMoveEvent();
    manageAppResizeEvent();
  });

  const toggleMiniPlayerAlwaysOnTop = (isMiniPlayerAlwaysOnTop: boolean) => {
    const userData = getUserData();
    if (isMiniPlayer) {
      mainWindow.setAlwaysOnTop(isMiniPlayerAlwaysOnTop);
    }
    userData.preferences.isMiniPlayerAlwaysOnTop = isMiniPlayerAlwaysOnTop;
    saveUserData(
      'preferences.isMiniPlayerAlwaysOnTop',
      isMiniPlayerAlwaysOnTop
    );
  };

  const toggleMiniPlayer = (isMiniPlayerActive: boolean) => {
    log(
      `Toggled the mini-player to be ${
        isMiniPlayerActive ? 'enabled' : 'disabled'
      }.`
    );
    isMiniPlayer = isMiniPlayerActive;
    const { windowPositions, windowDiamensions, preferences } = getUserData();
    if (isMiniPlayerActive) {
      mainWindow.setMaximumSize(MINI_PLAYER_MAX_SIZE_X, MINI_PLAYER_MAX_SIZE_Y);
      mainWindow.setMinimumSize(MINI_PLAYER_MIN_SIZE_X, MINI_PLAYER_MIN_SIZE_Y);
      mainWindow.setAlwaysOnTop(preferences.isMiniPlayerAlwaysOnTop ?? false);
      if (windowDiamensions.miniPlayer) {
        const { x, y } = windowDiamensions.miniPlayer;
        mainWindow.setSize(x, y, true);
      } else
        mainWindow.setSize(
          MINI_PLAYER_MIN_SIZE_X,
          MINI_PLAYER_MIN_SIZE_Y,
          true
        );
      if (windowPositions.miniPlayer) {
        const { x, y } = windowPositions.miniPlayer;
        mainWindow.setPosition(x, y, true);
      } else {
        mainWindow.center();
        const [x, y] = mainWindow.getPosition();
        saveUserData('windowPositions.miniPlayer', { x, y });
      }
    } else {
      mainWindow.setMaximumSize(MAIN_WINDOW_MAX_SIZE_X, MAIN_WINDOW_MAX_SIZE_Y);
      mainWindow.setMinimumSize(MAIN_WINDOW_MIN_SIZE_X, MAIN_WINDOW_MIN_SIZE_Y);
      mainWindow.setAlwaysOnTop(false);
      if (windowDiamensions.mainWindow) {
        const { x, y } = windowDiamensions.mainWindow;
        mainWindow.setSize(x, y, true);
      } else
        mainWindow.setSize(
          MAIN_WINDOW_DEFAULT_SIZE_X,
          MAIN_WINDOW_DEFAULT_SIZE_Y,
          true
        );
      if (windowPositions.mainWindow) {
        const { x, y } = windowPositions.mainWindow;
        mainWindow.setPosition(x, y, true);
      } else {
        mainWindow.center();
        const [x, y] = mainWindow.getPosition();
        saveUserData('windowPositions.mainWindow', { x, y });
      }
    }
  };

  const restartRenderer = () => {
    mainWindow.webContents.send('app/beforeQuitEvent');
    mainWindow.reload();
    if (isMiniPlayer) {
      toggleMiniPlayer(false);
      log('APP TOGGLED BACK TO THE MAIN WINDOW DUE TO AN APP REFRESH.');
    }
  };

  // ? / / / / / / / / /  IPC RENDERER EVENTS  / / / / / / / / / / / /

  ipcMain.on('app/close', () => app.quit());

  ipcMain.on('app/minimize', () => mainWindow.minimize());

  ipcMain.on('app/toggleMaximize', () =>
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
  );

  ipcMain.on(
    'app/player/songPlaybackStateChange',
    (_: unknown, isPlaying: boolean) => {
      console.log(`Player playback status : ${isPlaying}`);
      manageTaskbarPlaybackControls(true, isPlaying);
    }
  );
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('app/focused');
    mainWindow.flashFrame(false);
  });
  mainWindow.on('blur', () => mainWindow.webContents.send('app/blurred'));

  ipcMain.on('app/getSongPosition', (_event: unknown, position: number) =>
    saveUserData('currentSong.stoppedPosition', position)
  );

  ipcMain.on('app/incrementNoOfSongListens', (_: unknown, songId: string) =>
    incrementNoOfSongListens(songId)
  );

  ipcMain.handle('app/addMusicFolder', (_, sortType: SongSortTypes) =>
    addMusicFolder(sortType)
  );

  ipcMain.handle('app/getSong', (_event: unknown, id: string) =>
    sendAudioData(id)
  );

  ipcMain.handle(
    'app/toggleLikeSong',
    (_e: unknown, songId: string, likeSong: boolean) =>
      toggleLikeSong(songId, likeSong)
  );

  ipcMain.handle(
    'app/getAllSongs',
    (
      _,
      sortType?: SongSortTypes,
      pageNo?: number,
      maxResultsPerPage?: number
    ) => getAllSongs(sortType, pageNo, maxResultsPerPage)
  );

  ipcMain.handle(
    'app/saveUserData',
    async (_event: unknown, dataType: UserDataTypes, data: string) =>
      saveUserData(dataType, data)
  );

  ipcMain.handle('app/getUserData', () => getUserData());

  ipcMain.handle(
    'app/search',
    (_, searchFilters: SearchFilters, value: string) =>
      search(searchFilters, value)
  );

  ipcMain.handle(
    'app/getSongLyrics',
    async (_e: unknown, songTitle: string, songArtists?: string[]) =>
      await sendSongLyrics(songTitle, songArtists)
  );

  ipcMain.handle(
    'app/fetchSongLyricsFromNet',
    (_e: unknown, songTitle: string, songArtists?: string[]) =>
      songLyrics(`${songTitle} ${songArtists ? songArtists.join(', ') : ''}`)
  );

  ipcMain.handle(
    'app/getSongInfo',
    (
      _e: unknown,
      songIds: string[],
      sortType?: SongSortTypes,
      limit?: number
    ) => getSongInfo(songIds, sortType, limit)
  );

  ipcMain.on(
    'app/savePageSortState',
    (_, pageType: PageSortTypes, state: unknown) => {
      saveUserData(pageType, state);
    }
  );

  ipcMain.on('app/openDevTools', () => {
    log('USER REQUESTED FOR DEVTOOLS.');
    mainWindow.webContents.openDevTools({ mode: 'detach', activate: true });
  });

  ipcMain.handle(
    'app/getArtistArtworks',
    async (_e: unknown, artistId: string) => getArtistInfoFromNet(artistId)
  );

  ipcMain.handle(
    'app/fetchSongInfoFromNet',
    async (_e: unknown, songTitle: string, songArtists: string[]) =>
      fetchSongInfoFromLastFM(songTitle, songArtists)
  );

  ipcMain.handle(
    'app/getArtistData',
    async (_e: unknown, artistIdsOrNames?: string[]) =>
      await getArtistData(artistIdsOrNames)
  );

  ipcMain.handle(
    'app/getGenresData',
    async (_e: unknown, genreIds?: string[]) => await getGenresData(genreIds)
  );

  ipcMain.handle(
    'app/getAlbumData',
    async (_e: unknown, albumIds?: string[]) => await getAlbumData(albumIds)
  );

  ipcMain.handle(
    'app/getPlaylistData',
    async (_e: unknown, playlistIds?: string[], onlyMutablePlaylists = false) =>
      sendPlaylistData(playlistIds, onlyMutablePlaylists)
  );

  ipcMain.handle(
    'app/addNewPlaylist',
    async (_e: unknown, playlistName: string) => addNewPlaylist(playlistName)
  );

  ipcMain.handle(
    'app/removeAPlaylist',
    async (_e: unknown, playlistId: string) => await removeAPlaylist(playlistId)
  );

  ipcMain.handle(
    'app/addSongToPlaylist',
    async (_e: unknown, playlistId: string, songId: string) =>
      await addSongToPlaylist(playlistId, songId)
  );

  ipcMain.handle(
    'app/removeSongFromPlaylist',
    async (_e: unknown, playlistId: string, songId: string) =>
      await removeSongFromPlaylist(playlistId, songId)
  );

  ipcMain.handle('app/clearSongHistory', async () => await clearSongHistory());

  ipcMain.handle(
    'app/removeSongFromLibrary',
    async (_e: unknown, absoluteFilePath: string) =>
      await removeSongFromLibrary(
        path.dirname(absoluteFilePath),
        path.basename(absoluteFilePath)
      )
  );

  ipcMain.handle(
    'app/deleteSongFromSystem',
    async (_e: unknown, absoluteFilePath: string, isPermanentDelete: boolean) =>
      await deleteSongFromSystem(absoluteFilePath, isPermanentDelete)
  );

  ipcMain.handle('app/resyncSongsLibrary', async () => checkForNewSongs());

  ipcMain.handle('app/restoreBlacklistedSong', (_, absolutePath: string) =>
    restoreBlacklistedSong(absolutePath)
  );

  ipcMain.handle(
    'app/updateSongId3Tags',
    (_, songId: string, tags: SongId3Tags) => updateSongId3Tags(songId, tags)
  );

  ipcMain.handle('app/getImgFileLocation', () => {
    return new Promise(async (resolve, reject) => {
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Select an Image',
        buttonLabel: 'Select Image',
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'webp', 'png'] },
        ],
        properties: ['openFile'],
      });
      if (canceled) return reject('You cancelled the prompt');
      return resolve(filePaths[0]);
    });
  });

  ipcMain.handle('app/getSongId3Tags', async (_, songPath: string) => {
    log(`Requested song ID3 tags for the song on path '${songPath}'`);
    const tags = await getSongId3Tags(songPath).catch((err) =>
      log(
        `====== ERROR OCCURRED WHEN PARSING THE SONG TO GET METADATA ======\nERROR : ${err}`
      )
    );
    if (tags) return tags;
    return undefined;
  });

  ipcMain.on('app/resetApp', async () => await resetApp());

  ipcMain.on('app/openLogFile', () =>
    shell.openPath(path.join(app.getPath('userData'), 'logs.txt'))
  );

  ipcMain.on(
    'revealSongInFileExplorer',
    async (_e: unknown, songId: string) => {
      const data = getData();
      const { songs } = data;
      for (let x = 0; x < songs.length; x += 1) {
        if (songs[x].songId === songId)
          return shell.showItemInFolder(songs[x].path);
      }
    }
  );
  ipcMain.on('app/openInBrowser', async (_e: unknown, url: string) =>
    shell.openExternal(url)
  );

  ipcMain.handle(
    'app/getRendererLogs',
    async (
      _: unknown,
      logs: string,
      forceRestart = false,
      forceMainRestart = false
    ) => {
      log(logs);
      if (forceRestart) return mainWindow.reload();
      if (forceMainRestart) {
        app.relaunch();
        return app.exit();
      }
    }
  );

  ipcMain.handle(
    'app/removeAMusicFolder',
    async (_: unknown, absolutePath: string) =>
      await removeAMusicFolder(absolutePath).catch((err) => {
        log(
          `===== ERROR OCCURRED WHEN REMOVING A MUSIC FOLDER ======\n ERROR : ${err}`
        );
      })
  );

  ipcMain.handle(
    'app/toggleMiniPlayer',
    async (_e: unknown, isMiniPlayerActive: boolean) =>
      toggleMiniPlayer(isMiniPlayerActive)
  );

  ipcMain.handle(
    'app/toggleMiniPlayerAlwaysOnTop',
    async (_e: unknown, isMiniPlayerAlwaysOnTop: boolean) =>
      toggleMiniPlayerAlwaysOnTop(isMiniPlayerAlwaysOnTop)
  );

  ipcMain.handle(
    'app/toggleAutoLaunch',
    async (_e: unknown, autoLaunchState: boolean) =>
      toggleAutoLaunch(autoLaunchState)
  );

  ipcMain.on('app/networkStatusChange', (_: unknown, isConnected: boolean) => {
    log(
      isConnected
        ? `APP CONNECTED TO THE INTERNET SUCCESSFULLY`
        : `APP DISCONNECTED FROM THE INTERNET`
    );
    isConnectedToInternet = isConnected;
  });

  ipcMain.on('app/restartRenderer', (_: unknown, reason: string) => {
    log(`RENDERER REQUESTED A RENDERER REFRESH.\nREASON : ${reason}`);
    restartRenderer();
  });

  ipcMain.on('app/restartApp', (_: unknown, reason: string) => {
    log(`RENDERER REQUESTED A FULL APP REFRESH.\nREASON : ${reason}`);
    mainWindow.webContents.send('app/beforeQuitEvent');
    app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
    app.exit(0);
  });

  //  / / / / / / / / / / / GLOBAL SHORTCUTS / / / / / / / / / / / / / /
  globalShortcut.register('F5', () => {
    log('USER REQUESTED RENDERER REFRESH.');
    restartRenderer();
  });

  globalShortcut.register('F12', () => {
    log('USER REQUESTED FOR DEVTOOLS.');
    mainWindow.webContents.openDevTools({ mode: 'detach', activate: true });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// / / / / / / / / / / / / / / / / / / / / / / / / / / / /
const skipBackIcon = nativeImage.createFromPath(
  getAssetPath(
    'images',
    'taskbar buttons',
    'baseline_skip_previous_white_24dp.png'
  )
);
const playIcon = nativeImage.createFromPath(
  getAssetPath(
    'images',
    'taskbar buttons',
    'baseline_play_arrow_white_24dp.png'
  )
);
const pauseIcon = nativeImage.createFromPath(
  getAssetPath('images', 'taskbar buttons', 'outline_pause_white_24dp.png')
);
const skipForwardIcon = nativeImage.createFromPath(
  getAssetPath('images', 'taskbar buttons', 'baseline_skip_next_white_24dp.png')
);
const manageTaskbarPlaybackControls = (
  isPlaybackSupported = true,
  isPlaying: boolean
) => {
  if (mainWindow)
    mainWindow.setThumbarButtons([
      {
        tooltip: 'Skip Back',
        icon: skipBackIcon,
        flags: isPlaybackSupported ? undefined : ['disabled'],
        click() {
          console.log('Skip back button clicked');
          mainWindow.webContents.send('app/player/skipBackward');
        },
      },
      {
        tooltip: isPlaying ? 'Pause' : 'Play',
        icon: isPlaying ? pauseIcon : playIcon,
        flags: isPlaybackSupported ? undefined : ['disabled'],
        click: () => {
          console.log('Play button clicked');
          mainWindow.webContents.send('app/player/toggleSongPlaybackState');
        },
      },
      {
        tooltip: 'Skip forward',
        icon: skipForwardIcon,
        flags: isPlaybackSupported ? undefined : ['disabled'],
        click() {
          console.log('Skip forward button clicked');
          mainWindow.webContents.send('app/player/skipForward');
        },
      },
    ]);
};

const addMusicFolder = (
  resultsSortType?: SongSortTypes
): Promise<SongData[]> => {
  return new Promise(async (resolve, reject) => {
    log('Started the process of adding a new song to the music library');
    const { canceled, filePaths: musicFolderPath } =
      await dialog.showOpenDialog(mainWindow, {
        title: 'Add a Music Folder',
        buttonLabel: 'Add folder',
        filters: [
          {
            name: 'Audio Files',
            extensions: appPreferences.supportedMusicExtensions,
          },
        ],
        properties: ['openFile', 'openDirectory'],
      });
    if (canceled) {
      log('User cancelled the folder selection popup.');
      return reject('You cancelled the prompt.');
    }
    log(`Added a new song folder to the app - ${musicFolderPath[0]}`);
    const songPaths = await getFiles(musicFolderPath[0]).catch((err) =>
      reject(err)
    );
    let songs: SongData[] = [];
    if (songPaths) {
      for (let x = 0; x < songPaths.length; x += 1) {
        const res = await parseSong(songPaths[x]).catch((err) =>
          console.error(err)
        );
        if (res) songs.push(res);
      }
    }
    if (resultsSortType)
      songs = sortSongs(songs, resultsSortType) as SongData[];
    log(
      `Successfully parsed ${songs.length} songs from '${musicFolderPath[0]}' directory.`
    );
    dataUpdateEvent('userData/musicFolder');
    return resolve(songs);
  });
};

let cachedLyrics = {
  songTitle: undefined as undefined | string,
  lyricsResponse: undefined as TLyrics | undefined,
};

const sendSongLyrics = async (
  songTitle: string,
  songArtists = [] as string[]
) => {
  log(`Fetching lyrics for '${songTitle} - ${songArtists.join(',')}'.`);
  if (
    cachedLyrics.songTitle &&
    cachedLyrics.songTitle === songTitle &&
    cachedLyrics.lyricsResponse
  ) {
    log('Serving cached lyrics.');
    return cachedLyrics.lyricsResponse;
  } else {
    const str = songArtists
      ? `${songTitle} ${songArtists.join(' ')}`
      : songTitle;
    return songLyrics(str).then(
      (res) => {
        log(`Found a lyrics result named '${res?.source.name}'.`);
        cachedLyrics = { songTitle, lyricsResponse: res };
        return res;
      },
      (err) => {
        log(
          `No lyrics found in the internet for the requested query.\nERROR : ${err}`
        );
        sendMessageToRenderer(`We couldn't find lyrics for ${songTitle}`);
        return undefined;
      }
    );
  }
};

const sendAudioData = (audioId: string): Promise<AudioData> => {
  return new Promise(async (resolve, reject) => {
    log(`Fetching song data for song id -${audioId}-`);
    try {
      const jsonData = getData();
      if (jsonData && jsonData.songs && jsonData.artists) {
        const { songs, artists } = jsonData;
        for (let x = 0; x < songs.length; x += 1) {
          const song = songs[x];
          if (song.songId === audioId) {
            const metadata = await musicMetaData
              .parseFile(song.path)
              .catch((err) => {
                log(
                  `====== ERROR OCCURRED WHEN PARSING THE SONG TO GET METADATA ======\nERROR : ${err}`
                );
              });
            if (metadata) {
              const artworkData = metadata.common.picture
                ? metadata.common.picture[0].data
                : // : await getDefaultSongCoverImg();
                  '';
              await addToSongsHistory(song.songId);
              if (song.artists) {
                for (let x = 0; x < song.artists.length; x += 1) {
                  for (let y = 0; y < artists.length; y += 1) {
                    if (
                      artists[y].artistId === song.artists[x].artistId &&
                      !artists[y].onlineArtworkPaths
                    )
                      getArtistInfoFromNet(artists[y].artistId);
                  }
                }
              }
              if (metadata.common.lyrics)
                cachedLyrics = {
                  songTitle: song.title,
                  lyricsResponse: {
                    source: {
                      name: 'song_data',
                      link: 'song_data',
                      url: 'song_data',
                    },
                    lyrics: metadata.common.lyrics.join('\n'),
                  },
                };
              const data: AudioData = {
                title: song.title,
                artists: song.artists,
                duration: song.duration,
                artwork:
                  Buffer.from(artworkData).toString('base64') || undefined,
                artworkPath: song.artworkPath,
                path: song.path,
                songId: song.songId,
                isAFavorite: song.isAFavorite,
                album: song.album,
              };
              updateSongListeningRate(jsonData.songs, song.songId);
              return resolve(data);
            }
          }
        }
        log(`No matching song for songId -${audioId}-`);
        return reject('SONG_NOT_FOUND' as ErrorCodes);
      } else {
        log(
          `====== ERROR OCCURRED WHEN READING data.json TO GET SONGS DATA. data.json FILE DOESN'T EXIST OR SONGS ARRAY IS EMPTY. ======`
        );
        return reject('EMPTY_SONG_ARRAY' as ErrorCodes);
      }
    } catch (err) {
      log(
        `====== ERROR OCCURRED WHEN TRYING TO SEND SONGS DATA. ======\nERROR : ${err}`
      );
      return reject('SONG_DATA_SEND_FAILED' as ErrorCodes);
    }
  });
};

const getAllSongs = async (
  sortType = 'aToZ' as SongSortTypes,
  pageNo = 1,
  maxResultsPerPage = 0
) => {
  const result: GetAllSongsResult = {
    data: [] as AudioInfo[],
    pageNo: pageNo || 1,
    maxResultsPerPage,
    noOfPages: 1,
    sortType,
  };
  const songsData = getData().songs;

  if (songsData && songsData.length > 0) {
    if (maxResultsPerPage === 0 || maxResultsPerPage > songsData.length)
      result.maxResultsPerPage = songsData.length;
    if (result.maxResultsPerPage !== undefined)
      result.noOfPages = Math.floor(
        songsData.length / result.maxResultsPerPage
      );
    const audioData = sortSongs(songsData, sortType).map((songInfo) => {
      return {
        title: songInfo.title,
        artists: songInfo.artists,
        duration: songInfo.duration,
        artworkPath: songInfo.artworkPath,
        path: songInfo.path,
        songId: songInfo.songId,
        palette: songInfo.palette,
        addedDate: songInfo.addedDate,
        isAFavorite: songInfo.isAFavorite,
      } as AudioInfo;
    });
    const resultsStartIndex = (result.pageNo - 1) * result.maxResultsPerPage;
    const resultsEndIndex = result.pageNo * result.maxResultsPerPage;
    result.data =
      result.maxResultsPerPage === audioData.length
        ? audioData.slice(0)
        : audioData.slice(resultsStartIndex, resultsEndIndex);
  }
  log(
    `Sending data related to all the songs with filters of sortType=${sortType} pageNo=${result.pageNo} maxResultsPerPage=${result.maxResultsPerPage}`
  );
  return result;
};

const toggleLikeSong = async (songId: string, likeSong: boolean) => {
  const data = getData();
  const result: ToggleLikeSongReturnValue = {
    success: false,
    error: null,
  };
  log(
    `Requested to ${likeSong ? 'like' : 'dislike'} a song with id -${songId}-`
  );
  if (data.songs) {
    data.songs = data.songs.map((song) => {
      if (song.songId === songId) {
        if (likeSong) {
          if (song.isAFavorite) {
            log(
              `Tried to like a song that has been already been liked with a song id -${songId}-`
            );
            result.error = `you have already liked ${songId}`;
            return song;
          } else {
            addToFavorites(song.songId);
            song.isAFavorite = true;
            result.success = true;
            return song;
          }
        } else if (song.isAFavorite) {
          song.isAFavorite = false;
          result.success = true;
          removeFromFavorites(song.songId);
          return song;
        } else {
          log(
            `Tried to dislike a song that has been already been disliked with a song id -${songId}-`
          );
          result.error = `you have already disliked ${songId}`;
          return song;
        }
      } else return song;
    });
    setData(data);
    dataUpdateEvent('songs/likes', songId);
    return result;
  } else return result;
};

export const sendMessageToRenderer = (message: string, code?: MessageCodes) => {
  mainWindow.webContents.send('app/sendMessageToRendererEvent', message, code);
};
export const dataUpdateEvent = (
  dataType: DataUpdateEventTypes,
  id?: string,
  message?: string
) => {
  log(
    `Data update event fired with updated '${dataType}'.${
      id || message ? '\n' : ''
    }${id ? `ID : ${id}; ` : ''}${message ? `MESSAGE : ${id}; ` : ''}`
  );
  mainWindow.webContents.send('app/dataUpdateEvent', dataType, id, message);
};

const getArtistInfoFromNet = (
  artistId: string
): Promise<ArtistInfoFromNet | undefined> => {
  return new Promise(async (resolve, reject) => {
    log(
      `Requested artist information related to an artist with id ${artistId} from the internet`
    );
    const data = getData();
    if (data && data.artists) {
      const { artists } = data;
      if (Array.isArray(artists) && artists.length > 0) {
        for (let x = 0; x < artists.length; x += 1) {
          if (artists[x].artistId === artistId) {
            const artist = artists[x];
            const artistArtworks =
              artist.onlineArtworkPaths ??
              (await getArtistInfoFromDeezer(artist.name)
                .then((res) => {
                  return {
                    picture_small: res[0].picture_small,
                    picture_medium: res[0].picture_medium,
                  };
                })
                .catch((err) => {
                  log(
                    `====== ERROR OCCURRED WHEN FETCHING ARTIST ARTWORKS FORM DEEZER NETWORK. ======\nERROR : ${err}`
                  );
                  reject(err);
                }));
            const artistInfo = await getArtistInfoFromLastFM(artist.name).catch(
              (err) => {
                log(
                  `====== ERROR OCCURRED WHEN FETCHING ARTIST INFO FROM LAST_FM NETWORK. ======\nERROR : ${err}`
                );
                reject(err);
              }
            );
            if (artistArtworks && artistInfo) {
              const artistPalette = (await nodeVibrant
                .from(artistArtworks.picture_medium)
                .getPalette()
                .catch((err) => {
                  log(
                    `====== ERROR OCCURRED WHEN PARSING THE ARTIST ARTWORK FOR A COLOR PALETTE FETCHED FROM INTERNET. ======\nERROR : ${err}`
                  );
                })) as unknown as NodeVibrantPalette;
              if (!artist.onlineArtworkPaths) {
                artists[x].onlineArtworkPaths = {
                  picture_medium: artistArtworks.picture_medium,
                  picture_small: artistArtworks.picture_small,
                };
                setData({ ...data, artists });
                dataUpdateEvent('artists/artworks');
              }
              return resolve({
                artistArtworks,
                artistBio: artistInfo.artist.bio.summary,
                artistPalette,
              } as ArtistInfoFromNet);
            }
          }
        }
        log(
          `No artists found with the given name ${artistId} when trying to fetch artist info from the internet.`
        );
        return reject(`no artists found with the given name ${artistId}`);
      } else {
        log(
          `ERROR OCCURRED WHEN SEARCHING FOR ARTISTS IN getArtistInfoFromNet FUNCTION. ARTISTS ARRAY IS EMPTY.`
        );
        reject('no artists found.');
      }
    } else {
      log(
        `ERROR OCCURRED WHEN SEARCHING FOR ARTISTS IN getArtistInfoFromNet FUNCTION. data.json FILE IS DELETED OR POSSIBLY EMPTY.`
      );
      reject('no data found.');
    }
  });
};

const getArtistInfoFromDeezer = (
  artistName: string
): Promise<ArtistInfoFromDeezer[]> => {
  return new Promise((resolve, reject) => {
    if (isConnectedToInternet) {
      httpsGet.concat(
        `https://api.deezer.com/search/artist?q=${encodeURIComponent(
          artistName
        )}`,
        (err, _res, data) => {
          if (err) return reject(err);
          try {
            const json = JSON.parse(
              data.toString('utf-8')
            ) as ArtistInfoDeezerApi;
            return resolve(json.data);
          } catch (error) {
            log(
              `====== ERROR OCCURRED PARSING JSON DATA FETCHED FROM DEEZER API ABOUT ARTISTS ARTWORKS. ======\nERROR : ${err}`
            );
            return reject(error);
          }
        }
      );
    } else {
      log(
        `====== ERROR OCCURRED WHEN TRYING TO FETCH FROM DEEZER API ABOUT ARTISTS ARTWORKS. APP IS NOT CONNECTED TO THE INTERNET. ======\nERROR : ERR_CONNECTION_FAILED`
      );
      return reject(new Error('App is not connected to the internet.'));
    }
  });
};

const getArtistInfoFromLastFM = (
  artistName: string
): Promise<LastFMArtistDataApi> => {
  return new Promise((resolve, reject) => {
    if (isConnectedToInternet) {
      httpsGet.concat(
        `http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${artistName}&api_key=0aac0c7edaf4797bcc63bd8688b43b30&format=json`,
        (err, _res, data) => {
          if (err) return reject(err);
          try {
            const response = JSON.parse(
              data.toString('utf-8')
            ) as LastFMArtistDataApi;
            if (response.error) {
              log(
                `====== ERROR OCCURRED FETCHING DATA FROM LAST_FM API ABOUT ARTISTS INFORMATION. ======\nERROR : ${err}`
              );
              return reject(
                `An error occurred when fetching data. Error code : ${
                  response.error
                }; Reason: ${response.message || 'Unknown reason'}`
              );
            }
            return resolve(response);
          } catch (error) {
            log(
              `====== ERROR OCCURRED PARSING FETCHED DATA FROM LAST_FM API ABOUT ARTISTS INFORMATION. ======\nERROR : ${error}`
            );
            return reject(
              `An error occurred when parsing fetched data. error : ${error}`
            );
          }
        }
      );
    } else {
      log(
        `====== ERROR OCCURRED WHEN TRYING TO FETCH FROM DEEZER API ABOUT ARTIST INFORMATION. APP IS NOT CONNECTED TO THE INTERNET. ======\nERROR : ERR_CONNECTION_FAILED`
      );
      return reject(new Error('App is not connected to the internet.'));
    }
  });
};

const fetchSongInfoFromLastFM = (
  songTitle: string,
  artistNames: string[]
): Promise<LastFMTrackInfoApi> => {
  return new Promise((resolve, reject) => {
    if (isConnectedToInternet) {
      httpsGet.concat(
        `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=0aac0c7edaf4797bcc63bd8688b43b30&&artist=${encodeURIComponent(
          artistNames[0]
        )}&track=${encodeURIComponent(songTitle)}&format=json&autocorrect=1`,
        (err, _res, data) => {
          if (err) return reject(err);
          try {
            const response = JSON.parse(
              data.toString('utf-8')
            ) as LastFMTrackInfoApi;
            if (response.error) {
              log(
                `====== ERROR OCCURRED FETCHING DATA FROM LAST_FM API ABOUT SONG INFORMATION. ======\nERROR : ${err}`
              );
              return reject(
                `An error occurred when fetching data. Error code : ${
                  response.error
                }; Reason: ${response.message || 'Unknown reason'}`
              );
            }
            return resolve(response);
          } catch (error) {
            log(
              `====== ERROR OCCURRED PARSING FETCHED DATA FROM LAST_FM API ABOUT ARTISTS INFORMATION. ======\nERROR : ${error}`
            );
            return reject(
              `An error occurred when parsing fetched data. error : ${error}`
            );
          }
        }
      );
    } else {
      log(
        `====== ERROR OCCURRED WHEN TRYING TO FETCH FROM DEEZER API ABOUT ARTIST INFORMATION. APP IS NOT CONNECTED TO THE INTERNET. ======\nERROR : ERR_CONNECTION_FAILED`
      );
      return reject(new Error('App is not connected to the internet.'));
    }
  });
};

const getArtistData = async (artistIdsOrNames = [] as string[]) => {
  if (artistIdsOrNames) {
    log(`Requested artists data for ids '${artistIdsOrNames.join(',')}'`);
    const data = getData();
    if (data && data.artists) {
      const { artists } = data;
      if (artistIdsOrNames.length === 0) return artists;
      else {
        const results: Artist[] = [];
        for (let x = 0; x < artistIdsOrNames.length; x += 1) {
          for (let y = 0; y < artists.length; y += 1) {
            if (
              artistIdsOrNames[x] === artists[y].artistId ||
              artistIdsOrNames[x] === artists[y].name
            )
              results.push(artists[y]);
          }
        }
        return results;
      }
    }
    return undefined;
  }
  return undefined;
};

const getAlbumData = async (albumIds = [] as string[]) => {
  if (albumIds) {
    log(`Requested albums data for ids '${albumIds.join(',')}'`);
    const data = getData();
    if (data && data.albums) {
      const { albums } = data;
      if (albumIds.length === 0) return albums;
      else {
        const results: Album[] = [];
        for (let x = 0; x < albums.length; x += 1) {
          for (let y = 0; y < albumIds.length; y += 1) {
            if (albums[x].albumId === albumIds[y]) results.push(albums[x]);
          }
        }
        return results;
      }
    }
    return undefined;
  }
  return undefined;
};

const sendPlaylistData = (
  playlistIds = [] as string[],
  onlyMutablePlaylists = false
) => {
  const playlists = getPlaylistData();
  if (playlistIds && playlists && Array.isArray(playlists)) {
    let results: Playlist[] = [];
    log(`Requested playlists data for ids '${playlistIds.join(',')}'`);
    if (playlistIds.length === 0) results = playlists;
    else {
      for (let x = 0; x < playlists.length; x += 1) {
        for (let y = 0; y < playlistIds.length; y += 1) {
          if (playlists[x].playlistId === playlistIds[y])
            results.push(playlists[x]);
        }
      }
    }
    return onlyMutablePlaylists
      ? results.filter((result) => result.playlistId !== 'History')
      : results;
  } else return undefined;
};

const addToFavorites = (songId: string) => {
  return new Promise((resolve, reject) => {
    log(`Requested a song with id -${songId}- to be added to the favorites.`);
    const playlists = getPlaylistData();
    if (playlists && Array.isArray(playlists)) {
      if (
        playlists.length > 0 &&
        playlists.some(
          (playlist) =>
            playlist.name === 'Favorites' && playlist.playlistId === 'Favorites'
        )
      ) {
        setPlaylistData(
          playlists.map((playlist) => {
            if (
              playlist.name === 'Favorites' &&
              playlist.playlistId === 'Favorites'
            ) {
              if (
                playlist.songs.some(
                  (playlistSongId: string) => playlistSongId === songId
                )
              ) {
                log(
                  `Request failed for the song with id ${songId} to be added to the Favorites because it was already in the Favorites.`
                );
                resolve({
                  success: false,
                  message: `Song with id ${songId} is already in Favorites.`,
                });
                return playlist;
              } else {
                playlist.songs.push(songId);
                return playlist;
              }
            } else return playlist;
          })
        );
        resolve(true);
      } else {
        playlists.push({
          name: 'Favorites',
          createdDate: new Date(),
          songs: [songId],
          playlistId: 'Favorites',
          artworkPath: path.join(
            __dirname,
            'public',
            'images',
            'favorites-playlist-icon.png'
          ),
        });
        setPlaylistData(playlists);
        resolve(true);
      }
      dataUpdateEvent('playlists/favorites');
    } else {
      log(
        `ERROR OCCURRED WHEN TRYING TO ADD A SONG TO THE FAVORITES. PLAYLIST DATA ARE EMPTY.`
      );
      reject({
        success: false,
        message: 'Playlists is not an array.',
      });
    }
  });
};

const removeFromFavorites = (songId: string) => {
  return new Promise((resolve, reject) => {
    log(`Requested a song with id -${songId}- to be removed to the favorites.`);
    const playlists = getPlaylistData();
    if (playlists && Array.isArray(playlists)) {
      if (
        playlists.length > 0 &&
        playlists.some(
          (playlist) =>
            playlist.name === 'Favorites' && playlist.playlistId === 'Favorites'
        )
      ) {
        setPlaylistData(
          playlists.map((playlist) => {
            if (
              playlist.name === 'Favorites' &&
              playlist.playlistId === 'Favorites' &&
              playlist.songs.some(
                (playlistSongId: string) => playlistSongId === songId
              )
            ) {
              const { songs } = playlist;
              songs.splice(songs.indexOf(songId), 1);
              playlist.songs = songs;
              return playlist;
            } else {
              log(
                `Request failed for the song with id ${songId} to be removed to the Favorites because it is already unavailable in the Favorites.`
              );
              return playlist;
            }
          })
        );
        dataUpdateEvent('playlists/favorites');
        resolve({ success: true });
      }
    } else {
      log(
        `ERROR OCCURRED WHEN TRYING TO REMOVE A SONG TO THE FAVORITES. PLAYLIST DATA ARE EMPTY.`
      );
      reject({
        success: false,
        message: 'Playlists is not an array.',
      });
    }
  });
};

const addToSongsHistory = (songId: string) => {
  return new Promise((resolve, reject) => {
    log(
      `Requested a song with id -${songId}- to be added to the History playlist.`
    );
    let playlists = getPlaylistData();
    if (playlists && Array.isArray(playlists)) {
      if (
        playlists.some(
          (playlist) =>
            playlist.name === 'History' && playlist.playlistId === 'History'
        )
      ) {
        playlists = playlists.map((playlist) => {
          if (
            playlist.name === 'History' &&
            playlist.playlistId === 'History'
          ) {
            if (playlist.songs.length + 1 > 50) playlist.songs.pop();
            if (playlist.songs.some((song) => song === songId))
              playlist.songs = playlist.songs.filter((song) => song !== songId);
            playlist.songs.push(songId);
            return playlist;
          }
          return playlist;
        });
        setPlaylistData(playlists);
        resolve({ success: true });
      } else {
        playlists.push({
          name: 'History',
          playlistId: 'History',
          createdDate: new Date(),
          songs: [songId],
          artworkPath: path.join(
            __dirname,
            'public',
            'images',
            'history-playlist-icon.png'
          ),
        });
        setPlaylistData(playlists);
        resolve(true);
      }
      dataUpdateEvent('playlists/history');
      dataUpdateEvent('userData/recentlyPlayedSongs');
    } else {
      log(
        `ERROR OCCURRED WHEN TRYING TO ADD A SONG TO THE FAVORITES. PLAYLIST DATA ARE EMPTY.`
      );
      reject({
        success: false,
        message: 'Playlists is not an array.',
      });
    }
  });
};
const addNewPlaylist = (
  name: string,
  songIds?: string[],
  artworkPath?: string
): Promise<{ success: boolean; message?: string; playlist?: Playlist }> => {
  const PlaylistArtworkPath = getAssetPath(
    'images',
    'playlist_cover_default.png'
  );
  return new Promise((resolve, reject) => {
    log(`Requested a creation of new playlist with a name ${name}`);
    const playlists = getPlaylistData();
    if (playlists && Array.isArray(playlists)) {
      if (playlists.some((playlist) => playlist.name === name)) {
        log(
          `Request failed because there is already a playlist named '${name}'.`
        );
        resolve({
          success: false,
          message: `Playlist with name '${name}' already exists.`,
        });
      } else {
        const newPlaylist: Playlist = {
          name,
          createdDate: new Date(),
          playlistId: generateRandomId(),
          songs: Array.isArray(songIds) ? songIds : [],
          artworkPath: artworkPath ?? PlaylistArtworkPath,
        };
        playlists.push(newPlaylist);
        setPlaylistData(playlists);
        dataUpdateEvent('playlists/newPlaylist');
        resolve({ success: true, playlist: newPlaylist });
      }
    } else {
      log(
        `ERROR OCCURRED WHEN TRYING TO ADD A SONG TO THE FAVORITES. PLAYLIST DATA ARE EMPTY.`
      );
      reject({
        success: false,
        message: 'Playlists is not an array.',
      });
    }
  });
};

const removeAPlaylist = (
  playlistId: string
): Promise<{ success: boolean; message?: string }> => {
  return new Promise((resolve, reject) => {
    log(
      `Requested a playlist with id -${playlistId}- to be to be deleted from the app.`
    );
    const playlists = getPlaylistData();
    if (playlists && Array.isArray(playlists)) {
      if (
        playlists.length > 0 &&
        playlists.some((playlist) => playlist.playlistId === playlistId)
      ) {
        const updatedPlaylists = playlists.filter(
          (playlist) => playlist.playlistId !== playlistId
        );
        setPlaylistData(updatedPlaylists);
        dataUpdateEvent('playlists/deletedPlaylist');
        log(`Playlist with id ${playlistId} deleted successfully.`);
        return resolve({
          success: true,
          message: `Playlist with id ${playlistId} deleted.`,
        });
      } else {
        log(
          `Request failed for the playlist with id ${playlistId} to be removed because it cannot be located.`
        );
        reject({
          success: false,
          message: `Playlist with id ${playlistId} cannot be located.`,
        });
      }
    } else {
      log(
        `ERROR OCCURRED WHEN TRYING TO ADD A SONG TO THE FAVORITES. PLAYLIST DATA ARE EMPTY.`
      );
      reject({
        success: false,
        message: 'Playlists is not an array.',
      });
    }
  });
};

const addSongToPlaylist = (playlistId: string, songId: string) => {
  return new Promise((resolve, reject) => {
    log(
      `Requested a song with id -${songId}- to be added to a playlist with id '${playlistId}'.`
    );
    const playlists = getPlaylistData();
    if (playlists && Array.isArray(playlists) && playlists.length > 0) {
      for (let x = 0; x < playlists.length; x += 1) {
        if (playlists[x].playlistId === playlistId) {
          if (playlists[x].songs.some((id) => id === songId)) {
            log(
              `Request failed for the song with id ${songId} to be added to the playlist with id '${playlistId}' because it was exists in that playlist.`
            );
            return resolve({
              success: false,
              message: `Song with id ${songId} already exists in playlist ${playlists[x].name}`,
            });
          } else {
            playlists[x].songs.push(songId);
            setPlaylistData(playlists);
            log(
              `song ${songId} add to the playlist ${playlists[x].name} successfully.`
            );
            return resolve({
              success: true,
              message: `song ${songId} add to the playlist ${playlists[x].name} successfully.`,
            });
          }
        }
      }
      log(
        `Request failed because a playlist with an id '${playlistId}' cannot be found.`
      );
      return reject({
        success: false,
        message: `playlist with an id ${playlistId} couldn't be found.`,
      });
    }
  });
};

const removeSongFromPlaylist = (playlistId: string, songId: string) => {
  return new Promise((resolve, reject) => {
    log(
      `Requested a song with id -${songId}- to be removed from a playlist with id '${playlistId}'.`
    );
    let playlistsData = getPlaylistData([]);
    let isSongFound = false;
    if (playlistId === 'Favorites') {
      log(
        'User requested to remove a song from the Favorites playlist. Request handed over to toggleLikeSong.'
      );
      return toggleLikeSong(songId, false)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    } else if (Array.isArray(playlistsData) && playlistsData.length > 0) {
      playlistsData = playlistsData.map((playlist) => {
        if (
          playlist.playlistId === playlistId &&
          playlist.songs.some((id) => id === songId)
        ) {
          isSongFound = true;
          return {
            ...playlist,
            songs: playlist.songs.filter((id) => id !== songId),
          };
        }
        return playlist;
      });
      if (isSongFound) {
        dataUpdateEvent('playlists/deletedSong');
        setPlaylistData(playlistsData);
        log(
          `song '${songId}' removed from the playlist '${playlistId}' successfully.`
        );
        return resolve({
          success: true,
          message: `song '${songId}' removed from the playlist '${playlistId}' successfully.`,
        });
      }
      log(
        `Request failed because a song with an id '${songId}' cannot be found in the playlist of id ${playlistId}.`
      );
      return reject({
        success: false,
        message: `'${songId}' cannot be found in the playlist of id ${playlistId}.`,
      });
    }
    log(`Request failed because a playlist data is undefined.`);
    return reject({
      success: false,
      message: `Request failed because a playlist data is undefined.`,
    });
  });
};

const clearSongHistory = (): Promise<{
  success: boolean;
  message?: string;
}> => {
  return new Promise((resolve, reject) => {
    log('Started the cleaning process of the song history.');
    const playlistData = getPlaylistData([]);
    if (Array.isArray(playlistData) && playlistData.length > 0) {
      for (let i = 0; i < playlistData.length; i += 1) {
        if (playlistData[i].playlistId === 'History')
          playlistData[i].songs = [];
      }
      dataUpdateEvent('playlists/history');
      setPlaylistData(playlistData);
      log('Finished the song history cleaning process successfully.');
      return resolve({ success: true });
    }
    log(
      `======= ERROR OCCURRED WHEN TRYING TO CLEAR THE SONG HISTORY. =======\nERROR: PLAYLIST DATA IS EMPTY OR NOT AN ARRAY`
    );
    return reject({
      success: false,
      message: 'playlist data is empty or not an array.',
    });
  });
};

export const getSongInfo = (
  songIds: string[],
  sortType?: SongSortTypes,
  limit = songIds.length
) => {
  log(
    `Fetching songs data from getSongInfo function about ${
      limit || songIds.length
    } songs.`
  );
  if (songIds.length > 0) {
    const songsData = getData().songs;
    if (Array.isArray(songsData) && songsData.length > 0) {
      const results: SongData[] = [];
      for (let x = 0; x < songIds.length; x += 1) {
        for (let y = 0; y < songsData.length; y += 1) {
          if (songIds[x] === songsData[y].songId) {
            results.push(songsData[y]);
          }
        }
      }
      if (results.length > 0) {
        if (limit) {
          if (typeof sortType === 'string')
            return sortSongs(results, sortType).filter(
              (_, index) => index < limit
            );
          return results.filter((_, index) => index < limit);
        }
        return results;
      }
      log(
        `Request failed to get songs info of songs with ids ${songIds.join(
          ','
        )} because they cannot be found.`
      );
      return results;
    }
    log(
      `ERROR OCCURRED WHEN TRYING GET SONGS INFO FROM getSongInfo FUNCTION. SONGS DATA ARE EMPTY.`
    );
    return [];
  } else {
    log(
      `APP MADE A REQUEST TO getSongInfo FUNCTION WITH AN EMPTY ARRAY OF SONG IDS. `
    );
    return [];
  }
};

const manageAppResetErrors = (err: any) => {
  if (err.code && err.code !== 'ENOENT') throw err;
};

const resetApp = async () => {
  log('!-!-!-!-!-!  STARTED THE RESETTING PROCESS OF THE APP.  !-!-!-!-!-!');
  try {
    resetAppCache();
    const userDataPath = app.getPath('userData');
    await unlink(path.join(userDataPath, 'data.json')).catch(
      manageAppResetErrors
    );
    await unlink(path.join(userDataPath, 'userData.json')).catch(
      manageAppResetErrors
    );
    await unlink(path.join(userDataPath, 'playlists.json')).catch(
      manageAppResetErrors
    );
    await rm(path.join(userDataPath, 'song_covers'), {
      recursive: true,
    }).catch(manageAppResetErrors);
    log(
      `########## SUCCESSFULLY RESETTED THE APP. RESTARTING THE APP NOW. ##########`
    );
    sendMessageToRenderer(
      'Successfully resetted the app. Restarting the app now.'
    );
  } catch (error) {
    sendMessageToRenderer('Resetting the app failed. Reloading the app now.');
    log(
      `====== ERROR OCCURRED WHEN RESETTING THE APP. RELOADING THE APP NOW.  ======\nERROR : ${error}`
    );
  } finally {
    mainWindow.webContents.reload();
    log(`====== RELOADING THE RENDERER ======`);
  }
};

/** This function is called to increment the no of song listens because of song repetitions etc. */
const incrementNoOfSongListens = (songId: string) => {
  return new Promise((resolve, reject) => {
    const data = getData();
    if (data && data.songs) {
      for (let x = 0; x < data.songs.length; x += 1) {
        if (data.songs[x].songId === songId) {
          data.songs[x].listeningRate.allTime += 1;
          data.songs[x].listeningRate.monthly.months[
            new Date().getMonth()
          ] += 1;
          setData(data);
          dataUpdateEvent('songs/noOfListens');
          log(`Song listens incremented on '${data.songs[x].title}'`);
          resolve(true);
        }
      }
      log(
        `Failed to increment no song listens of song with id -${songId}- because it cannot be found.`
      );
      return reject(`no song with id ${songId}`);
    }
    log(
      `ERROR OCCURRED WHEN TRYING TO INCREMENT NO OF SONG LISTENS OF A SONG. SONGS DATA ARE EMPTY.`
    );
    return reject('data or songData of unknown type.');
  });
};

const getGenresData = async (genreIds = [] as string[]) => {
  const data = getData();
  let results: Genre[] = [];
  if (data.genres && Array.isArray(data.genres) && data.genres.length > 0) {
    const { genres } = data;
    if (genreIds) {
      if (genreIds.length > 0) {
        for (let x = 0; x < genres.length; x += 1) {
          for (let y = 0; y < genreIds.length; y += 1) {
            if (genres[x].genreId === genreIds[y]) results.push(genres[x]);
          }
        }
      } else results = genres;
    }
  }
  log(
    `Fetching genres data for genres with ids '${genreIds.join(',')}'.${
      genreIds.length > 0
        ? ` Found ${results.length} out of ${genreIds.length} results.`
        : ` Found ${results.length} results.`
    }`
  );
  return results;
};

const toggleAutoLaunch = async (autoLaunchState: boolean) => {
  log(`AUTO LAUNCH STATE : ${autoLaunchState}`);
  if (autoLaunchState) autoLauncher.enable();
  else autoLauncher.disable();
  saveUserData('preferences.autoLaunchApp', autoLaunchState);
};
