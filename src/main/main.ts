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
} from 'electron';
import path from 'path';
import { rm, unlink } from 'fs/promises';

import * as musicMetaData from 'music-metadata';
import songLyrics from 'songlyrics';
import httpsGet from 'simple-get';
import nodeVibrant from 'node-vibrant';

import { logger } from './logger';
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
} from './filesystem';
import { parseSong } from './parseSong';
import { generateRandomId } from './randomId';
import { resolveHtmlPath } from './util';

let mainWindow: BrowserWindow;

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
isDevelopment && require('electron-debug')();

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
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
    backgroundColor: '#fff',
    icon: getAssetPath('images', 'logo_light_mode.ico'),
    titleBarStyle: 'hidden',
    show: false,
  });
  mainWindow.webContents.openDevTools({
    mode: 'detach',
  });
  mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow.once('ready-to-show', checkForNewSongs);
  mainWindow.webContents.setWindowOpenHandler((edata: { url: string }) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

const toggleMiniPlayer = (isMiniPlayer = false) => {
  if (isMiniPlayer) {
    mainWindow.setMaximumSize(350, 350);
    mainWindow.setMinimumSize(250, 250);
    mainWindow.setSize(250, 250, true);
  } else {
    mainWindow.setMinimumSize(700, 500);
    mainWindow.setMaximumSize(10000, 5000);
    mainWindow.setSize(1280, 700, true);
  }
};

app.whenReady().then(() => {
  protocol.registerFileProtocol(
    'otomusic',
    (request: { url: string }, callback: (arg0: string) => any) => {
      const url = decodeURI(request.url).replace('otomusic://localFiles/', '');
      try {
        return callback(url);
      } catch (error) {
        console.error(error);
        return callback('404');
      }
    }
  );
  createWindow();
  mainWindow.show();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('before-quit', () => {
    mainWindow.webContents.send('app/beforeQuitEvent');
  });

  ipcMain.on('app/close', () => app.quit());

  ipcMain.on('app/minimize', () => mainWindow.minimize());

  ipcMain.on('app/toggleMaximize', () =>
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
  );

  ipcMain.on('app/getSongPosition', (_event: any, position: number) =>
    saveUserData('currentSong.stoppedPosition', position).catch((err) =>
      logger(err)
    )
  );

  ipcMain.on('app/incrementNoOfSongListens', (_: any, songId: string) =>
    incrementNoOfSongListens(songId)
  );

  ipcMain.handle('app/addMusicFolder', addMusicFolder);

  ipcMain.handle('app/getSong', (_event: any, id: string) => sendAudioData(id));

  ipcMain.handle(
    'app/toggleLikeSong',
    (_e: any, songId: string, likeSong: boolean) =>
      toggleLikeSong(songId, likeSong)
  );

  ipcMain.handle('app/checkForSongs', () => checkForSongs());

  ipcMain.handle(
    'app/saveUserData',
    async (_event: any, dataType: UserDataTypes, data: string) =>
      await saveUserData(dataType, data).catch((err) => logger(err))
  );

  ipcMain.handle('app/getUserData', async () => await getUserData());

  ipcMain.handle('app/search', search);

  ipcMain.handle(
    'app/getSongLyrics',
    async (_e: any, songTitle: string, songArtists?: string) =>
      await sendSongLyrics(songTitle, songArtists)
  );

  ipcMain.handle('app/getSongInfo', (_e: any, songId: string) =>
    getSongInfo(songId)
  );

  ipcMain.on('app/openDevTools', () =>
    mainWindow.webContents.openDevTools({ mode: 'detach', activate: true })
  );

  ipcMain.handle('app/getArtistArtworks', async (_e: any, artistId: string) =>
    getArtistInfoFromNet(artistId)
  );

  ipcMain.handle(
    'app/getArtistData',
    async (_e: any, artistIdOrName: string) =>
      await getArtistData(artistIdOrName)
  );

  ipcMain.handle(
    'app/getAlbumData',
    async (_e: any, albumId: string) => await getAlbumData(albumId)
  );

  ipcMain.handle('app/getPlaylistData', async (_e: any, playlistId: string) =>
    sendPlaylistData(playlistId)
  );

  ipcMain.handle('app/addNewPlaylist', async (_e: any, playlistName: string) =>
    addNewPlaylist(playlistName)
  );

  ipcMain.handle(
    'app/removeAPlaylist',
    async (_e: any, playlistId: string) => await removeAPlaylist(playlistId)
  );

  ipcMain.handle(
    'app/addSongToPlaylist',
    async (_e: any, playlistId: string, songId: string) =>
      await addSongToPlaylist(playlistId, songId)
  );

  ipcMain.handle(
    'app/removeSongFromLibrary',
    async (_e: any, absoluteFilePath: string) =>
      await removeSongFromLibrary(
        path.dirname(absoluteFilePath),
        path.basename(absoluteFilePath)
      )
  );

  ipcMain.handle(
    'app/deleteSongFromSystem',
    async (_e: any, absoluteFilePath: string, isPermanentDelete: boolean) =>
      await deleteSongFromSystem(absoluteFilePath, isPermanentDelete)
  );

  ipcMain.handle('app/resyncSongsLibrary', async () => checkForNewSongs());

  ipcMain.on('app/resetApp', async () => await resetApp());

  ipcMain.on('revealSongInFileExplorer', async (_e: any, songId: string) => {
    const data = await getData();
    const { songs } = data;
    for (let x = 0; x < songs.length; x += 1) {
      if (songs[x].songId === songId)
        return shell.showItemInFolder(songs[x].path);
    }
  });
  ipcMain.on('app/openInBrowser', async (_e: any, url: string) =>
    shell.openExternal(url)
  );

  ipcMain.handle(
    'app/getRendererLogs',
    async (
      _: any,
      logs: Error,
      forceRestart = false,
      forceMainRestart = false
    ) => {
      await logger(logs);
      if (forceRestart) return mainWindow.reload();
      if (forceMainRestart) {
        app.relaunch();
        return app.exit();
      }
    }
  );

  ipcMain.handle(
    'app/removeAMusicFolder',
    async (_: any, absolutePath: string) =>
      await removeAMusicFolder(absolutePath).catch((err) => logger(err))
  );

  ipcMain.handle(
    'app/toggleMiniPlayer',
    async (_e: any, isMiniPlayer: boolean) => toggleMiniPlayer(isMiniPlayer)
  );

  globalShortcut.register('F5', () => mainWindow.reload());

  globalShortcut.register('F12', () =>
    mainWindow.webContents.openDevTools({ mode: 'detach', activate: true })
  );
});

// / / / / / / / / / / / / / / / / / / / / / / / / / / / /

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

const addMusicFolder = (): Promise<SongData[]> => {
  return new Promise(async (resolve, reject) => {
    const { canceled, filePaths: musicFolderPath } =
      await dialog.showOpenDialog(mainWindow, {
        title: 'Add a Music Folder',
        buttonLabel: 'Add folder',
        filters: [{ name: 'Audio Files', extensions: ['mp3'] }],
        properties: ['openFile', 'openDirectory'],
      });
    if (canceled) return reject('You cancelled the prompt.');
    console.log(musicFolderPath[0]);
    const songPaths = await getFiles(musicFolderPath[0]).catch((err) =>
      reject(err)
    );
    const songs: SongData[] = [];
    if (songPaths) {
      for (let x = 0; x < songPaths.length; x += 1) {
        const res = await parseSong(songPaths[x]).catch((err) => reject(err));
        if (res) songs.push(res);
      }
    }
    return resolve(songs);
  });
};

const sendSongLyrics = async (songTitle: string, songArtists?: string) => {
  const str = songArtists ? `${songTitle} - ${songArtists}` : songTitle;
  return songLyrics(str).then(
    (res) => res,
    (err) => {
      console.log(err);
      sendMessageToRenderer(`We couldn't find lyrics for ${songTitle}`);
      return undefined;
    }
  );
};

const sendAudioData = async (audioId: string) => {
  console.log('audio id', `-${audioId}-`);

  return await getData().then(async (jsonData) => {
    try {
      if (jsonData && jsonData.songs) {
        const { songs } = jsonData;
        for (let x = 0; x < songs.length; x += 1) {
          const song = songs[x];
          // console.log(audioId, songInfo.songId, songInfo.songId === audioId);
          if (song.songId === audioId) {
            const metadata = await musicMetaData
              .parseFile(song.path)
              .catch((err) => logger(err));
            if (metadata) {
              const artworkData = metadata.common.picture
                ? metadata.common.picture[0].data
                : // : await getDefaultSongCoverImg();
                  '';
              await saveUserData('recentlyPlayedSongs', song);
              await addToSongsHistory(song.songId);
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
              await updateSongListeningRate(jsonData.songs, song.songId).catch(
                (err: Error) => logger(err)
              );
              return data;
            }
          }
        }
        console.log(`no matching song for songID the songId "${audioId}"`);
        return undefined;
      } else return await logger(new Error(`jsonData error. ${jsonData}`));
    } catch (err) {
      return await logger(err);
    }
  });
};

const checkForSongs = async () => {
  return await getData().then(
    async (data) => {
      if (data && Object.keys(data).length !== 0) {
        const songData = data.songs.map((songInfo: SongData) => {
          const info: AudioInfo = {
            title: songInfo.title,
            artists: songInfo.artists,
            duration: songInfo.duration,
            artworkPath: songInfo.artworkPath,
            path: songInfo.path,
            songId: songInfo.songId,
            palette: songInfo.palette,
            addedDate: songInfo.addedDate,
          };
          return info;
        });
        return songData;
      } else return undefined;
    },
    (err) => {
      logger(err);
      return undefined;
    }
  );
};

const search = async (
  _: unknown,
  filter: SearchFilters,
  value: string
): Promise<SearchResult> => {
  const jsonData: Data = await getData();
  const playlistData = await getPlaylistData();
  const songs =
    Array.isArray(jsonData.songs) &&
    jsonData.songs.length > 0 &&
    (filter === 'Songs' || filter === 'All')
      ? jsonData.songs.filter(
          (data: SongData) =>
            new RegExp(value.replace(/[^w ]/, ''), 'gim').test(data.title) ||
            (data.artists
              ? new RegExp(value.replace(/[^w ]/, ''), 'gim').test(
                  data.artists.map((artist) => artist.name).join(' ')
                )
              : false)
        )
      : [];
  const artists =
    Array.isArray(jsonData.artists) &&
    jsonData.artists.length > 0 &&
    (filter === 'Artists' || filter === 'All')
      ? jsonData.artists.filter((data: Artist) =>
          new RegExp(value, 'gim').test(data.name)
        )
      : [];
  const albums =
    Array.isArray(jsonData.albums) &&
    jsonData.albums.length > 0 &&
    (filter === 'Albums' || filter === 'All')
      ? jsonData.albums.filter((data: Album) =>
          new RegExp(value, 'gim').test(data.title)
        )
      : [];

  const playlists =
    Array.isArray(playlistData) &&
    playlistData.length > 0 &&
    (filter === 'Playlists' || filter === 'All')
      ? playlistData.filter((data: Playlist) =>
          new RegExp(value, 'gim').test(data.name)
        )
      : [];

  return {
    songs: songs || [],
    artists: artists || [],
    albums: albums || [],
    playlists: playlists || [],
  };
};

const toggleLikeSong = async (songId: string, likeSong: boolean) => {
  const data = await getData();
  const result: ToggleLikeSongReturnValue = {
    success: false,
    error: null,
  };
  if (data.songs) {
    data.songs = data.songs.map((song) => {
      if (song.songId === songId) {
        if (likeSong) {
          if (song.isAFavorite) {
            console.log({
              success: false,
              error: `you have already liked ${songId}`,
            });
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
          console.log({
            success: false,
            error: `you have already disliked ${songId}`,
          });
          result.error = `you have already disliked ${songId}`;
          return song;
        }
      } else return song;
    });
    await setData(data);
    return result;
  } else return result;
};

export const sendMessageToRenderer = (message: string) => {
  mainWindow.webContents.send('app/sendMessageToRenderer', message);
};
export const dataUpdateEvent = (
  dataType: DataUpdateEventTypes,
  message?: string
) => {
  mainWindow.webContents.send('app/newSongEvent', dataType, message);
};

const getArtistInfoFromNet = (
  artistId: string
  // artistName?: string
): Promise<ArtistInfoFromNet | undefined> => {
  return new Promise(async (resolve, reject) => {
    const data = await getData();
    if (data && data.artists) {
      const { artists } = data;
      if (Array.isArray(artists) && artists.length > 0) {
        for (let x = 0; x < artists.length; x += 1) {
          if (artists[x].artistId === artistId) {
            const artist = artists[x];
            const artistArtworks =
              artist.onlineArtworkPaths ??
              (await getArtistInfoFromDeezer(artist.name).then((res) => {
                return {
                  picture_small: res[0].picture_small,
                  picture_medium: res[0].picture_medium,
                };
              }));
            const artistInfo = await getArtistInfoFromLastFM(artist.name);
            if (artistArtworks && artistInfo) {
              const artistPalette = (await nodeVibrant
                .from(artistArtworks.picture_medium)
                .getPalette()) as unknown as NodeVibrantPalette;
              if (!artist.onlineArtworkPaths) {
                artists[x].onlineArtworkPaths = {
                  picture_medium: artistArtworks.picture_medium,
                  picture_small: artistArtworks.picture_small,
                };
                await setData({ ...data, artists }).catch((err) => reject(err));
              }
              return resolve({
                artistArtworks,
                artistBio: artistInfo.artist.bio.summary,
                artistPalette,
              } as ArtistInfoFromNet);
            }
          }
        }
        return reject(`no artists found with the given name ${artistId}`);
      } else reject('no artists found.');
    } else reject('no data found.');
  });
};

const getArtistInfoFromDeezer = (
  artistName: string
): Promise<ArtistInfoFromDeezer[]> => {
  return new Promise((resolve, reject) => {
    httpsGet.concat(
      `https://api.deezer.com/search/artist?q=${artistName}`,
      (err, _res, data) => {
        if (err) return reject(err);
        try {
          const json = JSON.parse(
            data.toString('utf-8')
          ) as ArtistInfoDeezerApi;
          return resolve(json.data);
        } catch (error) {
          return reject(error);
        }
      }
    );
  });
};

const getArtistInfoFromLastFM = (
  artistName: string
): Promise<LastFMArtistDataApi> => {
  return new Promise((resolve, reject) => {
    httpsGet.concat(
      `http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${artistName}&api_key=0aac0c7edaf4797bcc63bd8688b43b30&format=json`,
      (err, _res, data) => {
        if (err) return reject(err);
        const response = JSON.parse(
          data.toString('utf-8')
        ) as LastFMArtistDataApi;
        if (response.error)
          return reject(
            `An error occurred when fetching data. Error code : ${response.error}`
          );
        return resolve(response);
      }
    );
  });
};

const getArtistData = async (
  artistIdOrName = '*'
): Promise<Artist | Artist[] | undefined> => {
  if (artistIdOrName) {
    const data = await getData();
    if (data && data.artists) {
      const { artists } = data;
      if (artistIdOrName === '*') return artists;
      else {
        for (let x = 0; x < artists.length; x += 1) {
          const artist = artists[x];
          if (
            artist.artistId === artistIdOrName ||
            artist.name === artistIdOrName
          )
            return artist;
        }
        return undefined;
      }
    }
    return undefined;
  }
  return undefined;
};

const getAlbumData = async (albumId = '*') => {
  if (albumId) {
    const data = await getData();
    if (data && data.albums) {
      const { albums } = data;
      if (albumId === '*') return albums;
      else {
        for (let x = 0; x < albums.length; x += 1) {
          const album = albums[x];
          if (album.albumId === albumId) return album;
        }
        return undefined;
      }
    }
    return undefined;
  }
  return undefined;
};

const sendPlaylistData = async (playlistId = '*') => {
  const playlists = await getPlaylistData();
  if (playlists && Array.isArray(playlists)) {
    if (playlistId === '*') return playlists;
    else {
      for (let x = 0; x < playlists.length; x += 1) {
        const playlist = playlists[x];
        if (playlist.playlistId === playlistId) return playlist;
      }
      return undefined;
    }
  } else return undefined;
};

const addToFavorites = async (songId: string) => {
  return new Promise(async (resolve, reject) => {
    const playlists = await getPlaylistData();
    if (playlists && Array.isArray(playlists)) {
      if (
        playlists.length > 0 &&
        playlists.some(
          (playlist) =>
            playlist.name === 'Favorites' && playlist.playlistId === 'Favorites'
        )
      ) {
        await setPlaylistData(
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
        await setPlaylistData(playlists);
        resolve(true);
      }
    } else
      reject({
        success: false,
        message: 'Playlists is not an array.',
      });
  });
};

const removeFromFavorites = async (songId: string) => {
  return new Promise(async (resolve, reject) => {
    const playlists = await getPlaylistData();
    if (playlists && Array.isArray(playlists)) {
      if (
        playlists.length > 0 &&
        playlists.some(
          (playlist) =>
            playlist.name === 'Favorites' && playlist.playlistId === 'Favorites'
        )
      ) {
        await setPlaylistData(
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
            } else return playlist;
          })
        );
        resolve({ success: true });
      }
    } else
      reject({
        success: false,
        message: 'Playlists is not an array.',
      });
  });
};

