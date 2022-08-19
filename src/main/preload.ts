/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/prefer-default-export */
import { contextBridge, ipcRenderer } from 'electron';
import { TLyrics } from 'songlyrics';

export const api = {
  /** Tells whether the app is is development or production. */
  isDevelopment:
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true',

  /** closes the app */
  closeApp: (): void => ipcRenderer.send('app/close'),
  /** minimized the app */
  minimizeApp: (): void => ipcRenderer.send('app/minimize'),
  /** toggle maximize the app */
  toggleMaximizeApp: (): void => ipcRenderer.send('app/toggleMaximize'),

  /** Informs when the system theme change to dark mode. */
  playSongFromUnknownSource: (
    callback: (
      _: unknown,
      data: { audioData: AudioData; isKnownSource: boolean }
    ) => void
  ) => ipcRenderer.on('app/playSongFromUnknownSource', callback),

  /** Tells the main process when the renderer completes its process. */
  checkForStartUpSongs: (): Promise<{
    audioData: AudioData;
    isKnownSource: boolean;
  }> => ipcRenderer.invoke('app/checkForStartUpSongs'),

  /** Informs when the system theme change to dark mode. */
  listenForSystemThemeChanges: (
    callback: (e: any, isDarkMode: boolean, usingSystemTheme: boolean) => void
  ) => ipcRenderer.on('app/systemThemeChange', callback),

  /** Changes app theme. */
  changeAppTheme: (theme?: AppTheme): void =>
    ipcRenderer.send('app/changeAppTheme', theme),

  /** removes the event that watches for system theme changes. */
  StoplisteningForSystemThemeChanges: (
    callback: (e: any, isDarkMode: boolean, usingSystemTheme: boolean) => void
  ) => ipcRenderer.removeListener('app/systemThemeChange', callback),

  /** Tells the main process whether the player is currently playing a song. */
  songPlaybackStateChange: (isPlaying: boolean): void =>
    ipcRenderer.send('app/player/songPlaybackStateChange', isPlaying),
  /** Toggles the playback state of the player from the main process. */
  toggleSongPlaybackState: (callback: (e: any) => void) =>
    ipcRenderer.on('app/player/toggleSongPlaybackState', callback),
  /** Skips to the next song. */
  skipForwardToNextSong: (callback: (e: any) => void) =>
    ipcRenderer.on('app/player/skipForward', callback),
  /** Skips to the previous song. */
  skipBackwardToPreviousSong: (callback: (e: any) => void) =>
    ipcRenderer.on('app/player/skipBackward', callback),
  /** Removes the togglePlaybackStateEventListener. */
  removeTogglePlaybackStateEvent: (callback: (e: any) => void) =>
    ipcRenderer.removeListener('app/player/toggleSongPlaybackState', callback),
  /** Removes the skipBackwardToPreviousSong Listener. */
  removeSkipBackwardToPreviousSongEvent: (callback: (e: any) => void) =>
    ipcRenderer.removeListener('app/player/skipBackward', callback),
  /** Removes the togglePlaybackStateEventListener. */
  removeSkipForwardToNextSongEvent: (callback: (e: any) => void) =>
    ipcRenderer.removeListener('app/player/skipForward', callback),

  /** ADDS NEW FOLDERS */
  addMusicFolder: (sortType?: SongSortTypes): Promise<SongData[]> =>
    ipcRenderer.invoke('app/addMusicFolder', sortType),

  // /** ADDS A NEW SONG INSTEAD OF ADDING THROUGH A FOLDER */
  // addSongFromPath: (songPath:string): Promise<SongData[]> =>
  //   ipcRenderer.invoke('app/addSongFromPath', songPath),

  /** GET SONG DATA */
  getSong: (songId: string, updateListeningRate = true): Promise<AudioData> =>
    ipcRenderer.invoke('app/getSong', songId, updateListeningRate),

  /** GET SONG DATA FROM UNKNOWN SOURCE */
  getSongFromUnknownSource: (
    songPath: string
  ): Promise<{ audioData: AudioData; isKnownSource: boolean }> =>
    ipcRenderer.invoke('app/getSongFromUnknownSource', songPath),

  /** FETCHES ALL THE SONGS. SUPPORTS SORTING AND PAGINATION */
  getAllSongs: (
    sortType?: SongSortTypes,
    pageNo?: number,
    maxResultsPerPage?: number
  ): Promise<GetAllSongsResult> =>
    ipcRenderer.invoke('app/getAllSongs', sortType, pageNo, maxResultsPerPage),

  /** SAVES AND GETS USERDATA */
  saveUserData: (dataType: UserDataTypes, data: any) =>
    ipcRenderer.invoke('app/saveUserData', dataType, data),
  getUserData: (): Promise<UserData> => ipcRenderer.invoke('app/getUserData'),

  /** SENDS AN EVENT TO THE RENDERER BEFORE QUITTING THE APP. */
  beforeQuitEvent: (callback: (e: any) => void) =>
    ipcRenderer.on('app/beforeQuitEvent', callback),

  /**  Removes the specified listener from beforeQuitEvent */
  removeBeforeQuitEventListener: (callback: (...args: any[]) => void) =>
    ipcRenderer.removeListener('app/beforeQuitEvent', callback),

  /** SENDS AN EVENT TO THE RENDERER WHEN THE WINDOW GAINS FOCUS. */
  onWindowFocus: (callback: (e: any) => void) =>
    ipcRenderer.on('app/focused', callback),

  /** SENDS AN EVENT TO THE RENDERER WHEN THE WINDOW LOSES FOCUS. */
  onWindowBlur: (callback: (e: any) => void) =>
    ipcRenderer.on('app/blurred', callback),

  /** SENDS AND GETS CURRENTLY STOPPED SONG POSTION */
  sendSongPosition: (position: number): void =>
    ipcRenderer.send('app/getSongPosition', position),

  /** INCREMENTS THE NO OF SONE LISTENS */
  incrementNoOfSongListens: (songId: string): void =>
    ipcRenderer.send('app/incrementNoOfSongListens', songId),

  /** PROVIDES SEARCH RESULTS */
  search: (
    filter: SearchFilters,
    value: string,
    updateSearchHistory?: boolean
  ): Promise<SearchResult> =>
    ipcRenderer.invoke('app/search', filter, value, updateSearchHistory),

  /** PROVIDES SONG LYRICS */
  getSongLyrics: (
    songTitle: string,
    songArtists?: string[]
  ): Promise<Lyrics | undefined> =>
    ipcRenderer.invoke('app/getSongLyrics', songTitle, songArtists),

  /** Fetches song lyrics from the internet. */
  fetchSongLyricsFromNet: (
    songTitle: string,
    songArtists?: string[]
  ): Promise<TLyrics | undefined> =>
    ipcRenderer.invoke('app/fetchSongLyricsFromNet', songTitle, songArtists),

  /** CONTEXT MENU - OPENS DEVTOOLS */
  openDevtools: () => ipcRenderer.send('app/openDevTools'),

  /** SENDS MESSAGES FROM THE MAIN TO THE RENDERER */
  getMessageFromMain: (
    callback: (
      event: unknown,
      message: string,
      messageCode?: MessageCodes,
      data?: object
    ) => void
  ) => ipcRenderer.on('app/sendMessageToRendererEvent', callback),

  /**  Removes the specified listener from sendMessageToRendererEvent */
  removeMessageToRendererEventListener: (callback: (...args: any[]) => void) =>
    ipcRenderer.removeListener('app/sendMessageToRendererEvent', callback),

  /** SENDS MESSAGES FROM THE MAIN TO THE RENDERER */
  dataUpdateEvent: (
    callback: (e: unknown, dataEvents: DataUpdateEvent[]) => void
  ) => ipcRenderer.on('app/dataUpdateEvent', callback),

  /**  Removes the all the listeners from dataUpdateEvent */
  removeDataUpdateEventListeners: () =>
    ipcRenderer.removeAllListeners('app/dataUpdateEvent'),

  /**  Removes a listener from the specified channel */
  removeIpcEventListener: (
    channel: IpcChannels,
    callback: (...args: any[]) => void
  ) => ipcRenderer.removeListener(channel, callback),

  /** TOGGLE LIKE SONG */
  toggleLikeSong: (
    songId: string,
    likeSong: boolean
  ): Promise<ToggleLikeSongReturnValue | undefined> =>
    ipcRenderer.invoke('app/toggleLikeSong', songId, likeSong),

  /** GET ARTISTS ARTWORKS */
  getArtistArtworks: (
    artistId: string
  ): Promise<ArtistInfoFromNet | undefined> =>
    ipcRenderer.invoke('app/getArtistArtworks', artistId),

  /** GET ARTISTS ARTWORKS */
  fetchSongInfoFromNet: (
    songTitle: string,
    songArtists: string[]
  ): Promise<LastFMTrackInfoApi | undefined> =>
    ipcRenderer.invoke('app/fetchSongInfoFromNet', songTitle, songArtists),

  /** GET ARTIST DATA */
  getArtistData: (artistIdsOrNames?: string[]): Promise<Artist[]> =>
    ipcRenderer.invoke('app/getArtistData', artistIdsOrNames),

  /** GET GENRES DATA */
  getGenresData: (genreIds?: string[]): Promise<Genre[]> =>
    ipcRenderer.invoke('app/getGenresData', genreIds),

  /** GET ALBUM DATA */
  getAlbumData: (albumIds?: string[]): Promise<Album[]> =>
    ipcRenderer.invoke('app/getAlbumData', albumIds),

  /** GET PLAYLIST DATA */
  getPlaylistData: (
    playlistIds?: string[],
    onlyMutablePlaylists?: boolean
  ): Promise<Playlist[]> =>
    ipcRenderer.invoke(
      'app/getPlaylistData',
      playlistIds,
      onlyMutablePlaylists
    ),

  /** ADDS A NEW PLAYLIST */
  addNewPlaylist: (
    playlistName: string
  ): Promise<{ success: boolean; message?: string; playlist?: Playlist }> =>
    ipcRenderer.invoke('app/addNewPlaylist', playlistName),

  /** ADDS A SONG TO A PLAYLIST */
  addSongToPlaylist: (
    playlistId: string,
    songId: string
  ): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke('app/addSongToPlaylist', playlistId, songId),

  /** REMOVES A SONG TO A PLAYLIST */
  removeSongFromPlaylist: (
    playlistId: string,
    songId: string
  ): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke('app/removeSongFromPlaylist', playlistId, songId),

  /** CLEARS SONG HISTORY OF THE APP */
  clearSongHistory: (): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke('app/clearSongHistory'),

  /** REMOVES A PLAYLIST */
  removeAPlaylist: (
    playlistId: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> => ipcRenderer.invoke('app/removeAPlaylist', playlistId),

  /** GET SONG INFO */
  getSongInfo: (
    songIds: string[],
    sortType?: SongSortTypes,
    limit?: number
  ): Promise<SongData[] | undefined> =>
    ipcRenderer.invoke('app/getSongInfo', songIds, sortType, limit),

  /** REMOVES A SONG FROM THE LIBRARY */
  removeSongFromLibrary: (
    absoluteFilePath: string
  ): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke('app/removeSongFromLibrary', absoluteFilePath),

  /** DELTEES A SONG FROM THE SYSTEM */
  deleteSongFromSystem: (
    absoluteFilePath: string,
    isPermanentDelete: boolean
  ): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke(
      'app/deleteSongFromSystem',
      absoluteFilePath,
      isPermanentDelete
    ),

  /** RESYNC SONGS LIBRARY */
  resyncSongsLibrary: (): Promise<true> =>
    ipcRenderer.invoke('app/resyncSongsLibrary'),

  /** Updates the ID3 tags of the song. */
  updateSongId3Tags: (
    songId: string,
    tags: SongTags
  ): Promise<boolean | undefined> =>
    ipcRenderer.invoke('app/updateSongId3Tags', songId, tags),

  /** Fetches the ID3 tags of the song. */
  getSongId3Tags: (songPath: string): Promise<SongTags> =>
    ipcRenderer.invoke('app/getSongId3Tags', songPath),

  /** Opens a prompt for the user to select an img from the system. Returns the filepath of the selected img. */
  getImgFileLocation: (): Promise<string> =>
    ipcRenderer.invoke('app/getImgFileLocation'),

  /** REVEAL SONG IN FILE EXPLORER */
  revealSongInFileExplorer: (songId: string): void =>
    ipcRenderer.send('revealSongInFileExplorer', songId),

  /** Saves the sorting state of some of the app's pages. */
  savePageSortingState: (pageType: PageSortTypes, state: unknown): void =>
    ipcRenderer.send('app/savePageSortState', pageType, state),

  /** OPENS URLS ON THE DEFAULT BROWSER */
  openInBrowser: (url: string): void =>
    ipcRenderer.send('app/openInBrowser', url),

  /** SENDS RENDERER ERROR LOGS TO THE MAIN PROCESS. */
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

  /** TOGGLES MINI PLAYER */
  toggleMiniPlayer: (isMiniPlayerActive: boolean): Promise<void> =>
    ipcRenderer.invoke('app/toggleMiniPlayer', isMiniPlayerActive),

  /** TOGGLES MINI PLAYER */
  toggleMiniPlayerAlwaysOnTop: (
    isMiniPlayerAlwaysOnTop: boolean
  ): Promise<void> =>
    ipcRenderer.invoke(
      'app/toggleMiniPlayerAlwaysOnTop',
      isMiniPlayerAlwaysOnTop
    ),

  /** TOGGLES AUTO LAUNCH FEATURE */
  toggleAutoLaunch: (autoLaunchState: boolean): Promise<void> =>
    ipcRenderer.invoke('app/toggleAutoLaunch', autoLaunchState),

  /** REMOVES A MUSIC FOLDER AND ITS SONGS FROM THE MUSIC LIBRARY */
  removeAMusicFolder: (absolutePath: string): Promise<void> =>
    ipcRenderer.invoke('app/removeAMusicFolder', absolutePath),

  /** RESTORES A BLACKLISTED SONG */
  restoreBlacklistedSong: (absolutePath: string): Promise<void> =>
    ipcRenderer.invoke('app/restoreBlacklistedSong', absolutePath),

  /** Opens the log file of the app */
  openLogFile: (): void => ipcRenderer.send('app/openLogFile'),

  /** Restarts the renderer. */
  restartRenderer: (reason: string): void =>
    ipcRenderer.send('app/restartRenderer', reason),

  /** Notifies about a network change to the main process. */
  networkStatusChange: (isConnected: boolean): void =>
    ipcRenderer.send('app/networkStatusChange', isConnected),

  /** Restarts the app. */
  restartApp: (reason: string): void =>
    ipcRenderer.send('app/restartApp', reason),

  /** RESETS THE APP */
  resetApp: (): void => {
    ipcRenderer.removeAllListeners('app/beforeQuitEvent');
    ipcRenderer.send('app/resetApp');
  },
};

contextBridge.exposeInMainWorld('api', api);
