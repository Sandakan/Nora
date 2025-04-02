import { createContext, type ReactNode } from 'react';

export interface AppUpdateContextType {
  updateUserData: (callback: (prevState: UserData) => UserData | Promise<UserData> | void) => void;
  updateCurrentSongData: (callback: (prevState: AudioPlayerData) => AudioPlayerData) => void;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems?: ContextMenuItem[],
    pageX?: number,
    pageY?: number,
    contextMenuData?: ContextMenuAdditionalData
  ) => void;
  changePromptMenuData: (isVisible: boolean, content?: ReactNode, className?: string) => void;
  changeUpNextSongData: (upNextSongData?: AudioPlayerData) => void;
  updatePromptMenuHistoryIndex: (
    type: 'increment' | 'decrement' | 'home',
    promptIndex?: number
  ) => void;
  addNewNotifications: (newNotifications: AppNotification[]) => void;
  updateNotifications: (
    callback: (currentNotifications: AppNotification[]) => AppNotification[]
  ) => void;
  changeCurrentActivePage: (pageTitle: PageTitles, data?: PageData) => void;
  updatePageHistoryIndex: (type: 'increment' | 'decrement' | 'home', pageIndex?: number) => void;
  updateCurrentlyActivePageData: (callback: (currentPageData: PageData) => PageData) => void;
  playSong: (songId: string, isStartPlay?: boolean) => void;
  updateCurrentSongPlaybackState: (isPlaying: boolean) => void;
  handleSkipBackwardClick: () => void;
  handleSkipForwardClick: (reason: SongSkipReason) => void;
  toggleShuffling: (isShuffling?: boolean) => void;
  toggleSongPlayback: () => void;
  toggleRepeat: (newState?: RepeatTypes) => void;
  toggleIsFavorite: (isFavorite: boolean, onlyChangeCurrentSongData?: boolean) => void;
  toggleMutedState: (isMuted?: boolean) => void;
  updateVolume: (volume: number) => void;
  updateSongPosition: (position: number) => void;
  updateEqualizerOptions: (options: Equalizer) => void;
  createQueue: (
    songIds: string[],
    queueType: QueueTypes,
    isShuffleQueue?: boolean,
    queueId?: string,
    startPlaying?: boolean
  ) => void;
  updateQueueData: (
    currentSongIndex?: number,
    queue?: string[],
    isShuffleQueue?: boolean,
    playCurrentSongIndex?: boolean,
    restoreAndClearPreviousQueue?: boolean
  ) => void;
  changeQueueCurrentSongIndex: (currentSongIndex: number) => void;
  updatePlayerType: (type: PlayerTypes) => void;
  clearAudioPlayerData: () => void;
  updateBodyBackgroundImage: (isVisible: boolean, src?: string) => void;
  updateMultipleSelections: (id: string, selectionType: QueueTypes, type: 'add' | 'remove') => void;
  toggleMultipleSelections: (
    isEnabled?: boolean,
    selectionType?: QueueTypes,
    addSelections?: string[],
    replaceSelections?: boolean
  ) => void;
  updateAppUpdatesState: (state: AppUpdatesState) => void;
}

export const AppUpdateContext = createContext({} as AppUpdateContextType);
