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
import * as musicMetaData from 'music-metadata';
import sharp from 'sharp';
import { parseSong } from './parseSong';
import { logger } from './logger';
import { getAssetPath, dataUpdateEvent } from './main';
const songDataStore = new Store({
  name: 'data',
});
const userDataStore = new Store({
  name: 'userData',
});

const playlistDataStore = new Store({
  name: 'playlists',
});

// const sendNewSong = (songs: SongData[]) => {};

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
  const { musicFolders } = await getUserData();
  const allFolders = getDirectoriesRecursive(dir);
  const allFiles = allFolders
    .map((folder) => {
      const x = fsOther.readdirSync(folder).map((y) => path.join(folder, y));
      return x;
    })
    .flat();
  let foldersWithStatData = [];
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
  if (foldersWithStatData && foldersWithStatData.length > 0)
    await setUserData('musicFolders', musicFolders.concat(foldersWithStatData));
  const allSongs = allFiles.filter((filePath) => {
    const fileExtension = path.extname(filePath);
    return fileExtension === '.mp3';
  });
  return allSongs;
};

export const getUserData = async () => {
  const data: UserData = (await userDataStore.store) as any;
  if (data && Object.keys(data).length !== 0) return data;
  else {
    const userDataTemplate: UserData = {
      theme: { isDarkMode: false },
      currentSong: { songId: null, stoppedPosition: 0 },
      volume: { isMuted: false, value: 100 },
      recentlyPlayedSongs: [],
      musicFolders: [],
      defaultPage: 'Home',
    };
    userDataStore.store = { ...userDataTemplate };
    return userDataTemplate;
  }
};
export const setUserData = async (dataType: UserDataType, data: any) => {
  const userData = await getUserData();
  if (userData) {
    if (dataType === 'theme.isDarkMode') {
      if (data === 'true') userData.theme.isDarkMode = true;
      if (data === 'false') userData.theme.isDarkMode = false;
    }
    if (dataType === 'currentSong.songId') userData.currentSong.songId = data;
    if (dataType === 'currentSong.stoppedPosition')
      userData.currentSong.stoppedPosition = parseFloat(data);
    if (dataType === 'volume.value') userData.volume.value = parseInt(data, 10);
    if (dataType === 'volume.isMuted') {
      if (data === 'true') userData.volume.isMuted = true;
      if (data === 'false') userData.volume.isMuted = false;
    }
    if (dataType === 'recentlyPlayedSongs') {
      const val = userData.recentlyPlayedSongs.filter(
        (x) => x.songId !== data.songId
      );
      if (val.length >= 5) val.pop();
      val.unshift(data);
      userData.recentlyPlayedSongs = val;
    }
    if (dataType === 'musicFolders' && Array.isArray(data)) {
      userData.musicFolders = data;
    }
    if (dataType === 'defaultPage' && typeof data === 'string')
      userData.defaultPage = data as DefaultPages;
    userDataStore.store = { ...userData };
  } else {
    console.log('userData empty ', userData);
  }
};

export const getData = async () => {
  const data: Data = (await songDataStore.store) as any;
  if (data && Object.keys(data).length !== 0) {
    return data;
  } else {
    const songDataTemplate = {
      songs: [],
      albums: [],
      artists: [],
    };
    songDataStore.set(songDataTemplate);
    return songDataTemplate;
  }
};

export const setData = async (newData: Data) => {
  const data = await getData();
  if (data) {
    data.songs = newData.songs;
    data.artists = newData.artists;
    data.albums = newData.albums;
    songDataStore.store = { ...data };
  } else songDataStore.store = { ...newData };
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
              reject(err);
              return logger(err);
            });
          await sharp(artworks[0].data)
            .webp({ quality: 50, effort: 0 })
            .resize(50, 50)
            .toFile(optimizedImgPath)
            .catch((err) => {
              reject(err);
              return logger(err);
            });
        }
        return resolve(getAssetPath('images', 'song_cover_default.png'));
      });
  });
};

