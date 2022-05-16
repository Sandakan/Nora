/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/prefer-default-export */
import { createContext, ReactElement } from 'react';

interface AppContextType {
  toggleDarkMode: (theme?: 'dark' | 'light') => void;
  isDarkMode: boolean;
  isContextMenuVisible: boolean;
  contextMenuItems: ContextMenuItem[];
  contextMenuPageX: number;
  contextMenuPageY: number;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems?: ContextMenuItem[],
    pageX?: number,
    pageY?: number
  ) => void;
  PromptMenuData: {
    content: any;
    isVisible: boolean;
    className: string;
  };
  changePromptMenuData: (
    isVisible: boolean,
    content?: ReactElement<any, any>,
    className?: string
  ) => void;
  playSong: (songId: string, isStartPlay?: boolean) => void;
  currentSongData: AudioData;
  changeCurrentActivePage: (pageTitle: PageTitles, data?: any) => void;
  currentlyActivePage: { pageTitle: PageTitles; data?: any };
  notificationPanelData: NotificationPanelData;
  updateNotificationPanelData: (
    delay: number | undefined,
    content: ReactElement<any, any>
  ) => void;
  userData: UserData | undefined;
  isStartPlay: boolean;
  createQueue: (
    songIds: string[],
    playlistId?: string,
    startPlaying?: boolean
  ) => void;
  queue: Queue;
  updateQueueData: (
    currentSongIndex?: number,
    queue?: string[],
    playCurrentSongIndex?: boolean
  ) => void;
  changeQueueCurrentSongIndex: (currentSongIndex: number) => void;
  updateCurrentSongPlaybackState: (isPlaying: boolean) => void;
  isCurrentSongPlaying: boolean;
  pageHistoryIndex: number;
  updatePageHistoryIndex: (
    type: 'increment' | 'decrement',
    index?: number
  ) => void;
  updateMiniPlayerStatus: (isVisible: boolean) => void;
  isMiniPlayer: boolean;
  handleSkipBackwardClick: () => void;
  handleSkipForwardClick: () => void;
  songPosition: number;
  volume: number;
  isMuted: boolean;
  isRepeating: boolean;
  isShuffling: boolean;
  toggleSongPlayback: () => void;
  toggleRepeat: () => void;
  toggleIsFavorite: (isFavorite: boolean) => void;
  toggleMutedState: (isMuted?: boolean) => void;
  updateVolume: (volume: number) => void;
  updateSongPosition: (position: number) => void;
  isPlaying: boolean;
}

export const AppContext = createContext({} as AppContextType);
