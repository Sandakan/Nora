import { LOCAL_STORAGE_DEFAULT_TEMPLATE } from '../utils/localStorage';

export interface AppReducer {
  userData: UserData;
  isDarkMode: boolean;
  localStorage: LocalStorage;
  currentSongData: AudioPlayerData;
  promptMenuData: PromptMenuData;
  notificationPanelData: NotificationPanelData;
  contextMenuData: ContextMenuData;
  navigationHistory: NavigationHistoryData;
  player: Player;
  bodyBackgroundImage?: string;
  multipleSelectionsData: MultipleSelectionData;
  appUpdatesState: AppUpdatesState;
  isOnBatteryPower: boolean;
}

type AppReducerStateActions =
  | { type: 'USER_DATA_CHANGE'; data: UserData }
  | { type: 'START_PLAY_STATE_CHANGE'; data: unknown }
  | {
      type: 'APP_THEME_CHANGE';
      data: AppThemeData;
    }
  | { type: 'CURRENT_SONG_DATA_CHANGE'; data: AudioPlayerData | {} }
  | { type: 'CURRENT_SONG_PLAYBACK_STATE'; data: boolean }
  | { type: 'PROMPT_MENU_DATA_CHANGE'; data: PromptMenuData }
  | { type: 'ADD_NEW_NOTIFICATIONS'; data: AppNotification[] }
  | { type: 'UPDATE_NOTIFICATIONS'; data: AppNotification[] }
  | { type: 'CONTEXT_MENU_DATA_CHANGE'; data: ContextMenuData }
  | { type: 'CONTEXT_MENU_VISIBILITY_CHANGE'; data: boolean }
  | { type: 'CURRENT_ACTIVE_PAGE_DATA_UPDATE'; data: PageData }
  | { type: 'UPDATE_NAVIGATION_HISTORY'; data: NavigationHistoryData }
  | { type: 'UPDATE_MINI_PLAYER_STATE'; data: boolean }
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
  | { type: 'TOGGLE_REDUCED_MOTION'; data?: boolean }
  | { type: 'TOGGLE_SONG_INDEXING'; data?: boolean }
  | { type: 'PLAYER_WAITING_STATUS'; data: boolean }
  | { type: 'UPDATE_BODY_BACKGROUND_IMAGE'; data?: string }
  | { type: 'UPDATE_MULTIPLE_SELECTIONS_DATA'; data: MultipleSelectionData }
  | { type: 'CHANGE_APP_UPDATES_DATA'; data: AppUpdatesState }
  | { type: 'UPDATE_LOCAL_STORAGE'; data: LocalStorage }
  | { type: 'UPDATE_BATTERY_POWER_STATE'; data: boolean }
  | { type: 'TOGGLE_SHOW_SONG_REMAINING_DURATION'; data?: boolean };