export const checkForNewSongs = (): Promise<true> => {
  return new Promise((resolve, reject) => {
    const musicFolders: MusicFolderData[] = userDataStore.get(
      'musicFolders'
    ) as any;
    if (musicFolders) {
      musicFolders.forEach(async (folder, index) => {
        await fs
          .stat(folder.path)
          .then((stats) => {
            if (
              stats.mtime.toUTCString() ===
              new Date(folder.stats.lastModifiedDate).toUTCString()
            ) {
              console.log(
                path.basename(folder.path),
                'no folder data changed.'
              );
            } else {
              console.log(path.basename(folder.path), 'folder data changed.');
              checkFolderForUnknownModifications(folder.path);
              musicFolders[index].stats.lastModifiedDate = stats.mtime;
            }
          })
          .catch((err) => reject(err));
        const watch = fs.watch(folder.path);
        for await (const { filename, eventType } of watch) {
          if (filename) {
            if (eventType === 'rename' && path.extname(filename) === '.mp3') {
              const modifiedDate = await fs
                .stat(folder.path)
                .then((res) => res.mtime)
                .catch((err) => logger(err));
              if (
                modifiedDate &&
                musicFolders[index].stats.lastModifiedDate !== modifiedDate
              ) {
                musicFolders[index].stats.lastModifiedDate = modifiedDate;
                userDataStore.set('musicFolders', musicFolders);
                console.log(folder.path, 'folder data updated.');
              } else console.log('no need to update folder data');
              await checkFolderForModifications(folder.path, filename)
                .then(() =>
                  console.log(
                    'modification related to ',
                    filename,
                    ' finished.'
                  )
                )
                .catch((err) => {
                  reject(err);
                  return logger(err);
                });
            }
          } else {
            console.log(
              'error occurred when trying to read newly added songs.'
            );
            return reject(
              new Error('error occurred when trying to read newly added songs.')
            );
          }
        }
        return resolve(true);
      });
      return resolve(true);
    }
  });
};
// TODO - checkFolderForUnknownModifications function is not working as intended.
const checkFolderForUnknownModifications = async (folderPath: string) => {
  const songsData = (await songDataStore.get('songs')) as SongData[];
  const relevantFolderSongsData = Array.isArray(songsData)
    ? songsData.filter((songData) => path.dirname(songData.path) === folderPath)
    : undefined;
  const newSongPaths: string[] = [];
  const deletedSongPaths: string[] = [];
  if (relevantFolderSongsData) {
    const dirs = await fs.readdir(folderPath).then((res) => {
      return res
        .filter((filePath) => path.extname(filePath) === '.mp3')
        .map((filepath) => path.join(folderPath, filepath));
    });
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
    console.log(
      '🚀 ~ file: filesystem.ts ~ line 306 ~ checkFolderForUnknownModifications ~ newSongPaths',
      newSongPaths
    );
    console.log(
      '🚀 ~ file: filesystem.ts ~ line 311 ~ checkFolderForUnknownModifications ~ deletedSongPaths',
      deletedSongPaths
    );
    if (newSongPaths.length > 0) {
      // parses new songs that added before application launch
      for (const newSongPath of newSongPaths) {
        const newSongData = await parseSong(newSongPath).catch((err) =>
          logger(err)
        );
        if (newSongData) {
          console.log(path.basename(newSongPath), 'song added');
        }
      }
    }
    if (deletedSongPaths.length > 0) {
      // deleting songs from the library that got deleted before application launch
      for (const deletedSongPath of deletedSongPaths) {
        await removeSongFromLibrary(
          folderPath,
          path.basename(deletedSongPath)
        ).catch((err) => logger(err));
      }
    }
  }
};

