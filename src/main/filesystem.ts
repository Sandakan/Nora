/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable promise/no-nesting */
/* eslint-disable consistent-return */
/* eslint-disable promise/no-return-in-finally */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import fs from 'fs/promises';
import fsOther from 'fs';
import path from 'path';
import { app } from 'electron';
import Store from 'electron-store';
import trash from 'trash';
import * as musicMetaData from 'music-metadata';
import sharp from 'sharp';
import { parseSong } from './parseSong';
import log from './log';
import { getAssetPath, dataUpdateEvent } from './main';
const dataStore = new Store({
  name: 'data',
});
const userDataStore = new Store({
  name: 'userData',
});

const playlistDataStore = new Store({
  name: 'playlists',
});

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

let cachedData: Data = dataStore.store as any;
let cachedPlaylistsData: { playlists: Playlist[] } =
  playlistDataStore.store as any;
let cachedUserData: UserData = userDataStore.store as any;

if (cachedData && Object.keys(cachedData).length === 0) {
  const songDataTemplate: Data = {
    songs: [],
    albums: [],
    artists: [],
    genres: [],
  };
  dataStore.set({ ...songDataTemplate });
  cachedData = songDataTemplate;
}

if (cachedUserData && Object.keys(cachedUserData).length === 0) {
  const userDataTemplate: UserData = {
    theme: { isDarkMode: false },
    currentSong: { songId: null, stoppedPosition: 0 },
    volume: { isMuted: false, value: 100 },
    recentlyPlayedSongs: [],
    musicFolders: [],
    songBlacklist: [],
    defaultPage: 'Home',
    isShuffling: false,
    isRepeating: 'false',
    preferences: {
      doNotShowRemoveSongFromLibraryConfirm: false,
      isReducedMotion: false,
      songIndexing: false,
      autoLaunchApp: false,
    },
  };
  userDataStore.set({ ...userDataTemplate });
  cachedUserData = userDataTemplate;
}
if (cachedPlaylistsData && Object.keys(cachedPlaylistsData).length === 0) {
  const playlistDataTemplate: PlaylistDataTemplate = {
    playlists: [
      {
        name: 'History',
        playlistId: 'History',
        createdDate: new Date(),
        songs: [],
        artworkPath: path.join(
          RESOURCES_PATH,
          'images',
          'history-playlist-icon.png'
        ),
      },
      {
        name: 'Favorites',
        playlistId: 'Favorites',
        createdDate: new Date(),
        songs: [],
        artworkPath: path.join(
          RESOURCES_PATH,
          'images',
          'favorites-playlist-icon.png'
        ),
      },
    ],
  };
  playlistDataStore.set({ ...playlistDataTemplate });
  cachedPlaylistsData = playlistDataTemplate;
}

export const getUserData = () => {
  if (cachedUserData && Object.keys(cachedUserData).length !== 0)
    return cachedUserData;
  else return userDataStore.store as any as UserData;
};

