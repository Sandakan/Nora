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

const playlistDataStore = new Store({
	name: 'playlists',
});

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
					lastParsedDate: new Date(),
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

export const checkForNewSongs = () => {
	const musicFolders: MusicFolderData[] = userDataStore.get('musicFolders') as any;
	if (musicFolders) {
		musicFolders.forEach(async (folder, index) => {
			await fs.stat(folder.path).then((stats) => {
				if (
					stats.mtime.toUTCString() === new Date(folder.stats.lastModifiedDate).toUTCString()
				) {
					console.log(path.basename(folder.path), 'no folder data changed.');
				} else {
					console.log(path.basename(folder.path), 'folder data changed.');
					checkFolderForUnknownModifications(folder.path);
					musicFolders[index].stats.lastModifiedDate = stats.mtime;
				}
			});
			fsOther.watch(folder.path, async (eventType, filename) => {
				console.log(eventType, filename);
				if (filename) {
					if (eventType === 'rename') {
						const modifiedDate = await fs
							.stat(folder.path)
							.then((res) => res.mtime)
							.catch((err) => logger(err));
						if (modifiedDate && musicFolders[index].stats.lastModifiedDate !== modifiedDate) {
							musicFolders[index].stats.lastModifiedDate = modifiedDate;
							userDataStore.set('musicFolders', musicFolders);
							console.log('folder data updated.');
						} else console.log('no need to update folder data');

						setTimeout(() => checkFolderForModifications(folder.path, filename), 500);
					}
				} else console.log('error occurred when trying to read newly added songs.');
			});
		});
	}
};

const checkFolderForUnknownModifications = async (folderPath: string) => {
	const songsData = (await songDataStore.get('songs')) as SongData[];
	const relevantFolderSongsData = Array.isArray(songsData)
		? songsData.filter((songData) => path.dirname(songData.path) === folderPath)
		: undefined;
	const newSongPaths = [];
	if (relevantFolderSongsData) {
		const dirs = await fs.readdir(folderPath).then((res) => {
			return res
				.filter((filePath) => path.extname(filePath) === '.mp3')
				.map((filepath) => {
					const x = path.join(folderPath, filepath);
					return x;
				});
		});
		for (const dir of dirs) {
			if (relevantFolderSongsData.some((song) => song.path === dir)) {
			} else newSongPaths.push(dir);
		}
		console.log(newSongPaths);
		if (newSongPaths.length > 0) {
			for (const newSongPath of newSongPaths) {
				const newSongData = await parseSong(newSongPath);
				if (newSongData) {
					songsData.push(newSongData);
					songDataStore.set('songs', songsData);
					sendNewSong([newSongData]);
					console.log(path.basename(newSongPath), 'song added');
				}
			}
		}
	}
};

const checkFolderForModifications = async (folderPath: string, filename: string) => {
	// ! check for file path instead of looping through folder directories.
	await fs.readdir(folderPath).then(async (dirs) => {
		for (const dir of dirs) {
			if (dir === filename && path.extname(filename) === '.mp3') {
				const songs: SongData[] = songDataStore.get('songs') as any;
				if (songs) {
					const songData = await parseSong(path.join(folderPath, filename));
					if (songData && Array.isArray(songData)) {
						songs.push(songData);
						songDataStore.set('songs', songs);
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

export const getPlaylistData = async () => {
	const playlistData: playlistDataTemplate = (await playlistDataStore.store) as any;
	if (playlistData && Object.keys(playlistData).length !== 0) {
		return playlistData.playlists;
	} else {
		const playlistDataTemplate: playlistDataTemplate = {
			playlists: [
				{
					name: 'History',
					playlistId: 'History',
					createdDate: new Date(),
					songs: [],
					artworkPath:
						'C:\\Users\\Sandakan Nipunajith\\OneDrive\\Documents\\My Projects\\Projects\\Desktop App Development\\Oto Desktop Music Player\\public\\images\\history-playlist-icon.png',
				},
				{
					name: 'Favorites',
					playlistId: 'Favorites',
					createdDate: new Date(),
					songs: [],
					artworkPath:
						'C:\\Users\\Sandakan Nipunajith\\OneDrive\\Documents\\My Projects\\Projects\\Desktop App Development\\Oto Desktop Music Player\\public\\images\\favorites-playlist-icon.png',
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

export const updateSongListeningRate = async (songsData: SongData[], songId: string) => {
	if (Array.isArray(songsData) && songId) {
		songsData = songsData.map((songInfo) => {
			if (songInfo.songId === songId) {
				songInfo.listeningRate.allTime++;
				if (songInfo.listeningRate.monthly.year === new Date().getFullYear()) {
					songInfo.listeningRate.monthly.months[new Date().getMonth()]++;
				} else {
					songInfo.listeningRate.monthly.months = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
					songInfo.listeningRate.monthly.year = new Date().getFullYear();
					songInfo.listeningRate.monthly.months[new Date().getMonth()]++;
				}
			}
			return songInfo;
		});
		songDataStore.set('songs', songsData);
	}
};
