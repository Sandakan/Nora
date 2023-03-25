/* eslint-disable import/prefer-default-export */
import { createContext } from 'react';

export interface AppStateContextType {
  // THEME
  isDarkMode: boolean;
  // CONTEXT MENU
  contextMenuData: ContextMenuData;
  // PROMPT MENU
  PromptMenuData: {
    content: any;
    isVisible: boolean;
    className: string;
  };
  // NOTIFICATION PANEL
  notificationPanelData: NotificationPanelData;
  // CURRENTLY ACTVIE PAGE AND NAVIGATION HISTORY
  currentlyActivePage: { pageTitle: PageTitles; data?: any };
  pageHistoryIndex: number;
  noOfPagesInHistory: number;
  // AUDIO PLAYBACK
  currentSongData: AudioPlayerData;
  userData: UserData | undefined;
  isCurrentSongPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isRepeating: RepeatTypes;
  isShuffling: boolean;
  // LOCAL STORAGE
  localStorageData: LocalStorage;
  // QUEUE
  queue: Queue;
  // MULTIPLE SELECTIONS DATA
  multipleSelectionsData: MultipleSelectionData;
  isMultipleSelectionEnabled: boolean;
  // MINI PLAYER
  isMiniPlayer: boolean;
  // APP UPDATES DATA
  appUpdatesState: AppUpdatesState;
  // OTHER
  bodyBackgroundImage?: string;
  isPlayerStalled: boolean;
}

export const AppContext = createContext({} as AppStateContextType);