export const setUserData = (dataType: UserDataTypes, data: unknown) => {
  const userData = getUserData();
  if (userData) {
    if (dataType === 'theme.isDarkMode' && typeof data === 'boolean')
      userData.theme.isDarkMode = data;
    else if (dataType === 'currentSong.songId' && typeof data === 'string')
      userData.currentSong.songId = data;
    else if (
      dataType === 'currentSong.stoppedPosition' &&
      typeof data === 'number'
    )
      userData.currentSong.stoppedPosition = data;
    else if (dataType === 'volume.value' && typeof data === 'number')
      userData.volume.value = data;
    else if (dataType === 'volume.isMuted' && typeof data === 'boolean')
      userData.volume.isMuted = data;
    else if (dataType === 'recentlyPlayedSongs' && typeof data === 'object') {
      const val = userData.recentlyPlayedSongs.filter(
        (x) => x.songId !== (data as SongData).songId
      );
      if (val.length >= 5) val.pop();
      val.unshift(data as SongData);
      userData.recentlyPlayedSongs = val;
    } else if (dataType === 'musicFolders' && Array.isArray(data)) {
      userData.musicFolders = data;
    } else if (dataType === 'defaultPage' && typeof data === 'string') {
      userData.defaultPage = data as DefaultPages;
    } else if (dataType === 'isRepeating' && typeof data === 'string') {
      userData.isRepeating = data as RepeatTypes;
    } else if (dataType === 'isShuffling' && typeof data === 'boolean') {
      userData.isShuffling = data;
    } else if (dataType === 'queue' && typeof data === 'object') {
      userData.queue = data as Queue;
    } else if (dataType === 'songBlacklist' && Array.isArray(data)) {
      userData.songBlacklist = data as string[];
    } else if (
      dataType === 'preferences.doNotShowRemoveSongFromLibraryConfirm' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.doNotShowRemoveSongFromLibraryConfirm = data;
    } else if (
      dataType === 'preferences.isReducedMotion' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.isReducedMotion = data;
    } else if (
      dataType === 'preferences.songIndexing' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.songIndexing = data;
    } else if (
      dataType === 'preferences.autoLaunchApp' &&
      typeof data === 'boolean'
    ) {
      userData.preferences.autoLaunchApp = data;
    } else
      log(
        'Error occurred in setUserData function due ot invalid dataType or data.'
      );

    cachedUserData = userData;
    userDataStore.store = { ...userData };

    if (dataType === 'recentlyPlayedSongs')
      dataUpdateEvent('userData/recentlyPlayedSongs');
    else if (dataType === 'musicFolders')
      dataUpdateEvent('userData/musicFolder');
    else if (
      dataType === 'currentSong.songId' ||
      dataType === 'currentSong.stoppedPosition'
    )
      dataUpdateEvent('userData/currentSong');
    else if (dataType === 'queue') dataUpdateEvent('userData/queue');
    else if (dataType === 'volume.isMuted' || dataType === 'volume.value')
      dataUpdateEvent('userData/volume');
    else dataUpdateEvent('userData');
  } else {
    log(
      `===== ERROR OCCURRED WHEN READING USER DATA. USER DATA ARRAY IS EMPTY.\nARRAY : ${userData}`
    );
  }
};

export const getData = () => {
  if (cachedData && Object.keys(cachedData).length !== 0) {
    return cachedData;
  } else {
    return dataStore.store as any as Data;
  }
};

export const setData = (newData: Data) => {
  cachedData = newData;
  dataStore.store = { ...newData };
};

export const storeSongArtworks = (
  artworks: musicMetaData.IPicture[],
  artworkName: string
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    await fs
      .stat(path.join(app.getPath('userData'), 'song_covers'))
      .catch(async (err) => {
        if (err.code === 'ENOENT') {
          await fs.mkdir(path.join(app.getPath('userData'), 'song_covers'));
        } else reject(err);
      })
      .finally(async () => {
        if (artworks[0]) {
          const imgPath = path.join(
            app.getPath('userData'),
            'song_covers',
            `${artworkName}.webp`
          );
          const optimizedImgPath = path.join(
            app.getPath('userData'),
            'song_covers',
            `${artworkName}-optimized.webp`
          );
          await sharp(artworks[0].data)
            .webp()
            .toFile(imgPath)
            .then(() => resolve(imgPath))
            .catch((err) => {
              log(
                `====== ERROR OCCURRED WHEN CREATING ARTWORK OF A SONG WITH SONGID -${artworkName}- IMAGE USING SHARP PACKAGE ======\nERROR : ${err}`
              );
              return reject(err);
            });
          await sharp(artworks[0].data)
            .webp({ quality: 50, effort: 0 })
            .resize(50, 50)
            .toFile(optimizedImgPath)
            .catch((err) => {
              log(
                `====== ERROR OCCURRED WHEN OPTIMIZING ARTWORK OF A SONG WITH SONGID -${artworkName}- IMAGE USING SHARP PACKAGE ======\nERROR : ${err}`
              );
              return reject(err);
            });
        }
        return resolve(getAssetPath('images', 'song_cover_default.png'));
      });
  });
};

