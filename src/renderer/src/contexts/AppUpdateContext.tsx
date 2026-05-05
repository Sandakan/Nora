import { createContext, type ReactNode } from 'react';

export interface AppUpdateContextType {
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
  playSong: (songId: number, isStartPlay?: boolean) => void;
  updateCurrentSongPlaybackState: (isPlaying: boolean) => void;
  handleSkipBackwardClick: () => void;
  handleSkipForwardClick: (reason: SongSkipReason) => void;
  toggleShuffling: (isShuffling?: boolean) => void;
  toggleQueueShuffle: () => void;
  toggleSongPlayback: () => void;
  toggleRepeat: (newState?: RepeatTypes) => void;
  toggleIsFavorite: (isFavorite: boolean, onlyChangeCurrentSongData?: boolean) => void;
  toggleMutedState: (isMuted?: boolean) => void;
  updateVolume: (volume: number) => void;
  updateSongPosition: (position: number) => void;
  updateEqualizerOptions: (options: Equalizer) => void;
  createQueue: (
    songIds: number[],
    queueType: QueueTypes,
    isShuffleQueue?: boolean,
    queueId?: string | number,
    startPlaying?: boolean
  ) => void;
  updateQueueData: (
    currentSongIndex?: number,
    queue?: number[],
    isShuffleQueue?: boolean,
    playCurrentSongIndex?: boolean,
    restoreAndClearPreviousQueue?: boolean
  ) => void;
  changeQueueCurrentSongIndex: (currentSongIndex: number) => void;
  updatePlayerType: (type: PlayerTypes) => void;
  clearAudioPlayerData: () => void;
  updateBodyBackgroundImage: (isVisible: boolean, src?: string) => void;
  updateMultipleSelections: (id: number, selectionType: QueueTypes, type: 'add' | 'remove') => void;
  toggleMultipleSelections: (
    isEnabled?: boolean,
    selectionType?: QueueTypes,
    addSelections?: number[],
    replaceSelections?: boolean
  ) => void;
  updateAppUpdatesState: (state: AppUpdatesState) => void;
}

export const AppUpdateContext = createContext({} as AppUpdateContextType);
