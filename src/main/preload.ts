/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/prefer-default-export */
import { contextBridge, ipcRenderer } from 'electron';

export const api = {
  // WINDOW CONTROLS
  closeApp: (): void => ipcRenderer.send('app/close'),
  minimizeApp: (): void => ipcRenderer.send('app/minimize'),
  toggleMaximizeApp: (): void => ipcRenderer.send('app/toggleMaximize'),
  // ADDS NEW FOLDERS
  addMusicFolder: (): Promise<SongData[]> =>
    ipcRenderer.invoke('app/addMusicFolder'),
  // GET SONG DATA
  getSong: (
    songId: string,
    updateListeningRate = true
  ): Promise<AudioData | undefined> =>
    ipcRenderer.invoke('app/getSong', songId, updateListeningRate),
  // CHECK FOR SONGS ON APP STARTUP
  checkForSongs: (): Promise<AudioInfo[] | undefined> =>
    ipcRenderer.invoke('app/checkForSongs'),
  // SAVES AND GETS USERDATA
  saveUserData: (dataType: UserDataType, data: any) =>
    ipcRenderer.invoke('app/saveUserData', dataType, data),
  getUserData: (): Promise<UserData> => ipcRenderer.invoke('app/getUserData'),
  // SENDS AND GETS CURRENTLY STOPPED SONG POSTION
  beforeQuitEvent: (callback: (e: any) => void) =>
    ipcRenderer.on('app/beforeQuitEvent', callback),
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
  // SENDS MESSAGES FROM THE MAIN TO THE RENDERER
  getMessageFromMain: (callback: (event: unknown, message: string) => void) =>
    ipcRenderer.on('app/sendMessageToRenderer', callback),
  // SENDS MESSAGES FROM THE MAIN TO THE RENDERER
  dataUpdateEvent: (
    callback: (
      event: unknown,
      datType: DataUpdateEventTypes,
      message?: string
    ) => void
  ) => ipcRenderer.on('app/dataUpdateEvent', callback),
  // TOGGLE LIKE SONG
  toggleLikeSong: (
    songId: string,
    likeSong: boolean
  ): Promise<ToggleLikeSongReturnValue | undefined> =>
    ipcRenderer.invoke('app/toggleLikeSong', songId, likeSong),
  // GET ARTISTS ARTWORKS
  getArtistArtworks: (
    artistId: string,
    artistName?: string
  ): Promise<ArtistInfoFromNet | undefined> =>
    ipcRenderer.invoke('app/getArtistArtworks', artistId, artistName),
  // GET ARTIST DATA
  getArtistData: (
    artistIdOrName: string
  ): Promise<Artist | Artist[] | undefined> =>
    ipcRenderer.invoke('app/getArtistData', artistIdOrName),
  // GET ALBUM DATA
  getAlbumData: (albumId: string): Promise<Album | Album[] | undefined> =>
    ipcRenderer.invoke('app/getAlbumData', albumId),
  // GET PLAYLIST DATA
  getPlaylistData: (
    playlistId: string
  ): Promise<Playlist | Playlist[] | undefined> =>
    ipcRenderer.invoke('app/getPlaylistData', playlistId),
  // ADDS A NEW PLAYLIST
  addNewPlaylist: (
    playlistName: string
  ): Promise<{ success: boolean; message?: string; playlist?: Playlist }> =>
    ipcRenderer.invoke('app/addNewPlaylist', playlistName),
  // REMOVES A PLAYLIST
  removeAPlaylist: (
    playlistId: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> => ipcRenderer.invoke('app/removeAPlaylist', playlistId),
  // GET SONG INFO
  getSongInfo: (songId: string): Promise<SongData | undefined> =>
    ipcRenderer.invoke('app/getSongInfo', songId),
  // REMOVES A SONG FROM THE LIBRARY
  removeSongFromLibrary: (
    absoluteFilePath: string
  ): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke('app/removeSongFromLibrary', absoluteFilePath),
  // DELTEES A SONG FROM THE SYSTEM
  deleteSongFromSystem: (
    absoluteFilePath: string
  ): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke('app/deleteSongFromSystem', absoluteFilePath),
  // RESYNC SONGS LIBRARY
  resyncSongsLibrary: (): Promise<true> =>
    ipcRenderer.invoke('app/resyncSongsLibrary'),
  // REVEAL SONG IN FILE EXPLORER
  revealSongInFileExplorer: (songId: string): void =>
    ipcRenderer.send('revealSongInFileExplorer', songId),
  // OPENS URLS ON THE DEFAULT BROWSER
  openInBrowser: (url: string): void =>
    ipcRenderer.send('app/openInBrowser', url),
  // SENDS RENDERER ERROR LOGS TO THE MAIN PROCESS.
  sendLogs: (
    logs: Error,
    forceWindowRestart = false,
    forceMainRestart = false
  ): Promise<undefined> =>
    ipcRenderer.invoke(
      'app/getRendererLogs',
      logs,
      forceWindowRestart,
      forceMainRestart
    ),
  // TOGGLES MINI PLAYER
  toggleMiniPlayer: (isMiniPlayer: boolean) =>
    ipcRenderer.invoke('app/toggleMiniPlayer', isMiniPlayer),
  // REMOVES A MUSIC FOLDER AND ITS SONGS FROM THE MUSIC LIBRARY
  removeAMusicFolder: (absolutePath: string) =>
    ipcRenderer.invoke('app/removeAMusicFolder', absolutePath),
  // RESETS THE APP
  resetApp: (): void => ipcRenderer.send('app/resetApp'),
};

contextBridge.exposeInMainWorld('api', api);
