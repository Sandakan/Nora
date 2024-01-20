import { contextBridge, ipcRenderer } from 'electron';
import { LastFMTrackInfoApi } from '../@types/last_fm_api';
import { SimilarTracksOutput } from '../@types/last_fm_similar_tracks_api';
import { LastFMAlbumInfo } from '../@types/last_fm_album_info_api';

const properties = {
  isInDevelopment:
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true',
  commandLineArgs: process.argv,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
};

const windowControls = {
  minimizeApp: (): void => ipcRenderer.send('app/minimize'),
  toggleMaximizeApp: (): void => ipcRenderer.send('app/toggleMaximize'),
  closeApp: (): void => ipcRenderer.send('app/close'),
  hideApp: (): void => ipcRenderer.send('app/hide'),
  showApp: (): void => ipcRenderer.send('app/show'),
  changePlayerType: (type: PlayerTypes): Promise<void> =>
    ipcRenderer.invoke('app/changePlayerType', type),
  onWindowFocus: (callback: (e: any) => void) =>
    ipcRenderer.on('app/focused', callback),
  onWindowBlur: (callback: (e: any) => void) =>
    ipcRenderer.on('app/blurred', callback),
};

const theme = {
  listenForSystemThemeChanges: (
    callback: (e: any, isDarkMode: boolean, usingSystemTheme: boolean) => void,
  ) => ipcRenderer.on('app/systemThemeChange', callback),
  changeAppTheme: (appTheme?: AppTheme): void =>
    ipcRenderer.send('app/changeAppTheme', appTheme),
  stoplisteningForSystemThemeChanges: (
    callback: (e: any, isDarkMode: boolean, usingSystemTheme: boolean) => void,
  ) => ipcRenderer.removeListener('app/systemThemeChange', callback),
};

const playerControls = {
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
    isLikeSong?: boolean,
  ): Promise<ToggleLikeSongReturnValue | undefined> =>
    ipcRenderer.invoke('app/toggleLikeSongs', songIds, isLikeSong),

  removeTogglePlaybackStateEvent: (callback: (e: any) => void) =>
    ipcRenderer.removeListener('app/player/toggleSongPlaybackState', callback),
  removeSkipBackwardToPreviousSongEvent: (callback: (e: any) => void) =>
    ipcRenderer.removeListener('app/player/skipBackward', callback),
  removeSkipForwardToNextSongEvent: (callback: (e: any) => void) =>
    ipcRenderer.removeListener('app/player/skipForward', callback),
};

const audioLibraryControls = {
  checkForStartUpSongs: (): Promise<AudioPlayerData | undefined> =>
    ipcRenderer.invoke('app/checkForStartUpSongs'),
  addSongsFromFolderStructures: (
    structures: FolderStructure[],
    sortType?: SongSortTypes,
  ): Promise<SongData[]> =>
    ipcRenderer.invoke(
      'app/addSongsFromFolderStructures',
      structures,
      sortType,
    ),

  getSong: (
    songId: string,
    updateListeningRate = true,
  ): Promise<AudioPlayerData> =>
    ipcRenderer.invoke('app/getSong', songId, updateListeningRate),
  getAllSongs: (
    sortType?: SongSortTypes,
    paginatingData?: PaginatingData,
  ): Promise<PaginatedResult<AudioInfo, SongSortTypes>> =>
    ipcRenderer.invoke('app/getAllSongs', sortType, paginatingData),
  getSongInfo: (
    songIds: string[],
    sortType?: SongSortTypes,
    limit?: number,
    preserveIdOrder = false,
  ): Promise<SongData[] | undefined> =>
    ipcRenderer.invoke(
      'app/getSongInfo',
      songIds,
      sortType,
      limit,
      preserveIdOrder,
    ),
  getSongListeningData: (songIds: string[]): Promise<SongListeningData[]> =>
    ipcRenderer.invoke('app/getSongListeningData', songIds),
  updateSongListeningData: <
    DataType extends keyof ListeningDataTypes,
    Value extends ListeningDataTypes[DataType],
  >(
    songId: string,
    dataType: DataType,
    dataUpdateType: Value,
  ): Promise<void> =>
    ipcRenderer.invoke(
      'app/updateSongListeningData',
      songId,
      dataType,
      dataUpdateType,
    ),
  resyncSongsLibrary: (): Promise<true> =>
    ipcRenderer.invoke('app/resyncSongsLibrary'),

  getBlacklistData: (): Promise<Blacklist> =>
    ipcRenderer.invoke('app/getBlacklistData'),
  blacklistSongs: (songIds: string[]): Promise<void> =>
    ipcRenderer.invoke('app/blacklistSongs', songIds),
  restoreBlacklistedSongs: (songIds: string[]): Promise<void> =>
    ipcRenderer.invoke('app/restoreBlacklistedSongs', songIds),
  deleteSongsFromSystem: (
    absoluteFilePaths: string[],
    isPermanentDelete: boolean,
  ): PromiseFunctionReturn =>
    ipcRenderer.invoke(
      'app/deleteSongsFromSystem',
      absoluteFilePaths,
      isPermanentDelete,
    ),
  generatePalettes: (): Promise<void> =>
    ipcRenderer.invoke('app/generatePalettes'),
  clearSongHistory: (): PromiseFunctionReturn =>
    ipcRenderer.invoke('app/clearSongHistory'),
  scrobbleSong: (songId: string, startTimeInSecs: number): Promise<void> =>
    ipcRenderer.invoke('app/scrobbleSong', songId, startTimeInSecs),
  sendNowPlayingSongDataToLastFM: (songId: string): Promise<void> =>
    ipcRenderer.invoke('app/sendNowPlayingSongDataToLastFM', songId),
  getSimilarTracksForASong: (songId: string): Promise<SimilarTracksOutput> =>
    ipcRenderer.invoke('app/getSimilarTracksForASong', songId),
};

