/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import NodeID3 from 'node-id3';
import { ReactElement } from 'react';
import { ButtonProps } from 'renderer/components/Button';
import { api } from '../main/preload';

declare global {
  interface Window {
    api: typeof api;
  }

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
    songId: string;
    title: string;
    duration: number;
    artists?: { artistId: string; name: string }[];
    album?: { albumId: string; name: string };
    genres?: { genreId: string; name: string }[];
    albumArtist?: string;
    bitrate?: number;
    noOfChannels?: number;
    year?: number;
    sampleRate?: number;
    palette?: NodeVibrantPalette;
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
    rgb: [number, number, number];
    hsl?: [number, number, number];
    hex?: string;
    bodyTextColor?: string;
    titleTextColor?: string;
    population?: number;
  }

  interface AudioPlayerData {
    songId: string;
    title: string;
    artists?: {
      artistId: string;
      name: string;
      artworkPath?: string;
      onlineArtworkPaths?: OnlineArtistArtworks;
    }[];
    duration: number;
    artwork?: string;
    artworkPath?: string;
    path: string;
    isAFavorite: boolean;
    album?: { albumId: string; name: string };
    palette?: NodeVibrantPalette;
    isKnownSource: boolean;
  }

  interface AudioInfo {
    title: string;
    artists?: { artistId: string; name: string }[];
    duration: number;
    artworkPaths: ArtworkPaths;
    path: string;
    songId: string;
    addedDate: number;
    isAFavorite: boolean;
    year?: number;
    palette?: NodeVibrantPalette;
    isBlacklisted: boolean;
  }

  interface GetAllSongsResult {
    data: AudioInfo[];
    pageNo: number;
    maxResultsPerPage: number;
    noOfPages: number;
    sortType: SongSortTypes;
  }

  interface ToggleLikeSongReturnValue {
    likes: string[];
    dislikes: string[];
  }

  // ? Song listening data related types

  interface SavableSongListeningData {
    /** song id of the relevant song */
    songId: string;
    /** no of song skips.
     * Incremented if the song is skipped less than 5 seconds */
    skips?: number;
    /** no of full listens.
     * Incremented if the user has listened to more than 80% of the song. */
    fullListens?: number;
    /** no of playlists the song was added.
     * Incremented if the user added the song to any playlist. */
    inNoOfPlaylists?: number;
    /** an array of listening records for each year. */
    listens: SavableYearlyListeningRate[];
  }

  interface SongListeningData {
    songId: string;
    skips?: number;
    fullListens?: number;
    inNoOfPlaylists?: number;
    listens: YearlyListeningRate[];
  }

  interface SavableYearlyListeningRate {
    year: number;
    /**
     * An array with strings holding no of listens of the song in each day of each month of an year.
     *
     * * Array can have maximum of 12 strings each representing a month.
     *
     * * If the array has ["2_0","","1_3"], it means that user has listened to this song 2 times January, 0 times in February, and total of 4 times in March. In this example, other 9 months is considered as if the user didn't listen to this song.
     *
     * * String contains no of listens of each of a month seperated by an underscore(_).
     *
     * * Empty string says that user didn't listen to this song in that relevant month.
     *
     * * if the string contains "2_0_3", that means user listened to this song 2 times on 1st, 0 times on 2nd and 3 times on 3rd day in that month.
     */
    months: string[];
  }
  type MonthlyListens = number[];

  interface YearlyListeningRate {
    year: number;
    months: MonthlyListens[];
  }

  type ListeningDataTypes =
    | 'skips'
    | 'fullListens'
    | 'noOfPlaylists'
    | 'listens';

  type ListeningDataUpdateTypes = 'increment' | 'decrement';

  // ? Audio player and lyrics related types

  type RepeatTypes = 'false' | 'repeat' | 'repeat-1';

  interface Player {
    isCurrentSongPlaying: boolean;
    volume: { isMuted: boolean; value: number };
    isRepeating: RepeatTypes;
    songPosition: number;
    isShuffling: boolean;
    isMiniPlayer: boolean;
    isPlayerStalled: boolean;
  }

  type SongSkipReason = 'USER_SKIP' | 'PLAYER_SKIP';

  type LyricsTypes = 'SYNCED' | 'UN_SYNCED' | 'ANY';

  type LyricsRequestTypes = 'ONLINE_ONLY' | 'OFFLINE_ONLY' | 'ANY';

  type LyricsSource = 'IN_SONG_LYRICS' | 'MUSIXMATCH' | string;

  interface LyricsRequestTrackInfo {
    songTitle: string;
    songArtists?: string[];
    songPath: string;
    duration: number;
  }

  interface SongLyrics {
    title: string;
    source: LyricsSource;
    lyricsType: LyricsTypes;
    link?: string;
    lyrics: LyricsData;
    lang?: string;
    copyright?: string;
    isOfflineLyricsAvailable: boolean;
  }

  interface SyncedLyricLine {
    text: string;
    start: number;
    end: number;
  }

  interface LyricsData {
    isSynced: boolean;
    lyrics: string[];
    syncedLyrics?: SyncedLyricLine[];
    unparsedLyrics: string;
    copyright?: string;
  }

  // node-id3 synchronisedLyrics types.
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
    queue: string[];
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
    songId: string;
  }

  type QueueTypes =
    | 'album'
    | 'playlist'
    | 'artist'
    | 'songs'
    | 'genre'
    | 'folder';

  // ? User data related types

  type AppTheme = 'dark' | 'light' | 'system';

  type UserDataTypes =
    | 'theme'
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
    | 'recentSearches'
    | 'preferences.doNotShowBlacklistSongConfirm'
    | 'preferences.isReducedMotion'
    | 'preferences.songIndexing'
    | 'preferences.isMiniPlayerAlwaysOnTop'
    | 'preferences.doNotVerifyWhenOpeningLinks'
    | 'preferences.autoLaunchApp'
    | 'preferences.showSongRemainingTime'
    | 'preferences.noUpdateNotificationForNewUpdate'
    | 'preferences.showArtistArtworkNearSongControls'
    | 'preferences.isMusixmatchLyricsEnabled'
    | 'preferences.disableBackgroundArtworks'
    | 'preferences.hideWindowOnClose'
    | 'preferences.openWindowAsHiddenOnSystemStart'
    | 'customMusixmatchUserToken'
    | PageSortTypes;

  type AppUpdatesState =
    | 'UNKNOWN'
    | 'CHECKING'
    | 'LATEST'
    | 'OLD'
    | 'ERROR'
    | 'NO_NETWORK_CONNECTION';

  interface Blacklist {
    songBlacklist: string[];
    folderBlacklist: string[];
  }

  interface UserData {
    theme: AppThemeData;
    currentSong: {
      songId: string | null;
      stoppedPosition: number;
      playlistId?: string;
    };
    volume: {
      isMuted: boolean;
      value: number;
    };
    queue?: Queue;
    isShuffling: boolean;
    isRepeating: RepeatTypes;
    musicFolders: MusicFolderData[];
    defaultPage: DefaultPages;
    preferences: {
      doNotShowBlacklistSongConfirm: boolean;
      isReducedMotion: boolean;
      songIndexing: boolean;
      autoLaunchApp: boolean;
      isMiniPlayerAlwaysOnTop: boolean;
      doNotVerifyWhenOpeningLinks: boolean;
      showSongRemainingTime: boolean;
      noUpdateNotificationForNewUpdate?: string;
      showArtistArtworkNearSongControls: boolean;
      isMusixmatchLyricsEnabled: boolean;
      disableBackgroundArtworks: boolean;
      hideWindowOnClose: boolean;
      openWindowAsHiddenOnSystemStart: boolean;
    };
    windowPositions: {
      mainWindow?: WindowCordinates;
      miniPlayer?: WindowCordinates;
    };
    windowDiamensions: {
      mainWindow?: WindowCordinates;
      miniPlayer?: WindowCordinates;
    };
    sortingStates: {
      songsPage?: SongSortTypes;
      artistsPage?: ArtistSortTypes;
      playlistsPage?: PlaylistSortTypes;
      albumsPage?: AlbumSortTypes;
      genresPage?: GenreSortTypes;
    };
    recentSearches: string[];
    customMusixmatchUserToken?: string;
  }

  interface AppThemeData {
    isDarkMode: boolean;
    useSystemTheme: boolean;
  }

  interface WindowCordinates {
    x: number;
    y: number;
  }

  interface MusicFolderData {
    path: string;
    stats: {
      lastModifiedDate: Date;
      lastChangedDate: Date;
      fileCreatedDate: Date;
      lastParsedDate: Date;
    };
  }

  interface MusicFolder {
    folderData: MusicFolderData;
    songIds: string[];
    isBlacklisted: boolean;
  }

  // ? Playlists related types

  interface SavablePlaylist {
    playlistId: 'Favorites' | 'History' | string;
    name: string;
    /** song ids of the songs in the playlist */
    songs: string[];
    createdDate: Date;
    isArtworkAvailable: boolean;
  }

  interface Playlist extends SavablePlaylist {
    artworkPaths: ArtworkPaths;
  }

  // ? Genre related types

  interface SavableGenre {
    genreId: string;
    name: string;
    songs: {
      title: string;
      songId: string;
    }[];
    artworkName?: string;
    backgroundColor?: { rgb: unknown };
  }

  interface Genre extends SavableGenre {
    artworkPaths: ArtworkPaths;
  }

  // ? Albums related types

  interface SavableAlbum {
    albumId: string;
    title: string;
    artists?: {
      name: string;
      artistId: string;
    }[];
    songs: {
      title: string;
      songId: string;
    }[];
    year?: number;
    artworkName?: string;
  }

  interface Album extends SavableAlbum {
    artworkPaths: ArtworkPaths;
  }

  // ? Artists related types

  interface SavableArtist {
    artistId: string;
    songs: {
      title: string;
      songId: string;
    }[];
    albums?: {
      title: string;
      albumId: string;
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
  }

  interface ArtistInfoFromNet {
    artistArtworks?: OnlineArtistArtworks;
    artistPalette?: NodeVibrantPalette;
    artistBio?: string;
  }

  interface OnlineArtistArtworks {
    picture_small: string;
    picture_medium: string;
  }

  // ? Search related types

  type SearchFilters =
    | 'All'
    | 'Artists'
    | 'Albums'
    | 'Songs'
    | 'Playlists'
    | 'Genres';

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
    isVisible: boolean;
    content: ReactElement<any, any>;
    className: string;
  }

  // ? Notification panel related types

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
    | 'UNSUPPORTED_FILE_EXTENSION';

  type MessageCodes =
    | ErrorCodes
    | 'SONG_LIKE'
    | 'SONG_DISLIKE'
    | 'ARTIST_LIKE'
    | 'ARTIST_DISLIKE'
    | 'PROMPT_CLOSED_BEFORE_INPUT'
    | 'PARSE_FAILED'
    | 'PARSE_SUCCESSFUL'
    | 'SONG_DELETED'
    | 'MUSIC_FOLDER_DELETED'
    | 'NO_NETWORK_CONNECTION'
    | 'NETWORK_DISCONNECTED'
    | 'NETWORK_CONNECTED'
    | 'APP_THEME_CHANGE'
    | 'PLAYBACK_FROM_UNKNOWN_SOURCE'
    | 'RESYNC_SUCCESSFUL';

  interface NotificationPanelData {
    notifications: AppNotification[];
  }

  interface AppNotification {
    delay: number;
    id: string;
    order?: number;
    content: ReactElement<any, any>;
    icon?: ReactElement<any, any>;
    buttons?: ButtonProps[];
    isLoading?: boolean;
  }

  // ? Navigation History related data

  interface NavigationHistory {
    pageTitle: PageTitles;
    data?: PageData;
  }

  interface PageData extends Record<string, unknown> {
    scrollTopOffset?: number;
  }

  interface NavigationHistoryData {
    pageHistoryIndex: number;
    history: NavigationHistory[];
  }

  // ? Navigation History related data

  interface MultipleSelectionData {
    isEnabled: boolean;
    multipleSelections: string[];
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
    handlerFunction: () => void;
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

  type SongSortTypes =
    | 'aToZ'
    | 'zToA'
    | 'addedOrder'
    | 'dateAddedAscending'
    | 'dateAddedDescending'
    | 'releasedYearAscending'
    | 'releasedYearDescending'
    | 'artistNameAscending'
    | 'artistNameDescending'
    | 'allTimeMostListened'
    | 'allTimeLeastListened'
    | 'monthlyMostListened'
    | 'monthlyLeastListened'
    | 'artistNameDescending'
    | 'albumNameAscending'
    | 'albumNameDescending'
    | 'blacklistedSongs'
    | 'whitelistedSongs';

  type ArtistSortTypes =
    | 'aToZ'
    | 'zToA'
    | 'noOfSongsAscending'
    | 'noOfSongsDescending'
    | 'mostLovedAscending'
    | 'mostLovedDescending';

  type PlaylistSortTypes =
    | 'aToZ'
    | 'zToA'
    | 'noOfSongsAscending'
    | 'noOfSongsDescending';

  type AlbumSortTypes =
    | 'aToZ'
    | 'zToA'
    | 'noOfSongsAscending'
    | 'noOfSongsDescending';

  type GenreSortTypes =
    | 'aToZ'
    | 'zToA'
    | 'noOfSongsAscending'
    | 'noOfSongsDescending';

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
    | 'AllSearchResults';

  type PromiseFunctionReturn = Promise<{ success: boolean; message?: string }>;

  // ? Data updated event related types

  type DataUpdateEventTypes =
    | 'songs'
    | 'songs/newSong'
    | 'songs/updatedSong'
    | 'songs/deletedSong'
    | 'songs/artworks'
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
    eventData: { data?: string[]; message?: string }[];
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

  interface SongTags {
    title: string;
    artists?: {
      artistId?: string;
      name: string;
      artworkPath?: string;
      onlineArtworkPaths?: OnlineArtistArtworks;
    }[];
    album?: {
      title: string;
      albumId?: string;
      noOfSongs?: number;
      artists?: string[];
      artworkPath?: string;
    };
    releasedYear?: number;
    genres?: { genreId?: string; name: string; artworkPath?: string }[];
    composer?: string;
    lyrics?: string;
    artworkPath?: string;
    duration: number;
  }

  interface SongOutsideLibraryData {
    title: string;
    songId: string;
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
    notes: Notes;
  }

  export interface Notes {
    new: Fixed[];
    fixed: Fixed[];
    knownIssues: Fixed[];
  }

  export interface Fixed {
    note: string;
  }

  interface UpdateSongDataResult {
    success: boolean;
    reason?: string;
    updatedData?: AudioPlayerData;
  }

  // ? Song metadata results related types

  export type SongMetadataSource =
    | 'LAST_FM'
    | 'GENIUS'
    | 'DEEZER'
    | 'ITUNES'
    | 'MUSIXMATCH';

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
}
