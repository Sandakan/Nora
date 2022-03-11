import fs from 'fs/promises';
import fsOther from 'fs';
import path from 'path';

import { logger } from './logger';

import Store from 'electron-store';
import * as musicMetaData from 'music-metadata';

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
	// const allFiles = await fs.readdir(dir);
	// // ? / / / / / / / / / / / / /
	// return allFiles
	// 	.map((filePath) => path.join(dir, filePath))
	// 	.filter((filePath) => {
	// 		const fileExtension = filePath.split('.')[filePath.split('.').length - 1];
	// 		return fileExtension === 'mp3';
	// 	});
	// ? / / / / / / / / / / / /
	const allFolders = getDirectoriesRecursive(dir);
	const allFiles = allFolders
		.map((folder) => {
			const x = fsOther.readdirSync(folder).map((y) => path.join(folder, y));
			return x;
		})
		.flat();
	await setUserData('musicFolders', allFolders);
	const allSongs = allFiles.filter((filePath) => {
		const fileExtension = filePath.split('.')[filePath.split('.').length - 1];
		return fileExtension === 'mp3';
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
			val.push(data);
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

export const storeSongArtworks = async (
	artworks: musicMetaData.IPicture[],
	absoluteStorePath: string,
	artworkName: string
) => {
	const storePath = path.join(absoluteStorePath, `${artworkName}.jpg`);
	if (artworks[0]) {
		return await fs.writeFile(storePath, artworks[0].data).then(
			() => storePath,
			(err) => {
				logger(err);
				return path.join(__dirname, 'public', 'images', 'song_cover_default.png');
			}
		);
	}
	return path.join(__dirname, 'public', 'images', 'song_cover_default.png');
};