const addToSongsHistory = (songId: string) => {
  return new Promise(async (resolve, reject) => {
    let playlists = await getPlaylistData();
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
            playlist.songs.unshift(songId);
            return playlist;
          }
          return playlist;
        });
        await setPlaylistData(playlists);
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
        await setPlaylistData(playlists);
        resolve(true);
      }
    } else
      reject({
        success: false,
        message: 'Playlists is not an array.',
      });
  });
};

const addNewPlaylist = (
  name: string,
  songIds?: string[],
  artworkPath?: string
): Promise<{ success: boolean; message?: string; playlist?: Playlist }> => {
  return new Promise(async (resolve, reject) => {
    const playlists = await getPlaylistData();
    if (playlists && Array.isArray(playlists)) {
      if (playlists.some((playlist) => playlist.name === name)) {
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
          artworkPath,
        };
        playlists.push(newPlaylist);
        setPlaylistData(playlists);
        resolve({ success: true, playlist: newPlaylist });
      }
    } else
      reject({
        success: false,
        message: 'Playlists is not an array.',
      });
  });
};

const removeAPlaylist = (
  playlistId: string
): Promise<{ success: boolean; message?: string }> => {
  return new Promise(async (resolve, reject) => {
    const playlists = await getPlaylistData();
    if (playlists && Array.isArray(playlists)) {
      if (
        playlists.length > 0 &&
        playlists.some((playlist) => playlist.playlistId === playlistId)
      ) {
        const updatedPlaylists = playlists.filter(
          (playlist) => playlist.playlistId !== playlistId
        );
        await setPlaylistData(updatedPlaylists).then(() => {
          console.log(`Playlist with id ${playlistId} deleted.`);
          return resolve({
            success: true,
            message: `Playlist with id ${playlistId} deleted.`,
          });
        });
      } else
        reject({
          success: false,
          message: `Playlist with id ${playlistId} cannot be located.`,
        });
    } else
      reject({
        success: false,
        message: 'Playlists is not an array.',
      });
  });
};

