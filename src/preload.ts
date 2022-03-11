import { contextBridge, ipcRenderer } from 'electron';

const api = {
	closeApp: () => ipcRenderer.send('app/close'),
	minimizeApp: () => ipcRenderer.send('app/minimize'),
	toggleMaximizeApp: () => ipcRenderer.send('app/toggleMaximize'),
	addMusicFolder: () => ipcRenderer.invoke('app/addMusicFolder'),
	getSong: (songId: string) => ipcRenderer.invoke('app/getSong', songId),
	checkForSongs: () => ipcRenderer.invoke('app/checkForSongs'),
	saveUserData: (dataType: string, data: string) =>
		ipcRenderer.invoke('app/saveUserData', dataType, data),
	getUserData: () => ipcRenderer.invoke('app/getUserData'),
	getSongPosition: (callback: () => void) => ipcRenderer.on('app/sendSongPosition', callback),
	sendSongPosition: (position: number) => ipcRenderer.send('app/getSongPosition', position),
	search: (filter: string, value: string) => ipcRenderer.invoke('app/search', filter, value),
};

contextBridge.exposeInMainWorld('api', api);

module.exports = { api };
