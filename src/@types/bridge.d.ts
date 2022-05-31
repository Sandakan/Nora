/* eslint-disable @typescript-eslint/no-explicit-any */
import * as musicMetaData from 'music-metadata';
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
    albumArtist?: string;
    format?: musicMetaData.IFormat;
    track: unknown;
    year?: number;
    sampleRate: number | undefined;
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
    albumId?: string;
    artistsId?: string[];
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
    isRepeating: boolean;
    recentlyPlayedSongs: SongData[];
    musicFolders: MusicFolderData[];
    defaultPage: DefaultPages;
    songBlacklist: string[];
    preferences: {
      doNotShowRemoveSongFromLibraryConfirm: boolean;
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

  interface LogData {
    logs: {
      time: Date | string;
      error: {
        name: string;
        message: string;
        stack?: string;
      };
    }[];
  }
  interface Lyrics {
    lyrics: string;
    source: {
      name: string;
      url: string;
      link: string;
    };
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

  type DefaultPages =
    | 'Songs'
    | 'Home'
    | 'Artists'
    | 'Albums'
    | 'Playlists'
    | 'Search';

  type PageTitles =
    | DefaultPages
    | 'Search'
    | 'Settings'
    | 'Lyrics'
    | 'SongInfo'
    | 'ArtistInfo'
    | 'AlbumInfo'
    | 'PlaylistInfo'
    | 'CurrentQueue'
    | 'AllSearchResults';

  type SearchFilters = 'All' | 'Artists' | 'Albums' | 'Songs' | 'Playlists';

  type DataUpdateEventTypes =
    | 'songs'
    | 'artists'
    | 'albums'
    | 'playlists'
    | 'userData';

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

  interface LogsData {
    os: {
      architecture: string;
      cpu: string;
      platform: NodeJS.Platform;
      os: string;
      totalMemory: number;
    };
    logs: Error[];
  }
}