function flatten(lists: any[]) {
  return lists.reduce((a, b) => a.concat(b), []);
}

function getDirectories(srcpath: string) {
  return fsOther
    .readdirSync(srcpath)
    .map((file) => path.join(srcpath, file))
    .filter((path) => fsOther.statSync(path).isDirectory());
}

function getDirectoriesRecursive(srcpath: string): string[] {
  return [
    srcpath,
    ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive)),
  ];
}

export const getFiles = async (dir: string) => {
  const { musicFolders } = getUserData();
  const allFolders = getDirectoriesRecursive(dir);
  log(`${allFolders.length} directories found in the directory ${dir}`);
  const allFiles = allFolders
    .map((folder) => {
      const x = fsOther.readdirSync(folder).map((y) => path.join(folder, y));
      return x;
    })
    .flat();
  log(`${allFiles.length} files found in the directory ${dir}`);
  const foldersWithStatData = [];
  for (const folderPath of allFolders) {
    try {
      const stats = await fs.stat(folderPath);
      foldersWithStatData.push({
        path: folderPath,
        stats: {
          lastModifiedDate: stats.mtime,
          lastChangedDate: stats.ctime,
          fileCreatedDate: stats.birthtime,
          lastParsedDate: new Date(),
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
  foldersWithStatData.filter((path) =>
    musicFolders.some((folderPath) => folderPath.path !== path.path)
  );
  if (foldersWithStatData.length > 0)
    setUserData('musicFolders', musicFolders.concat(foldersWithStatData));
  const allSongs = allFiles.filter((filePath) => {
    const fileExtension = path.extname(filePath);
    return fileExtension === '.mp3';
  });
  log(`${allSongs.length} songs found in the directory ${dir}`);
  return allSongs;
};

export const checkForNewSongs = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const musicFolders: MusicFolderData[] = userDataStore.get(
      'musicFolders'
    ) as any;
    log(`${musicFolders.length} music folders found in user data.`);
    if (musicFolders) {
      musicFolders.forEach(async (folder, index) => {
        await fs
          .stat(folder.path)
          .then((stats) => {
            if (
              stats.mtime.toUTCString() ===
              new Date(folder.stats.lastModifiedDate).toUTCString()
            ) {
              log(
                `'${path.basename(folder.path)}' folder has no modifications.`
              );
            } else {
              log(
                `'${path.basename(
                  folder.path
                )}' folder has unknown modifications.`
              );
              checkFolderForUnknownModifications(folder.path);
              musicFolders[index].stats.lastModifiedDate = stats.mtime;
            }
          })
          .catch((err) => {
            log(
              `====== ERROR OCCURRED WHEN FETCHING STATS FOR '${path.basename(
                folder.path
              )}' FOLDER. ======\nERROR : ${err}`
            );
            reject(err);
          });
        fsOther.watch(folder.path, (eventType, filename) => {
          if (filename) {
            if (eventType === 'rename' && path.extname(filename) === '.mp3') {
              try {
                const modifiedDate = fsOther.statSync(folder.path).mtime;
                if (
                  modifiedDate &&
                  musicFolders[index].stats.lastModifiedDate !== modifiedDate
                ) {
                  musicFolders[index].stats.lastModifiedDate = modifiedDate;
                  userDataStore.set('musicFolders', musicFolders);
                  log(`'${path.basename(folder.path)}' folder data updated.`);
                } else
                  log(
                    `No need to update '${path.basename(
                      folder.path
                    )}' folder data`
                  );
                checkFolderForModifications(folder.path, filename)
                  .then(() =>
                    log(`Modification related to ${filename} finished.`)
                  )
                  .catch((err) => {
                    log(
                      `====== ERROR OCCURRED WHEN TRYING TO PARSE MODIFICATIONS IN '${filename}' ======\nERROR : ${err}`
                    );
                    return reject(err);
                  });
              } catch (error) {
                log(
                  `====== ERROR OCCURRED WHEN CHECKING FOR NEW SONGS ======\nERROR : ${error}`
                );
                reject(error);
              }
            }
          } else {
            log(
              '===== ERROR OCCURRED WHEN TRYING TO READ NEWLY ADDED SONGS. FILE WATCHER FUNCTION SENT A FILENAME OF undefined. ====='
            );
            return reject(
              new Error('error occurred when trying to read newly added songs.')
            );
          }
        });

        return resolve(true);
      });
      return resolve(true);
    } else
      log(
        `===== ERROR OCCURRED WHEN TRYING TO READ MUSIC FOLDERS ARRAY IN USER DATA. IT WAS POSSIBLY EMPTY. ======`
      );
  });
};
// ! - checkFolderForUnknownModifications function is not working as intended.
const checkFolderForUnknownModifications = async (folderPath: string) => {
  const songsData = dataStore.get('songs') as SongData[];
  const relevantFolderSongsData = Array.isArray(songsData)
    ? songsData.filter((songData) => path.dirname(songData.path) === folderPath)
    : undefined;
  const newSongPaths: string[] = [];
  const deletedSongPaths: string[] = [];
  if (relevantFolderSongsData) {
    const dirs = await fs
      .readdir(folderPath)
      .then((res) => {
        return res
          .filter((filePath) => path.extname(filePath) === '.mp3')
          .map((filepath) => path.join(folderPath, filepath));
      })
      .catch((err) =>
        log(
          `===== ERROR OCCURRED WHEN TRYING TO READ THE DIRECTORY.======\nERROR : ${err}`
        )
      );
    if (dirs) {
      for (const dir of dirs) {
        // checks for newly added songs that got added before application launch
        if (!relevantFolderSongsData.some((song) => song.path === dir))
          newSongPaths.push(dir);
      }
      for (const songData of relevantFolderSongsData) {
        // checks for deleted songs that got deleted before application launch
        if (!dirs.some((dir) => dir === songData.path))
          deletedSongPaths.push(songData.path);
      }
      log(
        `${newSongPaths.length} newly added songs found. ${
          deletedSongPaths.length
        } song deletions found.${
          newSongPaths.length > 0 || deletedSongPaths.length > 0
            ? `\nNewSongs : '${newSongPaths}';\n DeletedSongs : '${deletedSongPaths}';`
            : ''
        }`
      );
    }
    if (newSongPaths.length > 0) {
      // parses new songs that added before application launch
      for (const newSongPath of newSongPaths) {
        const newSongData = await parseSong(newSongPath).catch((err) =>
          log(
            `====== ERROR OCCURRED WHEN PARSING SONGS ADDED BEFORE APPLICATION LAUNCH ======\nERROR : ${err}`
          )
        );
        if (newSongData) {
          log(`${path.basename(newSongPath)} song added.`);
        }
      }
    }
    if (deletedSongPaths.length > 0) {
      // deleting songs from the library that got deleted before application launch
      for (let x = 0; x < deletedSongPaths.length; x += 1) {
        removeSongFromLibrary(
          folderPath,
          path.basename(deletedSongPaths[x]),
          false
        ).catch((err) => {
          log(
            `====== ERROR OCCURRED WHEN PARSING THE SONG TO GET METADATA ======\nERROR : ${err}`
          );
        });
      }
    }
  }
};

const checkFolderForModifications = (
  folderPath: string,
  filename: string
): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    log('Started checking folder for modifications.');
    const dirs = await fs
      .readdir(folderPath)
      .then((dirs) => dirs.filter((dir) => path.extname(dir) === '.mp3'))
      .catch((err) => {
        log(
          `====== ERROR OCCURRED WHEN READING DIRECTORY '${folderPath}'\nERROR : ${err}`
        );
        reject(err);
      });
    const songs: SongData[] = dataStore.get('songs') as any;
    if (dirs && songs && Array.isArray(songs)) {
      // checks whether the songs is newly added or deleted.
      if (
        dirs.some(
          (dir) => dir === filename && path.extname(filename) === '.mp3'
        )
      ) {
        // new song added
        let errRetryCount = 0;
        const tryParseSong = async (absolutePath: string): Promise<void> => {
          try {
            await parseSong(absolutePath);
            log(`'${filename}' song added to the library.`);
            dataUpdateEvent('songs/newSong');
            return resolve(true);
          } catch (error: any) {
            if (error.code && error.code === 'EINVAL' && errRetryCount < 10) {
              // THIS ERROR OCCURRED WHEN THE APP STARTS READING DATA WHILE THE SONG IS STILL WRITING TO THE DISK. POSSIBLE SOLUTION IS TO SET A TIMEOUT AND REDO THE PROCESS.
              log(
                'Error occurred when trying to parse data. Retrying in 5 seconds. (Error: read error)'
              );
              errRetryCount += 1;
              setTimeout(async () => await tryParseSong(absolutePath), 5000);
            } else {
              log(
                `====== ERROR OCCURRED WHEN PARSING A NEWLY ADDED SONG WHILE THE APP IS OPEN. FAILED 5 OF 5 RETRY EFFORTS. ======\nERROR : ${error}`
              );
              return reject(error);
            }
          }
        };
        return tryParseSong(path.join(folderPath, filename));
      } else if (
        songs.some(
          (song) =>
            song.path === path.normalize(path.join(folderPath, filename))
        )
      ) {
        // possible song deletion
        removeSongFromLibrary(folderPath, filename, false)
          .then(() => resolve(true))
          .catch((err) => reject(err));
      } else
        log(`${filename} got deleted which is not relevant to the library.`);
      return resolve(true);
    }
  });
};

