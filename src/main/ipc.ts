import { BrowserWindow, app, ipcMain, powerMonitor, shell } from 'electron';
import log, { logFilePath } from './log';
import {
  IS_DEVELOPMENT,
  changePlayerType,
  getFolderLocation,
  getImagefileLocation,
  getRendererLogs,
  resetApp,
  restartApp,
  restartRenderer,
  revealSongInFileExplorer,
  sendMessageToRenderer,
  stopScreenSleeping,
  allowScreenSleeping,
  toggleAudioPlayingState,
  toggleAutoLaunch,
  toggleMiniPlayerAlwaysOnTop,
  toggleOnBatteryPower,
} from './main';
import getArtworksForMultipleArtworksCover from './core/getArtworksForMultipleArtworksCover';
import toggleBlacklistFolders from './core/toggleBlacklistFolders';
import scrobbleSong from './other/lastFm/scrobbleSong';
import getSimilarTracks from './other/lastFm/getSimilarTracks';
import sendNowPlayingSongDataToLastFM from './other/lastFm/sendNowPlayingSongDataToLastFM';
import getAlbumInfoFromLastFM from './other/lastFm/getAlbumInfoFromLastFM';
import renameAPlaylist from './core/renameAPlaylist';
import { removeDefaultAppProtocolFromFilePath } from './fs/resolveFilePaths';
import blacklistFolders from './core/blacklistFolders';
import restoreBlacklistedFolders from './core/restoreBlacklistedFolder';
import getStorageUsage from './core/getStorageUsage';
import { generatePalettes } from './other/generatePalette';
import { getFolderStructures } from './core/getFolderStructures';
import { getArtistDuplicates } from './core/getDuplicates';
import { resolveArtistDuplicates } from './core/resolveDuplicates';
import addArtworkToAPlaylist from './core/addArtworkToAPlaylist';
import { resolveSeparateArtists } from './core/resolveSeparateArtists';
import resolveFeaturingArtists from './core/resolveFeaturingArtists';
import saveArtworkToSystem from './core/saveArtworkToSystem';
import exportAppData from './core/exportAppData';
import importAppData from './core/importAppData';
import exportPlaylist from './core/exportPlaylist';
import importPlaylist from './core/importPlaylist';
import reParseSong from './parseSong/reParseSong';
import { compare } from './utils/safeStorage';
import sendAudioData from './core/sendAudioData';
import toggleLikeSongs from './core/toggleLikeSongs';
import sendSongID3Tags from './core/sendSongId3Tags';
import removeSongFromPlaylist from './core/removeSongFromPlaylist';
import addSongsToPlaylist from './core/addSongsToPlaylist';
import removePlaylists from './core/removePlaylists';
import addNewPlaylist from './core/addNewPlaylist';
import getAllSongs from './core/getAllSongs';
import toggleLikeArtists from './core/toggleLikeArtists';
import fetchSongInfoFromLastFM from './core/fetchSongInfoFromLastFM';
import clearSongHistory from './core/clearSongHistory';
import clearSearchHistoryResults from './core/clearSeachHistoryResults';
import getSongInfo from './core/getSongInfo';
import updateSongListeningData from './core/updateSongListeningData';
import getGenresInfo from './core/getGenresInfo';
import sendPlaylistData from './core/sendPlaylistData';
import fetchAlbumData from './core/fetchAlbumData';
import fetchArtistData from './core/fetchArtistData';
import getMusicFolderData from './core/getMusicFolderData';
import blacklistSongs from './core/blacklistSongs';
import search from './search';
import {
  searchSongMetadataResultsInInternet,
  fetchSongMetadataFromInternet,
} from './utils/fetchSongMetadataFromInternet';
import deleteSongsFromSystem from './core/deleteSongsFromSystem';
import removeMusicFolder from './core/removeMusicFolder';
import restoreBlacklistedSongs from './core/restoreBlacklistedSongs';
import updateSongId3Tags, {
  isMetadataUpdatesPending,
} from './updateSongId3Tags';
import addSongsFromFolderStructures from './core/addMusicFolder';
import getArtistInfoFromNet from './core/getArtistInfoFromNet';
import getSongLyrics from './core/getSongLyrics';
import sendAudioDataFromPath from './core/sendAudioDataFromPath';
import saveLyricsToSong from './saveLyricsToSong';
import {
  getUserData,
  setUserData as saveUserData,
  getListeningData,
  getBlacklistData,
} from './filesystem';
import changeAppTheme from './core/changeAppTheme';
import checkForStartUpSongs from './core/checkForStartUpSongs';
import checkForNewSongs from './core/checkForNewSongs';