const addSongToPlaylist = (playlistId: string, songId: string) => {
  return new Promise(async (resolve, reject) => {
    const playlists = await getPlaylistData();
    if (playlists && Array.isArray(playlists) && playlists.length > 0) {
      for (let x = 0; x < playlists.length; x += 1) {
        if (playlists[x].playlistId === playlistId) {
          if (playlists[x].songs.some((id) => id === songId)) {
            return resolve({
              success: false,
              message: `Song with id ${songId} already exists in playlist ${playlists[x].name}`,
            });
          } else {
            playlists[x].songs.push(songId);
            return await setPlaylistData(playlists).then(() =>
              resolve({
                success: true,
                message: `song ${songId} add to the playlist ${playlists[x].name} successfully.`,
              })
            );
          }
        }
      }
      return reject({
        success: false,
        message: `playlist with an id ${playlistId} couldn't be found.`,
      });
    }
  });
};

const getSongInfo = async (songId: string) => {
  if (songId) {
    const songsData = await getData()
      .then((data) => data.songs)
      .catch((err) => {
        logger(err);
        return undefined;
      });
    if (Array.isArray(songsData)) {
      for (let x = 0; x < songsData.length; x += 1) {
        const songData = songsData[x];
        if (songData.songId === songId) {
          return songData;
        }
      }
    }
    return undefined;
  } else return undefined;
};