export const removeSongFromLibrary = (
  folderPath: string,
  filename: string,
  isBlacklisted = true
): Promise<{ success: boolean; message?: string }> => {
  return new Promise((resolve, reject) => {
    log(`Started the deletion process of the song '${filename}'`);
    const songs: SongData[] = dataStore.get('songs') as any;
    const artists: Artist[] = dataStore.get('artists') as any;
    const albums: Album[] = dataStore.get('albums') as any;
    const genres: Genre[] = dataStore.get('genres') as any;
    const playlists = getPlaylistData();
    const userData = getUserData();
    const updatedSongs = songs.filter((song) => {
      if (song.path === path.normalize(path.join(folderPath, filename))) {
        if (userData && Object.keys(userData).length > 0) {
          if (userData.currentSong.songId === song.songId) {
            const recentSongs = userData.recentlyPlayedSongs.filter(
              (recentSong) => recentSong.songId !== song.songId
            );
            setUserData('recentlyPlayedSongs', recentSongs);
            log(
              'Recently played songs updated because a song in it got deleted.'
            );
          }
        }
        if (
          Array.isArray(artists) &&
          artists.length > 0 &&
          Array.isArray(song.artists) &&
          song.artists.length > 0 &&
          artists.some((artist) =>
            song.artists
              ? song.artists.some((x) => x.name === artist.name)
              : false
          )
        ) {
          song.artists.forEach((art) => {
            for (let x = 0; x < artists.length; x++) {
              if (artists[x].name === art.name) {
                if (artists[x].songs.length > 1) {
                  artists[x].songs = artists[x].songs.filter(
                    (y) => y.songId !== song.songId
                  );
                  log(
                    `Data related to '${song.title}' in artist '${artists[x].name}' removed.`
                  );
                } else if (
                  artists[x].songs.length === 1 &&
                  artists[x].songs[0].songId === song.songId
                ) {
                  log(
                    `Artist '${artists[x].name}' related to '${song.title}' removed because of it doesn't contain any other songs.`
                  );
                  artists.splice(x, 1);
                } else {
                  artists.splice(x, 1);
                  log(
                    `Artist '${artists[x].name}' removed because it doesn't have any songs.`
                  );
                }
              }
            }
          });
        }
        if (
          Array.isArray(albums) &&
          albums.length > 0 &&
          albums.some(
            (album) => song.album && album.albumId === song.album.albumId
          )
        ) {
          for (let x = 0; x < albums.length; x++) {
            if (song.album && albums[x].albumId === song.album.albumId) {
              if (albums[x].songs.length > 1) {
                albums[x].songs = albums[x].songs.filter(
                  (y) => y.songId !== song.songId
                );
                log(
                  `Data related to '${song.title}' in album '${albums[x].title}' removed.`
                );
              } else if (
                albums[x].songs.length === 1 &&
                albums[x].songs[0].songId === song.songId
              ) {
                log(
                  `Album '${albums[x].title}' related to '${song.title}' removed because of it doesn't contain any other songs.`
                );
                albums.splice(x, 1);
              } else {
                albums.splice(x, 1);
                log(
                  `Album '${albums[x].title}' removed because it doesn't have any songs.`
                );
              }
            }
          }
        }
        if (
          Array.isArray(playlists) &&
          playlists.length > 0 &&
          playlists.some((playlist) =>
            playlist.songs.some((str) => str === song.songId)
          )
        ) {
          for (let x = 0; x < playlists.length; x++) {
            if (
              playlists[x].songs.length > 0 &&
              playlists[x].songs.some((y) => y === song.songId)
            ) {
              playlists[x].songs.splice(
                playlists[x].songs.indexOf(song.songId),
                1
              );
              log(
                `Data related to '${song.title}' in playlist '${playlists[x].name}' removed.`
              );
            } else
              log(
                `Playlist '${playlists[x].name}' removed because it doesn't have any songs.`
              );
          }
        }
        if (
          Array.isArray(genres) &&
          genres.length > 0 &&
          song.genres &&
          song.genres.length > 0 &&
          genres.some((genre) =>
            song.genres
              ? song.genres.some(
                  (songGenre) => songGenre.genreId === genre.genreId
                )
              : false
          )
        ) {
          song.genres.forEach((songGenre) => {
            for (let x = 0; x < genres.length; x++) {
              if (genres[x].name === songGenre.name) {
                if (genres[x].songs.length > 1) {
                  genres[x].songs = genres[x].songs.filter(
                    (y) => y.songId !== song.songId
                  );
                  log(
                    `Data related to '${song.title}' in genre '${genres[x].name}' removed.`
                  );
                } else if (
                  genres[x].songs.length === 1 &&
                  genres[x].songs[0].songId === song.songId
                ) {
                  log(
                    `Genre '${genres[x].name}' related to '${song.title}' removed because of it doesn't contain any other songs.`
                  );
                  genres.splice(x, 1);
                } else
                  log(
                    `Genre '${genres[x].name}' removed because it doesn't have any songs.`
                  );
              }
            }
          });
        }
        if (path.basename(song.artworkPath) !== 'song_cover_default.png') {
          fs.unlink(song.artworkPath).catch((err) => reject(err));
          fs.unlink(song.artworkPath.replace('.webp', '-optimized.webp')).catch(
            (err) => reject(err)
          );
        }
        return false;
      }
      return true;
    });
    if (updatedSongs && artists && albums) {
      dataStore.store = { songs: updatedSongs, artists, albums, genres };
      dataUpdateEvent('songs/deletedSong');
    }
    if (playlists) setPlaylistData(playlists);
    if (userData && isBlacklisted) {
      setUserData('songBlacklist', [
        ...userData.songBlacklist,
        path.join(folderPath, filename),
      ]);
      dataUpdateEvent('userData/blacklist');
      log('Blacklist updated because a new song got blacklisted.');
    }
    dataUpdateEvent('artists');
    dataUpdateEvent('albums');
    log(`'${filename}' song removed from the library.`);
    return resolve({
      success: true,
      message: `song '${filename}' removed and artists, albums,playlists related to it updated.`,
    });
  });
};