export function initializeIPC(
  mainWindow: BrowserWindow,
  abortSignal: AbortSignal,
) {
  if (mainWindow) {
    ipcMain.on('app/close', () => app.quit());

    ipcMain.on('app/minimize', () => mainWindow.minimize());

    ipcMain.on('app/toggleMaximize', () =>
      mainWindow.isMaximized()
        ? mainWindow.unmaximize()
        : mainWindow.maximize(),
    );

    ipcMain.on('app/hide', () => mainWindow.hide());

    ipcMain.on('app/show', () => mainWindow.show());

    ipcMain.on('app/changeAppTheme', (_, theme?: AppTheme) =>
      changeAppTheme(theme),
    );

    ipcMain.on(
      'app/player/songPlaybackStateChange',
      (_: unknown, isPlaying: boolean) => toggleAudioPlayingState(isPlaying),
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
      console.log('Entered full screen');
      mainWindow.webContents.send('app/enteredFullscreen');
    });
    mainWindow.on('leave-full-screen', () => {
      console.log('Left full screen');
      mainWindow.webContents.send('app/leftFullscreen');
    });
    powerMonitor.addListener('on-ac', toggleOnBatteryPower);
    powerMonitor.addListener('on-battery', toggleOnBatteryPower);

    ipcMain.on('app/getSongPosition', (_, position: number) =>
      saveUserData('currentSong.stoppedPosition', position),
    );

    ipcMain.handle(
      'app/addSongsFromFolderStructures',
      (_, structures: FolderStructure[]) =>
        addSongsFromFolderStructures(structures),
    );

    ipcMain.handle('app/getSong', (_, id: string) => sendAudioData(id));

    ipcMain.handle('app/getSongFromUnknownSource', (_, songPath: string) =>
      sendAudioDataFromPath(songPath),
    );

    ipcMain.handle(
      'app/toggleLikeSongs',
      (_, songIds: string[], likeSong?: boolean) =>
        toggleLikeSongs(songIds, likeSong),
    );

    ipcMain.handle(
      'app/toggleLikeArtists',
      (_, artistIds: string[], likeArtist?: boolean) =>
        toggleLikeArtists(artistIds, likeArtist),
    );

    ipcMain.handle(
      'app/getAllSongs',
      (_, sortType?: SongSortTypes, paginatingData?: PaginatingData) =>
        getAllSongs(sortType, paginatingData),
    );

    ipcMain.handle(
      'app/saveUserData',
      (_, dataType: UserDataTypes, data: string) =>
        saveUserData(dataType, data),
    );

    ipcMain.handle('app/getStorageUsage', (_, forceRefresh?: boolean) =>
      getStorageUsage(forceRefresh),
    );

    ipcMain.handle('app/getUserData', () => getUserData());

    ipcMain.handle(
      'app/search',
      (
        _,
        searchFilters: SearchFilters,
        value: string,
        updateSearchHistory?: boolean,
        isPredictiveSearchEnabled?: boolean,
      ) =>
        search(
          searchFilters,
          value,
          updateSearchHistory,
          isPredictiveSearchEnabled,
        ),
    );

    ipcMain.handle(
      'app/getSongLyrics',
      (
        _,
        trackInfo: LyricsRequestTrackInfo,
        lyricsType?: LyricsTypes,
        lyricsRequestType?: LyricsRequestTypes,
        saveLyricsAutomatically?: AutomaticallySaveLyricsTypes,
      ) =>
        getSongLyrics(
          trackInfo,
          lyricsType,
          lyricsRequestType,
          saveLyricsAutomatically,
        ),
    );

    ipcMain.handle(
      'app/saveLyricsToSong',
      (_, songPath: string, lyrics: SongLyrics) =>
        saveLyricsToSong(songPath, lyrics),
    );

    ipcMain.handle(
      'app/getSongInfo',
      (
        _,
        songIds: string[],
        sortType?: SongSortTypes,
        limit?: number,
        preserveIdOrder = false,
      ) => getSongInfo(songIds, sortType, limit, preserveIdOrder),
    );

    ipcMain.handle('app/getSimilarTracksForASong', (_, songId: string) =>
      getSimilarTracks(songId),
    );

    ipcMain.handle('app/getAlbumInfoFromLastFM', (_, albumId: string) =>
      getAlbumInfoFromLastFM(albumId),
    );

    ipcMain.handle('app/getSongListeningData', (_, songIds: string[]) =>
      getListeningData(songIds),
    );

    ipcMain.handle(
      'app/updateSongListeningData',
      <
        DataType extends keyof ListeningDataTypes,
        Value extends ListeningDataTypes[DataType],
      >(
        _: unknown,
        songId: string,
        dataType: DataType,
        value: Value,
      ) => updateSongListeningData(songId, dataType, value),
    );

    ipcMain.handle('app/generatePalettes', generatePalettes);

    ipcMain.handle(
      'app/scrobbleSong',
      (_, songId: string, startTimeInSecs: number) =>
        scrobbleSong(songId, startTimeInSecs),
    );

    ipcMain.handle('app/sendNowPlayingSongDataToLastFM', (_, songId: string) =>
      sendNowPlayingSongDataToLastFM(songId),
    );

    ipcMain.handle('app/getArtistArtworks', (_, artistId: string) =>
      getArtistInfoFromNet(artistId),
    );

    ipcMain.handle(
      'app/fetchSongInfoFromNet',
      (_, songTitle: string, songArtists: string[]) =>
        fetchSongInfoFromLastFM(songTitle, songArtists),
    );

    ipcMain.handle(
      'app/searchSongMetadataResultsInInternet',
      (_, songTitle: string, songArtists: string[]) =>
        searchSongMetadataResultsInInternet(songTitle, songArtists),
    );

    ipcMain.handle(
      'app/fetchSongMetadataFromInternet',
      (_, source: SongMetadataSource, sourceId: string) =>
        fetchSongMetadataFromInternet(source, sourceId),
    );

    ipcMain.handle(
      'app/getArtistData',
      (
        _,
        artistIdsOrNames?: string[],
        sortType?: ArtistSortTypes,
        limit?: number,
      ) => fetchArtistData(artistIdsOrNames, sortType, limit),
    );

    ipcMain.handle(
      'app/getGenresData',
      (_, genreNamesOrIds?: string[], sortType?: GenreSortTypes) =>
        getGenresInfo(genreNamesOrIds, sortType),
    );

    ipcMain.handle(
      'app/getAlbumData',
      (_, albumTitlesOrIds?: string[], sortType?: AlbumSortTypes) =>
        fetchAlbumData(albumTitlesOrIds, sortType),
    );

    ipcMain.handle(
      'app/getPlaylistData',
      (
        _,
        playlistIds?: string[],
        sortType?: AlbumSortTypes,
        onlyMutablePlaylists = false,
      ) => sendPlaylistData(playlistIds, sortType, onlyMutablePlaylists),
    );

    ipcMain.handle('app/getArtistDuplicates', (_, artistName: string) =>
      getArtistDuplicates(artistName),
    );

    ipcMain.handle(
      'app/resolveArtistDuplicates',
      (_, selectedArtistId: string, duplicateIds: string[]) =>
        resolveArtistDuplicates(selectedArtistId, duplicateIds),
    );

    ipcMain.handle(
      'app/resolveSeparateArtists',
      (_, separateArtistId: string, separateArtistNames: string[]) =>
        resolveSeparateArtists(separateArtistId, separateArtistNames),
    );

    ipcMain.handle(
      'app/resolveFeaturingArtists',
      (
        _,
        songId: string,
        featArtistNames: string[],
        removeFeatInfoInTitle?: boolean,
      ) =>
        resolveFeaturingArtists(songId, featArtistNames, removeFeatInfoInTitle),
    );

    ipcMain.handle(
      'app/addNewPlaylist',
      (_, playlistName: string, songIds?: string[], artworkPath?: string) =>
        addNewPlaylist(playlistName, songIds, artworkPath),
    );

    ipcMain.handle('app/removePlaylists', (_, playlistIds: string[]) =>
      removePlaylists(playlistIds),
    );

    ipcMain.handle(
      'app/addSongsToPlaylist',
      (_, playlistId: string, songIds: string[]) =>
        addSongsToPlaylist(playlistId, songIds),
    );

    ipcMain.handle(
      'app/removeSongFromPlaylist',
      (_, playlistId: string, songId: string) =>
        removeSongFromPlaylist(playlistId, songId),
    );

    ipcMain.handle(
      'app/addArtworkToAPlaylist',
      (_, playlistId: string, artworkPath: string) =>
        addArtworkToAPlaylist(playlistId, artworkPath),
    );

    ipcMain.handle(
      'app/renameAPlaylist',
      (_, playlistId: string, newName: string) =>
        renameAPlaylist(playlistId, newName),
    );

    ipcMain.handle('app/clearSongHistory', () => clearSongHistory());

    ipcMain.handle(
      'app/deleteSongsFromSystem',
      (_, absoluteFilePaths: string[], isPermanentDelete: boolean) =>
        deleteSongsFromSystem(
          absoluteFilePaths,
          abortSignal,
          isPermanentDelete,
        ),
    );

    ipcMain.handle('app/resyncSongsLibrary', async () => {
      await checkForNewSongs();
      sendMessageToRenderer({ messageCode: 'RESYNC_SUCCESSFUL' });
    });

    ipcMain.handle('app/getBlacklistData', getBlacklistData);

    ipcMain.handle('app/blacklistSongs', (_, songIds: string[]) =>
      blacklistSongs(songIds),
    );

    ipcMain.handle('app/restoreBlacklistedSongs', (_, songIds: string[]) =>
      restoreBlacklistedSongs(songIds),
    );

    ipcMain.handle(
      'app/updateSongId3Tags',
      (
        _,
        songIdOrPath: string,
        tags: SongTags,
        sendUpdatedData?: boolean,
        isKnownSource = true,
      ) =>
        updateSongId3Tags(songIdOrPath, tags, sendUpdatedData, isKnownSource),
    );

    ipcMain.handle('app/getImgFileLocation', getImagefileLocation);

    ipcMain.handle('app/getFolderLocation', getFolderLocation);

    ipcMain.handle(
      'app/getSongId3Tags',
      (_, songId: string, isKnownSource = true) =>
        sendSongID3Tags(songId, isKnownSource),
    );

    ipcMain.handle('app/clearSearchHistory', (_, searchText?: string[]) =>
      clearSearchHistoryResults(searchText),
    );

    ipcMain.handle('app/getFolderStructures', () => getFolderStructures());

    ipcMain.handle('app/reParseSong', (_, songPath: string) =>
      reParseSong(songPath),
    );

    ipcMain.on('app/resetApp', () => resetApp(!IS_DEVELOPMENT));

    ipcMain.on('app/openLogFile', () => shell.openPath(logFilePath));

    ipcMain.on('app/revealSongInFileExplorer', (_, songId: string) =>
      revealSongInFileExplorer(songId),
    );

    ipcMain.on('app/revealFolderInFileExplorer', (_, folderPath: string) =>
      shell.showItemInFolder(folderPath),
    );

    ipcMain.on(
      'app/saveArtworkToSystem',
      (_, songId: string, saveName?: string) =>
        saveArtworkToSystem(songId, saveName),
    );

    ipcMain.on('app/openInBrowser', (_, url: string) =>
      shell.openExternal(url),
    );

    ipcMain.on('app/loginToLastFmInBrowser', () =>
      shell.openExternal(
        `http://www.last.fm/api/auth/?api_key=${process.env.LAST_FM_API_KEY}&cb=nora://auth?service=lastfm`,
      ),
    );

    ipcMain.handle('app/exportAppData', (_, localStorageData: string) =>
      exportAppData(localStorageData),
    );

    ipcMain.handle('app/exportPlaylist', (_, playlistId: string) =>
      exportPlaylist(playlistId),
    );

    ipcMain.handle('app/importAppData', importAppData);

    ipcMain.handle('app/importPlaylist', importPlaylist);

    ipcMain.handle(
      'app/getRendererLogs',
      (
        _: unknown,
        mes: string | Error,
        data?: Record<string, unknown>,
        logToConsoleType: LogMessageTypes = 'INFO',
        forceWindowRestart = false,
        forceMainRestart = false,
      ) =>
        getRendererLogs(
          mes,
          data,
          logToConsoleType,
          forceWindowRestart,
          forceMainRestart,
        ),
    );

    ipcMain.handle('app/removeAMusicFolder', (_, absolutePath: string) =>
      removeMusicFolder(absolutePath),
    );

    ipcMain.handle('app/changePlayerType', (_, type: PlayerTypes) =>
      changePlayerType(type),
    );

    ipcMain.handle(
      'app/toggleMiniPlayerAlwaysOnTop',
      (_, isMiniPlayerAlwaysOnTop: boolean) =>
        toggleMiniPlayerAlwaysOnTop(isMiniPlayerAlwaysOnTop),
    );

    ipcMain.handle('app/toggleAutoLaunch', (_, autoLaunchState: boolean) =>
      toggleAutoLaunch(autoLaunchState),
    );

    ipcMain.handle(
      'app/getFolderData',
      (_, folderPaths?: string[], sortType?: FolderSortTypes) =>
        getMusicFolderData(folderPaths, sortType),
    );

    ipcMain.handle(
      'app/compareEncryptedData',
      (_, data: string, encryptedData: string) => compare(data, encryptedData),
    );

    ipcMain.handle('app/isMetadataUpdatesPending', (_, songPath: string) =>
      isMetadataUpdatesPending(removeDefaultAppProtocolFromFilePath(songPath)),
    );

    ipcMain.handle('app/blacklistFolders', (_, folderPaths: string[]) =>
      blacklistFolders(folderPaths),
    );

    ipcMain.handle(
      'app/restoreBlacklistedFolders',
      (_, folderPaths: string[]) => restoreBlacklistedFolders(folderPaths),
    );

    ipcMain.handle(
      'app/toggleBlacklistedFolders',
      (_, folderPaths: string[], isBlacklistFolder?: boolean) =>
        toggleBlacklistFolders(folderPaths, isBlacklistFolder),
    );

    ipcMain.on(
      'app/networkStatusChange',
      (_: unknown, isConnected: boolean) => {
        log(
          isConnected
            ? `APP CONNECTED TO THE INTERNET SUCCESSFULLY`
            : `APP DISCONNECTED FROM THE INTERNET`,
        );
        // isConnectedToInternet = isConnected;
      },
    );

    ipcMain.handle(
      'app/getArtworksForMultipleArtworksCover',
      (_, songIds: string[]) => getArtworksForMultipleArtworksCover(songIds),
    );

    ipcMain.on('app/openDevTools', () => {
      log('USER REQUESTED FOR DEVTOOLS.');
      mainWindow.webContents.openDevTools({
        mode: 'detach',
        activate: true,
      });
    });

    ipcMain.on('app/restartRenderer', (_: unknown, reason: string) => {
      log(`RENDERER REQUESTED A RENDERER REFRESH.\nREASON : ${reason}`);
      restartRenderer();
    });

    ipcMain.on('app/restartApp', (_: unknown, reason: string) =>
      restartApp(reason),
    );
  }
}
