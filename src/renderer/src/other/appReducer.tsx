import storage from '@renderer/utils/localStorage';
import { type ReactNode } from 'react';
import { normalizedKeys } from './appShortcuts';
import i18n from '@renderer/i18n';

export interface AppReducer {
  localStorage: LocalStorage;
  currentSongData: AudioPlayerData;
  upNextSongData?: AudioPlayerData;
  promptMenuNavigationData: PromptMenuNavigationHistoryData;
  promptMenuData: {
    prompt?: ReactNode;
    isVisible: boolean;
    className?: string;
    currentActiveIndex: number;
    noOfPrompts: number;
  };
  notificationPanelData: NotificationPanelData;
  contextMenuData: ContextMenuData;
  navigationHistory: NavigationHistoryData;
  currentlyActivePage: NavigationHistory;
  player: Player;
  bodyBackgroundImage?: string;
  multipleSelectionsData: MultipleSelectionData;
  appUpdatesState: AppUpdatesState;
  isOnBatteryPower: boolean;
  playerType: PlayerTypes;
}

export type AppReducerStateActions =
  | { type: 'START_PLAY_STATE_CHANGE'; data: unknown }
  | { type: 'CURRENT_SONG_DATA_CHANGE'; data: AudioPlayerData }
  | { type: 'UP_NEXT_SONG_DATA_CHANGE'; data?: AudioPlayerData }
  | { type: 'CURRENT_SONG_PLAYBACK_STATE'; data: boolean }
  | { type: 'PROMPT_MENU_DATA_CHANGE'; data: PromptMenuNavigationHistoryData }
  | { type: 'ADD_NEW_NOTIFICATIONS'; data: AppNotification[] }
  | { type: 'UPDATE_NOTIFICATIONS'; data: AppNotification[] }
  | { type: 'CONTEXT_MENU_DATA_CHANGE'; data: ContextMenuData }
  | { type: 'CONTEXT_MENU_VISIBILITY_CHANGE'; data: boolean }
  | { type: 'CURRENT_ACTIVE_PAGE_DATA_UPDATE'; data: PageData }
  | { type: 'UPDATE_NAVIGATION_HISTORY'; data: NavigationHistoryData }
  | { type: 'UPDATE_PLAYER_TYPE'; data: PlayerTypes }
  | {
      type: 'UPDATE_VOLUME';
      data: PlayerVolume;
    }
  | { type: 'UPDATE_MUTED_STATE'; data?: boolean }
  | { type: 'UPDATE_SONG_POSITION'; data: number }
  | { type: 'UPDATE_IS_REPEATING_STATE'; data: RepeatTypes }
  | { type: 'TOGGLE_IS_FAVORITE_STATE'; data?: boolean }
  | { type: 'TOGGLE_SHUFFLE_STATE'; data?: boolean }
  | { type: 'UPDATE_VOLUME_VALUE'; data: number }
  | { type: 'UPDATE_QUEUE'; data: PlayerQueueJson }
  | { type: 'UPDATE_QUEUE_CURRENT_SONG_INDEX'; data: number }
  | { type: 'TOGGLE_REDUCED_MOTION'; data?: boolean }
  | { type: 'TOGGLE_SONG_INDEXING'; data?: boolean }
  | { type: 'PLAYER_WAITING_STATUS'; data: boolean }
  | { type: 'UPDATE_BODY_BACKGROUND_IMAGE'; data?: string }
  | { type: 'UPDATE_MULTIPLE_SELECTIONS_DATA'; data: MultipleSelectionData }
  | { type: 'CHANGE_APP_UPDATES_DATA'; data: AppUpdatesState }
  | { type: 'UPDATE_LOCAL_STORAGE'; data: LocalStorage }
  | { type: 'UPDATE_BATTERY_POWER_STATE'; data: boolean }
  | { type: 'TOGGLE_SHOW_SONG_REMAINING_DURATION'; data?: boolean }
  | { type: 'UPDATE_LOCAL_STORAGE_PREFERENCES'; data: LocalStorage['preferences'] }
  | {
      type: 'UPDATE_LOCAL_STORAGE_PREFERENCE_ITEM';
      data: { item: string; value: LocalStorage['preferences'] };
    };