export const removeAMusicFolder = (
  absolutePath: string
): Promise<boolean | undefined> => {
  return new Promise(async (resolve) => {
    log(`STARTED THE PROCESS OF REMOVING '${absolutePath}' FROM THE SYSTEM.`);
    const { musicFolders } = getUserData();
    if (
      Array.isArray(musicFolders) &&
      musicFolders.length > 0 &&
      musicFolders.some((folder) => folder.path === absolutePath)
    ) {
      const relatedFolders = getDirectoriesRecursive(absolutePath);
      if (relatedFolders.length > 1) {
        log(
          `${
            relatedFolders.length
          } sub-directories found inside the '${path.basename(
            absolutePath
          )}' directory. Files inside these directories will be deleted too.\n SUB DIRECTORIES : ${relatedFolders} `
        );
        const allFiles = await Promise.all(
          relatedFolders.map((folderPath) => getFiles(folderPath))
        )
          .then((data) => data.flat())
          .catch((err) => {
            log(
              `====== ERROR OCCURRED WHEN READING FILES RELATED TO THE '${path.basename(
                absolutePath
              )}' ======\nERROR : ${err}`
            );
          });
        if (allFiles) {
          for (let x = 0; x < allFiles.length; x++) {
            await removeSongFromLibrary(
              path.dirname(allFiles[x]),
              path.basename(allFiles[x])
            ).catch((err) => {
              log(
                `====== ERROR OCCURRED WHEN TRYING TO REMOVE '${path.basename(
                  allFiles[x]
                )}' SONG. ======\nERROR : ${err}`
              );
            });
          }
        }
      } else {
        const allFiles = await getFiles(absolutePath);
        if (allFiles) {
          for (let x = 0; x < allFiles.length; x++) {
            await removeSongFromLibrary(
              absolutePath,
              path.basename(allFiles[x])
            );
          }
        }
      }
      const updatedMusicFolders = musicFolders.filter(
        (folder) => !relatedFolders.some((x) => x === folder.path)
      );
      setUserData('musicFolders', updatedMusicFolders);

      log(
        `Deleted ${relatedFolders.length} directories.\n DATA : ${relatedFolders}`
      );
      resolve(true);
    }
  });
};

