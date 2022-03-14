import fs from 'fs/promises';
import fsOther from 'fs';
import path from 'path';
import { app, ipcMain } from 'electron';

import { logger } from './logger';

import Store from 'electron-store';
import * as musicMetaData from 'music-metadata';
import { parseSong } from './parseSong';
import { sendNewSong } from './main';

const songDataStore = new Store({
	name: 'data',
});
const userDataStore = new Store({
	name: 'userData',
});
console.log(userDataStore.path);
console.log(songDataStore.path);

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
	return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
}

export const getFiles = async (dir: string) => {
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
				},
			});
		} catch (error) {
			console.log(error);
		}
	}
	if (foldersWithStatData && foldersWithStatData.length > 0)
		await setUserData('musicFolders', foldersWithStatData);
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
			playlist: null,
			recentlyPlayedSongs: [],
			musicFolders: [],
			defaultPage: 'Home',
		};
		userDataStore.store = { ...userDataTemplate };
		return userDataTemplate;
	}
};

export const setUserData = async (dataType: string, data: any) => {
	// console.log(dataType, data);
	// data = data.toString();
	const userData = await getUserData();
	if (userData) {
		if (dataType === 'theme.isDarkMode') {
			if (data === 'true') userData.theme.isDarkMode = true;
			if (data === 'false') userData.theme.isDarkMode = false;
		}
		if (dataType === 'currentSong.songId') userData.currentSong.songId = data;
		if (dataType === 'currentSong.stoppedPosition')
			userData.currentSong.stoppedPosition = parseFloat(data);
		if (dataType === 'volume.value') userData.volume.value = parseInt(data);
		if (dataType === 'volume.isMuted') {
			if (data === 'true') userData.volume.isMuted = true;
			if (data === 'false') userData.volume.isMuted = false;
		}
		if (dataType === 'recentlyPlayedSongs') {
			const val = userData.recentlyPlayedSongs.filter((x) => x.songId !== data.songId);
			if (val.length >= 3) val.pop();
			val.unshift(data);
			userData.recentlyPlayedSongs = val;
		}
		if (dataType === 'musicFolders') {
			if (Array.isArray(data)) userData.musicFolders = userData.musicFolders.concat(data);
		}
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
				}
			})
			.finally(async () => {
				if (artworks[0]) {
					const storePath = path.join(
						app.getPath('userData'),
						'song_covers',
						`${artworkName}.jpg`
					);
					return await fs.writeFile(storePath, artworks[0].data).then(
						() => resolve(storePath),
						(err) => {
							logger(err);
							resolve(path.join(__dirname, 'public', 'images', 'song_cover_default.png'));
						}
					);
				}
				return resolve(path.join(__dirname, 'public', 'images', 'song_cover_default.png'));
			});
	});
};

const checkForNewSongs = () => {
	const musicFolders: MusicFolderData[] = userDataStore.get('musicFolders') as any;
	if (musicFolders) {
		musicFolders.forEach((folder) => {
			fsOther.watch(folder.path, async (eventType, filename) => {
				console.log(eventType, filename);
				if (eventType === 'rename')
					setTimeout(() => checkFolderForModifications(folder.path, filename), 500);
			});
		});
	}
};

checkForNewSongs();

const checkFolderForModifications = async (folderPath: string, filename: string) => {
	// ! check for file path instead of looping through folder directories.
	fs.readdir(folderPath).then(async (dirs) => {
		for (const dir of dirs) {
			if (dir === filename && path.extname(filename) === '.mp3') {
				const songs: SongData[] = songDataStore.get('songs') as any;
				if (songs) {
					const songData = await parseSong(path.join(folderPath, filename));
					if (songData) {
						songs.push(songData);
						await songDataStore.set('songs', songs);
						sendNewSong([songData]);
						console.log(filename, 'song added');
					}
					// for (const song of songs) {
					// 	if (song.path !== path.join(folderPath, filename)) {
					// 	}
					// }
				}
			}
		}
	});
};