const suggestions = {
  getArtistDuplicates: (artistName: string): Promise<Artist[]> =>
    ipcRenderer.invoke('app/getArtistDuplicates', artistName),

  resolveArtistDuplicates: (
    selectedArtistId: string,
    duplicateIds: string[],
  ): Promise<UpdateSongDataResult | undefined> =>
    ipcRenderer.invoke(
      'app/resolveArtistDuplicates',
      selectedArtistId,
      duplicateIds,
    ),

  resolveSeparateArtists: (
    separateArtistId: string,
    separateArtistNames: string[],
  ): Promise<UpdateSongDataResult | undefined> =>
    ipcRenderer.invoke(
      'app/resolveSeparateArtists',
      separateArtistId,
      separateArtistNames,
    ),

  resolveFeaturingArtists: (
    songId: string,
    featArtistNames: string[],
    removeFeatInfoInTitle?: boolean,
  ): Promise<UpdateSongDataResult | undefined> =>
    ipcRenderer.invoke(
      'app/resolveFeaturingArtists',
      songId,
      featArtistNames,
      removeFeatInfoInTitle,
    ),
};

// $ APP PLAYER UNKNOWN SONGS FETCHING APIS
const unknownSource = {
  playSongFromUnknownSource: (
    callback: (_: unknown, audioPlayerData: AudioPlayerData) => void,
  ) => ipcRenderer.on('app/playSongFromUnknownSource', callback),
  getSongFromUnknownSource: (songPath: string): Promise<AudioPlayerData> =>
    ipcRenderer.invoke('app/getSongFromUnknownSource', songPath),
  removePlaySongFromUnknownSourceEvent: (
    callback: (_: unknown, audioPlayerData: AudioPlayerData) => void,
  ) => ipcRenderer.removeListener('app/playSongFromUnknownSource', callback),
};

// $ QUIT EVENT HANDLING
const quitEvent = {
  beforeQuitEvent: (callback: (e: any) => void) =>
    ipcRenderer.on('app/beforeQuitEvent', callback),
  removeBeforeQuitEventListener: (callback: (...args: any[]) => void) =>
    ipcRenderer.removeListener('app/beforeQuitEvent', callback),
};

// $ SYSTEM BATTERY RELATED EVENTS
const battery = {
  listenForBatteryPowerStateChanges: (
    callback: (_: any, isOnBatteryPower: boolean) => void,
  ) => ipcRenderer.on('app/isOnBatteryPower', callback),
  stopListeningForBatteryPowerStateChanges: (
    callback: (_: any, isOnBatteryPower: boolean) => void,
  ) => ipcRenderer.removeListener('app/isOnBatteryPower', callback),
};

// $ APP FULL-SCREEN EVENTS
const fullscreen = {
  onEnterFullscreen: (callback: (e: any) => void) =>
    ipcRenderer.on('app/enteredFullscreen', callback),
  onLeaveFullscreen: (callback: (e: any) => void) =>
    ipcRenderer.on('app/leftFullscreen', callback),
};

