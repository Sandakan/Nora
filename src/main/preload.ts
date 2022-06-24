/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/prefer-default-export */
import { contextBridge, ipcRenderer } from 'electron';
import NodeID3 from 'node-id3';
// import { FixedSizeList } from 'react-window';

export const api = {
  /** WINDOW CONTROLS * */
  closeApp: (): void => ipcRenderer.send('app/close'),
  minimizeApp: (): void => ipcRenderer.send('app/minimize'),
  toggleMaximizeApp: (): void => ipcRenderer.send('app/toggleMaximize'),

  /** ADDS NEW FOLDERS * */
  addMusicFolder: (sortType?: SongsPageSortTypes): Promise<SongData[]> =>
    ipcRenderer.invoke('app/addMusicFolder', sortType),

  /** GET SONG DATA * */
  getSong: (
    songId: string,
    updateListeningRate = true
  ): Promise<AudioData | undefined> =>
    ipcRenderer.invoke('app/getSong', songId, updateListeningRate),

  /** FETCHES ALL THE SONGS. SUPPORTS SORTING AND PAGINATION * */
  getAllSongs: (
    sortType?: SongsPageSortTypes,
    pageNo?: number,
    maxResultsPerPage?: number
  ): Promise<GetAllSongsResult> =>
    ipcRenderer.invoke('app/getAllSongs', sortType, pageNo, maxResultsPerPage),

  /** SAVES AND GETS USERDATA * */
  saveUserData: (dataType: UserDataTypes, data: any) =>
    ipcRenderer.invoke('app/saveUserData', dataType, data),
  getUserData: (): Promise<UserData> => ipcRenderer.invoke('app/getUserData'),

  /** SENDS AN EVENT TO THE RENDERER BEFORE QUITTING THE APP. * */
  beforeQuitEvent: (callback: (e: any) => void) =>
    ipcRenderer.on('app/beforeQuitEvent', callback),

  /** SENDS AN EVENT TO THE RENDERER WHEN THE WINDOW GAINS FOCUS. * */
  onWindowFocus: (callback: (e: any) => void) =>
    ipcRenderer.on('app/focused', callback),

  /** SENDS AN EVENT TO THE RENDERER WHEN THE WINDOW LOSES FOCUS. * */
  onWindowBlur: (callback: (e: any) => void) =>
    ipcRenderer.on('app/blurred', callback),

  /** SENDS AND GETS CURRENTLY STOPPED SONG POSTION * */
  sendSongPosition: (position: number): void =>
    ipcRenderer.send('app/getSongPosition', position),

  /** INCREMENTS THE NO OF SONE LISTENS * */
  incrementNoOfSongListens: (songId: string): void =>
    ipcRenderer.send('app/incrementNoOfSongListens', songId),

  /** PROVIDES SEARCH RESULTS * */
  search: (filter: string, value: string): Promise<SearchResult> =>
    ipcRenderer.invoke('app/search', filter, value),

  /** PROVIDES SONG LYRICS * */
  getSongLyrics: (
    songTitle: string,
    songArtists?: string[]
  ): Promise<Lyrics | undefined> =>
    ipcRenderer.invoke('app/getSongLyrics', songTitle, songArtists),

  /** CONTEXT MENU - OPENS DEVTOOLS * */
  openDevtools: () => ipcRenderer.send('app/openDevTools'),

  /** SENDS MESSAGES FROM THE MAIN TO THE RENDERER * */
  getMessageFromMain: (callback: (event: unknown, message: string) => void) =>
    ipcRenderer.on('app/sendMessageToRenderer', callback),

  /** SENDS MESSAGES FROM THE MAIN TO THE RENDERER * */
  dataUpdateEvent: (
    callback: (
      event: unknown,
      datType: DataUpdateEventTypes,
      message?: string
    ) => void
  ) => ipcRenderer.on('app/dataUpdateEvent', callback),

  /** TOGGLE LIKE SONG * */
  toggleLikeSong: (
    songId: string,
    likeSong: boolean
  ): Promise<ToggleLikeSongReturnValue | undefined> =>
    ipcRenderer.invoke('app/toggleLikeSong', songId, likeSong),

  /** GET ARTISTS ARTWORKS * */
  getArtistArtworks: (
    artistId: string
  ): Promise<ArtistInfoFromNet | undefined> =>
    ipcRenderer.invoke('app/getArtistArtworks', artistId),

  /** GET ARTIST DATA * */
  getArtistData: (artistIdsOrNames?: string[]): Promise<Artist[]> =>
    ipcRenderer.invoke('app/getArtistData', artistIdsOrNames),

  /** GET GENRES DATA * */
  getGenresData: (genreIds?: string[]): Promise<Genre[]> =>
    ipcRenderer.invoke('app/getGenresData', genreIds),

  /** GET ALBUM DATA * */
  getAlbumData: (albumIds?: string[]): Promise<Album[]> =>
    ipcRenderer.invoke('app/getAlbumData', albumIds),

  /** GET PLAYLIST DATA * */
  getPlaylistData: (playlistIds?: string[]): Promise<Playlist[]> =>
    ipcRenderer.invoke('app/getPlaylistData', playlistIds),

  /** ADDS A NEW PLAYLIST * */
  addNewPlaylist: (
    playlistName: string
  ): Promise<{ success: boolean; message?: string; playlist?: Playlist }> =>
    ipcRenderer.invoke('app/addNewPlaylist', playlistName),

  /** REMOVES A PLAYLIST * */
  removeAPlaylist: (
    playlistId: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> => ipcRenderer.invoke('app/removeAPlaylist', playlistId),

  /** GET SONG INFO * */
  getSongInfo: (songIds: string[]): Promise<SongData[] | undefined> =>
    ipcRenderer.invoke('app/getSongInfo', songIds),

  /** REMOVES A SONG FROM THE LIBRARY * */
  removeSongFromLibrary: (
    absoluteFilePath: string
  ): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke('app/removeSongFromLibrary', absoluteFilePath),

  /** DELTEES A SONG FROM THE SYSTEM * */
  deleteSongFromSystem: (
    absoluteFilePath: string,
    isPermanentDelete: boolean
  ): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke(
      'app/deleteSongFromSystem',
      absoluteFilePath,
      isPermanentDelete
    ),

  /** RESYNC SONGS LIBRARY * */
  resyncSongsLibrary: (): Promise<true> =>
    ipcRenderer.invoke('app/resyncSongsLibrary'),

  /** Updates the ID3 tags of the song. */
  updateSongId3Tags: (
    songId: string,
    tags: SongId3Tags
  ): Promise<boolean | undefined> =>
    ipcRenderer.invoke('app/updateSongId3Tags', songId, tags),

  /** Fetches the ID3 tags of the song. */
  getSongId3Tags: (songPath: string): Promise<NodeID3.Tags | undefined> =>
    ipcRenderer.invoke('app/getSongId3Tags', songPath),

  // /** Sends a react-window list component */
  // getReactWindowComponenet: (): typeof FixedSizeList => FixedSizeList,

  /** REVEAL SONG IN FILE EXPLORER * */
  revealSongInFileExplorer: (songId: string): void =>
    ipcRenderer.send('revealSongInFileExplorer', songId),

  /** OPENS URLS ON THE DEFAULT BROWSER * */
  openInBrowser: (url: string): void =>
    ipcRenderer.send('app/openInBrowser', url),

  /** SENDS RENDERER ERROR LOGS TO THE MAIN PROCESS. * */
  sendLogs: (
    logs: string,
    forceWindowRestart = false,
    forceMainRestart = false
  ): Promise<undefined> =>
    ipcRenderer.invoke(
      'app/getRendererLogs',
      logs,
      forceWindowRestart,
      forceMainRestart
    ),

  /** TOGGLES MINI PLAYER * */
  toggleMiniPlayer: (isMiniPlayer: boolean): Promise<void> =>
    ipcRenderer.invoke('app/toggleMiniPlayer', isMiniPlayer),

  /** TOGGLES AUTO LAUNCH FEATURE* */
  toggleAutoLaunch: (autoLaunchState: boolean): Promise<void> =>
    ipcRenderer.invoke('app/toggleAutoLaunch', autoLaunchState),

  /** REMOVES A MUSIC FOLDER AND ITS SONGS FROM THE MUSIC LIBRARY * */
  removeAMusicFolder: (absolutePath: string): Promise<void> =>
    ipcRenderer.invoke('app/removeAMusicFolder', absolutePath),

  /** RESTORES A BLACKLISTED SONG * */
  restoreBlacklistedSong: (absolutePath: string): Promise<void> =>
    ipcRenderer.invoke('app/restoreBlacklistedSong', absolutePath),

  /** Opens the log file of the app * */
  openLogFile: (): void => ipcRenderer.send('app/openLogFile'),

  /** RESETS THE APP * */
  resetApp: (): void => ipcRenderer.send('app/resetApp'),
};

contextBridge.exposeInMainWorld('api', api);
