/* eslint-disable @typescript-eslint/no-explicit-any */
import * as musicMetaData from 'music-metadata';
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
    | 'app/toggleLikeSong'
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
    | 'app/removeAPlaylist'
    | 'app/addSongToPlaylist'
    | 'app/removeSongFromLibrary'
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

  interface SongData {
    songId: string;
    title: string;
    duration: number;
    artists?: { artistId: string; name: string }[];
    album?: { albumId: string; name: string };
    genres?: { genreId: string; name: string }[];
    albumArtist?: string;
    format?: musicMetaData.IFormat;
    track: unknown;
    year?: number;
    sampleRate?: number;
    palette?: {
      DarkVibrant: {
        rgb: unknown;
      };
      LightVibrant: {
        rgb: unknown;
      };
    };
    path: string;
    artworkPath: string;
    isAFavorite: boolean;
    createdDate?: string;
    modifiedDate?: string;
    addedDate: string;
    listeningRate: {
      allTime: number;
      monthly: {
        year: number;
        months: [
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number
        ];
      };
    };
  }

  interface AudioData {
    title: string;
    artists?: { artistId: string; name: string }[];
    duration: number;
    artwork?: string;
    artworkPath?: string;
    path: string;
    songId: string;
    isAFavorite: boolean;
    album?: { albumId: string; name: string };
  }

  interface AudioPlayerData extends AudioData {
    artists?: {
      artistId: string;
      name: string;
      artworkPath?: string;
      onlineArtworkPaths?: OnlineArtistArtworks;
    }[];
  }

  interface AudioInfo {
    title: string;
    artists?: { artistId: string; name: string }[];
    duration: number;
    artworkPath?: string;
    path: string;
    songId: string;
    addedDate: string;
    isAFavorite: boolean;
    palette?: {
      DarkVibrant: {
        rgb: unknown;
      };
      LightVibrant: {
        rgb: unknown;
      };
    };
  }

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
  type QueueTypes = 'album' | 'playlist' | 'artist' | 'songs';

  interface UserData {
    theme: {
      isDarkMode: boolean;
      useSystemTheme: boolean;
    };
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
    songBlacklist: string[];
    preferences: {
      doNotShowRemoveSongFromLibraryConfirm: boolean;
      isReducedMotion: boolean;
      songIndexing: boolean;
      autoLaunchApp: boolean;
      isMiniPlayerAlwaysOnTop: boolean;
      doNotVerifyWhenOpeningLinks: boolean;
      showSongRemainingTime: boolean;
      noUpdateNotificationForNewUpdate?: string;
      showArtistArtworkNearSongControls: boolean;
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
      albumsPage?: AlbumSortTypes;
      genresPage?: GenreSortTypes;
    };
    recentSearches: string[];
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

  interface Playlist {
    name: string;
    /** song ids of the songs in the playlist */
    songs: string[];
    createdDate: Date;
    playlistId: string;
    artworkPath?: string;
  }
  interface PlaylistDataTemplate {
    playlists: Playlist[];
  }
  interface Data {
    songs: SongData[];
    albums: Album[];
    artists: Artist[];
    genres: Genre[];
  }

  interface Genre {
    genreId: string;
    name: string;
    songs: {
      title: string;
      songId: string;
    }[];
    artworkPath?: string;
    backgroundColor?: { rgb: unknown };
  }

  interface Album {
    albumId: string;
    title: string;
    artists?: {
      name: string;
      artistId: string;
    }[];
    artworkPath?: string;
    songs: {
      title: string;
      songId: string;
    }[];
    year?: number;
  }

  interface Artist {
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
    artworkPath?: string;
    onlineArtworkPaths?: OnlineArtistArtworks;
  }
  interface Lyrics {
    lyrics: string;
    source: {
      name: string;
      url: string;
      link: string;
    };
  }

  interface GetAllSongsResult {
    data: AudioInfo[];
    pageNo: number;
    maxResultsPerPage: number;
    noOfPages: number;
    sortType: SongSortTypes;
  }

  interface ToggleLikeSongReturnValue {
    error: string | null;
    success: boolean;
  }

  interface ArtistInfoFromNetData {
    data: ArtistInfoFromNet[];
  }

  interface ArtistInfoDeezerApi {
    data: ArtistInfoFromDeezer[];
    total: number;
    next: string;
  }

  interface LastFMArtistInfo {
    name: string;
    mbid: string;
    url: string;
    image: {
      text: string;
      size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega';
    }[];
    streamable: '0' | '1';
    ontour: '0' | '1';
    stats: {
      listeners: number;
      playcount: number;
    };
    similar: LastFMArtistInfo[];
    tags: {
      tag: { name: string; url: string }[];
    };
    bio: {
      links: {
        link: {
          text: string;
          rel: string;
          url: string;
        };
      };
      published: string;
      summary: string;
      content: string;
    };
  }
  interface ArtistInfoLastFMApi {
    artist: LastFMArtistInfo[];
  }

  interface ArtistInfoFromDeezer extends OnlineArtistArtworks {
    id: number;
    name: string;
    link: string;
    picture: string;
    picture_big: string;
    picture_xl: string;
    nb_album: number;
    nb_fan: string;
    radio: boolean;
    tracklist: string;
    type: string;
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

  interface SearchResult {
    songs: SongData[];
    artists: Artist[];
    albums: Album[];
    playlists: Playlist[];
    genres: Genre[];
    availableResults: string[];
  }

  interface PromptMenuData {
    isVisible: boolean;
    content: ReactElement<any, any>;
    className: string;
  }
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

  interface AnyProp {
    currentSongData?: AudioData;
  }

  interface NavigationHistory {
    pageTitle: PageTitles;
    data?: any;
  }

  interface NavigationHistoryData {
    pageHistoryIndex: number;
    history: NavigationHistory[];
  }

  interface ContextMenuData {
    isVisible: boolean;
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
  }

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
    | 'preferences.doNotShowRemoveSongFromLibraryConfirm'
    | 'preferences.isReducedMotion'
    | 'preferences.songIndexing'
    | 'preferences.isMiniPlayerAlwaysOnTop'
    | 'preferences.doNotVerifyWhenOpeningLinks'
    | 'preferences.autoLaunchApp'
    | 'preferences.showSongRemainingTime'
    | 'preferences.noUpdateNotificationForNewUpdate'
    | 'songBlacklist'
    | PageSortTypes;

  type PageSortTypes =
    | 'sortingStates.songsPage'
    | 'sortingStates.artistsPage'
    | 'sortingStates.albumsPage'
    | 'sortingStates.artistsPage'
    | 'sortingStates.genresPage';

  type SongSortTypes =
    | 'aToZ'
    | 'zToA'
    | 'dateAddedAscending'
    | 'dateAddedDescending'
    | 'artistNameAscending'
    | 'artistNameDescending'
    | 'allTimeMostListened'
    | 'allTimeLeastListened'
    | 'monthlyMostListened'
    | 'monthlyLeastListened'
    | 'artistNameDescending'
    | 'albumNameAscending'
    | 'albumNameDescending';

  type ArtistSortTypes =
    | 'aToZ'
    | 'ZToA'
    | 'noOfSongsAscending'
    | 'noOfSongsDescending';

  type AlbumSortTypes =
    | 'aToZ'
    | 'ZToA'
    | 'noOfSongsAscending'
    | 'noOfSongsDescending';

  type GenreSortTypes =
    | 'aToZ'
    | 'zToA'
    | 'noOfSongsAscending'
    | 'noOfSongsDescending';

  type DefaultPages =
    | 'Songs'
    | 'Home'
    | 'Artists'
    | 'Albums'
    | 'Playlists'
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
    | 'CurrentQueue'
    | 'SongTagsEditor'
    | 'AllSearchResults';

  type SearchFilters =
    | 'All'
    | 'Artists'
    | 'Albums'
    | 'Songs'
    | 'Playlists'
    | 'Genres';

  type DataUpdateEventTypes =
    | 'songs'
    | 'songs/newSong'
    | 'songs/updatedSong'
    | 'songs/deletedSong'
    | 'songs/artworks'
    | 'songs/noOfListens'
    | 'songs/likes'
    | 'artists'
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
    | 'userData/blacklist'
    | 'userData/musicFolder'
    | 'userData/windowPosition'
    | 'userData/windowDiamension'
    | 'userData/recentSearches'
    | 'userData/sortingStates'
    | 'settings/preferences';

  type RepeatTypes = 'false' | 'repeat' | 'repeat-1';

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

  interface DataUpdateEvent {
    dataType: DataUpdateEventTypes;
    eventData: { id?: string; message?: string }[];
  }

  interface DataEvent extends Event {
    detail: DataUpdateEvent[];
  }

  interface NodeVibrantPalette {
    DarkMuted: NodeVibrantPaletteSwatch;
    DarkVibrant: NodeVibrantPaletteSwatch;
    LightMuted: NodeVibrantPaletteSwatch;
    LightVibrant: NodeVibrantPaletteSwatch;
    Muted: NodeVibrantPaletteSwatch;
    Vibrant: NodeVibrantPaletteSwatch;
  }
  interface NodeVibrantPaletteSwatch {
    _rgb: [number, number, number];
    _hsl?: [number, number, number];
    _hex?: string;
  }
  interface ArtistInfo extends Artist {
    artistPalette?: NodeVibrantPalette;
    artistBio?: string;
  }

  interface LastFMArtistDataApi {
    artist: {
      name: string;
      url: string;
      image: {
        '#text': string;
        size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega';
      }[];
      tags: {
        tag: {
          name: string;
        }[];
      };
      bio: {
        summary: string;
        content: string;
      };
    };
    error?: number;
    message?: string;
  }

  interface LastFMTrackInfoApi {
    track?: {
      name: string;
      url: string;
      duration: string;
      streamable: LastFMTrackStreamable;
      listeners: string;
      playcount: string;
      artist: LastFMTrackArtist;
      album: LastFMTrackAlbum;
      toptags: {
        tag: LastFMTrackTag[];
      };
      wiki?: LastFMTrackWiki;
    };
    message?: string;
    error?: number;
  }

  export interface LastFMTrackAlbum {
    artist: string;
    title: string;
    url: string;
    image: LastFMTrackAlbumImage[];
  }

  export interface LastFMTrackAlbumImage {
    '#text': string;
    size: string;
  }

  export interface LastFMTrackArtist {
    name: string;
    mbid?: string;
    url: string;
  }

  export interface LastFMTrackStreamable {
    '#text': string;
    fulltrack: string;
  }

  export interface LastFMTrackTag {
    name: string;
    url: string;
  }

  export interface LastFMTrackWiki {
    published: string;
    summary: string;
    content: string;
  }

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
    artworkPath: string;
  }

  interface NodeID3Tags extends NodeID3.Tags {
    image: string;
  }

  export interface Changelog {
    latestVersion: LatestAppVersion;
    versions: AppVersion[];
  }

  export interface LatestAppVersion {
    version: string;
    phase: string;
    releaseDate: string;
    artwork?: string;
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
    updatedData?: AudioData;
  }
}
