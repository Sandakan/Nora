import NodeID3 from 'node-id3';
import { ReactElement, ReactNode } from 'react';
import { ButtonProps } from '../renderer/src/components/Button';
import { DropdownOption } from '../renderer/src/components/Dropdown';
import { songSortTypes } from '../renderer/src/components/SongsPage/SongOptions';
import { api } from '../preload';
import { LastFMSessionData } from './last_fm_api';
import { SimilarArtist, Tag } from './last_fm_artist_info_api';
import { resources } from 'src/renderer/src/i18n';
import type { db } from '@main/db/db';
import type { GetAllSongListeningDataReturnType } from '@main/db/queries/listens';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: typeof api;
  }

  type LogMessageTypes = 'INFO' | 'WARN' | 'ERROR';

  type IpcChannels =
    | 'app/beforeQuitEvent'
    | 'app/Close'
    | 'app/minimize'
    | 'app/toggleMaximize'
    | 'app/focused'
    | 'app/blurred'
    | 'app/systemThemeChange'
    | 'app/getSongPosition'
    | 'app/incrementNoOfSongListens'
    | 'app/addMusicFolder'
    | 'app/getSong'
    | 'app/getAllSongs'
    | 'app/toggleLikeSongs'
    | 'app/saveUserData'
    | 'app/getUserData'
    | 'app/search'
    | 'app/getSongLyrics'
    | 'app/getSongInfo'
    | 'app/openDevTools'
    | 'app/getArtistArtworks'
    | 'app/getArtistData'
    | 'app/getGenresData'
    | 'app/getAlbumData'
    | 'app/getPlaylistData'
    | 'app/addNewPlaylist'
    | 'app/removePlaylists'
    | 'app/addSongToPlaylist'
    | 'app/removeSongsFromLibrary'
    | 'app/deleteSongFromSystem'
    | 'app/resyncSongsLibrary'
    | 'app/restoreBlacklistedSong'
    | 'app/updateSongId3Tags'
    | 'app/getSongId3Tags'
    | 'app/openLogFile'
    | 'revealSongInFileExplorer'
    | 'app/openInBrowser'
    | 'app/removeAMusicFolder'
    | 'app/sendMessageToRendererEvent'
    | 'app/dataUpdateEvent'
    | 'app/toggleMiniPlayer'
    | 'app/toggleAutoLaunch'
    | 'app/getFolderData'
    | 'app/restartRenderer'
    | 'app/restartApp'
    | 'app/resetApp'
    | 'app/player/songPlaybackStateChange'
    | 'app/player/toggleSongPlaybackState'
    | 'app/player/skipForward'
    | 'app/player/skipBackward'
    | 'app/player/toggleSongPlaybackState'
    | 'app/player/skipBackward';

  interface ImageCoverData {
    format: string;
    data: Buffer;
  }

  // ? Song data related types

  interface SavableSongData {
    songId: number;
    title: string;
    duration: number;
    artists?: { artistId: number; name: string }[];
    album?: { albumId: number; name: string };
    genres?: { genreId: number; name: string }[];
    albumArtists?: { artistId: number; name: string }[];
    bitrate?: number;
    trackNo?: number;
    discNo?: number;
    noOfChannels?: number;
    year?: number;
    sampleRate?: number;
    paletteId?: string;
    isAFavorite: boolean;
    isArtworkAvailable: boolean;
    path: string;
    createdDate?: number;
    modifiedDate?: number;
    addedDate: number;
  }

  interface ArtworkPaths {
    isDefaultArtwork: boolean;
    artworkPath: string;
    optimizedArtworkPath: string;
  }

  interface SongData extends SavableSongData {
    artworkPaths: ArtworkPaths;
    isBlacklisted: boolean;
    paletteData?: PaletteData;
  }

  interface PaletteData extends NodeVibrantPalette {
    paletteId: string;
  }

  interface NodeVibrantPalette {
    DarkMuted?: NodeVibrantPaletteSwatch;
    DarkVibrant?: NodeVibrantPaletteSwatch;
    LightMuted?: NodeVibrantPaletteSwatch;
    LightVibrant?: NodeVibrantPaletteSwatch;
    Muted?: NodeVibrantPaletteSwatch;
    Vibrant?: NodeVibrantPaletteSwatch;
  }
  interface NodeVibrantPaletteSwatch {
    hsl: [number, number, number];
    hex: string;
    population: number;
    // rgb: [number, number, number];
    // bodyTextColor?: string;
    // titleTextColor?: string;
  }

  interface AudioPlayerData {
    songId: number;
    title: string;
    artists?: {
      artistId: number;
      name: string;
      artworkPath?: string;
      onlineArtworkPaths?: OnlineArtistArtworks;
    }[];
    duration: number;
    artwork?: string | Buffer | Uint8Array;
    artworkPath?: string;
    path: string;
    isAFavorite: boolean;
    album?: { albumId: number; name: string };
    paletteData?: PaletteData;
    isKnownSource: boolean;
    isBlacklisted: boolean;
  }

  interface AudioInfo {
    title: string;
    artists?: { artistId: number; name: string }[];
    album?: { albumId: number; name: string };
    duration: number;
    artworkPaths: ArtworkPaths;
    path: string;
    songId: number;
    addedDate: number;
    isAFavorite: boolean;
    year?: number;
    paletteData?: PaletteData;
    isBlacklisted: boolean;
    trackNo?: number;
  }

  type PaginatingData = { start: number; end: number };

  interface PaginatedResult<DataType, SortType extends string> {
    data: DataType[];
    sortType?: SortType;
    start: number;
    end: number;
    total: number;
  }

  interface ToggleLikeSongReturnValue {
    likes: number[];
    dislikes: number[];
  }

  // ? Song listening data related types

  interface SongListeningData {
    songId: number;
    playEvents: { playbackPercentage: string; createdAt: Date }[];
    skipEvents: { position: string; createdAt: Date }[];
    seekEvents: { position: string; createdAt: Date }[];
  }

  type ListeningDataEvents = 'SKIP' | 'SEEK' | 'LISTEN';
  // ? Audio player and lyrics related types

  type RepeatTypes = 'false' | 'repeat' | 'repeat-1';

  type PlayerTypes = 'normal' | 'mini' | 'full';

  type PlayerVolume = { isMuted: boolean; value: number };
  interface Player {
    isCurrentSongPlaying: boolean;
    volume: PlayerVolume;
    isRepeating: RepeatTypes;
    songPosition: number;
    isShuffling: boolean;
    isPlayerStalled: boolean;
    playbackRate: number;
  }

  type SongSkipReason = 'USER_SKIP' | 'PLAYER_SKIP';

  type AutomaticallySaveLyricsTypes = 'SYNCED' | 'SYNCED_OR_UN_SYNCED' | 'NONE';

  type LyricsTypes = 'ENHANCED_SYNCED' | 'SYNCED' | 'UN_SYNCED' | 'ANY';

  type LyricsRequestTypes = 'ONLINE_ONLY' | 'OFFLINE_ONLY' | 'ANY';

  type LyricsSource = 'IN_SONG_LYRICS' | 'MUSIXMATCH' | string;

  export type SyncedLyricsLineWord = {
    text: string;
    start: number;
    end: number;
    unparsedText: string;
  };

  // Represents a single translation of a lyric line in a specific language
  interface TranslatedLyricLine {
    lang: string; // Language code of the translation
    text: string | SyncedLyricsLineWord[]; // Translated text or synced lyrics
  }

  // Represents a single line of lyrics, either synced or unsynced
  interface LyricLine {
    originalText: string | SyncedLyricsLineWord[]; // Original text of the lyric line
    romanizedText?: string | SyncedLyricsLineWord[]; // Romanized text of the lyric line (optional)
    translatedTexts: TranslatedLyricLine[]; // Array of translations in different languages
    //convertedLyrics: string | SyncedLyricsLineWord[]; // Converted lyrics
    start?: number; // Timing start (for synced lyrics only)
    end?: number; // Timing end (for synced lyrics only)
    isEnhancedSynced: boolean; // Indicates if the original text is enhanced synced lyrics
  }

  // Holds all the lyrics data, whether synced or unsynced
  interface LyricsData {
    isSynced: boolean;
    isRomanized: boolean; // Indicates if the lyrics have been romanized
    isTranslated: boolean; // Indicates if translations are available
    // isTranslated: boolean;
    // isJapanese: boolean;
    // isChinese: boolean;
    // isKorean: boolean;
    // isConvertedToRomaji: boolean;
    // isConvertedToPinyin: boolean;
    // isConvertedToRomaja: boolean;
    isReset: boolean;
    parsedLyrics: LyricLine[]; // Array of original lyric lines (both synced and unsynced)
    unparsedLyrics: string;
    offset?: number;
    originalLanguage?: string; // Language of the original lyrics (optional)
    translatedLanguages?: string[]; // Array of language codes of the translated lyrics (optional)
    copyright?: string;
  }

  interface SongLyrics {
    title: string;
    source: LyricsSource;
    lyricsType: LyricsTypes;
    link?: string;
    lyrics: LyricsData; // original and translated lyrics data
    isOfflineLyricsAvailable: boolean;
  }

  interface LyricsRequestTrackInfo {
    songTitle: string;
    songArtists?: string[];
    album?: string;
    songPath: string;
    duration: number;
  }

  // node-id3 synchronisedLyrics types.
  type UnsynchronisedLyrics =
    | {
      language: string;
      text: string;
    }
    | undefined;

  type SynchronisedLyrics =
    | Array<{
      /**
       * 3 letter ISO 639-2 language code, for example: eng
       * @see {@link https://id3.org/ISO%20639-2 ISO 639-2}
       */
      language: string;
      /**
       * Absolute time unit:
       * {@link TagConstants.TimeStampFormat}
       */
      timeStampFormat: number;
      /**
       * {@link TagConstants.SynchronisedLyrics.ContentType}
       */
      contentType: number;
      /**
       * Content descriptor
       */
      shortText?: string;
      synchronisedText: Array<{
        text: string;
        /**
         * Absolute time in unit according to `timeStampFormat`.
         */
        timeStamp: number;
      }>;
    }>
    | undefined;

  interface LyricsMetadataFromShortText {
    copyright?: string;
  }

  // ? Song queue related types

  interface Queue {
    currentSongIndex: number | null;
    songIds: number[];
    queueBeforeShuffle?: number[];
    queueId?: string;
    queueType: QueueTypes;
  }

  interface QueuedSong {
    title: string;
    artists: string[];
    path: string;
    artworkPath: string;
    duration: number;
    songId: number;
  }

  type QueueTypes =
    | 'album'
    | 'playlist'
    | 'artist'
    | 'songs'
    | 'genre'
    | 'folder'
    | 'favorites'
    | 'history';

  interface QueueInfo {
    artworkPath: string;
    onlineArtworkPath?: string;
    title: string;
  }

  // ? User data related types

  type AppThemeWithoutSystem = 'dark' | 'light';

  type AppTheme = AppThemeWithoutSystem | 'system';

  type UserDataTypes =
    | 'theme'
    | 'language'
    | 'currentSong.songId'
    | 'currentSong.stoppedPosition'
    | 'volume.value'
    | 'volume.isMuted'
    | 'musicFolders'
    | 'defaultPage'
    | 'queue'
    | 'isShuffling'
    | 'isRepeating'
    | 'windowPositions.mainWindow'
    | 'windowPositions.miniPlayer'
    | 'windowDiamensions.mainWindow'
    | 'windowDiamensions.miniPlayer'
    | 'windowState'
    | 'recentSearches'
    | 'preferences.isMiniPlayerAlwaysOnTop'
    | 'preferences.autoLaunchApp'
    | 'preferences.isMusixmatchLyricsEnabled'
    | 'preferences.hideWindowOnClose'
    | 'preferences.openWindowAsHiddenOnSystemStart'
    | 'preferences.sendSongScrobblingDataToLastFM'
    | 'preferences.sendSongFavoritesDataToLastFM'
    | 'preferences.sendNowPlayingSongDataToLastFM'
    | 'preferences.saveLyricsInLrcFilesForSupportedSongs'
    | 'preferences.autoTranslateLyrics'
    | 'preferences.autoConvertLyrics'
    | 'preferences.enableDiscordRPC'
    | 'preferences.saveVerboseLogs'
    | 'customMusixmatchUserToken'
    | 'customLrcFilesSaveLocation'
    | 'lastFmSessionData'
    | 'storageMetrics'
    | PageSortTypes;

  type AppUpdatesState =
    | 'UNKNOWN'
    | 'CHECKING'
    | 'LATEST'
    | 'OLD'
    | 'ERROR'
    | 'NO_NETWORK_CONNECTION';

  interface Blacklist {
    songBlacklist: number[];
    folderBlacklist: string[];
  }

  interface UserSettings {
    language: string;
    isDarkMode: boolean;
    useSystemTheme: boolean;
    autoLaunchApp: boolean;
    openWindowMaximizedOnStart: boolean;
    openWindowAsHiddenOnSystemStart: boolean;
    isMiniPlayerAlwaysOnTop: boolean;
    isMusixmatchLyricsEnabled: boolean;
    hideWindowOnClose: boolean;
    sendSongScrobblingDataToLastFM: boolean;
    sendSongFavoritesDataToLastFM: boolean;
    sendNowPlayingSongDataToLastFM: boolean;
    saveLyricsInLrcFilesForSupportedSongs: boolean;
    enableDiscordRPC: boolean;
    saveVerboseLogs: boolean;
    mainWindowX: number | null;
    mainWindowY: number | null;
    miniPlayerX: number | null;
    miniPlayerY: number | null;
    mainWindowWidth: number | null;
    mainWindowHeight: number | null;
    miniPlayerWidth: number | null;
    miniPlayerHeight: number | null;
    windowState: string;
    recentSearches: string[];
    customLrcFilesSaveLocation: string | null;
    lastFmSessionName: string | null;
    lastFmSessionKey: string | null;
  }

  interface UserData extends UserSettings { }

  type LanguageCodes = NoInfer<keyof typeof resources>;

  interface AppThemeData {
    isDarkMode: boolean;
    useSystemTheme: boolean;
  }

  interface WindowCordinates {
    x: number;
    y: number;
  }

  type WindowState = 'maximized' | 'normal' | 'minimized';
  interface MusicFolderData {
    path: string;
    stats: {
      lastModifiedDate: Date;
      lastChangedDate: Date;
      fileCreatedDate: Date;
      lastParsedDate: Date;
    };
  }

  interface FolderStructure extends MusicFolderData {
    subFolders: FolderStructure[];
    noOfSongs?: number;
  }

  interface SavedFolderStructure extends FolderStructure {
    id: number;
    subFolders: SavedFolderStructure[];
  }

  interface MusicFolder extends FolderStructure {
    songIds: number[];
    isBlacklisted: boolean;
    subFolders: MusicFolder[];
  }

  interface SavedMusicFolder extends MusicFolder {
    id: number;
    subFolders: SavedMusicFolder[];
  }

  // ? LocalStorage related types

  interface Preferences {
    seekbarScrollInterval: number;
    isSongIndexingEnabled: boolean;
    doNotShowBlacklistSongConfirm: boolean;
    isReducedMotion: boolean;
    doNotVerifyWhenOpeningLinks: boolean;
    doNotShowHelpPageOnLyricsEditorStartUp: boolean;
    showSongRemainingTime: boolean;
    showArtistArtworkNearSongControls: boolean;
    disableBackgroundArtworks: boolean;
    noUpdateNotificationForNewUpdate: string;
    defaultPageOnStartUp: DefaultPages;
    enableArtworkFromSongCovers: boolean;
    shuffleArtworkFromSongCovers: boolean;
    removeAnimationsOnBatteryPower: boolean;
    isSimilaritySearchEnabled: boolean;
    lyricsAutomaticallySaveState: AutomaticallySaveLyricsTypes;
    showTrackNumberAsSongIndex: boolean;
    allowToPreventScreenSleeping: boolean;
    enableImageBasedDynamicThemes: boolean;
    autoTranslateLyrics: boolean;
    autoConvertLyrics: boolean;
  }

  interface CurrentSong {
    songId: number | null;
    stoppedPosition: number;
    playlistId?: string;
  }

  interface Volume {
    isMuted: boolean;
    value: number;
  }

  interface Playback {
    isShuffling: boolean;
    isRepeating: RepeatTypes;
    currentSong: CurrentSong;
    volume: Volume;
    playbackRate: number;
  }

  type EqualizerBandFilters =
    | 'thirtyTwoHertzFilter'
    | 'sixtyFourHertzFilter'
    | 'hundredTwentyFiveHertzFilter'
    | 'twoHundredFiftyHertzFilter'
    | 'fiveHundredHertzFilter'
    | 'thousandHertzFilter'
    | 'twoThousandHertzFilter'
    | 'fourThousandHertzFilter'
    | 'eightThousandHertzFilter'
    | 'sixteenThousandHertzFilter';

  type EqualierPresetDropdownOptionValues =
    | 'custom'
    | 'flat'
    | 'acoustic'
    | 'bassBooster'
    | 'bassReducer'
    | 'classical'
    | 'club'
    | 'dance'
    | 'deep'
    | 'electronic'
    | 'hipHop'
    | 'jazz'
    | 'latin'
    | 'live'
    | 'loudness'
    | 'lounge'
    | 'metal'
    | 'piano'
    | 'pop'
    | 'reggae'
    | 'rnb'
    | 'rock'
    | 'ska'
    | 'smallSpeakers'
    | 'soft'
    | 'softRock'
    | 'spokenWord'
    | 'techno'
    | 'trebleBooster'
    | 'trebleReducer'
    | 'vocalBooster';

  interface Equalizer extends Record<EqualizerBandFilters, number> {
    thirtyTwoHertzFilter: number;
    sixtyFourHertzFilter: number;
    hundredTwentyFiveHertzFilter: number;
    twoHundredFiftyHertzFilter: number;
    fiveHundredHertzFilter: number;
    thousandHertzFilter: number;
    twoThousandHertzFilter: number;
    fourThousandHertzFilter: number;
    eightThousandHertzFilter: number;
    sixteenThousandHertzFilter: number;
  }

  type EqualizerPresetsData = {
    title: EqualierPresetDropdownOptionValues;
    preset: Equalizer;
  }[];

  interface EqualizerPresetDropdownOptions
    extends DropdownOption<EqualierPresetDropdownOptionValues> {
    preset?: Equalizer;
  }

  interface IgnoredDuplicates {
    artists: number[];
    albums: number[];
    genres: number[];
  }

  interface SortingStates {
    songsPage?: SongSortTypes;
    artistsPage?: ArtistSortTypes;
    playlistsPage?: PlaylistSortTypes;
    albumsPage?: AlbumSortTypes;
    genresPage?: GenreSortTypes;
    musicFoldersPage?: FolderSortTypes;
  }

  interface LyricsEditorSettings {
    offset: number;
    editNextAndCurrentStartAndEndTagsAutomatically: boolean;
  }

  interface Shortcut {
    label: string;
    keys: string[];
  }

  interface ShortcutCategory {
    shortcutCategoryTitle: string;
    shortcuts: Shortcut[];
  }

  type ShortcutCategoryList = ShortcutCategory[];

  interface PlayerQueueMetadata {
    queueId?: string;
    queueType?: QueueTypes;
  }

  type QueueEventType =
    | 'positionChange'
    | 'queueChange'
    | 'songAdded'
    | 'songRemoved'
    | 'queueCleared'
    | 'queueReplaced'
    | 'shuffled'
    | 'restored'
    | 'metadataChange';

  type QueueEventCallback<T = unknown> = (data: T) => void;

  interface QueueEventData {
    positionChange: { oldPosition: number; newPosition: number; currentSongId: number | null };
    queueChange: { queue: number[]; length: number };
    songAdded: { songId: number; position: number };
    songRemoved: { songId: number; position: number };
    queueCleared: Record<string, never>;
    queueReplaced: { oldQueue: number[]; newQueue: number[]; newPosition: number };
    shuffled: { originalQueue: number[]; shuffledQueue: number[]; positions: number[] };
    restored: { restoredQueue: number[] };
    metadataChange: { queueId?: string; queueType?: QueueTypes };
  }

  interface PlayerQueueJson {
    songIds: number[];
    position: number;
    queueBeforeShuffle?: number[];
    metadata?: PlayerQueueMetadata;
  }

  interface LocalStorage {
    preferences: Preferences;
    playback: Playback;
    queue: PlayerQueueJson;
    ignoredSeparateArtists: number[];
    ignoredSongsWithFeatArtists: number[];
    ignoredDuplicates: IgnoredDuplicates;
    sortingStates: SortingStates;
    equalizerPreset: Equalizer;
    lyricsEditorSettings: LyricsEditorSettings;
    keyboardShortcuts: ShortcutCategoryList;
  }

  // ? Playlists related types

  interface SavablePlaylist {
    playlistId: number;
    name: string;
    /** song ids of the songs in the playlist */
    songs: number[];
    createdDate: Date;
    isArtworkAvailable: boolean;
  }

  interface Playlist extends SavablePlaylist {
    artworkPaths: ArtworkPaths;
  }

  // ? Genre related types

  interface SavableGenre {
    genreId: number;
    name: string;
    songs: {
      title: string;
      songId: number;
    }[];
    artworkName?: string;
    paletteId?: string;
  }

  interface Genre extends SavableGenre {
    artworkPaths: ArtworkPaths;
    paletteData?: PaletteData;
  }

  // ? Albums related types

  interface SavableAlbum {
    albumId: number;
    title: string;
    artists?: {
      name: string;
      artistId: number;
    }[];
    songs: {
      title: string;
      songId: number;
    }[];
    year?: number;
    artworkName?: string;
  }

  interface Album extends SavableAlbum {
    artworkPaths: ArtworkPaths;
  }

  // ? Artists related types

  interface SavableArtist {
    artistId: number;
    songs: {
      title: string;
      songId: number;
    }[];
    albums?: {
      title: string;
      albumId: number;
    }[];
    name: string;
    isAFavorite: boolean;
    artworkName?: string;
    onlineArtworkPaths?: OnlineArtistArtworks;
  }

  interface Artist extends SavableArtist {
    artworkPaths: ArtworkPaths;
  }

  interface ArtistInfo extends Artist {
    artistPalette?: NodeVibrantPalette;
    artistBio?: string;
    similarArtists?: SimilarArtistInfo;
    tags?: Tag[];
  }

  interface SimilarArtistInfo {
    availableArtists: SimilarArtist[];
    unAvailableArtists: SimilarArtist[];
  }

  interface ArtistInfoFromNet {
    artistArtworks?: OnlineArtistArtworks;
    artistPalette?: PaletteData;
    artistBio?: string;
    similarArtists: SimilarArtistInfo;
    tags: Tag[];
  }

  interface OnlineArtistArtworks {
    picture_small: string;
    picture_medium: string;
    picture_xl?: string;
  }

  //  ? Storage related types

  interface AppDataStorageMetrics {
    appDataSize: number;
    artworkCacheSize: number;
    tempArtworkCacheSize: number;
    totalArtworkCacheSize: number;
    logSize: number;
    databaseSize: number;
    totalKnownItemsSize: number;
    otherSize: number;
  }

  interface StorageMetrics {
    rootSizes: { freeSpace: number; size: number };
    remainingSize: number;
    appFolderSize: number;
    appDataSizes: AppDataStorageMetrics;
    totalSize: number;
    generatedDate: string;
  }

  interface DatabaseMetrics {
    songCount: number;
    artistCount: number;
    albumCount: number;
    genreCount: number;
    playlistCount: number;
  }

  // ? Search related types

  type SearchFilters = 'All' | 'Artists' | 'Albums' | 'Songs' | 'Playlists' | 'Genres';

  interface SearchResult {
    songs: SongData[];
    artists: Artist[];
    albums: Album[];
    playlists: Playlist[];
    genres: Genre[];
    availableResults: string[];
  }

  // ? Prompt menu related types

  interface PromptMenuData {
    prompt: ReactNode;
    className?: string;
    isOneTime?: boolean;
  }
  interface PromptMenuNavigationHistoryData {
    isVisible: boolean;
    prompts: PromptMenuData[];
    currentActiveIndex: number;
  }

  // ? Notification panel related

  type DefaultCodes = 'SUCCESS' | 'FAILURE' | 'LOADING' | 'INFO';

  type ErrorCodes =
    | 'SONG_NOT_FOUND'
    | 'ARTISTS_NOT_FOUND'
    | 'EMPTY_SONG_ARRAY'
    | 'EMPTY_USERDATA'
    | 'DATA_FILE_ERROR'
    | 'EMPTY_BLACKLIST'
    | 'SONG_DATA_SEND_FAILED'
    | 'NO_BLACKLISTED_SONG_IN_GIVEN_PATH'
    | 'CREATE_TEMP_ARTWORK_FAILED'
    | 'READING_MODIFICATIONS_FAILED'
    | 'FOLDER_MODIFICATIONS_CHECK_FAILED'
    | 'SONG_EXT_NOT_SUPPORTED_FOR_LYRICS_SAVES'
    | 'RESET_FAILED'
    | 'MUSIC_FOLDER_DELETED'
    | 'EMPTY_MUSIC_FOLDER_DELETED'
    | 'OPEN_SONG_IN_EXPLORER_FAILED'
    | 'LYRICS_FIND_FAILED'
    | 'LYRICS_TRANSLATION_FAILED'
    | 'LYRICS_CONVERT_FAILED'
    | 'RESET_CONVERTED_LYRICS_FAILED'
    | 'METADATA_UPDATE_FAILED'
    | 'DESTINATION_NOT_SELECTED'
    | 'ARTWORK_SAVE_FAILED'
    | 'APPDATA_EXPORT_FAILED'
    | 'PLAYLIST_EXPORT_FAILED'
    | 'APPDATA_IMPORT_FAILED'
    | 'APPDATA_IMPORT_FAILED_DUE_TO_MISSING_FILES'
    | 'PLAYLIST_IMPORT_FAILED'
    | 'PLAYLIST_IMPORT_FAILED_DUE_TO_SONGS_OUTSIDE_LIBRARY'
    | 'PLAYLIST_IMPORT_TO_EXISTING_PLAYLIST_FAILED'
    | 'PLAYLIST_CREATION_FAILED'
    | 'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_DATA'
    | 'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_EXTENSION'
    | 'PLAYLIST_NOT_FOUND'
    | 'SONG_REPARSE_FAILED'
    | 'WHITELISTING_FOLDER_FAILED_DUE_TO_BLACKLISTED_PARENT_FOLDER'
    | 'WHITELISTING_SONG_FAILED_DUE_TO_BLACKLISTED_DIRECTORY'
    | 'UNSUPPORTED_FILE_EXTENSION';

  type MessageCodes =
    | DefaultCodes
    | ErrorCodes
    | 'SONG_LIKE'
    | 'SONG_DISLIKE'
    | 'ARTIST_LIKE'
    | 'ARTIST_DISLIKE'
    | 'PROMPT_CLOSED_BEFORE_INPUT'
    | 'PARSE_FAILED'
    | 'PARSE_SUCCESSFUL'
    | 'SONG_DELETED'
    | 'NO_NETWORK_CONNECTION'
    | 'NETWORK_DISCONNECTED'
    | 'NETWORK_CONNECTED'
    | 'APP_THEME_CHANGE'
    | 'PLAYBACK_FROM_UNKNOWN_SOURCE'
    | 'AUDIO_PARSING_PROCESS_UPDATE'
    | 'SONG_PALETTE_GENERATING_PROCESS_UPDATE'
    | 'GENRE_PALETTE_GENERATING_PROCESS_UPDATE'
    | 'SONG_REMOVE_PROCESS_UPDATE'
    | 'NO_MORE_SONG_PALETTES'
    | 'NO_MORE_GENRE_PALETTES'
    | 'SONG_BLACKLISTED'
    | 'SONG_WHITELISTED'
    | 'FOLDER_BLACKLISTED'
    | 'FOLDER_WHITELISTED'
    | 'PENDING_METADATA_UPDATES_SAVED'
    | 'FOLDER_PARSED_FOR_DIRECTORIES'
    | 'RESET_SUCCESSFUL'
    | 'LYRICS_SAVE_QUEUED'
    | 'LYRICS_SAVED_IN_LRC_FILE'
    | 'PENDING_LYRICS_SAVED'
    | 'LYRICS_TRANSLATION_SUCCESS'
    | 'LYRICS_TRANSLATION_TO_SAME_SOURCE_LANGUAGE'
    | 'LYRICS_CONVERT_SUCCESS'
    | 'RESET_CONVERTED_LYRICS_SUCCESS'
    | 'LASTFM_LOGIN_SUCCESS'
    | 'APPDATA_EXPORT_STARTED'
    | 'APPDATA_IMPORT_STARTED'
    | 'APPDATA_EXPORT_SUCCESS'
    | 'APPDATA_IMPORT_SUCCESS'
    | 'APPDATA_IMPORT_SUCCESS_WITH_PENDING_RESTART'
    | 'PLAYLIST_EXPORT_SUCCESS'
    | 'PLAYLIST_IMPORT_SUCCESS'
    | 'PLAYLIST_RENAME_SUCCESS'
    | 'PLAYLIST_RENAME_FAILED'
    | 'PLAYLIST_IMPORT_TO_EXISTING_PLAYLIST'
    | 'SONG_REPARSE_SUCCESS'
    | 'ADDED_SONGS_TO_PLAYLIST'
    | 'ARTWORK_SAVED'
    | 'RESYNC_SUCCESSFUL';

  interface MessageToRendererData extends Record<string, unknown> {
    total?: number;
    value?: number;
  }

  type MessageToRendererProps = {
    messageCode: MessageCodes;
    data?: MessageToRendererData;
  };

  interface NotificationPanelData {
    notifications: AppNotification[];
    // notificationsMap: Map<string, AppNotification>;
  }

  type NotificationTypes = 'DEFAULT' | 'WITH_PROGRESS_BAR';

  interface AppNotification {
    duration?: number;
    id: string;
    order?: number;
    content: ReactNode;
    icon?: ReactElement;
    iconName?: string;
    iconClassName?: string;
    buttons?: ButtonProps[];
    type?: NotificationTypes;
    progressBarData?: {
      total: number;
      value: number;
    };
  }

  // ? Navigation History related data

  interface NavigationHistory {
    pageTitle: PageTitles;
    data?: PageData;
    onPageChange?: (changedPageTitle: PageTitles, changedPageData?: PageData) => void;
  }

  interface PageData<R = unknown> extends Record<string, R> {
    scrollTopOffset?: number;
    isLowResponseRequired?: boolean;
    preventScreenSleeping?: boolean;
  }

  interface NavigationHistoryData {
    pageHistoryIndex: number;
    history: NavigationHistory[];
  }

  // ? Navigation History related data

  interface MultipleSelectionData {
    isEnabled: boolean;
    multipleSelections: number[];
    selectionType?: QueueTypes;
  }

  // ? Context menu related related types

  interface ContextMenuAdditionalData {
    title: string;
    artworkPath: string;
    artworkClassName?: string;
    subTitle?: string;
    subTitle2?: string;
    button?: ReactElement;
  }

  interface ContextMenuData {
    isVisible: boolean;
    data?: ContextMenuAdditionalData;
    menuItems: ContextMenuItem[];
    pageX: number;
    pageY: number;
  }

  interface ContextMenuItem {
    label: string;
    class?: string;
    iconName?: string;
    iconClassName?: string;
    isContextMenuItemSeperator?: boolean;
    innerContextMenus?: ContextMenuItem[];
    handlerFunction: null | (() => void);
    isDisabled?: boolean;
  }

  // ? Data sorting related types

  type PageSortTypes =
    | 'sortingStates.songsPage'
    | 'sortingStates.artistsPage'
    | 'sortingStates.playlistsPage'
    | 'sortingStates.albumsPage'
    | 'sortingStates.artistsPage'
    | 'sortingStates.genresPage';

  type SongFilterTypes =
    | 'notSelected'
    | 'blacklistedSongs'
    | 'whitelistedSongs'
    | 'favorites'
    | 'nonFavorites';

  type SongSortTypes = (typeof songSortTypes)[number];

  type ArtistFilterTypes = 'notSelected' | 'favorites';

  type ArtistSortTypes =
    | 'aToZ'
    | 'zToA'
    | 'noOfSongsAscending'
    | 'noOfSongsDescending'
    | 'mostLovedAscending'
    | 'mostLovedDescending';

  type PlaylistSortTypes = 'aToZ' | 'zToA' | 'noOfSongsAscending' | 'noOfSongsDescending';

  type AlbumSortTypes = 'aToZ' | 'zToA' | 'noOfSongsAscending' | 'noOfSongsDescending';

  type GenreSortTypes = 'aToZ' | 'zToA' | 'noOfSongsAscending' | 'noOfSongsDescending';

  type FolderSortTypes =
    | 'aToZ'
    | 'zToA'
    | 'noOfSongsAscending'
    | 'noOfSongsDescending'
    | 'blacklistedFolders'
    | 'whitelistedFolders';

  // ? App pages related types

  type DefaultPages =
    | 'Songs'
    | 'Home'
    | 'Artists'
    | 'Albums'
    | 'Playlists'
    | 'Folders'
    | 'Search'
    | 'Genres';

  type PageTitles =
    | DefaultPages
    | 'Settings'
    | 'Lyrics'
    | 'SongInfo'
    | 'ArtistInfo'
    | 'AlbumInfo'
    | 'PlaylistInfo'
    | 'GenreInfo'
    | 'MusicFolderInfo'
    | 'CurrentQueue'
    | 'SongTagsEditor'
    | 'LyricsEditor'
    | 'AllSearchResults';

  type PromiseFunctionReturn = Promise<{ success: boolean; message?: string }>;

  // ? Data updated event related types

  type DataUpdateEventTypes =
    | 'songs'
    | 'songs/newSong'
    | 'songs/updatedSong'
    | 'songs/deletedSong'
    | 'songs/artworks'
    | 'songs/palette'
    | 'songs/listeningData'
    | 'songs/listeningData/fullSongListens'
    | 'songs/listeningData/skips'
    | 'songs/listeningData/listens'
    | 'songs/listeningData/inNoOfPlaylists'
    | 'songs/likes'
    | 'songs/lyrics'
    | 'artists'
    | 'artists/likes'
    | 'artists/newArtist'
    | 'artists/updatedArtist'
    | 'artists/deletedArtist'
    | 'artists/artworks'
    | 'albums'
    | 'albums/newAlbum'
    | 'albums/updatedAlbum'
    | 'albums/deletedAlbum'
    | 'genres'
    | 'genres/newGenre'
    | 'genres/updatedGenre'
    | 'genres/deletedGenre'
    | 'genres/backgroundColor'
    | 'playlists'
    | 'playlists/newPlaylist'
    | 'playlists/updatedPlaylist'
    | 'playlists/deletedPlaylist'
    | 'playlists/history'
    | 'playlists/favorites'
    | 'playlists/newSong'
    | 'playlists/deletedSong'
    | 'userData'
    | 'userData/theme'
    | 'userData/currentSong'
    | 'userData/recentlyPlayedSongs'
    | 'userData/volume'
    | 'userData/queue'
    | 'userData/musicFolder'
    | 'userData/windowPosition'
    | 'userData/windowDiamension'
    | 'userData/recentSearches'
    | 'userData/sortingStates'
    | 'settings/preferences'
    | 'blacklist'
    | 'blacklist/songBlacklist'
    | 'blacklist/folderBlacklist';

  interface DataUpdateEvent {
    dataType: DataUpdateEventTypes;
    eventData: { data?: number[]; message?: string }[];
  }

  interface DetailAvailableEvent<DetailType> extends Event {
    detail: DetailType;
  }

  // ? Logs related types

  interface ErrorLogData {
    os: {
      architecture: string;
      cpu: string;
      platform: NodeJS.Platform;
      os: string;
      totalMemory: number;
    };
    logs: ErrorLog[];
  }

  interface ErrorLog {
    time: string;
    error: {
      name: string;
      message: string;
      stack?: string;
    };
  }

  interface LogsData {
    logs: string[];
  }

  // ? SongTags related types
  type SongTagsAlbumData = {
    title: string;
    albumId?: number;
    noOfSongs?: number;
    artists?: string[];
    artworkPath?: string;
  };

  type SongTagsArtistData = {
    artistId?: number;
    name: string;
    artworkPath?: string;
    onlineArtworkPaths?: OnlineArtistArtworks;
  };

  type SongTagsGenreData = {
    genreId?: number;
    name: string;
    artworkPath?: string;
  };

  interface SongTags {
    title: string;
    artists?: SongTagsArtistData[];
    albumArtists?: SongTagsArtistData[];
    albums?: SongTagsAlbumData[];
    trackNumber?: number;
    releasedYear?: number;
    genres?: SongTagsGenreData[];
    composer?: string;
    synchronizedLyrics?: string;
    unsynchronizedLyrics?: string;
    artworkPath?: string;
    duration: number;
    isLyricsSavePending?: boolean;
    isMetadataSavePending?: boolean;
  }

  interface SongOutsideLibraryData {
    title: string;
    songId: number;
    duration: number;
    path: string;
    artworkPath?: string;
  }

  interface NodeID3Tags extends NodeID3.Tags {
    image: string;
  }

  // ? Release notes related types

  export interface Changelog {
    latestVersion: LatestAppVersion;
    versions: AppVersion[];
  }

  export interface LatestAppVersion {
    version: string;
    phase: string;
    releaseDate: string;
    artwork?: string;
    importantNotes?: string[];
  }

  export interface AppVersion {
    version: string;
    releaseDate: string;
    importantNotes?: string[];
    artwork?: string;
    notes: ChangelogNoteTypes;
  }

  export interface ChangelogNoteTypes {
    new: ChangelogNote[];
    fixed: ChangelogNote[];
    knownIssues: ChangelogNote[];
    developerUpdates: ChangelogNote[];
  }

  export interface ChangelogNote {
    note: string;
  }

  interface UpdateSongDataResult {
    success: boolean;
    reason?: string;
    updatedData?: AudioPlayerData;
  }

  // ? Song metadata results related types

  export type SongMetadataSource = 'LAST_FM' | 'GENIUS' | 'DEEZER' | 'ITUNES' | 'MUSIXMATCH';

  interface SongMetadataResultFromInternet {
    title: string;
    artists: string[];
    album?: string;
    genres?: string[];
    duration?: number;
    artworkPaths: string[];
    releasedYear?: number;
    language?: string;
    lyrics?: string;
    source: SongMetadataSource;
    sourceId: string;
  }

  type ArtAssetKeys =
    | 'nora_logo'
    | 'song_artwork'
    | 'album_artwork'
    | 'favorites_artwork'
    | 'genre_artwork'
    | 'playlist_artwork';

  interface SearchUrlParams {
    scrollTopOffset?: number;
  }

  interface LyricData {
    text: string | Omit<SyncedLyricsLineWord, 'unparsedText'>[];
    start?: number;
    end?: number;
  }

  interface LyricsLineData {
    text: string;
    start?: number;
    end?: number;
    unparsedText?: string;
    isActive: boolean;
  }

  interface EditingLyricsLineData {
    text: string | LyricsLineData[];
    start?: number;
    end?: number;
  }
  interface ExtendedEditingLyricsLineData extends EditingLyricsLineData {
    index: number;
    isActive: boolean;
  }

  type Routes = 'lyrics-editor';
  type LyricsEditorRouteState = { songId: number; lyrics?: LyricData[] };
  interface RouteStates {
    'lyrics-editor': LyricsEditorRouteState;
  }

  type DB = typeof db;
  type DBTransaction = Parameters<Parameters<DB['transaction']>[0]>[0];
}
