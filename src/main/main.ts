/* eslint-disable promise/no-promise-in-callback */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable global-require */
/* eslint-disable promise/no-callback-in-promise */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable import/prefer-default-export */
/* eslint-disable no-lonely-if */
/* eslint-disable promise/catch-or-return */
/* eslint-disable prefer-destructuring */
/* eslint-disable consistent-return */
/* eslint-disable promise/no-nesting */
/* eslint-disable import/newline-after-import */
/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable prefer-const */
/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/return-await */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable promise/always-return */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-else-return */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
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

import * as musicMetaData from 'music-metadata';
// import lyricsFinder from 'lyrics-finder';
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

if (isDevelopment) {
  require('electron-debug')();
}

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
    title: 'Oto Music for Desktop',
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      devTools: true,
    },
    visualEffectState: 'followWindow',
    roundedCorners: true,
    frame: false,
    backgroundColor: '#fff',
    icon: getAssetPath('images', 'icons', 'logo_light_mode.ico'),
    titleBarStyle: 'hidden',
    show: false,
  });
  mainWindow.webContents.openDevTools({
    mode: 'detach',
  });
  mainWindow.loadURL(resolveHtmlPath('index.html'));
  // mainWindow.loadFile('../../public/index.html');
  mainWindow.once('ready-to-show', checkForNewSongs);
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

console.log(app.getPath('userData'));