const resetApp = async () => {
  try {
    const userDataPath = app.getPath('userData');
    await rm(path.join(userDataPath, 'song_covers'), {
      recursive: true,
    });
    await unlink(path.join(userDataPath, 'data.json'));
    await unlink(path.join(userDataPath, 'playlists.json'));
    await unlink(path.join(userDataPath, 'userData.json'));
    sendMessageToRenderer(
      'Successfully resetted the app. Restarting the app now.'
    );
  } catch (error) {
    sendMessageToRenderer('Resetting the app failed. Restarting the app now.');
    logger(error as Error);
  } finally {
    mainWindow.webContents.reload();
  }
};

const incrementNoOfSongListens = (songId: string) => {
  return new Promise(async (resolve, reject) => {
    const data = await getData().catch((err) => reject(err));
    if (data && data.songs) {
      for (let x = 0; x < data.songs.length; x += 1) {
        if (data.songs[x].songId === songId) {
          data.songs[x].listeningRate.allTime += 1;
          data.songs[x].listeningRate.monthly.months[
            new Date().getMonth()
          ] += 1;
          await setData(data).then(() => {
            console.log(`song listens incremented on '${data.songs[x].title}'`);
            resolve(true);
          });
        }
      }
      return reject(`no song with id ${songId}`);
    }
    return reject('data or songData of unknown type.');
  });
};