export const reducer = (state: AppReducer, action: AppReducerStateActions): AppReducer => {
  switch (action.type) {
    case 'TOGGLE_REDUCED_MOTION':
      return {
        ...state,
        localStorage: {
          ...state.localStorage,
          preferences: {
            ...state.localStorage.preferences,
            isReducedMotion: action.data ?? state.localStorage.preferences.isReducedMotion
          }
        }
      };
    case 'TOGGLE_SONG_INDEXING':
      return {
        ...state,
        localStorage: {
          ...state.localStorage,
          preferences: {
            ...state.localStorage.preferences,
            isSongIndexingEnabled:
              action.data ?? state.localStorage.preferences.isSongIndexingEnabled
          }
        }
      };
    case 'TOGGLE_SHOW_SONG_REMAINING_DURATION':
      return {
        ...state,
        localStorage: {
          ...state.localStorage,
          preferences: {
            ...state.localStorage.preferences,
            showSongRemainingTime:
              action.data ?? state.localStorage.preferences.showSongRemainingTime
          }
        }
      };
    case 'PROMPT_MENU_DATA_CHANGE': {
      const promptMenuNavigationData = action.data ? action.data : state.promptMenuNavigationData;

      const promptMenuData = {
        isVisible: promptMenuNavigationData?.isVisible,
        prompt: promptMenuNavigationData.prompts?.at(promptMenuNavigationData.currentActiveIndex)
          ?.prompt,
        className: promptMenuNavigationData.prompts?.at(promptMenuNavigationData.currentActiveIndex)
          ?.className,
        noOfPrompts: promptMenuNavigationData.prompts.length,
        currentActiveIndex: promptMenuNavigationData.currentActiveIndex
      };

      return {
        ...state,
        promptMenuNavigationData,
        promptMenuData
      };
    }
    case 'ADD_NEW_NOTIFICATIONS':
      return {
        ...state,
        notificationPanelData: {
          ...state.notificationPanelData,
          notifications: action.data || state.notificationPanelData.notifications
        }
      };
    case 'UPDATE_NOTIFICATIONS':
      return {
        ...state,
        notificationPanelData: {
          ...state.notificationPanelData,
          notifications: action.data || state.notificationPanelData.notifications
        }
      };
    case 'CONTEXT_MENU_DATA_CHANGE':
      return {
        ...state,
        contextMenuData: action.data || state.contextMenuData
      };
    case 'CONTEXT_MENU_VISIBILITY_CHANGE':
      return {
        ...state,
        contextMenuData: {
          ...state.contextMenuData,
          isVisible: action.data ?? state.contextMenuData.isVisible
        }
      };
    case 'CURRENT_ACTIVE_PAGE_DATA_UPDATE':
      state.navigationHistory.history[state.navigationHistory.pageHistoryIndex].data = action.data;
      return {
        ...state,
        navigationHistory: state.navigationHistory,
        currentlyActivePage:
          state.navigationHistory.history[state.navigationHistory.pageHistoryIndex]
      };
    case 'UPDATE_NAVIGATION_HISTORY': {
      const navigationHistory = { ...action.data };
      return {
        ...state,
        bodyBackgroundImage: undefined,
        navigationHistory,
        currentlyActivePage: navigationHistory.history[navigationHistory.pageHistoryIndex]
      };
    }
    case 'CURRENT_SONG_DATA_CHANGE':
      return {
        ...state,
        currentSongData:
          typeof action.data === 'object'
            ? (action.data as AudioPlayerData)
            : state.currentSongData,
        localStorage: {
          ...state.localStorage,
          playback: {
            ...state.localStorage.playback,
            currentSong: {
              ...state.localStorage.playback.currentSong,
              songId: action.data.songId ?? state.currentSongData.songId,
              stoppedPosition: 0
            }
          }
        }
      };
    case 'UP_NEXT_SONG_DATA_CHANGE':
      return {
        ...state,
        upNextSongData: action.data ?? state.upNextSongData
      };
    case 'CURRENT_SONG_PLAYBACK_STATE': {
      return {
        ...state,
        player: {
          ...state.player,
          isCurrentSongPlaying: action.data ?? !state.player.isCurrentSongPlaying
          // isPlayerStalled: action.data ? false : state.player.isPlayerStalled
        }
      };
    }
    case 'UPDATE_PLAYER_TYPE': {
      const type = action.data ?? state.playerType;

      if (type !== 'full') window.api.windowControls.changePlayerType(type);

      return {
        ...state,
        bodyBackgroundImage: undefined,
        playerType: type
      };
    }
    case 'UPDATE_SONG_POSITION':
      return {
        ...state,
        player: {
          ...state.player,
          songPosition: action.data ?? state.player.songPosition
        }
      };
    case 'UPDATE_IS_REPEATING_STATE': {
      const isRepeating = action.data ?? state.player.isRepeating;
      return {
        ...state,
        player: {
          ...state.player,
          isRepeating
        },
        localStorage: {
          ...state.localStorage,
          playback: {
            ...state.localStorage.playback,
            isRepeating
          }
        }
      };
    }
    case 'TOGGLE_IS_FAVORITE_STATE':
      return {
        ...state,
        currentSongData: {
          ...state.currentSongData,
          isAFavorite: action.data ?? !state.currentSongData.isAFavorite
        }
      };
    case 'TOGGLE_SHUFFLE_STATE': {
      const isShuffling = action.data ?? !state.player.isShuffling;
      return {
        ...state,
        player: {
          ...state.player,
          isShuffling
        },
        localStorage: {
          ...state.localStorage,
          playback: {
            ...state.localStorage.playback,
            isShuffling
          }
        }
      };
    }
    case 'UPDATE_VOLUME': {
      const volume = action.data ?? state.player.volume;
      return {
        ...state,
        player: {
          ...state.player,
          volume
        },
        localStorage: {
          ...state.localStorage,
          playback: {
            ...state.localStorage.playback,
            volume
          }
        }
      };
    }
    case 'UPDATE_VOLUME_VALUE': {
      const volume = action.data ?? state.player.volume.value;
      return {
        ...state,
        player: {
          ...state.player,
          volume: {
            value: volume,
            isMuted: volume === 0
          }
        }
      };
    }
    case 'UPDATE_MUTED_STATE': {
      const isMuted = action.data ?? state.player.volume.isMuted;
      return {
        ...state,
        player: {
          ...state.player,
          volume: {
            ...state.player.volume,
            isMuted
          }
        },
        localStorage: {
          ...state.localStorage,
          playback: {
            ...state.localStorage.playback,
            volume: {
              ...state.localStorage.playback.volume,
              isMuted
            }
          }
        }
      };
    }
    case 'UPDATE_QUEUE':
      return {
        ...state,
        localStorage: {
          ...state.localStorage,
          queue: action.data ?? state.localStorage.queue
        }
      };
    case 'UPDATE_BODY_BACKGROUND_IMAGE':
      return {
        ...state,
        bodyBackgroundImage: action.data ?? state.bodyBackgroundImage
      };
    case 'UPDATE_MULTIPLE_SELECTIONS_DATA':
      return {
        ...state,
        multipleSelectionsData: action.data ?? state.multipleSelectionsData
      };
    case 'CHANGE_APP_UPDATES_DATA':
      return {
        ...state,
        appUpdatesState: action.data ?? state.appUpdatesState
      };
    case 'PLAYER_WAITING_STATUS':
      return {
        ...state,
        player: {
          ...state.player,
          isPlayerStalled: action.data ?? state.player.isPlayerStalled
        }
      };
    // ####### LOCAL STORAGE ENTRIES #######
    case 'UPDATE_LOCAL_STORAGE':
      return {
        ...state,
        localStorage: typeof action.data === 'object' ? action.data : state.localStorage
      };
    case 'UPDATE_LOCAL_STORAGE_PREFERENCES':
      return {
        ...state,
        localStorage: {
          ...state.localStorage,
          preferences:
            typeof action.data === 'object' ? action.data : state.localStorage.preferences
        }
      };
    // #####################################
    case 'UPDATE_BATTERY_POWER_STATE':
      return {
        ...state,
        isOnBatteryPower: action.data ?? state.isOnBatteryPower
      };
    default:
      return state;
  }
};

