import { type ReactNode, createContext } from 'react';

export interface AppStateContextType {
  // THEME
  isDarkMode: boolean;
  // CONTEXT MENU
  contextMenuData: ContextMenuData;
  // PROMPT MENU
  promptMenuData: {
    prompt?: ReactNode;
    isVisible: boolean;
    className?: string;
    currentActiveIndex: number;
    noOfPrompts: number;
  };
  // NOTIFICATION PANEL
  notificationPanelData: NotificationPanelData;
  // CURRENTLY ACTVIE PAGE AND NAVIGATION HISTORY
  currentlyActivePage: {
    pageTitle: PageTitles;
    data?: unknown;
  };
  pageHistoryIndex: number;
  noOfPagesInHistory: number;
  // AUDIO PLAYBACK
  currentSongData: AudioPlayerData;
  upNextSongData?: AudioPlayerData;
  userData: UserData | undefined;
  isCurrentSongPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isRepeating: RepeatTypes;
  isShuffling: boolean;
  equalizerOptions: Equalizer;
  // LOCAL STORAGE
  localStorageData: LocalStorage;
  // QUEUE
  queue: Queue;
  // MULTIPLE SELECTIONS DATA
  multipleSelectionsData: MultipleSelectionData;
  isMultipleSelectionEnabled: boolean;
  // MINI PLAYER
  // isMiniPlayer: boolean;
  // APP UPDATES DATA
  appUpdatesState: AppUpdatesState;
  // OTHER
  bodyBackgroundImage?: string;
  isPlayerStalled: boolean;
  playerType: PlayerTypes;
}

export const AppContext = createContext({} as AppStateContextType);