export const getPlaylistData = (playlistIds = []) => {
  log(`Requesting playlist data for ids '${playlistIds.join(',')}'`);
  if (cachedPlaylistsData && Object.keys(cachedPlaylistsData).length !== 0) {
    if (playlistIds && playlistIds.length === 0)
      return cachedPlaylistsData.playlists;
    else {
      const results: Playlist[] = [];
      for (let x = 0; x < cachedPlaylistsData.playlists.length; x++) {
        for (let y = 0; y < playlistIds.length; y++) {
          if (cachedPlaylistsData.playlists[x].playlistId === playlistIds[y])
            results.push(cachedPlaylistsData.playlists[x]);
        }
      }
      return results;
    }
  } else return playlistDataStore.store as any as Playlist[];
};

export const setPlaylistData = (updatedPlaylists: Playlist[]) => {
  log('Updating Playlist Data.');
  dataUpdateEvent('playlists');
  cachedPlaylistsData = { playlists: updatedPlaylists };
  playlistDataStore.store = { playlists: updatedPlaylists };
};

export const updateSongListeningRate = (
  songsData: SongData[],
  songId: string
) => {
  if (Array.isArray(songsData) && songId) {
    songsData = songsData.map((songInfo) => {
      if (songInfo.songId === songId) {
        songInfo.listeningRate.allTime++;
        if (songInfo.listeningRate.monthly.year === new Date().getFullYear()) {
          songInfo.listeningRate.monthly.months[new Date().getMonth()]++;
        } else {
          songInfo.listeningRate.monthly.months = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          ];
          songInfo.listeningRate.monthly.year = new Date().getFullYear();
          songInfo.listeningRate.monthly.months[new Date().getMonth()]++;
        }
      }
      return songInfo;
    });
    dataStore.set('songs', songsData);
    dataUpdateEvent('songs/noOfListens');
  }
};