// $ APP SEARCH
const search = {
  search: (
    filter: SearchFilters,
    value: string,
    updateSearchHistory?: boolean,
    isPredictiveSearchEnabled?: boolean,
  ): Promise<SearchResult> =>
    ipcRenderer.invoke(
      'app/search',
      filter,
      value,
      updateSearchHistory,
      isPredictiveSearchEnabled,
    ),
  clearSearchHistory: (searchText?: string[]): Promise<boolean> =>
    ipcRenderer.invoke('app/clearSearchHistory', searchText),
};

// $ SONG LYRICS
const lyrics = {
  getSongLyrics: (
    songInfo: LyricsRequestTrackInfo,
    lyricsType?: LyricsTypes,
    lyricsRequestType?: LyricsRequestTypes,
    saveLyricsAutomatically?: AutomaticallySaveLyricsTypes,
  ): Promise<SongLyrics | undefined> =>
    ipcRenderer.invoke(
      'app/getSongLyrics',
      songInfo,
      lyricsType,
      lyricsRequestType,
      saveLyricsAutomatically,
    ),

  saveLyricsToSong: (songPath: string, text: SongLyrics) =>
    ipcRenderer.invoke('app/saveLyricsToSong', songPath, text),
};

// $ APP MESSAGES
const messages = {
  getMessageFromMain: (
    callback: (
      event: unknown,
      messageCode: MessageCodes,
      data: Record<string, unknown>,
    ) => void,
  ) => ipcRenderer.on('app/sendMessageToRendererEvent', callback),
  removeMessageToRendererEventListener: (callback: (...args: any[]) => void) =>
    ipcRenderer.removeListener('app/sendMessageToRendererEvent', callback),
};

// $ APP DATA UPDATE EVENTS
const dataUpdates = {
  dataUpdateEvent: (
    callback: (e: unknown, dataEvents: DataUpdateEvent[]) => void,
  ) => ipcRenderer.on('app/dataUpdateEvent', callback),
  removeDataUpdateEventListeners: () =>
    ipcRenderer.removeAllListeners('app/dataUpdateEvent'),
};

// $  UPDATE SONG DATA
const songUpdates = {
  updateSongId3Tags: (
    songIdOrPath: string,
    tags: SongTags,
    sendUpdatedData: boolean,
    isKnownSource: boolean,
  ): Promise<UpdateSongDataResult> =>
    ipcRenderer.invoke(
      'app/updateSongId3Tags',
      songIdOrPath,
      tags,
      sendUpdatedData,
      isKnownSource,
    ),
  reParseSong: (songPath: string): Promise<SavableSongData | undefined> =>
    ipcRenderer.invoke('app/reParseSong', songPath),
  getSongId3Tags: (
    songIdOrPath: string,
    isKnownSource: boolean,
  ): Promise<SongTags> =>
    ipcRenderer.invoke('app/getSongId3Tags', songIdOrPath, isKnownSource),
  getImgFileLocation: (): Promise<string> =>
    ipcRenderer.invoke('app/getImgFileLocation'),

  revealSongInFileExplorer: (songId: string): void =>
    ipcRenderer.send('app/revealSongInFileExplorer', songId),
  saveArtworkToSystem: (songId: string, saveName?: string): void =>
    ipcRenderer.send('app/saveArtworkToSystem', songId, saveName),
  isMetadataUpdatesPending: (songPath: string): Promise<boolean> =>
    ipcRenderer.invoke('app/isMetadataUpdatesPending', songPath),
};

// $ FETCH SONG DATA FROM INTERNET
const songDataFromInternet = {
  searchSongMetadataResultsInInternet: (
    songTitle: string,
    songArtists: string[],
  ): Promise<SongMetadataResultFromInternet[]> =>
    ipcRenderer.invoke(
      'app/searchSongMetadataResultsInInternet',
      songTitle,
      songArtists,
    ),
  fetchSongMetadataFromInternet: (
    songTitle: string,
    songArtists: string[],
  ): Promise<SongMetadataResultFromInternet[]> =>
    ipcRenderer.invoke(
      'app/fetchSongMetadataFromInternet',
      songTitle,
      songArtists,
    ),
  fetchSongInfoFromNet: (
    songTitle: string,
    songArtists: string[],
  ): Promise<LastFMTrackInfoApi | undefined> =>
    ipcRenderer.invoke('app/fetchSongInfoFromNet', songTitle, songArtists),
};

// $ APP USER DATA
const userData = {
  getUserData: (): Promise<UserData> => ipcRenderer.invoke('app/getUserData'),
  saveUserData: (dataType: UserDataTypes, data: unknown) =>
    ipcRenderer.invoke('app/saveUserData', dataType, data),
};

// $ STORAGE DATA
const storageData = {
  getStorageUsage: (forceRefresh?: boolean): Promise<StorageMetrics> =>
    ipcRenderer.invoke('app/getStorageUsage', forceRefresh),
};

