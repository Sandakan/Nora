import { app, BrowserWindow, ipcMain, dialog, autoUpdater } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';

import * as musicMetaData from 'music-metadata';
import nodeVibrant from 'node-vibrant';
// import lyricsFinder from 'lyrics-finder';
import songLyrics from 'songlyrics';

import { logger } from './logger';
import { getUserData, setUserData as saveUserData, getData, getFiles } from './filesystem';
import { parseSong } from './parseSong';
import songlyrics from 'songlyrics';

let mainWindow: BrowserWindow;

// try {
// 	require('electron-reloader')(module);
// } catch {}

const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 700,
		minHeight: 500,
		title: 'Oto Music for Desktop',
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			// nodeIntegration: true,
			devTools: true,
		},
		visualEffectState: 'followWindow',
		roundedCorners: true,
		// frame: false,
		backgroundColor: '#fff',
		icon: path.join(__dirname, 'public', 'images', 'logo_light_mode.ico'),
		// titleBarStyle: 'hidden',
		show: false,
	});
	mainWindow.webContents.openDevTools({
		mode: 'detach',
	});
	mainWindow.loadFile('./public/index.html');
};

app.whenReady().then(() => {
	createWindow();
	mainWindow.show();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});

	ipcMain.on('app/close', () => {
		mainWindow.webContents.send('app/sendSongPosition');
		app.quit();
	});
	ipcMain.on('app/getSongPosition', async (event, position: number) => {
		await saveUserData('currentSong.stoppedPosition', position).catch((err) => logger(err));
	});
	ipcMain.on('app/minimize', () => mainWindow.minimize());
	ipcMain.on('app/toggleMaximize', () =>
		mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
	);

	ipcMain.handle('app/addMusicFolder', async () => {
		const { canceled, filePaths: musicFolderPath } = await dialog.showOpenDialog(mainWindow, {
			title: 'Add a Music Folder',
			buttonLabel: 'Add folder',
			filters: [{ name: 'Audio Files', extensions: ['mp3'] }],
			properties: ['openFile', 'openDirectory'],
		});
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
	});

	ipcMain.handle('app/getSong', (event, id: string) => sendAudioData(id));
	ipcMain.handle('app/checkForSongs', () => checkForSongs());
	ipcMain.handle('app/saveUserData', async (event, dataType: string, data: string) => {
		await saveUserData(dataType, data).catch((err) => logger(err));
	});
	ipcMain.handle('app/getUserData', async () => await getUserData());
	ipcMain.handle('app/search', async (e, filter: string, value: string) => {
		const jsonData: Data = await getData();
		const songs =
			Array.isArray(jsonData.songs) && jsonData.songs.length > 0
				? jsonData.songs.filter((data: SongData) => new RegExp(value, 'gim').test(data.title))
				: [];
		const artists =
			Array.isArray(jsonData.artists) && jsonData.artists.length > 0
				? jsonData.artists.filter((data: Artist) => new RegExp(value, 'gim').test(data.name))
				: [];
		const albums =
			Array.isArray(jsonData.albums) && jsonData.albums.length > 0
				? jsonData.albums.filter((data: Album) => new RegExp(value, 'gim').test(data.title))
				: [];
		return {
			songs: songs || [],
			artists: artists || [],
			albums: albums || [],
		};
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

const sendAudioData = async (audioId: string) => {
	return await getData().then(async (jsonData) => {
		try {
			if (jsonData) {
				for (const songInfo of jsonData.songs) {
					// console.log(audioId, songInfo.songId, songInfo.songId === audioId);
					if (songInfo.songId === audioId) {
						// const lyrics =
						// 	(await lyricsFinder(songInfo.artists[0], songInfo.title)) || 'not found';
						// console.log(lyrics);
						songlyrics(songInfo.title).then(
							(res) => console.log(res),
							(err) => logger(err)
						);

						const metadata = await musicMetaData
							.parseFile(songInfo.path)
							.catch((err) => logger(err));
						if (metadata) {
							const artworkData = metadata.common.picture
								? metadata.common.picture[0].data
								: // : await getDefaultSongCoverImg();
								  '';
							await saveUserData('recentlyPlayedSongs', songInfo);
							const data: PlayableAudioInfo = {
								title: songInfo.title,
								artists: songInfo.artists,
								duration: songInfo.duration,
								artwork: Buffer.from(artworkData).toString('base64') || undefined,
								artworkPath: songInfo.artworkPath,
								path: songInfo.path,
								songId: songInfo.songId,
							};
							return data;
						}
					} else `no matching song for songID the songId "${audioId}"`;
				}
			} else logger(new Error(`jsonData error. ${jsonData}`));
		} catch (err: any) {
			logger(err);
		}
	});
};

const checkForSongs = async () => {
	return await getData().then(
		async (data) => {
			if (data && Object.keys(data).length !== 0) {
				const songData = data.songs.map((songInfo) => {
					const info: AudioInfo = {
						title: songInfo.title,
						artists: songInfo.artists,
						duration: songInfo.duration,
						artworkPath: songInfo.artworkPath,
						path: songInfo.path,
						songId: songInfo.songId,
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
	// return await fs.readFile(path.join(__dirname, 'temp', 'data.json'), { encoding: 'utf-8' }).then(
	// 	async (str) => {
	// 		try {
	// 			const jsonData = JSON.parse(str);
	// 			return jsonData.songs;
	// 		} catch (err: any) {
	// 			logger(err);
	// 		}
	// 	},
	// 	(err) => {
	// 		if (err.code === 'ENOENT') {
	// 			return undefined;
	// 		} else logger(err);
	// 	}
	// );
};

// const saveUserData = async (dataType: string, data: string | boolean | number) => {
// 	console.log(dataType, data);
// 	data = data.toString();
// 	let userData = await getUserData();
// 	if (userData) {
// 		if (dataType === 'theme.isDarkMode') {
// 			if (data === 'true') userData.theme.isDarkMode = true;
// 			if (data === 'false') userData.theme.isDarkMode = false;
// 		}
// 		if (dataType === 'currentSong.songId') userData.currentSong.songId = data;
// 		if (dataType === 'currentSong.stoppedPosition')
// 			userData.currentSong.stoppedPosition = parseFloat(data);
// 		if (dataType === 'volume.value') userData.volume.value = parseInt(data);
// 		if (dataType === 'volume.isMuted') {
// 			if (data === 'true') userData.volume.isMuted = true;
// 			if (data === 'false') userData.volume.isMuted = false;
// 		}
// 		if (dataType === 'recentlyPlayedSongs') {
// 			const songs = userData.recentlyPlayedSongs;
// 			if (songs.length === 3) songs.pop();
// 			songs.push(data);
// 			userData.recentlyPlayedSongs = songs;
// 		}
// 		return userData;
// 	} else {
// 		console.log('error occurred when saving user data.');
// 		return undefined;
// 	}
// };

// const getUserData = async () => {
// 	const data: UserData | undefined = await getJsonData(
// 		path.join(__dirname, 'temp', 'userdata.json')
// 	)
// 		.then((res) => res)
// 		.catch((err) => undefined);
// 	if (data) return data;
// 	else
// 		return {
// 			theme: {
// 				isDarkMode: false,
// 			},
// 			currentSong: {
// 				songId: null,
// 				stoppedPosition: 0,
// 			},
// 			volume: {
// 				isMuted: false,
// 				value: 100,
// 			},
// 			playlist: [],
// 			recentlyPlayedSongs: [],
// 		} as UserData;
// };
