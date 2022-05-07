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
    artists: string[];
    album?: string;
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
    artists: string[];
    duration: number;
    artwork?: string;
    artworkPath?: string;
    path: string;
    songId: string;
    isAFavorite: boolean;
    album?: string;
  }

  interface AudioInfo {
    title: string;
    artists: string[];
    duration: number;
    artworkPath?: string;
    path: string;
    songId: string;
    modifiedDate?: string;
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
    // queue: QueuedSong[];
    queue: string[];
  }

  interface QueuedSong {
    title: string;
    artists: string[];
    path: string;
    artworkPath: string;
    duration: number;
    songId: string;
  }

  interface UserData {
    theme: {
      isDarkMode: boolean;
    };
    currentSong: {
      songId: string | null;
      stoppedPosition: number;
    };
    volume: {
      isMuted: boolean;
      value: number;
    };
    playlist: Playlist | null;
    recentlyPlayedSongs: SongData[];
    musicFolders: MusicFolderData[];
    defaultPage: 'Home' | 'Songs';
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
    artists: string[];
    // artists: {
    //   name: string;
    //   artistId: string;
    // }[];
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
  }

  interface LogData {
    logs: {
      time: Date | string;
      error: {
        name: string;
        message: string;
        stack: string | undefined;
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

  interface ArtistInfoFromNet {
    id: number;
    name: string;
    link: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
    picture_big: string;
    picture_xl: string;
    nb_album: number;
    nb_fan: string;
    radio: boolean;
    tracklist: string;
    type: string;
    artistPalette?: NodeVibrantPalette;
    artistBio?: string;
  }

  interface SearchResult {
    songs: SongData[];
    artists: Artist[];
    albums: Album[];
  }

  interface PromptMenuData {
    isVisible: boolean;
    content: ReactElement<any, any>;
    className: string;
  }
  interface DialogMenuData {
    isVisible: boolean;
    content: ReactElement<any, any>;
  }

  interface AnyProp {
    currentSongData?: AudioData;
  }

  interface ContextMenuItem {
    label: string;
    class?: string;
    iconName?: string;
    handlerFunction: () => void;
  }
  type UserDataType =
    | 'theme.isDarkMode'
    | 'currentSong.songId'
    | 'currentSong.stoppedPosition'
    | 'volume.value'
    | 'volume.isMuted'
    | 'recentlyPlayedSongs'
    | 'musicFolders';

  type SongsPageSortTypes =
    | 'aToZ'
    | 'zToA'
    | 'dateAddedAscending'
    | 'dateAddedDescending'
    | 'artistNameAscending'
    | 'artistNameDescending'
    | 'albumNameAscending'
    | 'albumNameDescending';

  type ArtistSortTypes = 'aToZ' | 'noOfSongs';

  type AlbumSortTypes = 'aToZ' | 'noOfSongs';

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
}
