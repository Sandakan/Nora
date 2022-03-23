import { app, BrowserWindow, ipcMain, dialog, autoUpdater, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';

import * as musicMetaData from 'music-metadata';
// import lyricsFinder from 'lyrics-finder';
import songLyrics from 'songlyrics';
import httpsGet from 'simple-get';

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
	mainWindow.once('ready-to-show', checkForNewSongs);
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

	ipcMain.handle('app/getSongInfo', (e, songId: string) => getSongInfo(songId));

	ipcMain.on('app/openDevTools', () =>
		mainWindow.webContents.openDevTools({ mode: 'detach', activate: true })
	);

	ipcMain.handle('app/getArtistArtworks', async (e, artistId: string, artistName?: string) =>
		getArtistInfoFromNet(artistId, artistName)
	);

	ipcMain.handle(
		'app/getArtistData',
		async (e, artistId: string) => await getArtistData(artistId)
	);

	ipcMain.handle('app/getAlbumData', async (e, albumId: string) => await getAlbumData(albumId));

	ipcMain.handle(
		'app/getPlaylistData',
		async (e, playlistId: string) => await sendPlaylistData(playlistId)
	);

	ipcMain.handle('app/addNewPlaylist', async (e, playlistName: string) =>
		addNewPlaylist(playlistName)
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
	return songLyrics(str).then(
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
							await updateSongListeningRate(jsonData.songs, songInfo.songId).catch(
								(err: Error) => console.log(err)
							);
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
			? jsonData.songs.filter(
					(data: SongData) =>
						new RegExp(value, 'gim').test(data.title) ||
						new RegExp(value, 'gim').test(data.artists.join(' '))
			  )
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

const getArtistInfoFromNet = (
	artistId: string,
	artistName?: string
): Promise<ArtistInfoFromNetData | undefined> => {
	return new Promise(async (resolve, reject) => {
		if (artistName) {
			httpsGet.concat(
				`https://api.deezer.com/search/artist?q=${artistName}`,
				(err, res, data) => {
					if (err) return reject(err);
					resolve(JSON.parse(data.toString('utf-8')) as any);
				}
			);
		} else if (artistId && artistId !== '') {
			const data = await getData();
			if (data && data.artists && data.artists.length > 0) {
				const artists = data.artists;
				for (const artist of artists) {
					if (artist.artistId === artistId) {
						return httpsGet.concat(
							`https://api.deezer.com/search/artist?q=${artist.name}`,
							(err, res, data) => {
								if (err) reject(err);
								resolve(JSON.parse(data.toString('utf-8')));
							}
						);
					}
				}
			}
		} else resolve(undefined);
	});
};

const getArtistData = async (artistId = '*') => {
	if (artistId) {
		const data = await getData();
		if (data && data.artists) {
			const artists = data.artists;
			if (artistId === '*') return artists;
			else {
				for (const artist of artists) {
					if (artist.artistId === artistId) return artist;
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
					(playlist) => playlist.name === 'Favorites' && playlist.playlistId === 'Favorites'
				)
			) {
				await setPlaylistData(
					playlists.map((playlist) => {
						if (playlist.name === 'Favorites' && playlist.playlistId === 'Favorites') {
							if (playlist.songs.some((playlistSongId) => playlistSongId === songId)) {
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
					artworkPath: path.join(__dirname, 'public', 'images', 'favorites-playlist-icon.png'),
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
					(playlist) => playlist.name === 'Favorites' && playlist.playlistId === 'Favorites'
				)
			) {
				await setPlaylistData(
					playlists.map((playlist) => {
						if (
							playlist.name === 'Favorites' &&
							playlist.playlistId === 'Favorites' &&
							playlist.songs.some((playlistSongId) => playlistSongId === songId)
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
					(playlist) => playlist.name === 'History' && playlist.playlistId === 'History'
				)
			) {
				playlists = playlists.map((playlist) => {
					if (playlist.name === 'History' && playlist.playlistId === 'History') {
						if (playlist.songs.length + 1 > 50) playlist.songs.pop();
						playlist.songs.push(songId);
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
					artworkPath: path.join(__dirname, 'public', 'images', 'history-playlist-icon.png'),
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
): Promise<{ success: boolean; message?: string; playlistId?: string }> => {
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
					name: name,
					createdDate: new Date(),
					playlistId: generateRandomId(),
					songs: Array.isArray(songIds) ? songIds : [],
					artworkPath: artworkPath,
				};
				playlists.push(newPlaylist);
				setPlaylistData(playlists);
				resolve({ success: true, playlistId: newPlaylist.playlistId });
			}
		} else
			reject({
				success: false,
				message: 'Playlists is not an array.',
			});
	});
};

const removeAPlaylist = (playlistId: string): Promise<{ success: boolean; message?: string }> => {
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
		const songsData = await getData().then(
			(data) => data.songs,
			(err) => {
				console.log(err);
				return undefined;
			}
		);
		if (Array.isArray(songsData)) {
			for (const songData of songsData) {
				if (songData.songId === songId) {
					return songData;
				}
			}
		}
	}
};
