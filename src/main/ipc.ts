import getBlacklistData from '@main/core/getBlacklistData';
import { app, BrowserWindow, ipcMain, powerMonitor, shell } from 'electron';

import addArtworkToAPlaylist from './core/addArtworkToAPlaylist';
import addSongsFromFolderStructures from './core/addMusicFolder';
import addNewPlaylist from './core/addNewPlaylist';
import addSongsToPlaylist from './core/addSongsToPlaylist';
import blacklistFolders from './core/blacklistFolders';
import blacklistSongs from './core/blacklistSongs';
import changeAppTheme from './core/changeAppTheme';
import checkForNewSongs from './core/checkForNewSongs';
import checkForStartUpSongs from './core/checkForStartUpSongs';
import clearSearchHistoryResults from './core/clearSeachHistoryResults';
import clearSongHistory from './core/clearSongHistory';
import deleteSongsFromSystem from './core/deleteSongsFromSystem';
import exportAppData from './core/exportAppData';
import exportPlaylist from './core/exportPlaylist';
import fetchAlbumData from './core/fetchAlbumData';
import fetchArtistData from './core/fetchArtistData';
import fetchSongInfoFromLastFM from './core/fetchSongInfoFromLastFM';
import { getAllFavoriteSongs } from './core/getAllFavoriteSongs';
import { getAllHistorySongs } from './core/getAllHistorySongs';
import getAllSongs from './core/getAllSongs';
import getArtistInfoFromNet from './core/getArtistInfoFromNet';
import getArtworksForMultipleArtworksCover from './core/getArtworksForMultipleArtworksCover';
import { getArtistDuplicates } from './core/getDuplicates';
import { getFolderStructures } from './core/getFolderStructures';
import getGenresInfo from './core/getGenresInfo';
import { getListeningData } from './core/getListeningData';
import getMusicFolderData from './core/getMusicFolderData';
import getSongInfo from './core/getSongInfo';
import getSongLyrics from './core/getSongLyrics';
import getStorageUsage from './core/getStorageUsage';
import importAppData from './core/importAppData';
import importPlaylist from './core/importPlaylist';
import removeMusicFolder from './core/removeMusicFolder';
import removePlaylists from './core/removePlaylists';
import removeSongFromPlaylist from './core/removeSongFromPlaylist';
import renameAPlaylist from './core/renameAPlaylist';
import { resolveArtistDuplicates } from './core/resolveDuplicates';
import resolveFeaturingArtists from './core/resolveFeaturingArtists';
import { resolveSeparateArtists } from './core/resolveSeparateArtists';
import restoreBlacklistedFolders from './core/restoreBlacklistedFolder';
import restoreBlacklistedSongs from './core/restoreBlacklistedSongs';
import saveArtworkToSystem from './core/saveArtworkToSystem';
import sendAudioData from './core/sendAudioData';
import sendAudioDataFromPath from './core/sendAudioDataFromPath';
import sendPlaylistData from './core/sendPlaylistData';
import sendSongID3Tags from './core/sendSongMetadata';
import toggleBlacklistFolders from './core/toggleBlacklistFolders';
import toggleLikeArtists from './core/toggleLikeArtists';
import toggleLikeSongs from './core/toggleLikeSongs';
import updateSongListeningData from './core/updateSongListeningData';
import {
  addIgnoredArtist,
  addIgnoredDuplicate,
  addIgnoredFeaturingArtist,
  getIgnoredArtists,
  getIgnoredDuplicateMetadata,
  getIgnoredFeaturingArtists,
  removeIgnoredArtist,
  removeIgnoredFeaturingArtist
} from './db/queries/ignoredItems';
import { getDatabaseMetrics } from './db/queries/other';
import { getUserSettings, saveUserSettings } from './db/queries/settings';
import {
  getUserKeyboardShortcuts,
  saveUserKeyboardShortcuts,
  getUserEqualizerPreset,
  saveUserEqualizerPreset
} from './db/queries/userPreferences';
import { removeDefaultAppProtocolFromFilePath } from './fs/resolveFilePaths';
import logger, { logFilePath } from './logger';
import {
  allowScreenSleeping,
  changePlayerType,
  getFolderLocation,
  getImagefileLocation,
  getRendererLogs,
  IS_DEVELOPMENT,
  resetApp,
  restartApp,
  restartRenderer,
  revealSongInFileExplorer,
  sendMessageToRenderer,
  stopScreenSleeping,
  toggleAudioPlayingState,
  toggleAutoLaunch,
  toggleMiniPlayerAlwaysOnTop,
  toggleOnBatteryPower,
  updateTraySingleClickBehavior
} from './main';
import { setDiscordRpcActivity } from './other/discordRPC';
import { generatePalettes } from './other/generatePalette';
import getAlbumInfoFromLastFM from './other/lastFm/getAlbumInfoFromLastFM';
import getSimilarTracks from './other/lastFm/getSimilarTracks';
import scrobbleSong from './other/lastFm/scrobbleSong';
import sendNowPlayingSongDataToLastFM from './other/lastFm/sendNowPlayingSongDataToLastFM';
import reParseSong from './parseSong/reParseSong';
import saveLyricsToSong from './saveLyricsToSong';
import search from './search';
import updateSongId3Tags, { isMetadataUpdatesPending } from './updateSong/updateSongId3Tags';
import convertLyricsToPinyin from './utils/convertToPinyin';
import convertLyricsToRomaja from './utils/convertToRomaja';
import {
  fetchSongMetadataFromInternet,
  searchSongMetadataResultsInInternet
} from './utils/fetchSongMetadataFromInternet';
import { getQueueInfo } from './utils/getQueueInfo';
import getTranslatedLyrics from './utils/getTranslatedLyrics';
import resetLyrics from './utils/resetLyrics';
import romanizeLyrics from './utils/romanizeLyrics';
import { compare } from './utils/safeStorage';

