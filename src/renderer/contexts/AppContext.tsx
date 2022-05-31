/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/prefer-default-export */
import { createContext, ReactElement } from 'react';

interface AppContextType {
  // THEME
  isDarkMode: boolean;
  toggleDarkMode: (theme?: 'dark' | 'light') => void;
  // CONTEXT MENU
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
  // PROMPT MENU
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
  // NOTIFICATION PANEL
  notificationPanelData: NotificationPanelData;
  updateNotificationPanelData: (
    delay: number | undefined,
    content: ReactElement<any, any>,
    icon?: ReactElement<any, any>
  ) => void;
  // CURRENTLY ACTVIE PAGE AND NAVIGATION HISTORY
  currentlyActivePage: { pageTitle: PageTitles; data?: any };
  pageHistoryIndex: number;
  changeCurrentActivePage: (pageTitle: PageTitles, data?: any) => void;
  updatePageHistoryIndex: (
    type: 'increment' | 'decrement',
    index?: number
  ) => void;
  updateCurrentlyActivePageData: (data: any) => void;
  // AUDIO PLAYBACK
  currentSongData: AudioData;
  userData: UserData | undefined;
  isCurrentSongPlaying: boolean;
  // songPosition: number;
  volume: number;
  isMuted: boolean;
  isRepeating: boolean;
  isShuffling: boolean;
  playSong: (songId: string, isStartPlay?: boolean) => void;
  updateCurrentSongPlaybackState: (isPlaying: boolean) => void;
  handleSkipBackwardClick: () => void;
  handleSkipForwardClick: () => void;
  toggleShuffling: (isShuffling?: boolean) => void;
  toggleSongPlayback: () => void;
  toggleRepeat: () => void;
  toggleIsFavorite: (isFavorite: boolean) => void;
  toggleMutedState: (isMuted?: boolean) => void;
  updateVolume: (volume: number) => void;
  updateSongPosition: (position: number) => void;
  isPlaying: boolean;
  // QUEUE
  queue: Queue;
  createQueue: (
    songIds: string[],
    queueType: QueueTypes,
    queueId?: string,
    startPlaying?: boolean
  ) => void;
  updateQueueData: (
    currentSongIndex?: number,
    queue?: string[],
    playCurrentSongIndex?: boolean
  ) => void;
  changeQueueCurrentSongIndex: (currentSongIndex: number) => void;
  // MINI PLAYER
  isMiniPlayer: boolean;
  updateMiniPlayerStatus: (isVisible: boolean) => void;
}

interface SongPositionContextType {
  songPosition: number;
}

export const AppContext = createContext({} as AppContextType);

export const SongPositionContext = createContext({} as SongPositionContextType);