export const LOCAL_STORAGE_DEFAULT_TEMPLATE: LocalStorage = {
  preferences: {
    seekbarScrollInterval: 5,
    isSongIndexingEnabled: false,
    disableBackgroundArtworks: true,
    doNotShowBlacklistSongConfirm: false,
    doNotVerifyWhenOpeningLinks: false,
    isReducedMotion: false,
    showArtistArtworkNearSongControls: false,
    showSongRemainingTime: false,
    noUpdateNotificationForNewUpdate: '',
    defaultPageOnStartUp: 'Home',
    enableArtworkFromSongCovers: false,
    shuffleArtworkFromSongCovers: false,
    removeAnimationsOnBatteryPower: false,
    isSimilaritySearchEnabled: true,
    lyricsAutomaticallySaveState: 'NONE',
    showTrackNumberAsSongIndex: true,
    allowToPreventScreenSleeping: true,
    enableImageBasedDynamicThemes: false,
    doNotShowHelpPageOnLyricsEditorStartUp: false,
    autoTranslateLyrics: false,
    autoConvertLyrics: false
  },
  playback: {
    currentSong: {
      songId: null,
      stoppedPosition: 0
    },
    isRepeating: 'false',
    isShuffling: false,
    volume: {
      isMuted: false,
      value: 50
    },
    playbackRate: 1.0
  },
  queue: { position: 0, songIds: [] },
  ignoredSeparateArtists: [],
  ignoredSongsWithFeatArtists: [],
  ignoredDuplicates: {
    albums: [],
    artists: [],
    genres: []
  },
  sortingStates: {
    albumsPage: 'aToZ',
    artistsPage: 'aToZ',
    genresPage: 'aToZ',
    playlistsPage: 'aToZ',
    songsPage: 'aToZ',
    musicFoldersPage: 'aToZ'
  },
  equalizerPreset: {
    thirtyTwoHertzFilter: 0,
    sixtyFourHertzFilter: 0,
    hundredTwentyFiveHertzFilter: 0,
    twoHundredFiftyHertzFilter: 0,
    fiveHundredHertzFilter: 0,
    thousandHertzFilter: 0,
    twoThousandHertzFilter: 0,
    fourThousandHertzFilter: 0,
    eightThousandHertzFilter: 0,
    sixteenThousandHertzFilter: 0
  },
  lyricsEditorSettings: {
    offset: 0,
    editNextAndCurrentStartAndEndTagsAutomatically: true
  },
  keyboardShortcuts: [
    {
      shortcutCategoryTitle: i18n.t('appShortcutsPrompt.mediaPlayback'),
      shortcuts: [
        {
          label: i18n.t('appShortcutsPrompt.playPause'),
          keys: [normalizedKeys.spaceKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.toggleMute'),
          keys: [normalizedKeys.ctrlKey, 'M']
        },
        {
          label: i18n.t('appShortcutsPrompt.nextSong'),
          keys: [normalizedKeys.ctrlKey, normalizedKeys.rightArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.prevSong'),
          keys: [normalizedKeys.ctrlKey, normalizedKeys.leftArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.tenSecondsForward'),
          keys: [normalizedKeys.shiftKey, normalizedKeys.rightArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.tenSecondsBackward'),
          keys: [normalizedKeys.shiftKey, normalizedKeys.leftArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.upVolume'),
          keys: [normalizedKeys.ctrlKey, normalizedKeys.upArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.downVolume'),
          keys: [normalizedKeys.ctrlKey, normalizedKeys.downArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.toggleShuffle'),
          keys: [normalizedKeys.ctrlKey, 'S']
        },
        {
          label: i18n.t('appShortcutsPrompt.toggleRepeat'),
          keys: [normalizedKeys.ctrlKey, 'T']
        },
        {
          label: i18n.t('appShortcutsPrompt.toggleFavorite'),
          keys: [normalizedKeys.ctrlKey, 'H']
        },
        {
          label: i18n.t('appShortcutsPrompt.upPlaybackRate'),
          keys: [normalizedKeys.ctrlKey, ']']
        },
        {
          label: i18n.t('appShortcutsPrompt.downPlaybackRate'),
          keys: [normalizedKeys.ctrlKey, '[']
        },
        {
          label: i18n.t('appShortcutsPrompt.resetPlaybackRate'),
          keys: [normalizedKeys.ctrlKey, '\\']
        },
        {
          label: i18n.t('appShortcutsPrompt.openAppShortcutsPrompt'),
          keys: [normalizedKeys.ctrlKey, '/']
        }
      ]
    },
    {
      shortcutCategoryTitle: i18n.t('appShortcutsPrompt.navigation'),
      shortcuts: [
        {
          label: i18n.t('appShortcutsPrompt.goHome'),
          keys: [normalizedKeys.altKey, normalizedKeys.homeKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.goBack'),
          keys: [normalizedKeys.altKey, normalizedKeys.leftArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.goForward'),
          keys: [normalizedKeys.altKey, normalizedKeys.rightArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.openMiniPlayer'),
          keys: [normalizedKeys.ctrlKey, 'N']
        },
        {
          label: i18n.t('appShortcutsPrompt.goToLyrics'),
          keys: [normalizedKeys.ctrlKey, 'L']
        },
        {
          label: i18n.t('appShortcutsPrompt.goToQueue'),
          keys: [normalizedKeys.ctrlKey, 'Q']
        },
        {
          label: i18n.t('appShortcutsPrompt.goToSearch'),
          keys: [normalizedKeys.ctrlKey, 'F']
        }
      ]
    },
    {
      shortcutCategoryTitle: i18n.t('appShortcutsPrompt.selections'),
      shortcuts: [
        {
          label: i18n.t('appShortcutsPrompt.selectMultipleItems'),
          keys: [normalizedKeys.shiftKey, normalizedKeys.mouseClick]
        }
      ]
    },
    {
      shortcutCategoryTitle: i18n.t('appShortcutsPrompt.lyrics'),
      shortcuts: [
        {
          label: i18n.t('appShortcutsPrompt.playNextLyricsLine'),
          keys: [normalizedKeys.altKey, normalizedKeys.downArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.playPrevLyricsLine'),
          keys: [normalizedKeys.altKey, normalizedKeys.upArrowKey]
        }
      ]
    },
    {
      shortcutCategoryTitle: i18n.t('appShortcutsPrompt.lyricsEditor'),
      shortcuts: [
        {
          label: i18n.t('appShortcutsPrompt.selectNextLyricsLine'),
          keys: [normalizedKeys.enterKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.selectPrevLyricsLine'),
          keys: [normalizedKeys.shiftKey, normalizedKeys.enterKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.selectCustomLyricsLine'),
          keys: [normalizedKeys.doubleClick]
        }
      ]
    },
    {
      shortcutCategoryTitle: i18n.t('appShortcutsPrompt.otherShortcuts'),
      shortcuts: [
        {
          label: i18n.t('appShortcutsPrompt.toggleTheme'),
          keys: [normalizedKeys.ctrlKey, 'Y']
        },
        {
          label: i18n.t('appShortcutsPrompt.toggleMiniPlayerAlwaysOnTop'),
          keys: [normalizedKeys.ctrlKey, 'O']
        },
        {
          label: i18n.t('appShortcutsPrompt.reload'),
          keys: [normalizedKeys.ctrlKey, 'R']
        },
        {
          label: i18n.t('appShortcutsPrompt.openDevtools'),
          keys: ['F12']
        }
      ]
    }
  ]
} satisfies LocalStorage;

export const USER_DATA_TEMPLATE: UserData = {
  language: 'en',
  autoLaunchApp: false,
  isMiniPlayerAlwaysOnTop: false,
  isMusixmatchLyricsEnabled: false,
  hideWindowOnClose: false,
  openWindowAsHiddenOnSystemStart: false,
  openWindowMaximizedOnStart: false,
  sendSongScrobblingDataToLastFM: false,
  sendSongFavoritesDataToLastFM: false,
  sendNowPlayingSongDataToLastFM: false,
  saveLyricsInLrcFilesForSupportedSongs: false,
  enableDiscordRPC: false,
  saveVerboseLogs: false,
  customLrcFilesSaveLocation: null,
  isDarkMode: false,
  useSystemTheme: true,
  lastFmSessionKey: null,
  lastFmSessionName: null,
  mainWindowX: null,
  mainWindowY: null,
  mainWindowWidth: null,
  mainWindowHeight: null,
  miniPlayerX: null,
  miniPlayerY: null,
  miniPlayerWidth: null,
  miniPlayerHeight: null,
  recentSearches: [],
  windowState: 'normal'
};

const localStorage = storage.getLocalStorage();

export const DEFAULT_REDUCER_DATA: AppReducer = {
  playerType: 'normal',
  player: {
    isCurrentSongPlaying: false,
    volume: localStorage.playback.volume,
    isRepeating: localStorage.playback.isRepeating,
    isShuffling: localStorage.playback.isShuffling,
    songPosition: 0,
    isPlayerStalled: false,
    playbackRate: localStorage.playback.playbackRate
  },
  currentSongData: {} as AudioPlayerData,
  upNextSongData: {} as AudioPlayerData,
  localStorage,
  navigationHistory: {
    pageHistoryIndex: 0,
    history: [
      {
        pageTitle: 'Home',
        data: undefined
      }
    ]
  },
  currentlyActivePage: {
    pageTitle: 'Home',
    data: undefined
  },
  contextMenuData: {
    isVisible: false,
    menuItems: [],
    pageX: 200,
    pageY: 200
  },
  notificationPanelData: {
    notifications: []
    // notificationsMap: new Map()
  },
  promptMenuNavigationData: {
    isVisible: false,
    prompts: [],
    currentActiveIndex: 0
  },
  promptMenuData: {
    isVisible: false,
    prompt: undefined,
    className: undefined,
    currentActiveIndex: 0,
    noOfPrompts: 0
  },
  multipleSelectionsData: { isEnabled: false, multipleSelections: [] },
  appUpdatesState: 'UNKNOWN',
  isOnBatteryPower: false
};

export default reducer;