const reducer = (
  state: AppReducer,
  action: AppReducerStateActions,
): AppReducer => {
  switch (action.type) {
    case 'APP_THEME_CHANGE': {
      const theme = (
        typeof action.data === 'object'
          ? action.data
          : { isDarkMode: false, useSystemTheme: true }
      ) as typeof state.userData.theme;
      return {
        ...state,
        isDarkMode: theme.isDarkMode,
        userData: { ...state.userData, theme },
      };
    }
    case 'USER_DATA_CHANGE':
      return {
        ...state,
        userData:
          typeof action.data === 'object'
            ? (action.data as UserData)
            : state.userData,
      };
    case 'TOGGLE_REDUCED_MOTION':
      return {
        ...state,
        localStorage:
          typeof action.data === 'boolean'
            ? {
                ...(state.localStorage as LocalStorage),
                preferences: {
                  ...(state.localStorage as LocalStorage).preferences,
                  isReducedMotion: action.data,
                },
              }
            : {
                ...(state.localStorage as LocalStorage),
                preferences: {
                  ...(state.localStorage as LocalStorage).preferences,
                  isReducedMotion: (state.localStorage as LocalStorage)
                    .preferences.isReducedMotion,
                },
              },
      };
    case 'TOGGLE_SONG_INDEXING':
      return {
        ...state,
        localStorage:
          typeof action.data === 'boolean'
            ? {
                ...(state.localStorage as LocalStorage),
                preferences: {
                  ...(state.localStorage as LocalStorage).preferences,
                  isSongIndexingEnabled: action.data,
                },
              }
            : {
                ...(state.localStorage as LocalStorage),
                preferences: {
                  ...(state.localStorage as LocalStorage).preferences,
                  isSongIndexingEnabled: (state.localStorage as LocalStorage)
                    .preferences.isSongIndexingEnabled,
                },
              },
      };
    case 'TOGGLE_SHOW_SONG_REMAINING_DURATION':
      return {
        ...state,
        localStorage:
          typeof action.data === 'boolean'
            ? {
                ...(state.localStorage as LocalStorage),
                preferences: {
                  ...(state.localStorage as LocalStorage).preferences,
                  showSongRemainingTime: action.data,
                },
              }
            : {
                ...(state.localStorage as LocalStorage),
                preferences: {
                  ...(state.localStorage as LocalStorage).preferences,
                  showSongRemainingTime: (state.localStorage as LocalStorage)
                    .preferences.showSongRemainingTime,
                },
              },
      };
    case 'PROMPT_MENU_DATA_CHANGE':
      return {
        ...state,
        promptMenuData: action.data
          ? (action.data as PromptMenuData).isVisible
            ? (action.data as PromptMenuData)
            : {
                ...(action.data as PromptMenuData),
                content: state.promptMenuData.content,
              }
          : state.promptMenuData,
      };
    case 'ADD_NEW_NOTIFICATIONS':
      return {
        ...state,
        notificationPanelData: {
          ...state.notificationPanelData,
          notifications:
            (action.data as AppNotification[]) ||
            state.notificationPanelData.notifications,
        } as NotificationPanelData,
      };
    case 'UPDATE_NOTIFICATIONS':
      return {
        ...state,
        notificationPanelData: {
          ...state.notificationPanelData,
          notifications:
            (action.data as AppNotification[]) ??
            state.notificationPanelData.notifications,
        } as NotificationPanelData,
      };
    case 'CONTEXT_MENU_DATA_CHANGE':
      return {
        ...state,
        contextMenuData:
          (action.data as ContextMenuData) || state.contextMenuData,
      };
    case 'CONTEXT_MENU_VISIBILITY_CHANGE':
      return {
        ...state,
        contextMenuData: {
          ...state.contextMenuData,
          isVisible:
            typeof action.data === 'boolean'
              ? action.data
              : state.contextMenuData.isVisible,
        },
      };
    case 'CURRENT_ACTIVE_PAGE_DATA_UPDATE':
      state.navigationHistory.history[
        state.navigationHistory.pageHistoryIndex
      ].data = action.data as PageData;
      return {
        ...state,
        navigationHistory: state.navigationHistory,
      };
    case 'UPDATE_NAVIGATION_HISTORY':
      return {
        ...state,
        bodyBackgroundImage: undefined,
        navigationHistory:
          typeof action.data === 'object'
            ? { ...state.navigationHistory, ...action.data }
            : state.navigationHistory,
      };
    case 'CURRENT_SONG_DATA_CHANGE':
      return {
        ...state,
        currentSongData:
          typeof action.data === 'object'
            ? (action.data as AudioPlayerData)
            : state.currentSongData,
      };
    case 'CURRENT_SONG_PLAYBACK_STATE':
      return {
        ...state,
        player: {
          ...state.player,
          isCurrentSongPlaying:
            typeof action.data === 'boolean'
              ? action.data
              : !state.player.isCurrentSongPlaying,
          isPlayerStalled:
            typeof action.data === 'boolean' && action.data
              ? false
              : state.player.isPlayerStalled,
        },
      };
    case 'UPDATE_MINI_PLAYER_STATE':
      window.api.miniPlayer.toggleMiniPlayer(
        typeof action.data === 'boolean'
          ? action.data
          : state.player.isMiniPlayer,
      );
      return {
        ...state,
        player: {
          ...state.player,
          isMiniPlayer:
            typeof action.data === 'boolean'
              ? action.data
              : state.player.isMiniPlayer,
        },
      };
    case 'UPDATE_SONG_POSITION':
      return {
        ...state,
        player: {
          ...state.player,
          songPosition:
            typeof action.data === 'number'
              ? action.data
              : state.player.songPosition,
        },
      };
    case 'UPDATE_IS_REPEATING_STATE':
      return {
        ...state,
        player: {
          ...state.player,
          isRepeating:
            typeof action.data === 'string'
              ? (action.data as RepeatTypes)
              : state.player.isRepeating,
        },
      };
    case 'TOGGLE_IS_FAVORITE_STATE':
      return {
        ...state,
        currentSongData: {
          ...state.currentSongData,
          isAFavorite:
            typeof action.data === 'boolean'
              ? action.data
              : !state.currentSongData.isAFavorite,
        },
      };
    case 'TOGGLE_SHUFFLE_STATE':
      return {
        ...state,
        player: {
          ...state.player,
          isShuffling:
            typeof action.data === 'boolean'
              ? action.data
              : !state.player.isShuffling,
        },
      };
    case 'UPDATE_VOLUME':
      return {
        ...state,
        player: {
          ...state.player,
          volume:
            typeof action.data === 'object'
              ? { ...state.player.volume, ...action.data }
              : state.player.volume,
        },
      };
    case 'UPDATE_VOLUME_VALUE':
      return {
        ...state,
        player: {
          ...state.player,
          volume: {
            ...state.player.volume,
            value:
              typeof action.data === 'number'
                ? action.data
                : state.player.volume.value,
            isMuted: typeof action.data === 'number' && action.data === 0,
          },
        },
      };
    case 'UPDATE_MUTED_STATE':
      return {
        ...state,
        player: {
          ...state.player,
          volume: {
            ...state.player.volume,
            isMuted:
              typeof action.data === 'boolean'
                ? action.data
                : !state.player.volume.isMuted,
          },
        },
      };
    case 'UPDATE_BODY_BACKGROUND_IMAGE':
      return {
        ...state,
        bodyBackgroundImage:
          typeof action.data === 'string'
            ? action.data
            : state.bodyBackgroundImage,
      };
    case 'UPDATE_MULTIPLE_SELECTIONS_DATA':
      return {
        ...state,
        multipleSelectionsData:
          typeof action.data === 'object'
            ? (action.data as MultipleSelectionData)
            : state.multipleSelectionsData,
      };
    case 'CHANGE_APP_UPDATES_DATA':
      return {
        ...state,
        appUpdatesState:
          typeof action.data === 'string'
            ? (action.data as AppUpdatesState)
            : state.appUpdatesState,
      };
    case 'PLAYER_WAITING_STATUS':
      return {
        ...state,
        player: {
          ...state.player,
          isPlayerStalled:
            typeof action.data === 'boolean'
              ? action.data
              : state.player.isPlayerStalled,
        },
      };
    case 'UPDATE_LOCAL_STORAGE':
      return {
        ...state,
        localStorage:
          typeof action.data === 'object'
            ? (action.data as LocalStorage)
            : state.localStorage,
      };
    case 'UPDATE_BATTERY_POWER_STATE':
      return {
        ...state,
        isOnBatteryPower:
          typeof action.data === 'boolean'
            ? (action.data as boolean)
            : state.isOnBatteryPower,
      };
    default:
      return state;
  }
};