/**
 * Registers Electron IPC listeners and main-window event handlers for the provided window.
 *
 * Sets up a wide set of ipcMain.on and ipcMain.handle endpoints and wires mainWindow focus/blur
 * and fullscreen events. All listeners that interact with the window are registered only when
 * `mainWindow` is truthy.
 *
 * @param mainWindow - The BrowserWindow to wire IPC and window events to; if falsy, no listeners are registered.
 * @param abortSignal - AbortSignal forwarded to handlers that may cancel long-running actions (e.g., deleting songs).
 */
export function initializeIPC(mainWindow: BrowserWindow, abortSignal: AbortSignal) {
  if (mainWindow) {
    ipcMain.on('app/close', () => app.quit());

    ipcMain.on('app/minimize', () => mainWindow.minimize());

    ipcMain.on('app/toggleMaximize', () =>
      mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
    );

    ipcMain.on('app/hide', () => mainWindow.hide());

    ipcMain.on('app/show', () => mainWindow.show());

    ipcMain.on('app/changeAppTheme', (_, theme?: AppTheme) => changeAppTheme(theme));

    ipcMain.on('app/player/songPlaybackStateChange', (_: unknown, isPlaying: boolean) =>
      toggleAudioPlayingState(isPlaying)
    );

    ipcMain.on('app/setDiscordRpcActivity', (_: unknown, activity: DiscordActivity) =>
      setDiscordRpcActivity(activity)
    );

    ipcMain.on('app/stopScreenSleeping', stopScreenSleeping);
    ipcMain.on('app/allowScreenSleeping', allowScreenSleeping);

    ipcMain.handle('app/checkForStartUpSongs', () => checkForStartUpSongs());

    mainWindow.on('focus', () => {
      mainWindow.webContents.send('app/focused');
      mainWindow.flashFrame(false);
    });
    mainWindow.on('blur', () => mainWindow.webContents.send('app/blurred'));

    mainWindow.on('enter-full-screen', () => {
      logger.debug('Entered full screen');
      mainWindow.webContents.send('app/enteredFullscreen');
    });
    mainWindow.on('leave-full-screen', () => {
      logger.debug('Left full screen');
      mainWindow.webContents.send('app/leftFullscreen');
    });
    powerMonitor.addListener('on-ac', toggleOnBatteryPower);
    powerMonitor.addListener('on-battery', toggleOnBatteryPower);

    // ipcMain.on('app/getSongPosition', (_, position: number) =>
    //   saveUserData('currentSong.stoppedPosition', position)
    // );

    ipcMain.handle('app/addSongsFromFolderStructures', (_, structures: FolderStructure[]) =>
      addSongsFromFolderStructures(structures)
    );

    ipcMain.handle('app/getSong', (_, id: number) => sendAudioData(id));

    ipcMain.handle('app/getSongFromUnknownSource', (_, songPath: string) =>
      sendAudioDataFromPath(songPath)
    );

    ipcMain.handle('app/toggleLikeSongs', (_, songIds: number[], likeSong?: boolean) =>
      toggleLikeSongs(songIds, likeSong)
    );

    ipcMain.handle('app/toggleLikeArtists', (_, artistIds: number[], likeArtist?: boolean) =>
      toggleLikeArtists(artistIds, likeArtist)
    );

    ipcMain.handle(
      'app/getAllSongs',
      (
        _,
        sortType?: SongSortTypes,
        filterType?: SongFilterTypes,
        paginatingData?: PaginatingData
      ) => getAllSongs(sortType, filterType, paginatingData)
    );

    ipcMain.handle(
      'app/getAllHistorySongs',
      (_, sortType?: SongSortTypes, paginatingData?: PaginatingData) =>
        getAllHistorySongs(sortType, paginatingData)
    );

    ipcMain.handle(
      'app/getAllFavoriteSongs',
      (_, sortType?: SongSortTypes, paginatingData?: PaginatingData) =>
        getAllFavoriteSongs(sortType, paginatingData)
    );

    // ipcMain.handle('app/saveUserData', (_, dataType: UserDataTypes, data: string) =>
    //   saveUserData(dataType, data)
    // );
    ipcMain.handle('app/saveUserSettings', (_, settings: Partial<UserSettings>) =>
      saveUserSettings(settings)
    );

    ipcMain.handle('app/updateTraySingleClickBehavior', (_, enable: boolean) =>
      updateTraySingleClickBehavior(enable)
    );

    // User Keyboard Shortcuts Handlers
    ipcMain.handle('app/getUserKeyboardShortcuts', async () => {
      const shortcuts = await getUserKeyboardShortcuts();
      return shortcuts.shortcuts;
    });

    ipcMain.handle('app/saveUserKeyboardShortcuts', (_, shortcuts: Record<string, string>) =>
      saveUserKeyboardShortcuts(shortcuts)
    );

    // User Equalizer Preset Handlers
    ipcMain.handle('app/getUserEqualizerPreset', async () => {
      const preset = await getUserEqualizerPreset();
      return preset;
    });

    ipcMain.handle(
      'app/saveUserEqualizerPreset',
      (
        _,
        presetData: {
          presetName?: string;
          frequencyBands?: number[];
          isEnabled?: boolean;
        }
      ) => saveUserEqualizerPreset(presetData)
    );

    // Ignored Items Handlers
    ipcMain.handle('app/getIgnoredArtists', async () => {
      const ignored = await getIgnoredArtists();
      return ignored.map((item) => item.artistId);
    });

    ipcMain.handle('app/addIgnoredArtist', (_, artistId: number) => addIgnoredArtist(artistId));

    ipcMain.handle('app/removeIgnoredArtist', (_, artistId: number) =>
      removeIgnoredArtist(artistId)
    );

    ipcMain.handle('app/getIgnoredFeaturingArtists', async () => {
      const ignored = await getIgnoredFeaturingArtists();
      return ignored.map((item) => item.artistId);
    });

    ipcMain.handle('app/addIgnoredFeaturingArtist', (_, artistId: number) =>
      addIgnoredFeaturingArtist(artistId)
    );

    ipcMain.handle('app/removeIgnoredFeaturingArtist', (_, artistId: number) =>
      removeIgnoredFeaturingArtist(artistId)
    );

    ipcMain.handle('app/getIgnoredDuplicateMetadata', () => getIgnoredDuplicateMetadata());

    ipcMain.handle('app/addIgnoredDuplicate', (_, duplicateGroupId: string, songId: number) =>
      addIgnoredDuplicate(duplicateGroupId, songId)
    );

    ipcMain.handle('app/getStorageUsage', () => getStorageUsage());
    ipcMain.handle('app/getDatabaseMetrics', () => getDatabaseMetrics());

    ipcMain.handle('app/getUserData', async () => await getUserSettings());
    ipcMain.handle('app/getUserSettings', async () => await getUserSettings());

    ipcMain.handle(
      'app/search',
      (
        _,
        searchFilters: SearchFilters,
        value: string,
        updateSearchHistory?: boolean,
        isSimilaritySearchEnabled?: boolean
      ) => search(searchFilters, value, updateSearchHistory, isSimilaritySearchEnabled)
    );

    ipcMain.handle(
      'app/getSongLyrics',
      (
        _,
        trackInfo: LyricsRequestTrackInfo,
        lyricsType?: LyricsTypes,
        lyricsRequestType?: LyricsRequestTypes,
        saveLyricsAutomatically?: AutomaticallySaveLyricsTypes
      ) => getSongLyrics(trackInfo, lyricsType, lyricsRequestType, saveLyricsAutomatically)
    );

    ipcMain.handle('app/getTranslatedLyrics', (_, languageCode: LanguageCodes) =>
      getTranslatedLyrics(languageCode as string)
    );

    ipcMain.handle('app/romanizeLyrics', async () => await romanizeLyrics());

    ipcMain.handle('app/convertLyricsToPinyin', () => convertLyricsToPinyin());

    ipcMain.handle('app/convertLyricsToRomaja', () => convertLyricsToRomaja());

    ipcMain.handle('app/resetLyrics', () => resetLyrics());

    ipcMain.handle('app/saveLyricsToSong', (_, songPath: string, lyrics: SongLyrics) =>
      saveLyricsToSong(songPath, lyrics)
    );

    ipcMain.handle(
      'app/getSongInfo',
      (
        _,
        songIds: number[],
        sortType?: SongSortTypes,
        filterType?: SongFilterTypes,
        limit?: number,
        preserveIdOrder = false
      ) => getSongInfo(songIds, sortType, filterType, limit, preserveIdOrder)
    );

    ipcMain.handle('app/getSimilarTracksForASong', (_, songId: number) => getSimilarTracks(songId));

    ipcMain.handle('app/getAlbumInfoFromLastFM', (_, albumId: number) =>
      getAlbumInfoFromLastFM(albumId)
    );

    ipcMain.handle('app/getSongListeningData', (_, songIds: number[]) => getListeningData(songIds));

    ipcMain.handle(
      'app/updateSongListeningData',
      (_: unknown, songId: number, dataType: ListeningDataEvents, value: number) =>
        updateSongListeningData(songId, dataType, value)
    );

    ipcMain.handle('app/generatePalettes', generatePalettes);

    ipcMain.handle('app/scrobbleSong', (_, songId: number, startTimeInSecs: number) =>
      scrobbleSong(songId, startTimeInSecs)
    );

    ipcMain.handle('app/sendNowPlayingSongDataToLastFM', (_, songId: number) =>
      sendNowPlayingSongDataToLastFM(songId)
    );

    ipcMain.handle('app/getArtistArtworks', (_, artistId: number) =>
      getArtistInfoFromNet(artistId)
    );

    ipcMain.handle('app/fetchSongInfoFromNet', (_, songTitle: string, songArtists: string[]) =>
      fetchSongInfoFromLastFM(songTitle, songArtists)
    );

    ipcMain.handle(
      'app/searchSongMetadataResultsInInternet',
      (_, songTitle: string, songArtists: string[]) =>
        searchSongMetadataResultsInInternet(songTitle, songArtists)
    );

    ipcMain.handle(
      'app/fetchSongMetadataFromInternet',
      (_, source: SongMetadataSource, sourceId: string) =>
        fetchSongMetadataFromInternet(source, sourceId)
    );

    ipcMain.handle(
      'app/getArtistData',
      (
        _,
        artistIdsOrNames?: string[],
        sortType?: ArtistSortTypes,
        filterType?: ArtistFilterTypes,
        start?: number,
        end?: number,
        limit?: number
      ) => fetchArtistData(artistIdsOrNames, sortType, filterType, start, end, limit)
    );

    ipcMain.handle(
      'app/getGenresData',
      (_, genreNamesOrIds?: string[], sortType?: GenreSortTypes, start?: number, end?: number) =>
        getGenresInfo(genreNamesOrIds, sortType, start, end)
    );

    ipcMain.handle(
      'app/getAlbumData',
      (_, albumTitlesOrIds?: string[], sortType?: AlbumSortTypes, start?: number, end?: number) =>
        fetchAlbumData(albumTitlesOrIds, sortType, start, end)
    );

    ipcMain.handle(
      'app/getPlaylistData',
      (_, playlistIds?: string[], sortType?: AlbumSortTypes, start?: number, end?: number) =>
        sendPlaylistData(playlistIds, sortType, start, end)
    );

    ipcMain.handle('app/getArtistDuplicates', (_, artistName: string) =>
      getArtistDuplicates(artistName)
    );

    ipcMain.handle(
      'app/resolveArtistDuplicates',
      (_, selectedArtistId: number, duplicateIds: number[]) =>
        resolveArtistDuplicates(selectedArtistId, duplicateIds)
    );

    ipcMain.handle(
      'app/resolveSeparateArtists',
      (_, separateArtistId: number, separateArtistNames: string[]) =>
        resolveSeparateArtists(separateArtistId, separateArtistNames)
    );

    ipcMain.handle(
      'app/resolveFeaturingArtists',
      (_, songId: number, featArtistNames: string[], removeFeatInfoInTitle?: boolean) =>
        resolveFeaturingArtists(songId, featArtistNames, removeFeatInfoInTitle)
    );

    ipcMain.handle('app/getQueueInfo', (_, queueType: QueueTypes, id: string) =>
      getQueueInfo(queueType, id)
    );

    ipcMain.handle(
      'app/addNewPlaylist',
      (_, playlistName: string, songIds?: string[], artworkPath?: string) =>
        addNewPlaylist(playlistName, songIds, artworkPath)
    );

    ipcMain.handle('app/removePlaylists', (_, playlistIds: number[]) =>
      removePlaylists(playlistIds)
    );

    ipcMain.handle('app/addSongsToPlaylist', (_, playlistId: number, songIds: number[]) =>
      addSongsToPlaylist(playlistId, songIds)
    );

    ipcMain.handle('app/removeSongFromPlaylist', (_, playlistId: number, songId: number) =>
      removeSongFromPlaylist(playlistId, songId)
    );

    ipcMain.handle('app/addArtworkToAPlaylist', (_, playlistId: number, artworkPath: string) =>
      addArtworkToAPlaylist(playlistId, artworkPath)
    );

    ipcMain.handle('app/renameAPlaylist', (_, playlistId: number, newName: string) =>
      renameAPlaylist(playlistId, newName)
    );

    ipcMain.handle('app/clearSongHistory', () => clearSongHistory());

    ipcMain.handle(
      'app/deleteSongsFromSystem',
      (_, absoluteFilePaths: string[], isPermanentDelete: boolean) =>
        deleteSongsFromSystem(absoluteFilePaths, abortSignal, isPermanentDelete)
    );

    ipcMain.handle('app/resyncSongsLibrary', async () => {
      await checkForNewSongs();
      sendMessageToRenderer({ messageCode: 'RESYNC_SUCCESSFUL' });
    });

    ipcMain.handle('app/getBlacklistData', getBlacklistData);

    ipcMain.handle('app/blacklistSongs', (_, songIds: number[]) => blacklistSongs(songIds));

    ipcMain.handle('app/restoreBlacklistedSongs', (_, songIds: number[]) =>
      restoreBlacklistedSongs(songIds)
    );

    ipcMain.handle(
      'app/updateSongId3Tags',
      (_, songIdOrPath: string, tags: SongTags, sendUpdatedData?: boolean, isKnownSource = true) =>
        updateSongId3Tags(songIdOrPath, tags, sendUpdatedData, isKnownSource)
    );

    ipcMain.handle('app/getImgFileLocation', getImagefileLocation);

    ipcMain.handle('app/getFolderLocation', getFolderLocation);

    ipcMain.handle('app/getSongId3Tags', (_, songId: number, isKnownSource = true) =>
      sendSongID3Tags(songId, isKnownSource)
    );

    ipcMain.handle('app/clearSearchHistory', (_, searchText?: string[]) =>
      clearSearchHistoryResults(searchText)
    );

    ipcMain.handle('app/getFolderStructures', () => getFolderStructures());

    ipcMain.handle('app/reParseSong', (_, songPath: string) => reParseSong(songPath));

    ipcMain.on('app/resetApp', () => resetApp(!IS_DEVELOPMENT));

    ipcMain.on('app/openLogFile', () => shell.openPath(logFilePath));

    ipcMain.on('app/revealSongInFileExplorer', (_, songId: number) =>
      revealSongInFileExplorer(songId)
    );

    ipcMain.on('app/revealFolderInFileExplorer', (_, folderPath: string) =>
      shell.showItemInFolder(folderPath)
    );

    ipcMain.on('app/saveArtworkToSystem', (_, artworkPath: string, saveName?: string) =>
      saveArtworkToSystem(artworkPath, saveName)
    );

    ipcMain.on('app/openInBrowser', (_, url: string) => shell.openExternal(url));

    ipcMain.on('app/loginToLastFmInBrowser', () =>
      shell.openExternal(
        `http://www.last.fm/api/auth/?api_key=${import.meta.env.MAIN_VITE_LAST_FM_API_KEY}&cb=nora://auth?service=lastfm`
      )
    );

    ipcMain.handle('app/exportAppData', (_, localStorageData: string) =>
      exportAppData(localStorageData)
    );

    ipcMain.handle('app/exportPlaylist', (_, playlistId: number) => exportPlaylist(playlistId));

    ipcMain.handle('app/importAppData', importAppData);

    ipcMain.handle('app/importPlaylist', (_, targetPlaylistId?: number) =>
      importPlaylist(targetPlaylistId)
    );

    ipcMain.handle(
      'app/getRendererLogs',
      (
        _: unknown,
        mes: string | Error,
        data?: Record<string, unknown>,
        logToConsoleType: LogMessageTypes = 'INFO',
        forceWindowRestart = false,
        forceMainRestart = false
      ) => getRendererLogs(mes, data, logToConsoleType, forceWindowRestart, forceMainRestart)
    );

    ipcMain.handle('app/removeAMusicFolder', (_, absolutePath: string) =>
      removeMusicFolder(absolutePath)
    );

    ipcMain.handle('app/changePlayerType', (_, type: PlayerTypes) => changePlayerType(type));

    ipcMain.handle('app/toggleMiniPlayerAlwaysOnTop', (_, isMiniPlayerAlwaysOnTop: boolean) =>
      toggleMiniPlayerAlwaysOnTop(isMiniPlayerAlwaysOnTop)
    );

    ipcMain.handle('app/toggleAutoLaunch', (_, autoLaunchState: boolean) =>
      toggleAutoLaunch(autoLaunchState)
    );

    ipcMain.handle('app/getFolderData', (_, folderPaths?: string[], sortType?: FolderSortTypes) =>
      getMusicFolderData(folderPaths, sortType)
    );

    ipcMain.handle('app/compareEncryptedData', (_, data: string, encryptedData: string) =>
      compare(data, encryptedData)
    );

    ipcMain.handle('app/isMetadataUpdatesPending', (_, songPath: string) =>
      isMetadataUpdatesPending(removeDefaultAppProtocolFromFilePath(songPath))
    );

    ipcMain.handle('app/blacklistFolders', (_, folderPaths: string[]) =>
      blacklistFolders(folderPaths)
    );

    ipcMain.handle('app/restoreBlacklistedFolders', (_, folderPaths: string[]) =>
      restoreBlacklistedFolders(folderPaths)
    );

    ipcMain.handle(
      'app/toggleBlacklistedFolders',
      (_, folderPaths: string[], isBlacklistFolder?: boolean) =>
        toggleBlacklistFolders(folderPaths, isBlacklistFolder)
    );

    ipcMain.on('app/networkStatusChange', (_: unknown, isConnected: boolean) => {
      logger.info(
        isConnected
          ? `App connected to the internet successfully`
          : `App disconnected from the internet`
      );
      // isConnectedToInternet = isConnected;
    });

    ipcMain.handle('app/getArtworksForMultipleArtworksCover', (_, songIds: number[]) =>
      getArtworksForMultipleArtworksCover(songIds)
    );

    ipcMain.on('app/openDevTools', () => {
      logger.info('User requested for devtools.');
      mainWindow.webContents.openDevTools({
        mode: 'detach',
        activate: true
      });
    });

    ipcMain.on('app/restartRenderer', (_: unknown, reason: string) => {
      logger.info(`Renderer requested a renderer refresh.`, { reason });
      restartRenderer();
    });

    ipcMain.on('app/restartApp', (_: unknown, reason: string) => restartApp(reason));
  }
}