// $ FOLDER DATA
const folderData = {
  getFolderData: (
    folderPaths: string[],
    sortType?: FolderSortTypes,
  ): Promise<MusicFolder[]> =>
    ipcRenderer.invoke('app/getFolderData', folderPaths, sortType),
  blacklistFolders: (folderPaths: string[]): Promise<void> =>
    ipcRenderer.invoke('app/blacklistFolders', folderPaths),
  restoreBlacklistedFolders: (folderPaths: string[]): Promise<void> =>
    ipcRenderer.invoke('app/restoreBlacklistedFolders', folderPaths),
  toggleBlacklistedFolders: (
    folderPaths: string[],
    isBlacklistFolder?: boolean,
  ): Promise<void> =>
    ipcRenderer.invoke(
      'app/toggleBlacklistedFolders',
      folderPaths,
      isBlacklistFolder,
    ),
  revealFolderInFileExplorer: (folderPath: string): void =>
    ipcRenderer.send('app/revealFolderInFileExplorer', folderPath),
  getFolderStructures: (): Promise<FolderStructure[]> =>
    ipcRenderer.invoke('app/getFolderStructures'),
  removeAMusicFolder: (absolutePath: string): Promise<void> =>
    ipcRenderer.invoke('app/removeAMusicFolder', absolutePath),
};

// $ ARTISTS DATA
const artistsData = {
  getArtistData: (
    artistIdsOrNames?: string[],
    sortType?: ArtistSortTypes,
    limit?: number,
  ): Promise<Artist[]> =>
    ipcRenderer.invoke('app/getArtistData', artistIdsOrNames, sortType, limit),
  toggleLikeArtists: (
    artistIds: string[],
    likeArtist?: boolean,
  ): Promise<ToggleLikeSongReturnValue | undefined> =>
    ipcRenderer.invoke('app/toggleLikeArtists', artistIds, likeArtist),
  getArtistArtworks: (
    artistId: string,
  ): Promise<ArtistInfoFromNet | undefined> =>
    ipcRenderer.invoke('app/getArtistArtworks', artistId),
};

// $ GENRES DATA
const genresData = {
  getGenresData: (
    genreNamesOrIds?: string[],
    sortType?: GenreSortTypes,
  ): Promise<Genre[]> =>
    ipcRenderer.invoke('app/getGenresData', genreNamesOrIds, sortType),
};

// $ ALBUMS DATA
const albumsData = {
  getAlbumData: (
    albumTitlesOrIds?: string[],
    sortType?: AlbumSortTypes,
  ): Promise<Album[]> =>
    ipcRenderer.invoke('app/getAlbumData', albumTitlesOrIds, sortType),
  getAlbumInfoFromLastFM: (
    albumId: string,
  ): Promise<LastFMAlbumInfo | undefined> =>
    ipcRenderer.invoke('app/getAlbumInfoFromLastFM', albumId),
};

// $ PLAYLIST DATA AND CONTROLS
const playlistsData = {
  getPlaylistData: (
    playlistIds?: string[],
    sortType?: PlaylistSortTypes,
    onlyMutablePlaylists?: boolean,
  ): Promise<Playlist[]> =>
    ipcRenderer.invoke(
      'app/getPlaylistData',
      playlistIds,
      sortType,
      onlyMutablePlaylists,
    ),
  addNewPlaylist: (
    playlistName: string,
    songIds?: string[],
    artworkPath?: string,
  ): Promise<{ success: boolean; message?: string; playlist?: Playlist }> =>
    ipcRenderer.invoke(
      'app/addNewPlaylist',
      playlistName,
      songIds,
      artworkPath,
    ),
  addSongsToPlaylist: (
    playlistId: string,
    songIds: string[],
  ): PromiseFunctionReturn =>
    ipcRenderer.invoke('app/addSongsToPlaylist', playlistId, songIds),
  addArtworkToAPlaylist: (
    playlistId: string,
    artworkPath: string,
  ): Promise<ArtworkPaths | undefined> =>
    ipcRenderer.invoke('app/addArtworkToAPlaylist', playlistId, artworkPath),
  renameAPlaylist: (playlistId: string, newName: string): Promise<void> =>
    ipcRenderer.invoke('app/renameAPlaylist', playlistId, newName),
  removeSongFromPlaylist: (
    playlistId: string,
    songId: string,
  ): PromiseFunctionReturn =>
    ipcRenderer.invoke('app/removeSongFromPlaylist', playlistId, songId),
  removePlaylists: (playlistIds: string[]) =>
    ipcRenderer.invoke('app/removePlaylists', playlistIds),
  getArtworksForMultipleArtworksCover: (songIds: string[]): Promise<string[]> =>
    ipcRenderer.invoke('app/getArtworksForMultipleArtworksCover', songIds),
  exportPlaylist: (playlistId: string): Promise<void> =>
    ipcRenderer.invoke('app/exportPlaylist', playlistId),
  importPlaylist: (): Promise<void> => ipcRenderer.invoke('app/importPlaylist'),
};