const checkFolderForModifications = (
  folderPath: string,
  filename: string
): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    const dirs = await fs
      .readdir(folderPath)
      .then((dirs) => dirs.filter((dir) => path.extname(dir) === '.mp3'))
      .catch((err) => reject(err));
    const songs: SongData[] = songDataStore.get('songs') as any;
    if (dirs && songs && Array.isArray(songs)) {
      // checks whether the songs is newly added or deleted.
      if (
        dirs.some(
          (dir) => dir === filename && path.extname(filename) === '.mp3'
        )
      ) {
        // new song added
        return parseSong(path.join(folderPath, filename))
          .then(() => {
            console.log(filename, 'song added to the library.');
            dataUpdateEvent('songs', `${filename} song added to the library.`);
            return resolve(true);
          })
          .catch((err) => reject(err));
      } else if (
        songs.some(
          (song) =>
            song.path === path.normalize(path.join(folderPath, filename))
        )
      ) {
        // possible song deletion
        return await removeSongFromLibrary(folderPath, filename)
          .then(() => resolve(true))
          .catch((err) => reject(err));
      } else
        console.log(
          `${filename} got deleted which is not relevant to the library.`
        );
      return resolve(true);
    }
  });
};

const removeSongFromLibrary = (folderPath: string, filename: string) => {
  return new Promise(async (resolve, reject) => {
    const songs: SongData[] = songDataStore.get('songs') as any;
    const artists: Artist[] = songDataStore.get('artists') as any;
    const albums: Album[] = songDataStore.get('albums') as any;
    const playlists = await getPlaylistData().catch((err) => reject(err));
    const userData = await getUserData().catch((err) => reject(err));
    const updatedSongs = songs.filter((song) => {
      if (song.path === path.normalize(path.join(folderPath, filename))) {
        if (userData && Object.keys(userData).length > 0) {
          if (userData.currentSong.songId === song.songId) {
            const recentSongs = userData.recentlyPlayedSongs.filter(
              (recentSong) => recentSong.songId !== song.songId
            );
            userDataStore.store = {
              ...userData,
              currentSong: {
                songId: null,
                stoppedPosition: 0,
              },
              recentlyPlayedSongs: recentSongs,
            };
          }
        }
        if (
          Array.isArray(artists) &&
          artists.length > 0 &&
          artists.some((artist) =>
            song.artists.some((str) => str === artist.name)
          )
        ) {
          song.artists.forEach((str) => {
            for (let x = 0; x < artists.length; x++) {
              if (artists[x].name === str) {
                if (artists[x].songs.length > 1) {
                  artists[x].songs = artists[x].songs.filter(
                    (y) => y.songId !== song.songId
                  );
                  console.log(
                    `songData related to ${song.title} in artist ${artists[x].name} removed.`
                  );
                } else if (
                  artists[x].songs.length === 1 &&
                  artists[x].songs[0].songId === song.songId
                ) {
                  console.log(
                    `Artist ${artists[x].name} related to ${song.title} removed because of it doesn't contain any other songs.`
                  );
                  artists.splice(x, 1);
                } else
                  console.log(`${artists[x].name} doesn't have any songs.`);
              }
            }
          });
        }
        if (
          Array.isArray(albums) &&
          albums.length > 0 &&
          albums.some((album) => album.albumId === song.albumId)
        ) {
          for (let x = 0; x < albums.length; x++) {
            if (albums[x].albumId === song.albumId) {
              if (albums[x].songs.length > 1) {
                albums[x].songs = albums[x].songs.filter(
                  (y) => y.songId !== song.songId
                );
                console.log(
                  `songData related to ${song.title} in album ${albums[x].title} removed.`
                );
              } else if (
                albums[x].songs.length === 1 &&
                albums[x].songs[0].songId === song.songId
              ) {
                console.log(
                  `Artist ${albums[x].title} related to ${song.title} removed because of it doesn't contain any other songs.`
                );
                albums.splice(x, 1);
              } else console.log(`${albums[x].title} doesn't have any songs.`);
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
              console.log(
                `songData related to ${song.title} in album ${playlists[x].name} removed.`
              );
            } else
              console.log(
                `playlist ${playlists[x].name} doesn't have any songs.`
              );
          }
        }
        fs.unlink(song.artworkPath).catch((err) => reject(err));
        fs.unlink(song.artworkPath.replace('.webp', '-optimized.webp')).catch(
          (err) => reject(err)
        );
        return false;
      }
      return true;
    });
    if (updatedSongs && artists && albums)
      songDataStore.store = { songs: updatedSongs, artists, albums };
    if (playlists) playlistDataStore.set('playlists', playlists);
    console.log(filename, 'removed from the library.');
    dataUpdateEvent(
      'songs',
      `${filename} removed from the library. music library updated.`
    );
    dataUpdateEvent('artists', `artists related to ${filename} updated.`);
    dataUpdateEvent('albums', `albums related to ${filename} updated.`);
    dataUpdateEvent('playlists', `playlists related to ${filename} updated.`);
    return resolve(true);
  });
};

