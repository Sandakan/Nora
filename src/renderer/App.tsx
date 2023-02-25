/* eslint-disable promise/no-nesting */
/* eslint-disable no-unused-vars */
/* eslint-disable default-param-last */
/* eslint-disable no-use-before-define */
import React, { ReactElement } from 'react';
import 'tailwindcss/tailwind.css';
import '../../assets/styles/styles.css';

import { AppContext, AppStateContextType } from './contexts/AppContext';
import {
  AppUpdateContext,
  AppUpdateContextType,
} from './contexts/AppUpdateContext';
import { SongPositionContext } from './contexts/SongPositionContext';
import packageFile from '../../package.json';
import TitleBar from './components/TitleBar/TitleBar';
import SongControlsContainer from './components/SongsControlsContainer/SongControlsContainer';
import BodyAndSideBarContainer from './components/BodyAndSidebarContainer';
import PromptMenu from './components/PromptMenu/PromptMenu';
import ContextMenu from './components/ContextMenu/ContextMenu';
import MiniPlayer from './components/MiniPlayer/MiniPlayer';
import ErrorPrompt from './components/ErrorPrompt';
import Button, { ButtonProps } from './components/Button';
import ReleaseNotesPrompt from './components/ReleaseNotesPrompt/ReleaseNotesPrompt';
import Img from './components/Img';
import Preloader from './components/Preloader/Preloader';
import isLatestVersion from './utils/isLatestVersion';
import roundTo from './utils/roundTo';

interface AppReducer {
  userData: UserData;
  isDarkMode: boolean;
  currentSongData: AudioPlayerData;
  PromptMenuData: PromptMenuData;
  notificationPanelData: NotificationPanelData;
  contextMenuData: ContextMenuData;
  navigationHistory: NavigationHistoryData;
  player: Player;
  bodyBackgroundImage?: string;
  multipleSelectionsData: MultipleSelectionData;
  appUpdatesState: AppUpdatesState;
}

type AppReducerStateActions =
  | 'USER_DATA_CHANGE'
  | 'START_PLAY_STATE_CHANGE'
  | 'APP_THEME_CHANGE'
  | 'CURRENT_SONG_DATA_CHANGE'
  | 'CURRENT_SONG_PLAYBACK_STATE'
  | 'PROMPT_MENU_DATA_CHANGE'
  | 'ADD_NEW_NOTIFICATIONS'
  | 'UPDATE_NOTIFICATIONS'
  | 'CONTEXT_MENU_DATA_CHANGE'
  | 'CONTEXT_MENU_VISIBILITY_CHANGE'
  | 'CURRENT_ACTIVE_PAGE_DATA_UPDATE'
  | 'UPDATE_NAVIGATION_HISTORY'
  | 'UPDATE_MINI_PLAYER_STATE'
  | 'UPDATE_VOLUME'
  | 'UPDATE_MUTED_STATE'
  | 'UPDATE_SONG_POSITION'
  | 'UPDATE_IS_REPEATING_STATE'
  | 'TOGGLE_IS_FAVORITE_STATE'
  | 'TOGGLE_SHUFFLE_STATE'
  | 'UPDATE_VOLUME_VALUE'
  | 'TOGGLE_REDUCED_MOTION'
  | 'TOGGLE_SONG_INDEXING'
  | 'PLAYER_WAITING_STATUS'
  | 'UPDATE_BODY_BACKGROUND_IMAGE'
  | 'UPDATE_MULTIPLE_SELECTIONS_DATA'
  | 'CHANGE_APP_UPDATES_DATA'
  | 'TOGGLE_SHOW_SONG_REMAINING_DURATION';

const reducer = (
  state: AppReducer,
  action: { type: AppReducerStateActions; data?: unknown }
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
        userData:
          typeof action.data === 'boolean'
            ? {
                ...(state.userData as UserData),
                preferences: {
                  ...(state.userData as UserData).preferences,
                  isReducedMotion: action.data,
                },
              }
            : {
                ...(state.userData as UserData),
                preferences: {
                  ...(state.userData as UserData).preferences,
                  isReducedMotion: (state.userData as UserData).preferences
                    .isReducedMotion,
                },
              },
      };
    case 'TOGGLE_SONG_INDEXING':
      return {
        ...state,
        userData:
          typeof action.data === 'boolean'
            ? {
                ...(state.userData as UserData),
                preferences: {
                  ...(state.userData as UserData).preferences,
                  songIndexing: action.data,
                },
              }
            : {
                ...(state.userData as UserData),
                preferences: {
                  ...(state.userData as UserData).preferences,
                  songIndexing: (state.userData as UserData).preferences
                    .songIndexing,
                },
              },
      };
    case 'TOGGLE_SHOW_SONG_REMAINING_DURATION':
      return {
        ...state,
        userData:
          typeof action.data === 'boolean'
            ? {
                ...(state.userData as UserData),
                preferences: {
                  ...(state.userData as UserData).preferences,
                  showSongRemainingTime: action.data,
                },
              }
            : {
                ...(state.userData as UserData),
                preferences: {
                  ...(state.userData as UserData).preferences,
                  showSongRemainingTime: (state.userData as UserData)
                    .preferences.showSongRemainingTime,
                },
              },
      };
    case 'PROMPT_MENU_DATA_CHANGE':
      return {
        ...state,
        PromptMenuData: action.data
          ? (action.data as PromptMenuData).isVisible
            ? (action.data as PromptMenuData)
            : // eslint-disable-next-line react/jsx-no-useless-fragment
              { ...(action.data as PromptMenuData), content: <></> }
          : state.PromptMenuData,
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
      window.api.toggleMiniPlayer(
        typeof action.data === 'boolean'
          ? action.data
          : state.player.isMiniPlayer
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
    default:
      return state;
  }
};

const player = new Audio();
player.preload = 'auto';

player.addEventListener('player/trackchange', (e) => {
  if ('detail' in e) {
    console.log(
      `player track changed to ${(e as DetailAvailableEvent<string>).detail}.`
    );
  }
});

const updateNetworkStatus = () =>
  window.api.networkStatusChange(navigator.onLine);

updateNetworkStatus();
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

const userDataTemplate: UserData = {
  theme: { isDarkMode: false, useSystemTheme: true },
  currentSong: { songId: null, stoppedPosition: 0 },
  volume: { isMuted: false, value: 100 },
  musicFolders: [],
  defaultPage: 'Home',
  isShuffling: false,
  isRepeating: 'false',
  preferences: {
    doNotShowBlacklistSongConfirm: false,
    isReducedMotion: false,
    songIndexing: false,
    autoLaunchApp: false,
    isMiniPlayerAlwaysOnTop: false,
    doNotVerifyWhenOpeningLinks: false,
    showSongRemainingTime: false,
    showArtistArtworkNearSongControls: false,
    isMusixmatchLyricsEnabled: false,
    disableBackgroundArtworks: false,
    hideWindowOnClose: false,
    openWindowAsHiddenOnSystemStart: false,
  },
  windowPositions: {},
  windowDiamensions: {},
  sortingStates: {},
  recentSearches: [],
};

const reducerData: AppReducer = {
  isDarkMode: false,
  player: {
    isCurrentSongPlaying: false,
    volume: { isMuted: false, value: 50 },
    isRepeating: 'false',
    isShuffling: false,
    songPosition: 0,
    isMiniPlayer: false,
    isPlayerStalled: false,
  },
  userData: userDataTemplate,
  currentSongData: {} as AudioPlayerData,
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
  PromptMenuData: {
    isVisible: false,
    content: <span />,
    className: '',
  },
  multipleSelectionsData: { isEnabled: false, multipleSelections: [] },
  appUpdatesState: 'UNKNOWN',
};

console.log('Command line args', window.api.commandLineArgs);