export const USER_DATA_TEMPLATE: UserData = {
  language: 'en',
  theme: { isDarkMode: false, useSystemTheme: true },
  musicFolders: [],
  preferences: {
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
  },
  windowPositions: {},
  windowDiamensions: {},
  windowState: 'normal',
  recentSearches: [],
};

export const DEFAULT_REDUCER_DATA: AppReducer = {
  isDarkMode: false,
  player: {
    isCurrentSongPlaying: false,
    volume: { isMuted: false, value: 50 },
    isRepeating: 'false',
    isShuffling: false,
    songPosition: 0,
    isMiniPlayer: false,
    isPlayerStalled: false,
    playbackRate: 1.0,
  },
  userData: USER_DATA_TEMPLATE,
  currentSongData: {} as AudioPlayerData,
  localStorage: LOCAL_STORAGE_DEFAULT_TEMPLATE,
  navigationHistory: {
    pageHistoryIndex: 0,
    history: [
      {
        pageTitle: 'Home',
        data: undefined,
      },
    ],
  },
  contextMenuData: {
    isVisible: false,
    menuItems: [],
    pageX: 200,
    pageY: 200,
  },
  notificationPanelData: {
    notifications: [],
  },
  promptMenuData: {
    isVisible: false,
    content: <span />,
    className: '',
  },
  multipleSelectionsData: { isEnabled: false, multipleSelections: [] },
  appUpdatesState: 'UNKNOWN',
  isOnBatteryPower: false,
};

export default reducer;