export const removeAMusicFolder = (
  absolutePath: string
): Promise<boolean | undefined> => {
  return new Promise(async (resolve, reject) => {
    const { musicFolders } = await getUserData();
    if (
      Array.isArray(musicFolders) &&
      musicFolders.length > 0 &&
      musicFolders.some((folder) => folder.path === absolutePath)
    ) {
      const relatedFolders = getDirectoriesRecursive(absolutePath);
      if (relatedFolders.length > 1) {
        console.log(
          'found sub-directories inside the selected directory. Files inside these directories will be deleted too.',
          relatedFolders
        );
        const allFiles = await Promise.all(
          relatedFolders.map((folderPath) => getFiles(folderPath))
        )
          .then((data) => data.flat())
          .catch((err) => logger(err));
        if (allFiles) {
          for (let x = 0; x < allFiles.length; x++) {
            await removeSongFromLibrary(
              path.dirname(allFiles[x]),
              path.basename(allFiles[x])
            ).catch((err) => logger(err));
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
      await setUserData('musicFolders', updatedMusicFolders)
        .then(() => {
          console.log(
            `deleted ${relatedFolders.length} directories.`,
            relatedFolders
          );
          resolve(true);
          dataUpdateEvent('songs');
          dataUpdateEvent('artists');
          dataUpdateEvent('playlists');
          dataUpdateEvent('albums');
        })
        .catch((err) => reject(err));
    }
  });
};

export const getPlaylistData = async (playlistId = '*') => {
  const playlistData: PlaylistDataTemplate =
    (await playlistDataStore.store) as any;
  if (playlistData && Object.keys(playlistData).length !== 0) {
    if (playlistId === '*') return playlistData.playlists;
    else {
      for (let x = 0; x < playlistData.playlists.length; x++) {
        if (playlistData.playlists[x].playlistId === playlistId)
          return playlistData.playlists[x];
      }
      return undefined;
    }
  } else {
    const playlistDataTemplate: PlaylistDataTemplate = {
      playlists: [
        {
          name: 'History',
          playlistId: 'History',
          createdDate: new Date(),
          songs: [],
          artworkPath: getAssetPath('images', 'history-playlist-icon.png'),
        },
        {
          name: 'Favorites',
          playlistId: 'Favorites',
          createdDate: new Date(),
          songs: [],
          artworkPath: getAssetPath('images', 'favorites-playlist-icon.png'),
        },
      ],
    };
    playlistDataStore.store = playlistDataTemplate as any;
    return playlistDataTemplate.playlists;
  }
};

export const setPlaylistData = async (updatedPlaylists: Playlist[]) => {
  playlistDataStore.store = { playlists: updatedPlaylists };
};

export const updateSongListeningRate = async (
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
    songDataStore.set('songs', songsData);
  }
};