export const deleteSongFromSystem = (
  absoluteFilePath: string,
  isPermanentDelete = false
) => {
  return new Promise(async (resolve, reject) => {
    log(
      `Started the deletion process of '${path.basename(
        absoluteFilePath
      )}' song.`
    );
    if (path.extname(absoluteFilePath) === '.mp3') {
      const res = await removeSongFromLibrary(
        path.dirname(absoluteFilePath),
        path.basename(absoluteFilePath),
        false
      ).catch((err) => {
        log(
          `====== ERROR OCCURRED WHEN TRYING TO REMOVE SONG DATA RELATED TO '${path.basename(
            absoluteFilePath
          )}' SONG FROM THE SYSTEM. =======\nERROR : ${err}`
        );
        return reject(err);
      });
      if (res && res.success)
        if (!isPermanentDelete)
          await trash(absoluteFilePath)
            .then(() => {
              log(
                `'${path.basename(
                  absoluteFilePath
                )}' song moved to the recycled bin.`
              );
              resolve({
                success: true,
                message: `Moved '${path.basename(
                  absoluteFilePath
                )}'to the Recycle bin/Trash.`,
              });
            })
            .catch((err) => {
              log(
                `====== ERROR OCCURRED WHEN TRYING TO DELETE '${path.basename(
                  absoluteFilePath
                )}' SONG FROM THE SYSTEM. =======\nERROR : ${err}`
              );
              return reject(err);
            });
        else
          await fs
            .unlink(absoluteFilePath)
            .then(() => {
              log(
                `'${path.basename(
                  absoluteFilePath
                )}' song permanently removed from the system.`
              );
              resolve({
                success: true,
                message: `Removed '${path.basename(
                  absoluteFilePath
                )}' from the system.`,
              });
            })
            .catch((err) => {
              log(
                `====== ERROR OCCURRED WHEN TRYING TO DELETE '${path.basename(
                  absoluteFilePath
                )}' SONG FROM THE SYSTEM. =======\nERROR : ${err}`
              );
              return reject(err);
            });
    } else {
      log(
        `TRIED TO DELETE A RESOURCE WHICH IS RECOGNIZED AS A SONG.\nPATH : ${absoluteFilePath}`
      );
      return resolve({
        success: false,
        message: `'${path.basename(absoluteFilePath)}' is not a song.`,
      });
    }
  });
};

export const restoreBlacklistedSong = (absolutePath: string) => {
  return new Promise((resolve, reject) => {
    log(
      `Started the blacklist song restoring process for '${path.basename(
        absolutePath
      )}'`
    );
    const userData = getUserData();
    if (userData && userData.songBlacklist.length > 0) {
      if (
        userData.songBlacklist.some((songPath) => songPath === absolutePath)
      ) {
        userData.songBlacklist = userData.songBlacklist.filter(
          (songPath) => songPath !== absolutePath
        );
        parseSong(absolutePath)
          .then((res) => {
            log(
              `'${
                res ? res.title : absolutePath
              }' song restored successfully from the blacklist.`
            );
            setUserData('songBlacklist', userData.songBlacklist);
            return resolve(true);
          })
          .catch((err) => reject(err));
      } else {
        log(
          `AN UN-BLACKLISTED SONG IS REQUESTED TO RESTORE FROM THE BLACKLIST.\nSONG PATH : ${absolutePath}`
        );
        return reject(
          `There's no song with the given path in the song blacklist.`
        );
      }
    } else return reject('Userdata empty or song blacklist is empty');
  });
};