// $ APP LOGS
const log = {
  sendLogs: (
    mes: string | Error,
    data?: Record<string, unknown>,
    logToConsoleType: LogMessageTypes = 'INFO',
    forceWindowRestart = false,
    forceMainRestart = false,
  ): Promise<any> => {
    return ipcRenderer.invoke(
      'app/getRendererLogs',
      mes,
      data,
      logToConsoleType,
      forceWindowRestart,
      forceMainRestart,
    );
  },
  openLogFile: (): void => ipcRenderer.send('app/openLogFile'),
};

// $ APP MINI PLAYER CONTROLS
const miniPlayer = {
  toggleMiniPlayerAlwaysOnTop: (
    isMiniPlayerAlwaysOnTop: boolean,
  ): Promise<void> =>
    ipcRenderer.invoke(
      'app/toggleMiniPlayerAlwaysOnTop',
      isMiniPlayerAlwaysOnTop,
    ),
};

// $ APP SETTINGS HELPER FUNCTIONS
const settingsHelpers = {
  getAppLanguage: (lang: LanguageCodes): void =>
    ipcRenderer.send('app/getAppLanguage', lang),
  openInBrowser: (url: string): void =>
    ipcRenderer.send('app/openInBrowser', url),
  toggleAutoLaunch: (autoLaunchState: boolean): Promise<void> =>
    ipcRenderer.invoke('app/toggleAutoLaunch', autoLaunchState),
  openDevtools: () => ipcRenderer.send('app/openDevTools'),
  networkStatusChange: (isConnected: boolean): void =>
    ipcRenderer.send('app/networkStatusChange', isConnected),
  exportAppData: (localStorageData: string): Promise<void> =>
    ipcRenderer.invoke('app/exportAppData', localStorageData),
  importAppData: (): Promise<void | LocalStorage> =>
    ipcRenderer.invoke('app/importAppData'),
  compareEncryptedData: (): Promise<boolean> =>
    ipcRenderer.invoke('app/compareEncryptedData'),
  loginToLastFmInBrowser: () => ipcRenderer.send('app/loginToLastFmInBrowser'),
  getFolderLocation: (): Promise<string> =>
    ipcRenderer.invoke('app/getFolderLocation'),
};

// $ APP RESTART OR RESET
const appControls = {
  restartRenderer: (reason: string): void =>
    ipcRenderer.send('app/restartRenderer', reason),
  restartApp: (reason: string): void =>
    ipcRenderer.send('app/restartApp', reason),
  resetApp: (): void => {
    ipcRenderer.removeAllListeners('app/beforeQuitEvent');
    ipcRenderer.send('app/resetApp');
  },
  stopScreenSleeping: () => ipcRenderer.send('app/stopScreenSleeping'),

  allowScreenSleeping: () => ipcRenderer.send('app/allowScreenSleeping'),
};

// $ OTHER
const utils = {
  path: {
    join: (...args: string[]) => args.join('/'),
  },
  getExtension: (dir: string) => {
    const ext = dir.split('.').at(-1) || '';
    return ext;
  },
  getBaseName: (dir: string) => {
    const base =
      dir
        .split(/[/\\]/)
        .filter((x) => x)
        .at(-1) || '';
    return base;
  },
  removeDefaultAppProtocolFromFilePath: (filePath: string) => {
    return filePath.replace(
      /nora:[/\\]{1,2}localFiles[/\\]{1,2}|\?[\w+=\w+&?]+$/gm,
      '',
    );
  },
};

export const api = {
  properties,
  windowControls,
  theme,
  playerControls,
  audioLibraryControls,
  suggestions,
  unknownSource,
  quitEvent,
  battery,
  fullscreen,
  search,
  lyrics,
  messages,
  dataUpdates,
  songUpdates,
  songDataFromInternet,
  userData,
  storageData,
  folderData,
  artistsData,
  genresData,
  albumsData,
  playlistsData,
  log,
  miniPlayer,
  settingsHelpers,
  appControls,
  utils,
};

contextBridge.exposeInMainWorld('api', api);
