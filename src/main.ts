import { app, BrowserWindow, ipcMain, dialog, autoUpdater, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';

import * as musicMetaData from 'music-metadata';
import nodeVibrant from 'node-vibrant';
// import lyricsFinder from 'lyrics-finder';
import songLyrics from 'songlyrics';

import { logger } from './logger';
import { getUserData, setUserData as saveUserData, getData, getFiles, setData } from './filesystem';
import { parseSong } from './parseSong';
import songlyrics from 'songlyrics';

let mainWindow: BrowserWindow;

console.log('userData path : ', app.getPath('userData'));

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
		frame: false,
		backgroundColor: '#fff',
		icon: path.join(__dirname, 'public', 'images', 'logo_light_mode.ico'),
		titleBarStyle: 'hidden',
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

	app.on('before-quit', () => {
		mainWindow.webContents.send('app/sendSongPosition');
	});

	ipcMain.on('app/close', () => app.quit());

	ipcMain.on('app/minimize', () => mainWindow.minimize());

	ipcMain.on('app/toggleMaximize', () =>
		mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
	);

	ipcMain.on('app/getSongPosition', async (event, position: number) => {
		await saveUserData('currentSong.stoppedPosition', position).catch((err) => logger(err));
	});

	ipcMain.handle('app/addMusicFolder', addMusicFolder);

	ipcMain.handle('app/getSong', (event, id: string) => sendAudioData(id));

	ipcMain.handle('app/toggleLikeSong', (e, songId: string, likeSong: boolean) =>
		toggleLikeSong(songId, likeSong)
	);

	ipcMain.handle('app/checkForSongs', () => checkForSongs());

	ipcMain.handle(
		'app/saveUserData',
		async (event, dataType: string, data: string) =>
			await saveUserData(dataType, data).catch((err) => logger(err))
	);

	ipcMain.handle('app/getUserData', async () => await getUserData());

	ipcMain.handle('app/search', search);

	ipcMain.handle(
		'app/getSongLyrics',
		async (e, songTitle: string, songArtists: string) =>
			await sendSongLyrics(songTitle, songArtists)
	);

	ipcMain.on('app/openDevTools', () =>
		mainWindow.webContents.openDevTools({ mode: 'detach', activate: true })
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
};

const sendSongLyrics = async (songTitle: string, songArtists?: string) => {
	const str = songArtists ? `${songTitle} - ${songArtists}` : songTitle;
	return songlyrics(str).then(
		(res) => res,
		(err) => {
			console.log(err);
			return undefined;
		}
	);
};

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
								isAFavorite: songInfo.isAFavorite,
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
						palette: songInfo.palette,
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

const search = async (e: any, filter: string, value: string) => {
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
};

const toggleLikeSong = async (songId: string, likeSong: boolean) => {
	const data = await getData();
	let result: toggleLikeSongReturnValue = {
		success: false,
		error: null,
	};
	if (data.songs) {
		data.songs = data.songs.map((song) => {
			if (song.songId === songId) {
				if (likeSong) {
					if (song.isAFavorite) {
						console.log({ success: false, error: `you have already liked ${songId}` });
						result.error = `you have already liked ${songId}`;
						return song;
					} else {
						song.isAFavorite = true;
						result.success = true;
						return song;
					}
				} else {
					if (song.isAFavorite) {
						song.isAFavorite = false;
						result.success = true;
						return song;
					} else {
						console.log({ success: false, error: `you have already disliked ${songId}` });
						result.error = `you have already disliked ${songId}`;
						return song;
					}
				}
			} else return song;
		});
		await setData(data);
		return result;
	}
};

export const sendNewSong = (songs: SongData[]) => {
	mainWindow.webContents.send('app/getNewSong', songs);
};
