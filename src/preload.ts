import { contextBridge, ipcRenderer } from 'electron';

const api = {
	// WINDOW CONTROLS
	closeApp: () => ipcRenderer.send('app/close'),
	minimizeApp: () => ipcRenderer.send('app/minimize'),
	toggleMaximizeApp: () => ipcRenderer.send('app/toggleMaximize'),
	// ADDS NEW FOLDERS
	addMusicFolder: () => ipcRenderer.invoke('app/addMusicFolder'),
	// GET SONG DATA
	getSong: (songId: string) => ipcRenderer.invoke('app/getSong', songId),
	// CHECK FOR SONGS ON APP STARTUP
	checkForSongs: () => ipcRenderer.invoke('app/checkForSongs'),
	// SAVES AND GETS USERDATA
	saveUserData: (dataType: string, data: string) =>
		ipcRenderer.invoke('app/saveUserData', dataType, data),
	getUserData: () => ipcRenderer.invoke('app/getUserData'),
	// SENDS AND GETS CURRENTLY STOPPED SONG POSTION
	getSongPosition: (callback: (e: any) => void) =>
		ipcRenderer.on('app/sendSongPosition', callback),
	sendSongPosition: (position: number) => ipcRenderer.send('app/getSongPosition', position),
	// PROVIDES SEARCH RESULTS
	search: (filter: string, value: string) => ipcRenderer.invoke('app/search', filter, value),
	// PROVIDES SONG LYRICS
	getSongLyrics: (songTitle: string, songArtists: string) =>
		ipcRenderer.invoke('app/getSongLyrics', songTitle, songArtists),
	// CONTEXT MENU - OPENS DEVTOOLS
	openDevtools: () => ipcRenderer.send('app/openDevTools'),
	// GETS NEWLY ADDED SONGS WHEN ADDED TO A PRESELECTED FOLDER
	addNewSong: (callback: (event: unknown, songs: SongData[]) => void) =>
		ipcRenderer.on('app/getNewSong', callback),
	// TOGGLE LIKE SONG
	toggleLikeSong: (songId: string, likeSong: boolean) =>
		ipcRenderer.invoke('app/toggleLikeSong', songId, likeSong),
	// GET ARTISTS ARTWORKS
	getArtistArtworks: (artistId: string, artistName?: string) =>
		ipcRenderer.invoke('app/getArtistArtworks', artistId, artistName),
	// GET ARTIST DATA
	getArtistData: (artistId: string) => ipcRenderer.invoke('app/getArtistData', artistId),
	//GET ALBUM DATA
	getAlbumData: (albumId: string) => ipcRenderer.invoke('app/getAlbumData', albumId),
	// GET PLAYLIST DATA
	getPlaylistData: (playlistId: string) => ipcRenderer.invoke('app/getPlaylistData', playlistId),
	// ADD NEW PLAYLIST
	addNewPlaylist: (playlistName: string) => ipcRenderer.invoke('app/addNewPlaylist', playlistName),
	// GET SONG INFO
	getSongInfo: (songId: string) => ipcRenderer.invoke('app/getSongInfo', songId),
};

contextBridge.exposeInMainWorld('api', api);

module.exports = { api };
