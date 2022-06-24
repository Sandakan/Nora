/* eslint-disable @typescript-eslint/no-explicit-any */
import * as musicMetaData from 'music-metadata';
import NodeID3 from 'node-id3';
import { ReactElement } from 'react';
import { api } from '../main/preload';

declare global {
  interface Window {
    api: typeof api;
  }
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
    folderInfo: {
      name: string;
      path: string;
    };
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

  interface AudioInfo {
    title: string;
    artists?: { artistId: string; name: string }[];
    duration: number;
    artworkPath?: string;
    path: string;
    songId: string;
    addedDate: string;
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
    recentlyPlayedSongs: SongData[];
    musicFolders: MusicFolderData[];
    defaultPage: DefaultPages;
    songBlacklist: string[];
    preferences: {
      doNotShowRemoveSongFromLibraryConfirm: boolean;
      isReducedMotion: boolean;
      songIndexing: boolean;
      autoLaunchApp: boolean;
    };
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
    artworkPath: string | undefined;
    songs: {
      title: string;
      songId: string;
    }[];
    year: number | undefined;
  }

  interface Artist {
    artistId: string;
    songs: {
      title: string;
      songId: string;
    }[];
    albums: {
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
    sortType: SongsPageSortTypes;
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
  }

  interface PromptMenuData {
    isVisible: boolean;
    content: ReactElement<any, any>;
    className: string;
  }
  interface NotificationPanelData {
    isVisible: boolean;
    content: ReactElement<any, any>;
    icon?: ReactElement<any, any>;
    isLoading: boolean;
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
    isContextMenuItemSeperator?: boolean;
    handlerFunction: () => void;
  }
  type UserDataTypes =
    | 'theme.isDarkMode'
    | 'currentSong.songId'
    | 'currentSong.stoppedPosition'
    | 'volume.value'
    | 'volume.isMuted'
    | 'recentlyPlayedSongs'
    | 'musicFolders'
    | 'defaultPage'
    | 'queue'
    | 'isShuffling'
    | 'isRepeating'
    | 'preferences.doNotShowRemoveSongFromLibraryConfirm'
    | 'preferences.isReducedMotion'
    | 'preferences.songIndexing'
    | 'preferences.autoLaunchApp'
    | 'songBlacklist';

  type SongsPageSortTypes =
    | 'aToZ'
    | 'zToA'
    | 'dateAddedAscending'
    | 'dateAddedDescending'
    | 'artistNameAscending'
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

  type SearchFilters = 'All' | 'Artists' | 'Albums' | 'Songs' | 'Playlists';

  type DataUpdateEventTypes =
    | 'songs'
    | 'songs/newSong'
    | 'songs/deletedSong'
    | 'songs/artworks'
    | 'songs/noOfListens'
    | 'songs/likes'
    | 'artists'
    | 'artists/artworks'
    | 'albums'
    | 'genres'
    | 'playlists'
    | 'userData'
    | 'userData/theme'
    | 'userData/currentSong'
    | 'userData/recentlyPlayedSongs'
    | 'userData/volume'
    | 'userData/queue'
    | 'userData/blacklist'
    | 'userData/musicFolder'
    | 'settings/preferences';

  type RepeatTypes = 'false' | 'repeat' | 'repeat-1';

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

  interface SongId3Tags {
    title: string;
    artist?: string;
    artwork?: {
      mimeType: string;
      type: { id: number; name: string };
      description: string;
      imageBuffer: Buffer;
    };
    year?: string;
    album?: string;
    genres?: string;
    unsynchronisedLyrics?: {
      language: string;
      shortText?: string;
      text: string;
    };
    composer?: string;
    publisher?: string;
  }

  interface NodeID3Tags extends NodeID3.Tags {
    image: string;
  }
}
