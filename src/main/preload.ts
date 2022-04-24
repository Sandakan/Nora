/* eslint-disable import/prefer-default-export */
import { contextBridge, ipcRenderer } from 'electron';

export const api = {
  // WINDOW CONTROLS
  closeApp: () => ipcRenderer.send('app/close'),
  minimizeApp: () => ipcRenderer.send('app/minimize'),
  toggleMaximizeApp: () => ipcRenderer.send('app/toggleMaximize'),
  // ADDS NEW FOLDERS
  addMusicFolder: (): Promise<SongData[]> =>
    ipcRenderer.invoke('app/addMusicFolder'),
  // GET SONG DATA
  getSong: (songId: string): Promise<SongData | string> =>
    ipcRenderer.invoke('app/getSong', songId),
  // CHECK FOR SONGS ON APP STARTUP
  checkForSongs: (): Promise<AudioInfo[] | undefined> =>
    ipcRenderer.invoke('app/checkForSongs'),
  // SAVES AND GETS USERDATA
  saveUserData: (dataType: UserDataType, data: string) =>
    ipcRenderer.invoke('app/saveUserData', dataType, data),
  getUserData: (): Promise<UserData> => ipcRenderer.invoke('app/getUserData'),
  // SENDS AND GETS CURRENTLY STOPPED SONG POSTION
  getSongPosition: (callback: (e: any) => void) =>
    ipcRenderer.on('app/sendSongPosition', callback),
  sendSongPosition: (position: number) =>
    ipcRenderer.send('app/getSongPosition', position),
  // PROVIDES SEARCH RESULTS
  search: (filter: string, value: string): Promise<SearchResult> =>
    ipcRenderer.invoke('app/search', filter, value),
  // PROVIDES SONG LYRICS
  getSongLyrics: (
    songTitle: string,
    songArtists: string
  ): Promise<Lyrics | undefined> =>
    ipcRenderer.invoke('app/getSongLyrics', songTitle, songArtists),
  // CONTEXT MENU - OPENS DEVTOOLS
  openDevtools: () => ipcRenderer.send('app/openDevTools'),
  // ! GETS NEWLY ADDED SONGS WHEN ADDED TO A PRESELECTED FOLDER -- NOT WORKING YET
  addNewSong: (callback: (event: unknown, songs: SongData[]) => void) =>
    ipcRenderer.on('app/getNewSong', callback),
  // TOGGLE LIKE SONG
  toggleLikeSong: (
    songId: string,
    likeSong: boolean
  ): Promise<ToggleLikeSongReturnValue | undefined> =>
    ipcRenderer.invoke('app/toggleLikeSong', songId, likeSong),
  // GET ARTISTS ARTWORKS
  getArtistArtworks: (artistId: string, artistName?: string) =>
    ipcRenderer.invoke('app/getArtistArtworks', artistId, artistName),
  // GET ARTIST DATA
  getArtistData: (artistId: string): Promise<Artist | Artist[] | undefined> =>
    ipcRenderer.invoke('app/getArtistData', artistId),
  getAlbumData: (albumId: string): Promise<Album | Album[] | undefined> =>
    ipcRenderer.invoke('app/getAlbumData', albumId),
  // GET PLAYLIST DATA
  getPlaylistData: (
    playlistId: string
  ): Promise<Playlist | Playlist[] | undefined> =>
    ipcRenderer.invoke('app/getPlaylistData', playlistId),
  // ADD NEW PLAYLIST
  addNewPlaylist: (
    playlistName: string
  ): Promise<{ success: boolean; message?: string; playlist?: Playlist }> =>
    ipcRenderer.invoke('app/addNewPlaylist', playlistName),
  // GET SONG INFO
  getSongInfo: (songId: string): Promise<SongData | undefined> =>
    ipcRenderer.invoke('app/getSongInfo', songId),

  revealSongInFileExplorer: (songId: string) =>
    ipcRenderer.send('revealSongInFileExplorer', songId),
  openInBrowser: (url: string) => ipcRenderer.send('app/openInBrowser', url),
};

contextBridge.exposeInMainWorld('api', api);