app.whenReady().then(() => {
  protocol.registerFileProtocol('otomusic', (request, callback) => {
    const url = decodeURI(request.url).replace('otomusic://localFiles/', '');
    try {
      return callback(url);
    } catch (error) {
      console.error(error);
      return callback('404');
    }
  });
  createWindow();
  mainWindow.show();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('before-quit', () => {
    mainWindow.webContents.send('app/sendSongPosition');
  });

  ipcMain.on('app/close', () => app.quit());

  ipcMain.on('app/minimize', () => mainWindow.minimize());

  ipcMain.on('app/toggleMaximize', () =>
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
  );

  ipcMain.on('app/getSongPosition', async (_event, position: number) => {
    await saveUserData('currentSong.stoppedPosition', position).catch((err) =>
      logger(err)
    );
  });

  ipcMain.handle('app/addMusicFolder', addMusicFolder);

  ipcMain.handle('app/getSong', (_event, id: string) => sendAudioData(id));

  ipcMain.handle(
    'app/toggleLikeSong',
    (_e, songId: string, likeSong: boolean) => toggleLikeSong(songId, likeSong)
  );

  ipcMain.handle('app/checkForSongs', () => checkForSongs());

  ipcMain.handle(
    'app/saveUserData',
    async (_event, dataType: UserDataType, data: string) =>
      await saveUserData(dataType, data).catch((err) => logger(err))
  );

  ipcMain.handle('app/getUserData', async () => await getUserData());

  ipcMain.handle('app/search', search);

  ipcMain.handle(
    'app/getSongLyrics',
    async (_e, songTitle: string, songArtists: string) =>
      await sendSongLyrics(songTitle, songArtists)
  );

  ipcMain.handle('app/getSongInfo', (_e, songId: string) =>
    getSongInfo(songId)
  );

  ipcMain.on('app/openDevTools', () =>
    mainWindow.webContents.openDevTools({ mode: 'detach', activate: true })
  );

  ipcMain.handle(
    'app/getArtistArtworks',
    async (_e, artistId: string, artistName?: string) =>
      getArtistInfoFromNet(artistId, artistName)
  );

  ipcMain.handle(
    'app/getArtistData',
    async (_e, artistIdOrName: string) => await getArtistData(artistIdOrName)
  );

  ipcMain.handle(
    'app/getAlbumData',
    async (_e, albumId: string) => await getAlbumData(albumId)
  );

  ipcMain.handle('app/getPlaylistData', async (_e, playlistId: string) =>
    sendPlaylistData(playlistId)
  );

  ipcMain.handle('app/addNewPlaylist', async (_e, playlistName: string) =>
    addNewPlaylist(playlistName)
  );

  ipcMain.handle('app/resyncSongsLibrary', async () => checkForNewSongs());

  ipcMain.on('revealSongInFileExplorer', async (_e, songId: string) => {
    const data = await getData();
    const songs = data.songs;
    for (const song of songs) {
      if (song.songId === songId) return shell.showItemInFolder(song.path);
    }
  });
  ipcMain.on('app/openInBrowser', async (_e, url: string) =>
    shell.openExternal(url)
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

const addMusicFolder = async () => {
  const { canceled, filePaths: musicFolderPath } = await dialog.showOpenDialog(
    mainWindow,
    {
      title: 'Add a Music Folder',
      buttonLabel: 'Add folder',
      filters: [{ name: 'Audio Files', extensions: ['mp3'] }],
      properties: ['openFile', 'openDirectory'],
    }
  );
  if (canceled) return 'You cancelled the prompt.';
  console.log(musicFolderPath[0]);
  const data = await getFiles(musicFolderPath[0]);
  const songs: SongData[] = [];
  if (data) {
    for (const songPath of data) {
      await parseSong(songPath).then((res) => {
        if (res) songs.push(res);
      });
    }
  }
  return songs;
};

const sendSongLyrics = async (songTitle: string, songArtists?: string) => {
  const str = songArtists ? `${songTitle} - ${songArtists}` : songTitle;
  return songLyrics(str).then(
    (res) => res,
    (err) => {
      console.log(err);
      return undefined;
    }
  );
};

const sendAudioData = async (audioId: string) => {
  console.log('audio id', `-${audioId}-`);

  return await getData().then(async (jsonData) => {
    try {
      if (jsonData) {
        for (const songInfo of jsonData.songs) {
          // console.log(audioId, songInfo.songId, songInfo.songId === audioId);
          if (songInfo.songId === audioId) {
            const metadata = await musicMetaData
              .parseFile(songInfo.path)
              .catch((err) => logger(err));
            if (metadata) {
              const artworkData = metadata.common.picture
                ? metadata.common.picture[0].data
                : // : await getDefaultSongCoverImg();
                  '';
              await saveUserData('recentlyPlayedSongs', songInfo);
              await addToSongsHistory(songInfo.songId);
              const data: AudioData = {
                title: songInfo.title,
                artists: songInfo.artists,
                duration: songInfo.duration,
                artwork:
                  Buffer.from(artworkData).toString('base64') || undefined,
                artworkPath: songInfo.artworkPath,
                path: songInfo.path,
                songId: songInfo.songId,
                isAFavorite: songInfo.isAFavorite,
                album: songInfo.album,
              };
              await updateSongListeningRate(
                jsonData.songs,
                songInfo.songId
              ).catch((err: Error) => logger(err));
              return data;
            }
          }
        }
        console.log(`no matching song for songID the songId "${audioId}"`);
        return undefined;
      } else return await logger(new Error(`jsonData error. ${jsonData}`));
    } catch (err: any) {
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
            modifiedDate: songInfo.modifiedDate,
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

const search = async (_e: any, filter: string, value: string) => {
  const jsonData: Data = await getData();
  const songs =
    Array.isArray(jsonData.songs) &&
    jsonData.songs.length > 0 &&
    (filter === 'songs' || filter === 'all')
      ? jsonData.songs.filter(
          (data: SongData) =>
            new RegExp(value.replace(/[^w ]/, ''), 'gim').test(data.title) ||
            new RegExp(value.replace(/[^w ]/, ''), 'gim').test(
              data.artists.join(' ')
            )
        )
      : [];
  const artists =
    Array.isArray(jsonData.artists) &&
    jsonData.artists.length > 0 &&
    (filter === 'artists' || filter === 'all')
      ? jsonData.artists.filter((data: Artist) =>
          new RegExp(value, 'gim').test(data.name)
        )
      : [];
  const albums =
    Array.isArray(jsonData.albums) &&
    jsonData.albums.length > 0 &&
    (filter === 'albums' || filter === 'all')
      ? jsonData.albums.filter((data: Album) =>
          new RegExp(value, 'gim').test(data.title)
        )
      : [];
  return {
    songs: songs || [],
    artists: artists || [],
    albums: albums || [],
  };
};

const toggleLikeSong = async (songId: string, likeSong: boolean) => {
  const data = await getData();
  let result: ToggleLikeSongReturnValue = {
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
        } else {
          if (song.isAFavorite) {
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
        }
      } else return song;
    });
    await setData(data);
    return result;
  } else return result;
};

export const sendNewSongUpdates = (update: string) => {
  mainWindow.webContents.send('app/sendNewSongUpdates', update);
};

const getArtistInfoFromNet = (
  artistId: string,
  artistName?: string
): Promise<ArtistInfoFromNet | undefined> => {
  return new Promise(async (resolve, reject) => {
    if (artistName) {
      return httpsGet.concat(
        `https://api.deezer.com/search/artist?q=${artistName}`,
        (err, _res, data) => {
          if (err) return reject(err);
          return resolve(JSON.parse(data.toString('utf-8')) as any);
        }
      );
    } else if (artistId && artistId !== '') {
      const data = await getData();
      if (data && data.artists && data.artists.length > 0) {
        const artists = data.artists;
        for (const artist of artists) {
          if (artist.artistId === artistId) {
            return httpsGet.concat(
              `https://api.deezer.com/search/artist?q=${encodeURI(
                artist.name
              )}`,
              (err, _res, data) => {
                if (err) return reject(undefined);
                const arr = JSON.parse(data.toString('utf-8')) as {
                  data: ArtistInfoFromNet[];
                };
                // console.log(arr);
                nodeVibrant
                  .from(arr.data[0].picture_medium)
                  .getPalette()
                  .then((palette) => {
                    // console.log(palette);
                    const res = arr.data[0];
                    httpsGet.concat(
                      `http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${artist.name}&api_key=0aac0c7edaf4797bcc63bd8688b43b30&format=json`,
                      (err, _res, data) => {
                        if (err)
                          return resolve({
                            ...res,
                            artistPalette:
                              palette as unknown as NodeVibrantPalette,
                          });
                        const response = JSON.parse(
                          data.toString('utf-8')
                        ) as LastFMArtistDataApi;
                        if (response.error)
                          return resolve({
                            ...res,
                            artistPalette:
                              palette as unknown as NodeVibrantPalette,
                          });
                        else {
                          const artistBio = response.artist.bio.summary;
                          resolve({
                            ...res,
                            artistPalette:
                              palette as unknown as NodeVibrantPalette,
                            artistBio,
                          });
                        }
                      }
                    );
                  });
                // resolve(data ? JSON.parse(data.toString('utf-8')) : undefined);
              }
            );
          }
        }
      }
    } else return resolve(undefined);
  });
};

const getArtistData = async (artistIdOrName = '*') => {
  if (artistIdOrName) {
    const data = await getData();
    if (data && data.artists) {
      const artists = data.artists;
      if (artistIdOrName === '*') return artists;
      else {
        for (const artist of artists) {
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
      const albums = data.albums;
      if (albumId === '*') return albums;
      else {
        for (const album of albums) {
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
      for (const playlist of playlists) {
        if (playlist.playlistId === playlistId) return playlist;
      }
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
              const songs = playlist.songs;
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
        playlists.filter((playlist) => playlist.playlistId !== playlistId);
        await setPlaylistData(playlists);
        resolve({ success: true });
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

const getSongInfo = async (songId: string) => {
  if (songId) {
    const songsData = await getData()
      .then((data) => data.songs)
      .catch((err) => {
        logger(err);
        return undefined;
      });
    if (Array.isArray(songsData)) {
      for (const songData of songsData) {
        if (songData.songId === songId) {
          return songData;
        }
      }
    }
    return undefined;
  } else return undefined;
};
