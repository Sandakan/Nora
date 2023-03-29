/* eslint-disable no-unused-vars */
/* eslint-disable import/no-cycle */
/* eslint-disable import/prefer-default-export */
import { contextBridge, ipcRenderer } from 'electron';
import path from 'path';
import { LastFMTrackInfoApi } from '../@types/last_fm_api';

export const api = {
  // $ APP PROPERTIES
  isInDevelopment:
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true',
  commandLineArgs: process.argv,

  // $ APP WINDOW CONTROLS
  minimizeApp: (): void => ipcRenderer.send('app/minimize'),
  toggleMaximizeApp: (): void => ipcRenderer.send('app/toggleMaximize'),
  closeApp: (): void => ipcRenderer.send('app/close'),
  hideApp: (): void => ipcRenderer.send('app/hide'),
  showApp: (): void => ipcRenderer.send('app/show'),

  // $ APP THEME
  listenForSystemThemeChanges: (
    callback: (e: any, isDarkMode: boolean, usingSystemTheme: boolean) => void
  ) => ipcRenderer.on('app/systemThemeChange', callback),
  changeAppTheme: (theme?: AppTheme): void =>
    ipcRenderer.send('app/changeAppTheme', theme),
  StoplisteningForSystemThemeChanges: (
    callback: (e: any, isDarkMode: boolean, usingSystemTheme: boolean) => void
  ) => ipcRenderer.removeListener('app/systemThemeChange', callback),

  // $ APP PLAYER CONTROLS
  songPlaybackStateChange: (isPlaying: boolean): void =>
    ipcRenderer.send('app/player/songPlaybackStateChange', isPlaying),
  toggleSongPlayback: (callback: (e: any) => void) =>
    ipcRenderer.on('app/player/toggleSongPlaybackState', callback),
  skipForwardToNextSong: (callback: (e: any) => void) =>
    ipcRenderer.on('app/player/skipForward', callback),
  skipBackwardToPreviousSong: (callback: (e: any) => void) =>
    ipcRenderer.on('app/player/skipBackward', callback),
  sendSongPosition: (position: number): void =>
    ipcRenderer.send('app/getSongPosition', position),
  toggleLikeSongs: (
    songIds: string[],
    isLikeSong?: boolean
  ): Promise<ToggleLikeSongReturnValue | undefined> =>
    ipcRenderer.invoke('app/toggleLikeSongs', songIds, isLikeSong),

  removeTogglePlaybackStateEvent: (callback: (e: any) => void) =>
    ipcRenderer.removeListener('app/player/toggleSongPlaybackState', callback),
  removeSkipBackwardToPreviousSongEvent: (callback: (e: any) => void) =>
    ipcRenderer.removeListener('app/player/skipBackward', callback),
  removeSkipForwardToNextSongEvent: (callback: (e: any) => void) =>
    ipcRenderer.removeListener('app/player/skipForward', callback),

  // $ AUDIO LIBRARY CONTROLS
  checkForStartUpSongs: (): Promise<AudioPlayerData | undefined> =>
    ipcRenderer.invoke('app/checkForStartUpSongs'),
  addMusicFolder: (sortType?: SongSortTypes): Promise<SongData[]> =>
    ipcRenderer.invoke('app/addMusicFolder', sortType),
  // addSongFromPath: (songPath:string): Promise<SongData[]> =>
  //   ipcRenderer.invoke('app/addSongFromPath', songPath),
  getSong: (
    songId: string,
    updateListeningRate = true
  ): Promise<AudioPlayerData> =>
    ipcRenderer.invoke('app/getSong', songId, updateListeningRate),
  getAllSongs: (
    sortType?: SongSortTypes,
    pageNo?: number,
    maxResultsPerPage?: number
  ): Promise<GetAllSongsResult> =>
    ipcRenderer.invoke('app/getAllSongs', sortType, pageNo, maxResultsPerPage),
  getSongInfo: (
    songIds: string[],
    sortType?: SongSortTypes,
    limit?: number,
    preserveIdOrder = false
  ): Promise<SongData[] | undefined> =>
    ipcRenderer.invoke(
      'app/getSongInfo',
      songIds,
      sortType,
      limit,
      preserveIdOrder
    ),
  getSongListeningData: (songIds: string[]): Promise<SongListeningData[]> =>
    ipcRenderer.invoke('app/getSongListeningData', songIds),
  updateSongListeningData: (
    songId: string,
    dataType: ListeningDataTypes,
    dataUpdateType: ListeningDataUpdateTypes
  ): Promise<void> =>
    ipcRenderer.invoke(
      'app/updateSongListeningData',
      songId,
      dataType,
      dataUpdateType
    ),
  resyncSongsLibrary: (): Promise<true> =>
    ipcRenderer.invoke('app/resyncSongsLibrary'),

  removeAMusicFolder: (absolutePath: string): Promise<void> =>
    ipcRenderer.invoke('app/removeAMusicFolder', absolutePath),
  getBlacklistData: (): Promise<Blacklist> =>
    ipcRenderer.invoke('app/getBlacklistData'),
  blacklistSongs: (songIds: string[]): Promise<void> =>
    ipcRenderer.invoke('app/blacklistSongs', songIds),
  restoreBlacklistedSongs: (songIds: string[]): Promise<void> =>
    ipcRenderer.invoke('app/restoreBlacklistedSongs', songIds),
  deleteSongsFromSystem: (
    absoluteFilePaths: string[],
    isPermanentDelete: boolean
  ): PromiseFunctionReturn =>
    ipcRenderer.invoke(
      'app/deleteSongsFromSystem',
      absoluteFilePaths,
      isPermanentDelete
    ),
  generatePalettes: (): Promise<void> =>
    ipcRenderer.invoke('app/generatePalettes'),

  // $ SUGGESTIONS RELATED APIS
  getArtistDuplicates: (artistName: string): Promise<Artist[]> =>
    ipcRenderer.invoke('app/getArtistDuplicates', artistName),

  resolveArtistDuplicates: (
    selectedArtistId: string,
    duplicateIds: string[]
  ): Promise<void> =>
    ipcRenderer.invoke(
      'app/resolveArtistDuplicates',
      selectedArtistId,
      duplicateIds
    ),

  // $ APP PLAYER UNKNOWN SONGS FETCHING APIS
  playSongFromUnknownSource: (
    callback: (_: unknown, audioPlayerData: AudioPlayerData) => void
  ) => ipcRenderer.on('app/playSongFromUnknownSource', callback),
  getSongFromUnknownSource: (songPath: string): Promise<AudioPlayerData> =>
    ipcRenderer.invoke('app/getSongFromUnknownSource', songPath),

  // $ QUIT EVENT HANDLING
  beforeQuitEvent: (callback: (e: any) => void) =>
    ipcRenderer.on('app/beforeQuitEvent', callback),
  removeBeforeQuitEventListener: (callback: (...args: any[]) => void) =>
    ipcRenderer.removeListener('app/beforeQuitEvent', callback),

  // $ APP WINDOW BLUR AND FOCUS EVENTS
  onWindowFocus: (callback: (e: any) => void) =>
    ipcRenderer.on('app/focused', callback),
  onWindowBlur: (callback: (e: any) => void) =>
    ipcRenderer.on('app/blurred', callback),

  // $ APP FULL-SCREEN EVENTS
  onEnterFullscreen: (callback: (e: any) => void) =>
    ipcRenderer.on('app/enteredFullscreen', callback),
  onLeaveFullscreen: (callback: (e: any) => void) =>
    ipcRenderer.on('app/leftFullscreen', callback),

  // $ APP SEARCH
  search: (
    filter: SearchFilters,
    value: string,
    updateSearchHistory?: boolean
  ): Promise<SearchResult> =>
    ipcRenderer.invoke('app/search', filter, value, updateSearchHistory),
  clearSearchHistory: (searchText?: string[]): Promise<boolean> =>
    ipcRenderer.invoke('app/clearSearchHistory', searchText),

  // $ SONG LYRICS
  getSongLyrics: (
    songInfo: LyricsRequestTrackInfo,
    lyricsType?: LyricsTypes,
    lyricsRequestType?: LyricsRequestTypes
  ): Promise<SongLyrics | undefined> =>
    ipcRenderer.invoke(
      'app/getSongLyrics',
      songInfo,
      lyricsType,
      lyricsRequestType
    ),

  saveLyricsToSong: (songPath: string, lyrics: SongLyrics) =>
    ipcRenderer.invoke('app/saveLyricsToSong', songPath, lyrics),

  // $ APP MESSAGES
  getMessageFromMain: (
    callback: (
      event: unknown,
      message: string,
      messageCode?: MessageCodes,
      data?: Record<string, unknown>
    ) => void
  ) => ipcRenderer.on('app/sendMessageToRendererEvent', callback),
  removeMessageToRendererEventListener: (callback: (...args: any[]) => void) =>
    ipcRenderer.removeListener('app/sendMessageToRendererEvent', callback),

  // $ APP DATA UPDATE EVENTS
  dataUpdateEvent: (
    callback: (e: unknown, dataEvents: DataUpdateEvent[]) => void
  ) => ipcRenderer.on('app/dataUpdateEvent', callback),
  removeDataUpdateEventListeners: () =>
    ipcRenderer.removeAllListeners('app/dataUpdateEvent'),

  // $ APP GLOBAL EVENT LISTENER CONTROLS
  removeIpcEventListener: (
    channel: IpcChannels,
    callback: (...args: any[]) => void
  ) => ipcRenderer.removeListener(channel, callback),

  // $  UPDATE SONG DATA
  updateSongId3Tags: (
    songIdOrPath: string,
    tags: SongTags,
    sendUpdatedData: boolean,
    isKnownSource: boolean
  ): Promise<UpdateSongDataResult> =>
    ipcRenderer.invoke(
      'app/updateSongId3Tags',
      songIdOrPath,
      tags,
      sendUpdatedData,
      isKnownSource
    ),
  getSongId3Tags: (
    songIdOrPath: string,
    isKnownSource: boolean
  ): Promise<SongTags> =>
    ipcRenderer.invoke('app/getSongId3Tags', songIdOrPath, isKnownSource),
  getImgFileLocation: (): Promise<string> =>
    ipcRenderer.invoke('app/getImgFileLocation'),
  revealSongInFileExplorer: (songId: string): void =>
    ipcRenderer.send('revealSongInFileExplorer', songId),

  // $ FETCH SONG DATA FROM INTERNET
  searchSongMetadataResultsInInternet: (
    songTitle: string,
    songArtists: string[]
  ): Promise<SongMetadataResultFromInternet[]> =>
    ipcRenderer.invoke(
      'app/searchSongMetadataResultsInInternet',
      songTitle,
      songArtists
    ),
  fetchSongMetadataFromInternet: (
    songTitle: string,
    songArtists: string[]
  ): Promise<SongMetadataResultFromInternet[]> =>
    ipcRenderer.invoke(
      'app/fetchSongMetadataFromInternet',
      songTitle,
      songArtists
    ),
  fetchSongInfoFromNet: (
    songTitle: string,
    songArtists: string[]
  ): Promise<LastFMTrackInfoApi | undefined> =>
    ipcRenderer.invoke('app/fetchSongInfoFromNet', songTitle, songArtists),

  // $ APP USER DATA
  getUserData: (): Promise<UserData> => ipcRenderer.invoke('app/getUserData'),
  saveUserData: (dataType: UserDataTypes, data: unknown) =>
    ipcRenderer.invoke('app/saveUserData', dataType, data),

  // $ STORAGE DATA
  getStorageUsage: (forceRefresh?: boolean): Promise<StorageMetrics> =>
    ipcRenderer.invoke('app/getStorageUsage', forceRefresh),

  // $ FOLDER DATA
  getFolderData: (
    folderPaths: string[],
    sortType?: FolderSortTypes
  ): Promise<MusicFolder[]> =>
    ipcRenderer.invoke('app/getFolderData', folderPaths, sortType),
  blacklistFolders: (folderPaths: string[]): Promise<void> =>
    ipcRenderer.invoke('app/blacklistFolders', folderPaths),
  restoreBlacklistedFolders: (folderPaths: string[]): Promise<void> =>
    ipcRenderer.invoke('app/restoreBlacklistedFolders', folderPaths),
  toggleBlacklistedFolders: (
    folderPaths: string[],
    isBlacklistFolder?: boolean
  ): Promise<void> =>
    ipcRenderer.invoke(
      'app/toggleBlacklistedFolders',
      folderPaths,
      isBlacklistFolder
    ),

  // $ ARTISTS DATA
  getArtistData: (
    artistIdsOrNames?: string[],
    sortType?: ArtistSortTypes
  ): Promise<Artist[]> =>
    ipcRenderer.invoke('app/getArtistData', artistIdsOrNames, sortType),
  toggleLikeArtists: (
    artistIds: string[],
    likeArtist?: boolean
  ): Promise<ToggleLikeSongReturnValue | undefined> =>
    ipcRenderer.invoke('app/toggleLikeArtists', artistIds, likeArtist),
  getArtistArtworks: (
    artistId: string
  ): Promise<ArtistInfoFromNet | undefined> =>
    ipcRenderer.invoke('app/getArtistArtworks', artistId),

  // $ GENRES DATA
  getGenresData: (
    genreIds?: string[],
    sortType?: GenreSortTypes
  ): Promise<Genre[]> =>
    ipcRenderer.invoke('app/getGenresData', genreIds, sortType),

  // $ ALBUMS DATA
  getAlbumData: (
    albumIds?: string[],
    sortType?: AlbumSortTypes
  ): Promise<Album[]> =>
    ipcRenderer.invoke('app/getAlbumData', albumIds, sortType),

  // $ PLAYLIST DATA AND CONTROLS
  getPlaylistData: (
    playlistIds?: string[],
    sortType?: PlaylistSortTypes,
    onlyMutablePlaylists?: boolean
  ): Promise<Playlist[]> =>
    ipcRenderer.invoke(
      'app/getPlaylistData',
      playlistIds,
      sortType,
      onlyMutablePlaylists
    ),
  addNewPlaylist: (
    playlistName: string,
    songIds?: string[],
    artworkPath?: string
  ): Promise<{ success: boolean; message?: string; playlist?: Playlist }> =>
    ipcRenderer.invoke(
      'app/addNewPlaylist',
      playlistName,
      songIds,
      artworkPath
    ),
  addSongsToPlaylist: (
    playlistId: string,
    songIds: string[]
  ): PromiseFunctionReturn =>
    ipcRenderer.invoke('app/addSongsToPlaylist', playlistId, songIds),
  addArtworkToAPlaylist: (
    playlistId: string,
    artworkPath: string
  ): Promise<ArtworkPaths | undefined> =>
    ipcRenderer.invoke('app/addArtworkToAPlaylist', playlistId, artworkPath),

  // $ APP PLAYLISTS DATA UPDATE
  removeSongFromPlaylist: (
    playlistId: string,
    songId: string
  ): PromiseFunctionReturn =>
    ipcRenderer.invoke('app/removeSongFromPlaylist', playlistId, songId),
  clearSongHistory: (): PromiseFunctionReturn =>
    ipcRenderer.invoke('app/clearSongHistory'),
  removePlaylists: (playlistIds: string[]) =>
    ipcRenderer.invoke('app/removePlaylists', playlistIds),

  // $ APP PAGES STATE
  savePageSortingState: (pageType: PageSortTypes, state: unknown): void =>
    ipcRenderer.send('app/savePageSortState', pageType, state),

  // $ APP LOGS
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

  // $ APP MINI PLAYER CONTROLS
  toggleMiniPlayer: (isMiniPlayerActive: boolean): Promise<void> =>
    ipcRenderer.invoke('app/toggleMiniPlayer', isMiniPlayerActive),
  toggleMiniPlayerAlwaysOnTop: (
    isMiniPlayerAlwaysOnTop: boolean
  ): Promise<void> =>
    ipcRenderer.invoke(
      'app/toggleMiniPlayerAlwaysOnTop',
      isMiniPlayerAlwaysOnTop
    ),

  // $ APP SETTINGS HELPER FUNCTIONS
  openInBrowser: (url: string): void =>
    ipcRenderer.send('app/openInBrowser', url),
  toggleAutoLaunch: (autoLaunchState: boolean): Promise<void> =>
    ipcRenderer.invoke('app/toggleAutoLaunch', autoLaunchState),
  openLogFile: (): void => ipcRenderer.send('app/openLogFile'),
  openDevtools: () => ipcRenderer.send('app/openDevTools'),
  networkStatusChange: (isConnected: boolean): void =>
    ipcRenderer.send('app/networkStatusChange', isConnected),

  // $ APP RESTART OR RESET
  restartRenderer: (reason: string): void =>
    ipcRenderer.send('app/restartRenderer', reason),
  restartApp: (reason: string): void =>
    ipcRenderer.send('app/restartApp', reason),
  resetApp: (): void => {
    ipcRenderer.removeAllListeners('app/beforeQuitEvent');
    ipcRenderer.send('app/resetApp');
  },

  // $ PATH FOR RENDERER
  path: {
    join: (...args: string[]) => path.join(...args),
  },

  // $ OTHER
  getArtworksForMultipleArtworksCover: (songIds: string[]): Promise<string[]> =>
    ipcRenderer.invoke('app/getArtworksForMultipleArtworksCover', songIds),
  getFolderInfo: (): Promise<FolderStructure> =>
    ipcRenderer.invoke('app/getFolderInfo'),
  getExtension: (dir: string) => {
    const ext = path.extname(dir);
    return ext.replace(/\W/, '');
  },
  getBaseName: (dir: string) => {
    const base = path.basename(dir);
    return base;
  },
  removeDefaultAppProtocolFromFilePath: (filePath: string) => {
    return filePath.replace(
      /nora:[/\\]{1,2}localFiles[/\\]{1,2}|\?[\w+=\w+&?]+$/gm,
      ''
    );
  },
};

contextBridge.exposeInMainWorld('api', api);