export default function App() {
  const [content, dispatch] = React.useReducer(reducer, reducerData);
  // Had to use a Ref in parallel with the Reducer to avoid an issue that happens when using content.* not giving the intended data in useCallback functions even though it was added as a dependency of that function.
  const contentRef = React.useRef(reducerData);

  const AppRef = React.useRef(null as HTMLDivElement | null);

  const [, startTransition] = React.useTransition();
  const refStartPlay = React.useRef(false);
  const refQueue = React.useRef({
    currentSongIndex: null,
    queue: [],
    queueBeforeShuffle: [],
    queueType: 'songs',
  } as Queue);

  const addSongDropPlaceholder = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.relatedTarget === null) AppRef.current?.classList.add('song-drop');
    },
    []
  );

  const removeSongDropPlaceholder = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.relatedTarget === null)
        AppRef.current?.classList.remove('song-drop');
    },
    []
  );

  const changePromptMenuData = React.useCallback(
    (
      isVisible = false,
      contentData?: ReactElement<any, any>,
      className = ''
    ) => {
      dispatch({
        type: 'PROMPT_MENU_DATA_CHANGE',
        data: {
          isVisible,
          content: contentData ?? content.PromptMenuData.content,
          className: className ?? content.PromptMenuData.className,
        },
      });
    },
    [content.PromptMenuData.className, content.PromptMenuData.content]
  );

  const managePlaybackErrors = React.useCallback(
    (err: unknown) => {
      const prevSongPosition = player.currentTime;
      const playerErrorData = player.error;
      console.error(err, playerErrorData);
      window.api.sendLogs(
        `Error occurred in the player.App error:${err}; Player error: ${playerErrorData};`
      );
      if (player.src && playerErrorData) {
        player.load();
        player.currentTime = prevSongPosition;
      } else {
        player.pause();
        changePromptMenuData(
          true,
          <ErrorPrompt
            reason="ERROR_IN_PLAYER"
            message={
              <>
                An error ocurred in the player.
                <br />
                This could be a result of trying to play a corrupted song.
                <details>{`${playerErrorData}`}</details>
              </>
            }
            showSendFeedbackBtn
          />
        );
      }
    },
    [changePromptMenuData]
  );

  const AUDIO_FADE_INTERVAL = 50;
  const AUDIO_FADE_DURATION = 250;
  const fadeOutIntervalId = React.useRef(undefined as NodeJS.Timer | undefined);
  const fadeInIntervalId = React.useRef(undefined as NodeJS.Timer | undefined);
  const fadeOutAudio = React.useCallback(() => {
    // console.log('volume on fade out', contentRef.current.volume);
    if (fadeInIntervalId.current) clearInterval(fadeInIntervalId.current);
    if (fadeOutIntervalId.current) clearInterval(fadeOutIntervalId.current);
    fadeOutIntervalId.current = setInterval(() => {
      if (player.volume > 0) {
        const rate =
          contentRef.current.player.volume.value /
          (100 * (AUDIO_FADE_DURATION / AUDIO_FADE_INTERVAL));
        if (player.volume - rate <= 0) player.volume = 0;
        else player.volume -= rate;
      } else {
        player.pause();
        if (fadeOutIntervalId.current) clearInterval(fadeOutIntervalId.current);
      }
    }, AUDIO_FADE_INTERVAL);
  }, []);

  const fadeInAudio = React.useCallback(() => {
    // console.log('volume on fade in', contentRef.current.volume);
    if (fadeInIntervalId.current) clearInterval(fadeInIntervalId.current);
    if (fadeOutIntervalId.current) clearInterval(fadeOutIntervalId.current);
    fadeInIntervalId.current = setInterval(() => {
      if (player.volume < contentRef.current.player.volume.value / 100) {
        const rate =
          (contentRef.current.player.volume.value / 100 / AUDIO_FADE_INTERVAL) *
          (AUDIO_FADE_DURATION / AUDIO_FADE_INTERVAL);
        if (
          player.volume + rate >=
          contentRef.current.player.volume.value / 100
        )
          player.volume = contentRef.current.player.volume.value / 100;
        else player.volume += rate;
      } else if (fadeInIntervalId.current) {
        clearInterval(fadeInIntervalId.current);
      }
    }, AUDIO_FADE_INTERVAL);
  }, []);

  const handleBeforeQuitEvent = React.useCallback(async () => {
    window.api.sendSongPosition(player.currentTime);
    await window.api.saveUserData(
      'isRepeating',
      contentRef.current.player.isRepeating
    );
    await window.api.saveUserData(
      'isShuffling',
      contentRef.current.player.isShuffling
    );
  }, []);

  const updateAppUpdatesState = React.useCallback((state: AppUpdatesState) => {
    contentRef.current.appUpdatesState = state;
    dispatch({ type: 'CHANGE_APP_UPDATES_DATA', data: state });
  }, []);

  const checkForAppUpdates = React.useCallback(() => {
    if (navigator.onLine) {
      updateAppUpdatesState('CHECKING');

      fetch(packageFile.releaseNotes.json)
        .then((res) => {
          if (res.status === 200) return res.json();
          throw new Error('response status is not 200');
        })
        .then((res: Changelog) => {
          const isThereAnAppUpdate = !isLatestVersion(
            res.latestVersion.version,
            packageFile.version
          );

          updateAppUpdatesState(isThereAnAppUpdate ? 'OLD' : 'LATEST');

          if (isThereAnAppUpdate) {
            console.log('client has new updates');
            if (
              contentRef.current.userData.preferences
                .noUpdateNotificationForNewUpdate !== res.latestVersion.version
            ) {
              changePromptMenuData(
                true,
                <ReleaseNotesPrompt />,
                'release-notes px-8 py-4'
              );
            }
          } else console.log('client is up-to-date.');

          return undefined;
        })
        .catch((err) => {
          console.error(err);
          return updateAppUpdatesState('ERROR');
        });
    } else {
      updateAppUpdatesState('NO_NETWORK_CONNECTION');

      console.log(
        `couldn't check for app updates. Check the network connection.`
      );
    }
  }, [changePromptMenuData, updateAppUpdatesState]);

  React.useEffect(
    () => {
      // check for app updates on app startup after 5 seconds.
      setTimeout(checkForAppUpdates, 5000);
      // checks for app updates every 10 minutes.
      const id = setInterval(checkForAppUpdates, 1000 * 60 * 15);
      return () => {
        clearInterval(id);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  React.useEffect(() => {
    const watchForSystemThemeChanges = (
      _: unknown,
      isDarkMode: boolean,
      usingSystemTheme: boolean
    ) => {
      console.log(
        'theme changed : isDarkMode',
        isDarkMode,
        'usingSystemTheme',
        usingSystemTheme
      );
      const theme = {
        isDarkMode,
        useSystemTheme: usingSystemTheme,
      };
      dispatch({
        type: 'APP_THEME_CHANGE',
        data: theme,
      });
      contentRef.current.userData.theme = theme;
    };
    window.api.listenForSystemThemeChanges(watchForSystemThemeChanges);
    return () => {
      window.api.StoplisteningForSystemThemeChanges(watchForSystemThemeChanges);
    };
  }, []);

  const manageWindowBlurOrFocus = React.useCallback(
    (state: 'blur' | 'focus') => {
      if (AppRef.current) {
        if (state === 'blur') AppRef.current.classList.add('blurred');
        if (state === 'focus') AppRef.current.classList.remove('blurred');
      }
    },
    []
  );

  const manageWindowFullscreen = React.useCallback(
    (state: 'fullscreen' | 'windowed') => {
      if (AppRef.current) {
        if (state === 'fullscreen')
          return AppRef.current.classList.add('fullscreen');
        if (state === 'windowed')
          return AppRef.current.classList.remove('fullscreen');
      }
      return undefined;
    },
    []
  );

  React.useEffect(() => {
    player.addEventListener('error', (err) => managePlaybackErrors(err));
    player.addEventListener('play', () => {
      dispatch({
        type: 'CURRENT_SONG_PLAYBACK_STATE',
        data: true,
      });
      window.api.songPlaybackStateChange(true);
    });
    player.addEventListener('pause', () => {
      dispatch({
        type: 'CURRENT_SONG_PLAYBACK_STATE',
        data: false,
      });
      window.api.songPlaybackStateChange(false);
    });
    window.api.beforeQuitEvent(handleBeforeQuitEvent);

    window.api.onWindowBlur(() => manageWindowBlurOrFocus('blur'));
    window.api.onWindowFocus(() => manageWindowBlurOrFocus('focus'));

    window.api.onEnterFullscreen(() => manageWindowFullscreen('fullscreen'));
    window.api.onLeaveFullscreen(() => manageWindowFullscreen('windowed'));

    return () => {
      window.api.removeBeforeQuitEventListener(handleBeforeQuitEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const displayDefaultTitleBar = () => {
      document.title = `Nora`;
      window.api.saveUserData(
        'currentSong.stoppedPosition',
        player.currentTime
      );
    };
    const playSongIfPlayable = () => {
      if (refStartPlay.current) toggleSongPlayback(true);
    };
    const manageSongPositionUpdate = () => {
      contentRef.current.player.songPosition = roundTo(player.currentTime, 2);
    };
    const managePlayerStalledStatus = () => {
      dispatch({ type: 'PLAYER_WAITING_STATUS', data: true });
    };
    const managePlayerNotStalledStatus = () => {
      dispatch({ type: 'PLAYER_WAITING_STATUS', data: false });
    };

    const handleSkipForwardClickWithParams = () =>
      handleSkipForwardClick('PLAYER_SKIP');

    // player.addEventListener('seeking', managePlayerNotStalledStatus);
    player.addEventListener('canplay', managePlayerNotStalledStatus);
    player.addEventListener('canplaythrough', managePlayerNotStalledStatus);
    player.addEventListener('loadeddata', managePlayerNotStalledStatus);
    player.addEventListener('loadedmetadata', managePlayerNotStalledStatus);
    player.addEventListener('suspend', managePlayerStalledStatus);
    player.addEventListener('stalled', managePlayerStalledStatus);
    player.addEventListener('waiting', managePlayerStalledStatus);
    player.addEventListener('canplay', playSongIfPlayable);
    player.addEventListener('ended', handleSkipForwardClickWithParams);
    player.addEventListener('play', addSongTitleToTitleBar);
    player.addEventListener('pause', displayDefaultTitleBar);

    const intervalId = setInterval(() => {
      if (!player.paused) {
        const currentPosition = contentRef.current.player.songPosition;

        const playerPositionChange = new CustomEvent('player/positionChange', {
          detail: currentPosition,
        });
        player.dispatchEvent(playerPositionChange);

        startTransition(() =>
          dispatch({
            type: 'UPDATE_SONG_POSITION',
            data: currentPosition,
          })
        );
      }
    }, 1000 / 3);

    player.addEventListener('timeupdate', manageSongPositionUpdate);

    return () => {
      toggleSongPlayback(false);
      clearInterval(intervalId);
      // player.removeEventListener('seeking', managePlayerNotStalledStatus);
      player.removeEventListener('canplay', managePlayerNotStalledStatus);
      player.removeEventListener(
        'canplaythrough',
        managePlayerNotStalledStatus
      );
      player.removeEventListener('loadeddata', managePlayerNotStalledStatus);
      player.removeEventListener(
        'loadedmetadata',
        managePlayerNotStalledStatus
      );
      player.removeEventListener('suspend', managePlayerStalledStatus);
      player.removeEventListener('stalled', managePlayerStalledStatus);
      player.removeEventListener('waiting', managePlayerStalledStatus);
      player.removeEventListener('timeupdate', manageSongPositionUpdate);
      player.removeEventListener('canplay', playSongIfPlayable);
      player.removeEventListener('ended', handleSkipForwardClickWithParams);
      player.removeEventListener('play', addSongTitleToTitleBar);
      player.removeEventListener('pause', displayDefaultTitleBar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // VOLUME RELATED SETTINGS
  React.useEffect(() => {
    player.volume = content.player.volume.value / 100;
    player.muted = content.player.volume.isMuted;
  }, [content.player.volume]);

  React.useEffect(() => {
    window.api
      .getUserData()
      .then((res) => {
        if (!res) return;
        dispatch({ type: 'USER_DATA_CHANGE', data: res });
        contentRef.current.userData = res;
        dispatch({ type: 'APP_THEME_CHANGE', data: res.theme });
        dispatch({ type: 'UPDATE_VOLUME', data: res.volume });
        contentRef.current.player.volume = res.volume;
        toggleShuffling(res.isShuffling);
        toggleRepeat(res.isRepeating);
        if (
          content.navigationHistory.history.at(-1)?.pageTitle !==
          res.defaultPage
        )
          changeCurrentActivePage(res.defaultPage);
        window.api
          .checkForStartUpSongs()
          .then((startUpSongData) => {
            if (startUpSongData)
              playSongFromUnknownSource(startUpSongData, true);
            else {
              if (res.currentSong.songId)
                playSong(res.currentSong.songId, false);
              const currSongPosition = Number(res.currentSong.stoppedPosition);
              player.currentTime = currSongPosition;
              contentRef.current.player.songPosition = currSongPosition;
              dispatch({
                type: 'UPDATE_SONG_POSITION',
                data: currSongPosition,
              });
            }
            return undefined;
          })
          .catch((err) => console.error(err));

        // eslint-disable-next-line promise/always-return
        if (res.queue) {
          refQueue.current = {
            ...refQueue.current,
            queue: res.queue.queue || [],
            queueType: res.queue.queueType,
            queueId: res.queue.queueId,
          };
        } else {
          // eslint-disable-next-line promise/no-nesting
          window.api
            .getAllSongs()
            .then((audioData) => {
              if (!audioData) return undefined;
              createQueue(
                audioData.data.map((song) => song.songId),
                'songs'
              );
              return undefined;
            })
            .catch((err) => console.error(err));
        }
      })
      .catch((err) => console.error(err));

    window.api.toggleSongPlayback(() => {
      console.log('Main requested song playback');
      toggleSongPlayback();
    });
    window.api.playSongFromUnknownSource((_, data) => {
      playSongFromUnknownSource(data, true);
    });
    window.api.skipBackwardToPreviousSong(handleSkipBackwardClick);
    window.api.skipForwardToNextSong(handleSkipForwardClick);
    return () => {
      window.api.removeTogglePlaybackStateEvent(toggleSongPlayback);
      window.api.removeSkipBackwardToPreviousSongEvent(handleSkipBackwardClick);
      window.api.removeSkipForwardToNextSongEvent(handleSkipForwardClick);
      window.api.removeDataUpdateEventListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const noticeDataUpdateEvents = (
      _: unknown,
      dataEvents: DataUpdateEvent[]
    ) => {
      const event = new CustomEvent('app/dataUpdates', { detail: dataEvents });
      document.dispatchEvent(event);
    };

    window.api.dataUpdateEvent(noticeDataUpdateEvents);

    return () => {
      window.api.removeDataUpdateEventListeners();
    };
  }, []);

  const addNewNotifications = React.useCallback(
    (newNotifications: AppNotification[]) => {
      if (newNotifications.length > 0) {
        const maxNotifications = 4;
        const currentNotifications =
          contentRef.current.notificationPanelData.notifications;
        const newNotificationIds = newNotifications.map((x) => x.id);
        const resultNotifications = currentNotifications.filter(
          (x, index) =>
            !newNotificationIds.some((y) => y === x.id) &&
            index < maxNotifications
        );
        resultNotifications.unshift(...newNotifications);
        contentRef.current.notificationPanelData.notifications =
          resultNotifications;
        dispatch({
          type: 'ADD_NEW_NOTIFICATIONS',
          data: resultNotifications,
        });
      }
    },
    []
  );

  const updateNotifications = React.useCallback(
    (
      // eslint-disable-next-line no-unused-vars
      callback: (currentNotifications: AppNotification[]) => AppNotification[]
    ) => {
      const currentNotifications = content.notificationPanelData.notifications;
      const updatedNotifications = callback(currentNotifications);
      contentRef.current.notificationPanelData.notifications =
        updatedNotifications;
      dispatch({ type: 'UPDATE_NOTIFICATIONS', data: updatedNotifications });
    },
    [content.notificationPanelData.notifications]
  );

  const toggleSongPlayback = React.useCallback(
    (startPlay?: boolean) => {
      if (contentRef.current.currentSongData?.songId) {
        if (typeof startPlay !== 'boolean' || startPlay === player.paused) {
          if (player.readyState > 0) {
            if (player.paused) {
              player
                .play()
                .then(() => {
                  const playbackChange = new CustomEvent(
                    'player/playbackChange'
                  );
                  return player.dispatchEvent(playbackChange);
                })
                .catch((err) => managePlaybackErrors(err));
              return fadeInAudio();
            }
            if (player.ended) {
              player.currentTime = 0;
              player
                .play()
                .then(() => {
                  const playbackChange = new CustomEvent(
                    'player/playbackChange'
                  );
                  return player.dispatchEvent(playbackChange);
                })
                .catch((err) => managePlaybackErrors(err));
              return fadeInAudio();
            }
            const playbackChange = new CustomEvent('player/playbackChange');
            player.dispatchEvent(playbackChange);
            return fadeOutAudio();
          }
        }
      } else
        addNewNotifications([
          {
            id: 'noSongToPlay',
            delay: 5000,
            content: <span>Please select a song to play.</span>,
            icon: (
              <span className="material-icons-round-outlined text-lg">
                error
              </span>
            ),
          },
        ]);
      return undefined;
    },
    [managePlaybackErrors, addNewNotifications, fadeOutAudio, fadeInAudio]
  );

  const displayMessageFromMain = React.useCallback(
    (
      _: unknown,
      message: string,
      messageCode?: MessageCodes,
      data?: Record<string, unknown>
    ) => {
      const buttons: ButtonProps[] = [];
      let id: string = messageCode ?? 'mainProcessMessage';
      const defaultButtonStyles =
        '!bg-background-color-3 dark:!bg-dark-background-color-3 !text-font-color-black dark:!text-font-color-black !font-light';
      let duration = 5000;
      let icon: ReactElement<any, any> | undefined;
      const showMessage = true;

      if (messageCode === 'APP_THEME_CHANGE')
        icon = <span className="material-icons-round">brightness_4</span>;
      if (messageCode === 'PARSE_SUCCESSFUL') {
        icon = (
          <span className="material-icons-round-outlined icon">
            file_download
          </span>
        );
        id = (data?.songId as string) ?? messageCode;
      }
      if (messageCode === 'RESYNC_SUCCESSFUL') {
        icon = (
          <span className="material-icons-round-outlined icon">check</span>
        );
      }
      if (messageCode === 'PARSE_FAILED') {
        duration = 15000;
        buttons.push({
          label: 'Resync Songs',
          iconClassName: 'sync',
          className: defaultButtonStyles,
          clickHandler: () => window.api.resyncSongsLibrary(),
        });
      }
      if (
        messageCode === 'PLAYBACK_FROM_UNKNOWN_SOURCE' &&
        data &&
        'path' in data
      ) {
        icon = (
          <span className="material-icons-round-outlined icon">error</span>
        );
        duration = 15000;
        // buttons.push({
        //   label: 'Add to the library',
        //   iconClassName: 'add',
        //   className: defaultButtonStyles,
        //   clickHandler: () => console.log(data),
        // });
      }
      if (
        (messageCode === 'SONG_LIKE' || messageCode === 'SONG_DISLIKE') &&
        data &&
        'artworkPath' in data
      ) {
        icon = (
          <div className="relative h-8 w-8">
            <Img
              className="aspect-square h-full w-full rounded-sm"
              src={`nora://localFiles/${data.artworkPath as string}`}
              alt="song artwork"
            />
            <span
              className={`material-icons-round${
                messageCode === 'SONG_DISLIKE' ? '-outlined' : ''
              } icon absolute -bottom-1 -right-1 text-font-color-crimson dark:text-font-color-crimson`}
            >
              favorite
            </span>
          </div>
        );
        // duration = 60000;
      }

      if (showMessage)
        addNewNotifications([
          {
            id,
            delay: duration,
            content: <div>{message}</div>,
            icon,
            buttons,
          },
        ]);
    },
    [addNewNotifications]
  );

  React.useEffect(() => {
    window.api.getMessageFromMain(displayMessageFromMain);
    return () => {
      window.api.removeMessageToRendererEventListener(displayMessageFromMain);
    };
  }, [displayMessageFromMain]);

  React.useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: contentRef.current.currentSongData.title,
        artist: Array.isArray(contentRef.current.currentSongData.artists)
          ? contentRef.current.currentSongData.artists
              .map((artist) => artist.name)
              .join(', ')
          : `Unknown Artist`,
        album: contentRef.current.currentSongData.album
          ? contentRef.current.currentSongData.album.name || 'Unknown Album'
          : 'Unknown Album',
        artwork: [
          {
            src: `data:;base64,${contentRef.current.currentSongData.artwork}`,
            sizes: '300x300',
            type: 'image/webp',
          },
        ],
      });
      const handleSkipForwardClickWithParams = () =>
        handleSkipForwardClick('PLAYER_SKIP');

      navigator.mediaSession.setActionHandler('pause', () =>
        toggleSongPlayback(false)
      );
      navigator.mediaSession.setActionHandler('play', () =>
        toggleSongPlayback(true)
      );
      navigator.mediaSession.setActionHandler(
        'previoustrack',
        handleSkipBackwardClick
      );
      navigator.mediaSession.setActionHandler(
        `nexttrack`,
        handleSkipForwardClickWithParams
      );
      navigator.mediaSession.playbackState = content.player.isCurrentSongPlaying
        ? 'playing'
        : 'paused';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.currentSongData, content.player.isCurrentSongPlaying]);

  const handleContextMenuVisibilityUpdate = React.useCallback(() => {
    if (contentRef.current.contextMenuData.isVisible) {
      dispatch({
        type: 'CONTEXT_MENU_VISIBILITY_CHANGE',
        data: false,
      });
      contentRef.current.contextMenuData.isVisible = false;
    }
  }, []);

  React.useEffect(() => {
    window.addEventListener('click', handleContextMenuVisibilityUpdate);
    window.addEventListener('keydown', manageKeyboardShortcuts);
    return () => {
      window.removeEventListener('click', handleContextMenuVisibilityUpdate);
      window.removeEventListener('keydown', manageKeyboardShortcuts);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSongTitleToTitleBar = React.useCallback(() => {
    if (
      contentRef.current.currentSongData.title &&
      contentRef.current.currentSongData.artists
    )
      document.title = `${contentRef.current.currentSongData.title} - ${
        Array.isArray(contentRef.current.currentSongData.artists) &&
        contentRef.current.currentSongData.artists
          .map((artist) => artist.name)
          .join(', ')
      }`;
  }, []);

  const toggleRepeat = React.useCallback((newState?: RepeatTypes) => {
    const repeatState =
      newState ||
      // eslint-disable-next-line no-nested-ternary
      (contentRef.current.player.isRepeating === 'false'
        ? 'repeat'
        : contentRef.current.player.isRepeating === 'repeat'
        ? 'repeat-1'
        : 'false');
    contentRef.current.player.isRepeating = repeatState;
    dispatch({
      type: 'UPDATE_IS_REPEATING_STATE',
      data: repeatState,
    });
  }, []);

  const recordListeningData = React.useCallback(
    (songId: string, duration: number) => {
      console.warn(
        `started recording full listens and skips of ${songId}`,
        'duration',
        duration
      );

      const abortController = new AbortController();
      let isPaused = false;
      let passedSkipRange = false;
      let passedFullListenRange = false;
      let seconds = 0;

      player.addEventListener(
        'pause',
        () => {
          isPaused = true;
        },
        { signal: abortController.signal }
      );
      player.addEventListener(
        'play',
        () => {
          isPaused = false;
        },
        { signal: abortController.signal }
      );
      // player.addEventListener(
      //   'ended',
      //   () => {
      //     stopRecording(true);
      //   },
      //   { signal: abortController.signal }
      // );

      console.warn(
        songId,
        'skip end range',
        (duration * 10) / 100,
        'full listen range',
        (duration * 90) / 100
      );

      const intervalId = window.setInterval(() => {
        //  listen for song skips
        if (!passedSkipRange && seconds > (duration * 10) / 100) {
          passedSkipRange = true;
          console.warn(`user didn't skip ${songId} before 10% completion.`);
        }
        // listen for full song listens
        if (!passedFullListenRange && seconds > (duration * 90) / 100) {
          passedFullListenRange = true;
          console.warn(`user listened to 90% of ${songId}`);
          window.api.updateSongListeningData(
            songId,
            'fullListens',
            'increment'
          );
          stopRecording();
        }

        if (!isPaused) {
          seconds += 1;
        }
      }, 1000);

      const stopRecording = (isSongEnded = false) => {
        try {
          if (!isSongEnded && !passedFullListenRange)
            console.warn(`user skipped ${songId} before 90% completion.`);
          if (!passedSkipRange) {
            console.warn(`user skipped ${songId}. before 10% completion.`);
            window.api.updateSongListeningData(songId, 'skips', 'increment');
          }
          abortController.abort();
          clearInterval(intervalId);
          console.warn(`stopping listening data recording of ${songId}`);
        } catch (error) {
          console.error(error);
        }
      };

      return stopRecording;
    },
    []
  );

  const recordRef = React.useRef<() => void>();

  const playSong = React.useCallback(
    (songId: string, isStartPlay = true, playAsCurrentSongIndex = false) => {
      if (typeof songId === 'string') {
        if (contentRef.current.currentSongData.songId === songId)
          return toggleSongPlayback();
        console.time('timeForSongFetch');

        return window.api
          .getSong(songId)
          .then((songData) => {
            console.timeEnd('timeForSongFetch');
            if (songData) {
              console.log('playSong', songId, songData.path);

              dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: songData });
              contentRef.current.currentSongData = songData;

              window.api.saveUserData('currentSong.songId', songData.songId);

              player.src = songData.path;

              const trackChangeEvent = new CustomEvent('player/trackchange', {
                detail: songId,
              });
              player.dispatchEvent(trackChangeEvent);

              refStartPlay.current = isStartPlay;

              if (isStartPlay) toggleSongPlayback();

              if (recordRef.current) recordRef.current();
              recordRef.current = recordListeningData(
                songId,
                songData.duration
              );

              if (refQueue.current.queue.length > 0) {
                // check if songId exists in the queue
                if (refQueue.current.queue.indexOf(songData.songId) !== -1) {
                  if (playAsCurrentSongIndex) {
                    // if playAsCurrentSongIndex is enabled, songId will be removed from the position it previously was and put next to the currentSongIndex to avoid messing up the queue when playing arbitrary songs from different places in the queue, result in continuing playing from that position rather than playing from previous song's position.
                    if (refQueue.current.currentSongIndex !== null) {
                      // There is a currently playing song.
                      const position = refQueue.current.currentSongIndex + 1;
                      if (
                        refQueue.current.queue[position] !== songData.songId
                      ) {
                        refQueue.current.queue = refQueue.current.queue.filter(
                          (id) => id !== songData.songId
                        );
                        refQueue.current.queue.splice(
                          position,
                          0,
                          songData.songId
                        );
                      }
                      refQueue.current.currentSongIndex = position;
                    } else
                      refQueue.current.currentSongIndex =
                        refQueue.current.queue.indexOf(songData.songId);
                  } else
                    refQueue.current.currentSongIndex =
                      refQueue.current.queue.indexOf(songData.songId);
                } else {
                  // songId not in the queue
                  console.log(
                    `song ${songData.title} with id ${songData.songId} is not present in the queue`
                  );
                  refQueue.current.queue.push(songData.songId);

                  if (refQueue.current.currentSongIndex !== null)
                    refQueue.current.currentSongIndex += 1;
                  else refQueue.current.currentSongIndex = 0;
                }
              } else if (refQueue.current.queue.length === 0)
                refQueue.current.queue.push(songData.songId);
            } else console.log(songData);
            return undefined;
          })
          .catch((err) => {
            console.error(err);
            addNewNotifications([
              {
                id: 'unplayableSong',
                delay: 10000,
                content: <span>Seems like we can&apos;t play that song.</span>,
                icon: (
                  <span className="material-icons-round icon">
                    error_outline
                  </span>
                ),
              },
            ]);
            changePromptMenuData(
              true,
              <div>
                <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
                  Couldn't Play the Song
                </div>
                <div className="description">
                  Seems like we can't play that song. Please check whether the
                  selected song is available in your system and accessible by
                  the app.
                </div>
                <div className="mt-6">
                  ERROR: {err?.message.split(':').at(-1) ?? 'UNKNOWN'}
                </div>
                <Button
                  label="OK"
                  className="remove-song-from-library-btn float-right mt-2 w-[10rem] rounded-md !bg-background-color-3 text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:text-font-color-black dark:hover:border-background-color-3"
                  clickHandler={() => changePromptMenuData(false)}
                />
              </div>
            );
          });
      }
      addNewNotifications([
        {
          id: 'unplayableSong',
          delay: 10000,
          content: <span>Seems like we can&apos;t play that song.</span>,
          icon: (
            <span className="material-icons-round icon">error_outline</span>
          ),
        },
      ]);
      changePromptMenuData(
        true,
        <ErrorPrompt
          reason="SONG_ID_UNDEFINED"
          message={
            <>
              An error ocurred when trying to play a song. <br />
              ERROR : SONG_ID_UNDEFINED
            </>
          }
        />
      );
      return window.api.sendLogs(
        `======= ERROR OCCURRED WHEN TRYING TO PLAY A S0NG. =======\nERROR : Song id is of unknown type; SONGIDTYPE : ${typeof songId}`
      );
    },
    [
      addNewNotifications,
      changePromptMenuData,
      toggleSongPlayback,
      recordListeningData,
    ]
  );

  const playSongFromUnknownSource = React.useCallback(
    (audioPlayerData: AudioPlayerData, isStartPlay = true) => {
      if (audioPlayerData) {
        const { isKnownSource } = audioPlayerData;
        if (isKnownSource) playSong(audioPlayerData.songId);
        else {
          console.log('playSong', audioPlayerData.path);
          dispatch({
            type: 'CURRENT_SONG_DATA_CHANGE',
            data: audioPlayerData,
          });
          contentRef.current.currentSongData = audioPlayerData;
          player.src = audioPlayerData.path;
          refStartPlay.current = isStartPlay;
          if (isStartPlay) toggleSongPlayback();
        }
      }
    },
    [playSong, toggleSongPlayback]
  );

  const fetchSongFromUnknownSource = React.useCallback(
    (songPath: string) => {
      window.api
        .getSongFromUnknownSource(songPath)
        .then((res) => playSongFromUnknownSource(res, true))
        .catch((err) => {
          console.error(err);
          addNewNotifications([
            {
              id: 'unplayableSong',
              delay: 10000,
              content: <span>Seems like we can&apos;t play that song.</span>,
              icon: (
                <span className="material-icons-round icon">error_outline</span>
              ),
            },
          ]);
          changePromptMenuData(
            true,
            <div>
              <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
                Couldn't Play the Song
              </div>
              <div className="description">
                Seems like we can't play that song. Please check whether the
                selected song is available in your system and accessible by the
                app.
              </div>
              <div className="mt-6">
                ERROR: {err?.message.split(':').at(-1) ?? 'UNKNOWN'}
              </div>
              <Button
                label="OK"
                className="remove-song-from-library-btn float-right mt-2 w-[10rem] rounded-md !bg-background-color-3 text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:text-font-color-black dark:hover:border-background-color-3"
                clickHandler={() => changePromptMenuData(false)}
              />
            </div>
          );
        });
    },
    [playSongFromUnknownSource, addNewNotifications, changePromptMenuData]
  );

  const changeQueueCurrentSongIndex = React.useCallback(
    (currentSongIndex: number) => {
      console.log('currentSongIndex', currentSongIndex);
      refQueue.current.currentSongIndex = currentSongIndex;
      playSong(refQueue.current.queue[currentSongIndex]);
    },
    [playSong]
  );

  const handleSkipBackwardClick = React.useCallback(() => {
    const { currentSongIndex } = refQueue.current;
    if (player.currentTime > 5) {
      player.currentTime = 0;
    } else if (typeof currentSongIndex === 'number') {
      if (currentSongIndex === 0)
        changeQueueCurrentSongIndex(refQueue.current.queue.length - 1);
      else changeQueueCurrentSongIndex(currentSongIndex - 1);
    } else changeQueueCurrentSongIndex(0);
  }, [changeQueueCurrentSongIndex]);

  const handleSkipForwardClick = React.useCallback(
    (reason: SongSkipReason = 'USER_SKIP') => {
      const { currentSongIndex } = refQueue.current;
      if (
        contentRef.current.player.isRepeating === 'repeat-1' &&
        reason !== 'USER_SKIP'
      ) {
        player.currentTime = 0;
        toggleSongPlayback(true);
        window.api.updateSongListeningData(
          contentRef.current.currentSongData.songId,
          'listens',
          'increment'
        );
      } else if (typeof currentSongIndex === 'number') {
        if (refQueue.current.queue.length > 0) {
          if (refQueue.current.queue.length - 1 === currentSongIndex) {
            if (contentRef.current.player.isRepeating === 'repeat')
              changeQueueCurrentSongIndex(0);
          } else changeQueueCurrentSongIndex(currentSongIndex + 1);
        } else console.log('Queue is empty.');
      } else changeQueueCurrentSongIndex(0);
    },
    [toggleSongPlayback, changeQueueCurrentSongIndex]
  );

  const toggleShuffling = React.useCallback((isShuffling?: boolean) => {
    dispatch({ type: 'TOGGLE_SHUFFLE_STATE', data: isShuffling });
    if (isShuffling !== undefined)
      contentRef.current.player.isShuffling = isShuffling;
    else
      contentRef.current.player.isShuffling =
        !contentRef.current.player.isShuffling;
  }, []);

  const shuffleQueue = React.useCallback(
    (songIds: string[], currentSongIndex?: number) => {
      const positions: number[] = [];
      const initialQueue = songIds.slice(0);
      const currentSongId =
        typeof currentSongIndex === 'number'
          ? songIds.splice(currentSongIndex, 1)[0]
          : undefined;
      for (let i = songIds.length - 1; i > 0; i -= 1) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [songIds[i], songIds[randomIndex]] = [songIds[randomIndex], songIds[i]];
      }
      if (currentSongId) songIds.unshift(currentSongId);
      for (let i = 0; i < initialQueue.length; i += 1) {
        positions.push(songIds.indexOf(initialQueue[i]));
      }
      toggleShuffling(true);
      return { shuffledQueue: songIds, positions };
    },
    [toggleShuffling]
  );

  const createQueue = React.useCallback(
    (
      newQueue: string[],
      queueType: QueueTypes,
      isShuffleQueue = false,
      queueId?: string,
      startPlaying = false
    ) => {
      const queue = {
        currentSongIndex: 0,
        queue: newQueue.map((songId) => songId),
        queueId,
        queueType,
      } as Queue;
      if (isShuffleQueue) {
        const { shuffledQueue, positions } = shuffleQueue(queue.queue);

        queue.queue = shuffledQueue;
        if (positions.length > 0) queue.queueBeforeShuffle = positions;
        queue.currentSongIndex = 0;
      } else toggleShuffling(false);
      window.api
        .saveUserData('queue', queue)
        .then(() => {
          refQueue.current = queue;
          if (startPlaying) return changeQueueCurrentSongIndex(0);
          return undefined;
        })
        .catch((err: Error) => console.error(err));
    },
    [changeQueueCurrentSongIndex, shuffleQueue, toggleShuffling]
  );

  const updateQueueData = React.useCallback(
    (
      currentSongIndex?: number,
      newQueue?: string[],
      isShuffleQueue = false,
      playCurrentSongIndex = true,
      clearPreviousQueueData = false
    ) => {
      const queue: Queue = {
        ...refQueue.current,
        currentSongIndex: currentSongIndex ?? refQueue.current.currentSongIndex,
        queue: newQueue ?? refQueue.current.queue,
      };
      if (clearPreviousQueueData) queue.queueBeforeShuffle = [];
      if (Array.isArray(newQueue) && newQueue.length > 1 && isShuffleQueue) {
        const { shuffledQueue, positions } = shuffleQueue(
          queue.queue,
          queue.currentSongIndex ??
            refQueue.current.currentSongIndex ??
            undefined
        );
        queue.queue = shuffledQueue;
        if (positions.length > 0) queue.queueBeforeShuffle = positions;
        queue.currentSongIndex = 0;
      }
      window.api.saveUserData('queue', queue);
      refQueue.current = queue;
      if (playCurrentSongIndex && typeof currentSongIndex === 'number')
        playSong(refQueue.current.queue[currentSongIndex]);
    },
    [playSong, shuffleQueue]
  );

  const updateCurrentSongPlaybackState = React.useCallback(
    (isPlaying: boolean) => {
      if (isPlaying !== content.player.isCurrentSongPlaying)
        dispatch({ type: 'CURRENT_SONG_PLAYBACK_STATE', data: isPlaying });
    },
    [content.player.isCurrentSongPlaying]
  );

  const updateContextMenuData = React.useCallback(
    (
      isVisible: boolean,
      menuItems: ContextMenuItem[] = [],
      pageX?: number,
      pageY?: number,
      contextMenuData?: ContextMenuAdditionalData
    ) => {
      // console.log('pageX', pageX, 'pageY', pageY);
      dispatch({
        type: 'CONTEXT_MENU_DATA_CHANGE',
        data: {
          isVisible,
          data: contextMenuData,
          menuItems:
            menuItems.length > 0
              ? menuItems
              : contentRef.current.contextMenuData.menuItems,
          pageX:
            pageX !== undefined
              ? pageX
              : contentRef.current.contextMenuData.pageX,
          pageY:
            pageY !== undefined
              ? pageY
              : contentRef.current.contextMenuData.pageY,
        } as ContextMenuData,
      });
      contentRef.current.contextMenuData = {
        isVisible,
        data: contextMenuData,
        menuItems:
          menuItems.length > 0
            ? menuItems
            : contentRef.current.contextMenuData.menuItems,
        pageX:
          pageX !== undefined
            ? pageX
            : contentRef.current.contextMenuData.pageX,
        pageY:
          pageY !== undefined
            ? pageY
            : contentRef.current.contextMenuData.pageY,
      };
    },
    []
  );

  const updateCurrentlyActivePageData = React.useCallback(
    (callback: (currentPageData: PageData) => PageData) => {
      const { navigationHistory } = contentRef.current;
      const updatedData = callback(
        navigationHistory.history[navigationHistory.pageHistoryIndex].data ?? {
          scrollTopOffset: 0,
        }
      );
      contentRef.current.navigationHistory.history[
        contentRef.current.navigationHistory.pageHistoryIndex
      ].data = updatedData;
      dispatch({
        type: 'CURRENT_ACTIVE_PAGE_DATA_UPDATE',
        data: updatedData,
      });
    },
    []
  );

  const updatePageHistoryIndex = React.useCallback(
    (type: 'increment' | 'decrement' | 'home') => {
      const { history, pageHistoryIndex } =
        contentRef.current.navigationHistory;
      if (type === 'decrement' && pageHistoryIndex - 1 >= 0) {
        const newPageHistoryIndex = pageHistoryIndex - 1;
        const data = {
          pageHistoryIndex: newPageHistoryIndex,
          history,
        } as NavigationHistoryData;
        contentRef.current.navigationHistory = data;
        contentRef.current.bodyBackgroundImage = undefined;
        dispatch({
          type: 'UPDATE_NAVIGATION_HISTORY',
          data,
        });
        return;
      }
      if (type === 'increment' && pageHistoryIndex + 1 < history.length) {
        const newPageHistoryIndex = pageHistoryIndex + 1;
        const data = {
          pageHistoryIndex: newPageHistoryIndex,
          history,
        } as NavigationHistoryData;
        contentRef.current.navigationHistory = data;
        contentRef.current.bodyBackgroundImage = undefined;
        dispatch({
          type: 'UPDATE_NAVIGATION_HISTORY',
          data,
        });
        return;
      }
      if (type === 'home') {
        const data: NavigationHistoryData = {
          history: [{ pageTitle: 'Home' }],
          pageHistoryIndex: 0,
        };
        contentRef.current.navigationHistory = data;
        contentRef.current.bodyBackgroundImage = undefined;
        dispatch({
          type: 'UPDATE_NAVIGATION_HISTORY',
          data,
        });
      }
    },
    []
  );

  const updateMultipleSelections = React.useCallback(
    (id: string, selectionType: QueueTypes, type: 'add' | 'remove') => {
      if (
        contentRef.current.multipleSelectionsData.selectionType &&
        selectionType !==
          contentRef.current.multipleSelectionsData.selectionType
      )
        return;
      let { multipleSelections } = contentRef.current.multipleSelectionsData;
      if (type === 'add') {
        if (multipleSelections.includes(id)) return;
        multipleSelections.push(id);
      } else if (type === 'remove') {
        if (!multipleSelections.includes(id)) return;
        multipleSelections = multipleSelections.filter(
          (selection) => selection !== id
        );
      }

      contentRef.current.multipleSelectionsData.multipleSelections =
        multipleSelections;
      contentRef.current.multipleSelectionsData.selectionType = selectionType;
      dispatch({
        type: 'UPDATE_MULTIPLE_SELECTIONS_DATA',
        data: {
          ...contentRef.current.multipleSelectionsData,
          selectionType,
          multipleSelections,
        } as MultipleSelectionData,
      });
    },
    []
  );

  const toggleMultipleSelections = React.useCallback(
    (
      isEnabled?: boolean,
      selectionType?: QueueTypes,
      addSelections?: string[]
    ) => {
      if (typeof isEnabled === 'boolean') {
        contentRef.current.multipleSelectionsData.selectionType = selectionType;
        if (Array.isArray(addSelections) && isEnabled === true)
          contentRef.current.multipleSelectionsData.multipleSelections.push(
            ...addSelections
          );
        if (isEnabled === false) {
          contentRef.current.multipleSelectionsData.multipleSelections = [];
          contentRef.current.multipleSelectionsData.selectionType = undefined;
        }
        contentRef.current.multipleSelectionsData.isEnabled = isEnabled;
        dispatch({
          type: 'UPDATE_MULTIPLE_SELECTIONS_DATA',
          data: {
            ...contentRef.current.multipleSelectionsData,
          } as MultipleSelectionData,
        });
      }
    },
    []
  );

  const changeCurrentActivePage = React.useCallback(
    (pageClass: PageTitles, data?: PageData) => {
      const { navigationHistory } = contentRef.current;
      if (
        navigationHistory.history[navigationHistory.pageHistoryIndex]
          .pageTitle === pageClass
      ) {
        if (
          navigationHistory.history[navigationHistory.pageHistoryIndex].data !==
          data
        ) {
          updateCurrentlyActivePageData((currentData) => ({
            ...currentData,
            ...data,
          }));
        }
        // else updatePageHistoryIndex('increment');
      } else {
        const pageData = {
          pageTitle: pageClass,
          data,
        };
        navigationHistory.history = navigationHistory.history.slice(
          0,
          navigationHistory.pageHistoryIndex + 1
        );
        navigationHistory.history.push(pageData);
        navigationHistory.pageHistoryIndex += 1;
        contentRef.current.navigationHistory = navigationHistory;
        contentRef.current.bodyBackgroundImage = undefined;
        toggleMultipleSelections(false);
        dispatch({
          type: 'UPDATE_NAVIGATION_HISTORY',
          data: navigationHistory,
        });
      }
    },
    [toggleMultipleSelections, updateCurrentlyActivePageData]
  );

  const updateMiniPlayerStatus = React.useCallback(
    (isVisible: boolean) => {
      if (content.player.isMiniPlayer !== isVisible) {
        dispatch({ type: 'UPDATE_MINI_PLAYER_STATE', data: isVisible });
        contentRef.current.player.isMiniPlayer = isVisible;
      }
    },
    [content.player.isMiniPlayer]
  );

  const toggleIsFavorite = React.useCallback(
    (isFavorite?: boolean, onlyChangeCurrentSongData = false) => {
      const newFavorite =
        isFavorite ?? !contentRef.current.currentSongData.isAFavorite;
      if (
        contentRef.current.currentSongData.isAFavorite !== newFavorite &&
        !onlyChangeCurrentSongData
      ) {
        window.api
          .toggleLikeSongs(
            [contentRef.current.currentSongData.songId],
            newFavorite
          )
          .then((res) => {
            if (res && res.likes.length + res.dislikes.length > 0) {
              contentRef.current.currentSongData.isAFavorite = newFavorite;
              return dispatch({
                type: 'TOGGLE_IS_FAVORITE_STATE',
                data: newFavorite,
              });
            }
            return undefined;
          })
          .catch((err) => console.error(err));
      }
      if (typeof isFavorite === 'boolean') {
        contentRef.current.currentSongData.isAFavorite = isFavorite;
        return dispatch({
          type: 'TOGGLE_IS_FAVORITE_STATE',
          data: isFavorite,
        });
      }
      return undefined;
    },
    []
  );

  const updateVolume = React.useCallback((volume: number) => {
    if (fadeInIntervalId.current) clearInterval(fadeInIntervalId.current);
    if (fadeOutIntervalId.current) clearInterval(fadeOutIntervalId.current);
    window.api
      .saveUserData('volume.value', volume)
      .then(() => {
        contentRef.current.player.volume.value = volume;
        return dispatch({
          type: 'UPDATE_VOLUME_VALUE',
          data: volume,
        });
      })
      .catch((err) => console.error(err));
  }, []);

  const updateSongPosition = React.useCallback((position: number) => {
    if (position >= 0 && position <= player.duration)
      player.currentTime = position;
  }, []);

  const toggleMutedState = React.useCallback(
    (isMute?: boolean) => {
      if (isMute !== undefined) {
        if (isMute !== content.player.volume.isMuted) {
          dispatch({ type: 'UPDATE_MUTED_STATE', data: isMute });
          contentRef.current.player.volume.isMuted = isMute;
        }
      } else {
        dispatch({ type: 'UPDATE_MUTED_STATE' });
        contentRef.current.player.volume.isMuted =
          !contentRef.current.player.volume.isMuted;
      }
    },
    [content.player.volume.isMuted]
  );

  const manageKeyboardShortcuts = React.useCallback(
    (e: KeyboardEvent) => {
      const ctrlCombinations = [
        'ArrowUp',
        'ArrowDown',
        'ArrowRight',
        'ArrowLeft',
        'm',
        's',
        't',
        'h',
        'l',
        'n',
        'q',
      ];
      const shiftCombinations = ['ArrowRight', 'ArrowLeft'];
      if (
        (e.ctrlKey && ctrlCombinations.some((x) => e.key === x)) ||
        (e.shiftKey && shiftCombinations.some((x) => e.key === x)) ||
        e.code === 'Space'
      )
        e.preventDefault();

      // ctrl combinations
      if (e.ctrlKey && e.key === 'ArrowUp')
        updateVolume(player.volume + 0.05 <= 1 ? player.volume * 100 + 5 : 100);
      else if (e.ctrlKey && e.key === 'ArrowDown')
        updateVolume(player.volume - 0.05 >= 0 ? player.volume * 100 - 5 : 0);
      else if (e.ctrlKey && e.key === 'm')
        toggleMutedState(!contentRef.current.player.volume.isMuted);
      else if (e.ctrlKey && e.key === 'ArrowRight') handleSkipForwardClick();
      else if (e.ctrlKey && e.key === 'ArrowLeft') handleSkipBackwardClick();
      else if (e.ctrlKey && e.key === 's') toggleShuffling();
      else if (e.ctrlKey && e.key === 't') toggleRepeat();
      else if (e.ctrlKey && e.key === 'h') toggleIsFavorite();
      else if (e.ctrlKey && e.key === 'l') {
        const currentlyActivePage =
          content.navigationHistory.history[
            content.navigationHistory.pageHistoryIndex
          ];
        if (currentlyActivePage.pageTitle === 'Lyrics')
          changeCurrentActivePage('Home');
        else changeCurrentActivePage('Lyrics');
      } else if (e.ctrlKey && e.key === 'n')
        updateMiniPlayerStatus(!content.player.isMiniPlayer);
      else if (e.ctrlKey && e.key === 'q') {
        const currentlyActivePage =
          content.navigationHistory.history[
            content.navigationHistory.pageHistoryIndex
          ];
        if (currentlyActivePage.pageTitle === 'CurrentQueue')
          changeCurrentActivePage('Home');
        else changeCurrentActivePage('CurrentQueue');
      }
      // default combinations
      else if (e.code === 'Space') toggleSongPlayback();
      // shift combinations
      else if (e.shiftKey && e.key === 'ArrowLeft') {
        if (player.currentTime - 10 >= 0) player.currentTime -= 10;
        else player.currentTime = 0;
      } else if (e.shiftKey && e.key === 'ArrowRight') {
        if (player.currentTime + 10 < player.duration) player.currentTime += 10;
      }
      // alt combinations
      else if (e.altKey && e.key === 'Home') updatePageHistoryIndex('home');
      else if (e.altKey && e.key === 'ArrowLeft')
        updatePageHistoryIndex('decrement');
      else if (e.altKey && e.key === 'ArrowRight')
        updatePageHistoryIndex('increment');
    },
    [
      updateVolume,
      toggleMutedState,
      handleSkipForwardClick,
      handleSkipBackwardClick,
      toggleShuffling,
      toggleRepeat,
      toggleIsFavorite,
      updateMiniPlayerStatus,
      content.player.isMiniPlayer,
      content.navigationHistory.history,
      content.navigationHistory.pageHistoryIndex,
      toggleSongPlayback,
      updatePageHistoryIndex,
      changeCurrentActivePage,
    ]
  );

  const updatePageSortingOrder = React.useCallback(
    (page: PageSortTypes, state: unknown) => {
      if (content.userData) {
        const updatedUserData = content.userData;
        if (page === 'sortingStates.songsPage')
          updatedUserData.sortingStates.songsPage = state as SongSortTypes;
        if (page === 'sortingStates.artistsPage')
          updatedUserData.sortingStates.artistsPage = state as ArtistSortTypes;
        if (page === 'sortingStates.albumsPage')
          updatedUserData.sortingStates.albumsPage = state as AlbumSortTypes;
        if (page === 'sortingStates.genresPage')
          updatedUserData.sortingStates.genresPage = state as GenreSortTypes;
        window.api.savePageSortingState(page, state);
        dispatch({ type: 'USER_DATA_CHANGE', data: updatedUserData });
      }
    },
    [content.userData]
  );

  const displayUnsupportedFileMessage = React.useCallback(
    (path: string) => {
      const fileType = path.split('.').at(-1)?.replace('.', '') ?? path;
      const isLetterAVowel = (letter: string) => /^[aeiou]/gm.test(letter);
      const { supportedMusicExtensions } = packageFile.appPreferences;

      const supportedExtensionComponents = supportedMusicExtensions.map(
        (ext, index) => (
          <>
            <span className="underline">{ext}</span>
            {index > 0 && index !== supportedMusicExtensions.length - 1 && (
              <span className="mr-1">,</span>
            )}
          </>
        )
      );

      changePromptMenuData(
        true,
        <div>
          <div className="title-container mb-4 text-3xl font-medium">
            Unsupported Audio File
          </div>
          <div className="description">
            You are trying to open {isLetterAVowel(fileType[0]) ? 'an' : 'a'}{' '}
            <span className="underline">{fileType}</span> file which is not
            supported by this app.
            <br />
            Currently we only support {supportedExtensionComponents} songs.
          </div>
          <div className="buttons-container mt-12 flex justify-end">
            <Button
              label="OK"
              className="ok-btn w-[10rem] rounded-md !bg-background-color-3 text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:text-font-color-black dark:hover:border-background-color-3"
              clickHandler={() => {
                changePromptMenuData(false);
              }}
            />
          </div>
        </div>
      );
    },
    [changePromptMenuData]
  );

  const updateUserData = React.useCallback(
    async (
      callback: (prevState: UserData) => UserData | Promise<UserData> | void
    ) => {
      try {
        const updatedUserData = await callback(contentRef.current.userData);
        if (typeof updatedUserData === 'object') {
          dispatch({ type: 'USER_DATA_CHANGE', data: updatedUserData });
          contentRef.current.userData = updatedUserData;
        }
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  const onSongDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      console.log(e.dataTransfer.files);
      if (e.dataTransfer.files.length > 0) {
        if (
          packageFile.appPreferences.supportedMusicExtensions.some((type) =>
            e.dataTransfer.files[0].path.endsWith(type)
          )
        )
          fetchSongFromUnknownSource(e.dataTransfer.files[0].path);
        else
          displayUnsupportedFileMessage(
            e.dataTransfer.files[0].path || e.dataTransfer.files[0].name
          );
      }
      if (AppRef.current) AppRef.current.classList.remove('song-drop');
    },
    [displayUnsupportedFileMessage, fetchSongFromUnknownSource]
  );

  const updateCurrentSongData = React.useCallback(
    (callback: (prevData: AudioPlayerData) => AudioPlayerData) => {
      const updatedData = callback(contentRef.current.currentSongData);
      if (updatedData) {
        contentRef.current.currentSongData = updatedData;
        dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: updatedData });
      }
    },
    []
  );

  const clearAudioPlayerData = React.useCallback(() => {
    toggleSongPlayback(false);
    player.currentTime = 0;
    player.pause();
    dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: {} });
    contentRef.current.currentSongData = {} as AudioPlayerData;
    addNewNotifications([
      {
        id: 'songPausedOnDelete',
        delay: 7500,
        content: (
          <span>
            Current song playback paused because the song was deleted.
          </span>
        ),
      },
    ]);
  }, [addNewNotifications, toggleSongPlayback]);

  const updateBodyBackgroundImage = React.useCallback(
    (isVisible: boolean, src?: string) => {
      if (!contentRef.current.userData.preferences.disableBackgroundArtworks) {
        if (isVisible)
          if (src) {
            contentRef.current.bodyBackgroundImage = src;
            return dispatch({
              type: 'UPDATE_BODY_BACKGROUND_IMAGE',
              data: src,
            });
          } else {
            contentRef.current.bodyBackgroundImage = undefined;
            return dispatch({
              type: 'UPDATE_BODY_BACKGROUND_IMAGE',
              data: undefined,
            });
          }
      }
      contentRef.current.bodyBackgroundImage = undefined;
      return dispatch({
        type: 'UPDATE_BODY_BACKGROUND_IMAGE',
        data: undefined,
      });
    },
    []
  );

  const appContextStateValues: AppStateContextType = React.useMemo(
    () => ({
      isDarkMode: content.isDarkMode,
      contextMenuData: content.contextMenuData,
      PromptMenuData: content.PromptMenuData,
      currentSongData: {
        ...content.currentSongData,
        duration: player.duration || content.currentSongData.duration,
      },
      currentlyActivePage:
        contentRef.current.navigationHistory.history[
          content.navigationHistory.pageHistoryIndex
        ],
      notificationPanelData: content.notificationPanelData,
      userData: content.userData,
      queue: refQueue.current,
      isCurrentSongPlaying: content.player.isCurrentSongPlaying,
      noOfPagesInHistory: content.navigationHistory.history.length - 1,
      pageHistoryIndex: content.navigationHistory.pageHistoryIndex,
      isMiniPlayer: content.player.isMiniPlayer,
      volume: content.player.volume.value,
      isMuted: content.player.volume.isMuted,
      isRepeating: content.player.isRepeating,
      isShuffling: content.player.isShuffling,
      isPlayerStalled: content.player.isPlayerStalled,
      bodyBackgroundImage: content.bodyBackgroundImage,
      isMultipleSelectionEnabled: content.multipleSelectionsData.isEnabled,
      multipleSelectionsData: content.multipleSelectionsData,
      appUpdatesState: content.appUpdatesState,
    }),
    [
      content.PromptMenuData,
      content.appUpdatesState,
      content.bodyBackgroundImage,
      content.contextMenuData,
      content.currentSongData,
      content.isDarkMode,
      content.multipleSelectionsData,
      content.navigationHistory.history,
      content.navigationHistory.pageHistoryIndex,
      content.notificationPanelData,
      content.player.isCurrentSongPlaying,
      content.player.isMiniPlayer,
      content.player.isPlayerStalled,
      content.player.isRepeating,
      content.player.isShuffling,
      content.player.volume.isMuted,
      content.player.volume.value,
      content.userData,
    ]
  );

  const appUpdateContextValues: AppUpdateContextType = React.useMemo(
    () => ({
      updateUserData,
      updateCurrentSongData,
      updateContextMenuData,
      changePromptMenuData,
      playSong,
      changeCurrentActivePage,
      updateCurrentlyActivePageData,
      addNewNotifications,
      updateNotifications,
      createQueue,
      updatePageHistoryIndex,
      changeQueueCurrentSongIndex,
      updateCurrentSongPlaybackState,
      updateMiniPlayerStatus,
      handleSkipBackwardClick,
      handleSkipForwardClick,
      updateSongPosition,
      updateVolume,
      toggleMutedState,
      toggleRepeat,
      toggleShuffling,
      toggleIsFavorite,
      toggleSongPlayback,
      updateQueueData,
      updatePageSortingOrder,
      clearAudioPlayerData,
      updateBodyBackgroundImage,
      updateMultipleSelections,
      toggleMultipleSelections,
      updateAppUpdatesState,
    }),
    [
      addNewNotifications,
      changeCurrentActivePage,
      changePromptMenuData,
      changeQueueCurrentSongIndex,
      clearAudioPlayerData,
      createQueue,
      handleSkipBackwardClick,
      handleSkipForwardClick,
      playSong,
      toggleIsFavorite,
      toggleMultipleSelections,
      toggleMutedState,
      toggleRepeat,
      toggleShuffling,
      toggleSongPlayback,
      updateAppUpdatesState,
      updateBodyBackgroundImage,
      updateContextMenuData,
      updateCurrentSongData,
      updateCurrentSongPlaybackState,
      updateCurrentlyActivePageData,
      updateMiniPlayerStatus,
      updateMultipleSelections,
      updateNotifications,
      updatePageHistoryIndex,
      updatePageSortingOrder,
      updateQueueData,
      updateSongPosition,
      updateUserData,
      updateVolume,
    ]
  );

  const songPositionContextValues = React.useMemo(
    () => ({
      songPosition: content.player.songPosition,
    }),
    [content.player.songPosition]
  );

  return (
    <AppContext.Provider value={appContextStateValues}>
      <AppUpdateContext.Provider value={appUpdateContextValues}>
        {!content.player.isMiniPlayer && (
          <div
            className={`App select-none ${
              content.isDarkMode
                ? 'dark bg-dark-background-color-1'
                : 'bg-background-color-1'
            } ${
              content.userData && content.userData.preferences.isReducedMotion
                ? 'reduced-motion animate-none transition-none !duration-[0] [&.dialog-menu]:!backdrop-blur-none'
                : ''
            } flex h-screen w-full flex-col items-center after:invisible after:absolute after:-z-10 after:grid after:h-full after:w-full after:place-items-center after:bg-[rgba(0,0,0,0)] after:text-4xl after:font-medium after:text-font-color-white after:content-["Drop_your_song_here"] dark:after:bg-[rgba(0,0,0,0)] dark:after:text-font-color-white [&.blurred_#title-bar]:opacity-40 [&.fullscreen_#window-controls-container]:hidden [&.song-drop]:after:visible [&.song-drop]:after:z-20 [&.song-drop]:after:border-4 [&.song-drop]:after:border-dashed [&.song-drop]:after:border-[#ccc]  [&.song-drop]:after:bg-[rgba(0,0,0,0.7)] [&.song-drop]:after:transition-[background,visibility,color] dark:[&.song-drop]:after:border-[#ccc] dark:[&.song-drop]:after:bg-[rgba(0,0,0,0.7)]`}
            ref={AppRef}
            onDragEnter={addSongDropPlaceholder}
            onDragLeave={removeSongDropPlaceholder}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={onSongDrop}
          >
            <Preloader />

            {contentRef.current.bodyBackgroundImage && (
              <div className="body-background-image-container absolute h-full w-full animate-bg-image-appear overflow-hidden bg-center transition-[filter] duration-500">
                <Img
                  className="w-full bg-cover"
                  src={contentRef.current.bodyBackgroundImage}
                  alt=""
                />
              </div>
            )}
            <ContextMenu />
            <PromptMenu />
            <TitleBar />
            <SongPositionContext.Provider value={songPositionContextValues}>
              <BodyAndSideBarContainer />
              <SongControlsContainer />
            </SongPositionContext.Provider>
          </div>
        )}
        <SongPositionContext.Provider value={songPositionContextValues}>
          {content.player.isMiniPlayer && <MiniPlayer />}
        </SongPositionContext.Provider>
      </AppUpdateContext.Provider>
    </AppContext.Provider>
  );
}
