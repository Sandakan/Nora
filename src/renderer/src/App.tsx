// ? BASE IMPORTS
import {
  type DragEvent,
  type ReactNode,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useTransition
} from 'react';
import { useStore } from '@tanstack/react-store';
import { Trans, useTranslation } from 'react-i18next';
import './assets/styles/styles.css';
import 'material-symbols/rounded.css';
import { releaseNotes, version, appPreferences } from '../../../package.json';

// ? CONTEXTS
import { AppUpdateContext, type AppUpdateContextType } from './contexts/AppUpdateContext';
// import { SongPositionContext } from './contexts/SongPositionContext';

// ? HOOKS
import useNetworkConnectivity from './hooks/useNetworkConnectivity';

// ? MAIN APP COMPONENTS
import TitleBar from './components/TitleBar/TitleBar';
import SongControlsContainer from './components/SongsControlsContainer/SongControlsContainer';
import BodyAndSideBarContainer from './components/BodyAndSidebarContainer';
import PromptMenu from './components/PromptMenu/PromptMenu';
import ContextMenu from './components/ContextMenu/ContextMenu';
import ErrorPrompt from './components/ErrorPrompt';
import Img from './components/Img';
import Preloader from './components/Preloader/Preloader';
import ErrorBoundary from './components/ErrorBoundary';
import toggleSongIsFavorite from './other/toggleSongIsFavorite';
import SuspenseLoader from './components/SuspenseLoader';

// ? PROMPTS
const ReleaseNotesPrompt = lazy(() => import('./components/ReleaseNotesPrompt/ReleaseNotesPrompt'));
const UnsupportedFileMessagePrompt = lazy(
  () => import('./components/UnsupportedFileMessagePrompt')
);
const SongUnplayableErrorPrompt = lazy(() => import('./components/SongUnplayableErrorPrompt'));
const AppShortcutsPrompt = lazy(() => import('./components/SettingsPage/AppShortcutsPrompt'));

// ? SCREENS
const MiniPlayer = lazy(() => import('./components/MiniPlayer/MiniPlayer'));
const FullScreenPlayer = lazy(() => import('./components/FullScreenPlayer/FullScreenPlayer'));

// ? UTILS
import isLatestVersion from './utils/isLatestVersion';
import roundTo from '../../common/roundTo';
import storage from './utils/localStorage';
import { isDataChanged } from './utils/hasDataChanged';
import log from './utils/log';
import throttle from './utils/throttle';
import parseNotificationFromMain from './other/parseNotificationFromMain';
import ListeningDataSession from './other/listeningDataSession';
import updateQueueOnSongPlay from './other/updateQueueOnSongPlay';
import shuffleQueueRandomly from './other/shuffleQueueRandomly';
import AudioPlayer from './other/player';
import { dispatch, store } from './store';
import { type AppReducer } from './other/appReducer';
import i18n from './i18n';
import { getShortcuts, normalizedKeys } from './other/appShortcuts';

// ? CONSTANTS
const LOW_RESPONSE_DURATION = 100;
const DURATION = 1000;

// ? INITIALIZE PLAYER
const player = new AudioPlayer();
let repetitivePlaybackErrorsCount = 0;

// ? / / / / / / /  PLAYER DEFAULT OPTIONS / / / / / / / / / / / / / /
// player.addEventListener('player/trackchange', (e) => {
//   if ('detail' in e) {
//     console.log(`player track changed to ${(e as DetailAvailableEvent<string>).detail}.`);
//   }
// });
// / / / / / / / /

const updateNetworkStatus = () => window.api.settingsHelpers.networkStatusChange(navigator.onLine);
const syncUserData = () =>
  window.api.userData
    .getUserData()
    .then((res) => {
      if (!res) return undefined;

      dispatch({ type: 'USER_DATA_CHANGE', data: res });
      dispatch({ type: 'APP_THEME_CHANGE', data: res.theme });
      return res;
    })
    .catch((err) => console.error(err));

updateNetworkStatus();
syncUserData();
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// console.log('Command line args', window.api.properties.commandLineArgs);

export default function App() {
  const { t } = useTranslation();

  // const [content, dispatch] = useReducer(reducer, DEFAULT_REDUCER_DATA);
  // // Had to use a Ref in parallel with the Reducer to avoid an issue that happens when using content.* not giving the intended data in useCallback functions even though it was added as a dependency of that function.
  // const contentRef = useRef(DEFAULT_REDUCER_DATA);

  const AppRef = useRef(null as HTMLDivElement | null);
  const storeRef = useRef<AppReducer>(undefined);

  const [, startTransition] = useTransition();
  const refStartPlay = useRef(false);

  const { isOnline } = useNetworkConnectivity();

  const addSongDropPlaceholder = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget === null) AppRef.current?.classList.add('song-drop');
  }, []);

  const removeSongDropPlaceholder = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget === null) AppRef.current?.classList.remove('song-drop');
  }, []);

  const changePromptMenuData = useCallback(
    (isVisible = false, prompt?: ReactNode | null, className = '') => {
      const promptData: PromptMenuData = { prompt, className };

      const data = {
        isVisible,
        currentActiveIndex:
          prompt && isVisible
            ? store.state.promptMenuNavigationData.prompts.length
            : prompt === null && isVisible === false
              ? 0
              : store.state.promptMenuNavigationData.currentActiveIndex,
        prompts:
          prompt && isVisible
            ? store.state.promptMenuNavigationData.prompts.concat(promptData)
            : prompt === null && isVisible === false
              ? []
              : store.state.promptMenuNavigationData.prompts
      };

      dispatch({ type: 'PROMPT_MENU_DATA_CHANGE', data });
    },
    []
  );

  const managePlaybackErrors = useCallback(
    (appError: unknown) => {
      const playerErrorData = player.error;
      console.error(appError, playerErrorData);

      const prompt = (
        <ErrorPrompt
          reason="ERROR_IN_PLAYER"
          message={
            <Trans
              i18nKey="player.errorMessage"
              components={{
                br: <br />,
                details: (
                  <details className="mt-4">
                    {playerErrorData
                      ? `CODE ${playerErrorData.code} : ${playerErrorData.message}`
                      : t('player.noErrorMessage')}
                  </details>
                )
              }}
            />
          }
          showSendFeedbackBtn
        />
      );

      if (repetitivePlaybackErrorsCount > 5) {
        changePromptMenuData(true, prompt);
        return log(
          'Playback errors exceeded the 5 errors limit.',
          { appError, playerErrorData },
          'ERROR'
        );
      }

      repetitivePlaybackErrorsCount += 1;
      const prevSongPosition = player.currentTime;
      log(`Error occurred in the player.`, { appError, playerErrorData }, 'ERROR');

      if (player.src && playerErrorData) {
        player.load();
        player.currentTime = prevSongPosition;
      } else {
        player.pause();
        changePromptMenuData(true, prompt);
      }
      return undefined;
    },
    [changePromptMenuData, t]
  );

  const handleBeforeQuitEvent = useCallback(async () => {
    storage.playback.setCurrentSongOptions('stoppedPosition', player.currentTime);
    storage.playback.setPlaybackOptions('isRepeating', store.state.player.isRepeating);
    storage.playback.setPlaybackOptions('isShuffling', store.state.player.isShuffling);
  }, []);

  const updateAppUpdatesState = useCallback((state: AppUpdatesState) => {
    store.setState((prevData) => {
      return {
        ...prevData,
        appUpdatesState: state
      };
    });
  }, []);

  const checkForAppUpdates = useCallback(() => {
    if (navigator.onLine) {
      updateAppUpdatesState('CHECKING');

      fetch(releaseNotes.json)
        .then((res) => {
          if (res.status === 200) return res.json();
          throw new Error('response status is not 200');
        })
        .then((res: Changelog) => {
          const isThereAnAppUpdate = !isLatestVersion(res.latestVersion.version, version);

          updateAppUpdatesState(isThereAnAppUpdate ? 'OLD' : 'LATEST');

          if (isThereAnAppUpdate) {
            const noUpdateNotificationForNewUpdate = storage.preferences.getPreferences(
              'noUpdateNotificationForNewUpdate'
            );
            const isUpdateIgnored = noUpdateNotificationForNewUpdate !== res.latestVersion.version;
            log('client has new updates', {
              isThereAnAppUpdate,
              noUpdateNotificationForNewUpdate,
              isUpdateIgnored
            });

            if (isUpdateIgnored) {
              changePromptMenuData(true, <ReleaseNotesPrompt />, 'release-notes px-8 py-4');
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

      console.log(`couldn't check for app updates. Check the network connection.`);
    }
  }, [changePromptMenuData, updateAppUpdatesState]);

  useEffect(
    () => {
      // check for app updates on app startup after 5 seconds.
      const timeoutId = setTimeout(checkForAppUpdates, 5000);
      // checks for app updates every 10 minutes.
      const intervalId = setInterval(checkForAppUpdates, 1000 * 60 * 15);
      return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOnline]
  );

  useEffect(() => {
    const watchForSystemThemeChanges = (
      _: unknown,
      isDarkMode: boolean,
      usingSystemTheme: boolean
    ) => {
      console.log('theme changed : isDarkMode', isDarkMode, 'usingSystemTheme', usingSystemTheme);
      const theme = {
        isDarkMode,
        useSystemTheme: usingSystemTheme
      };
      dispatch({
        type: 'APP_THEME_CHANGE',
        data: theme
      });
    };

    const watchPowerChanges = (_: unknown, isOnBatteryPower: boolean) => {
      dispatch({ type: 'UPDATE_BATTERY_POWER_STATE', data: isOnBatteryPower });
    };

    window.api.theme.listenForSystemThemeChanges(watchForSystemThemeChanges);
    window.api.battery.listenForBatteryPowerStateChanges(watchPowerChanges);
    return () => {
      window.api.theme.stoplisteningForSystemThemeChanges(watchForSystemThemeChanges);
      window.api.battery.stopListeningForBatteryPowerStateChanges(watchPowerChanges);
    };
  }, []);

  const manageWindowBlurOrFocus = useCallback((state: 'blur-sm' | 'focus') => {
    if (AppRef.current) {
      if (state === 'blur-sm') AppRef.current.classList.add('blurred');
      if (state === 'focus') AppRef.current.classList.remove('blurred');
    }
  }, []);

  const manageWindowFullscreen = useCallback((state: 'fullscreen' | 'windowed') => {
    if (AppRef.current) {
      if (state === 'fullscreen') return AppRef.current.classList.add('fullscreen');
      if (state === 'windowed') return AppRef.current.classList.remove('fullscreen');
    }
    return undefined;
  }, []);

  useEffect(() => {
    const handlePlayerErrorEvent = (err: unknown) => managePlaybackErrors(err);
    const handlePlayerPlayEvent = () => {
      dispatch({
        type: 'CURRENT_SONG_PLAYBACK_STATE',
        data: true
      });
      window.api.playerControls.songPlaybackStateChange(true);
    };
    const handlePlayerPauseEvent = () => {
      dispatch({
        type: 'CURRENT_SONG_PLAYBACK_STATE',
        data: false
      });
      window.api.playerControls.songPlaybackStateChange(false);
    };

    player.addEventListener('error', handlePlayerErrorEvent);
    player.addEventListener('play', handlePlayerPlayEvent);
    player.addEventListener('pause', handlePlayerPauseEvent);
    window.api.quitEvent.beforeQuitEvent(handleBeforeQuitEvent);

    window.api.windowControls.onWindowBlur(() => manageWindowBlurOrFocus('blur-sm'));
    window.api.windowControls.onWindowFocus(() => manageWindowBlurOrFocus('focus'));

    window.api.fullscreen.onEnterFullscreen(() => manageWindowFullscreen('fullscreen'));
    window.api.fullscreen.onLeaveFullscreen(() => manageWindowFullscreen('windowed'));

    return () => {
      player.removeEventListener('error', handlePlayerErrorEvent);
      player.removeEventListener('play', handlePlayerPlayEvent);
      player.removeEventListener('pause', handlePlayerPauseEvent);
      window.api.quitEvent.removeBeforeQuitEventListener(handleBeforeQuitEvent);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manageWindowBlurOrFocus, manageWindowFullscreen, handleBeforeQuitEvent]);

  useEffect(() => {
    const displayDefaultTitleBar = () => {
      document.title = `Nora`;
      storage.playback.setCurrentSongOptions('stoppedPosition', player.currentTime);
    };
    const playSongIfPlayable = () => {
      if (refStartPlay.current) toggleSongPlayback(true);
    };
    // const managePlayerStalledStatus = () => {
    //   dispatch({ type: 'PLAYER_WAITING_STATUS', data: true });
    // };
    // const managePlayerNotStalledStatus = () => {
    //   dispatch({ type: 'PLAYER_WAITING_STATUS', data: false });
    // };

    const handleSkipForwardClickWithParams = () => handleSkipForwardClick('PLAYER_SKIP');

    // player.addEventListener('canplay', managePlayerNotStalledStatus);
    // player.addEventListener('canplaythrough', managePlayerNotStalledStatus);
    // player.addEventListener('loadeddata', managePlayerNotStalledStatus);
    // player.addEventListener('loadedmetadata', managePlayerNotStalledStatus);

    // player.addEventListener('suspend', managePlayerStalledStatus);
    // player.addEventListener('stalled', managePlayerStalledStatus);
    // player.addEventListener('waiting', managePlayerStalledStatus);
    // player.addEventListener('progress', managePlayerStalledStatus);

    player.addEventListener('canplay', playSongIfPlayable);
    player.addEventListener('ended', handleSkipForwardClickWithParams);
    player.addEventListener('play', addSongTitleToTitleBar);
    player.addEventListener('pause', displayDefaultTitleBar);

    return () => {
      toggleSongPlayback(false);
      // player.removeEventListener('canplay', managePlayerNotStalledStatus);
      // player.removeEventListener('canplaythrough', managePlayerNotStalledStatus);
      // player.removeEventListener('loadeddata', managePlayerNotStalledStatus);
      // player.removeEventListener('loadedmetadata', managePlayerNotStalledStatus);

      // player.removeEventListener('suspend', managePlayerStalledStatus);
      // player.removeEventListener('stalled', managePlayerStalledStatus);
      // player.removeEventListener('waiting', managePlayerStalledStatus);
      // player.removeEventListener('progress', managePlayerStalledStatus);

      player.removeEventListener('canplay', playSongIfPlayable);
      player.removeEventListener('ended', handleSkipForwardClickWithParams);
      player.removeEventListener('play', addSongTitleToTitleBar);
      player.removeEventListener('pause', displayDefaultTitleBar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const dispatchCurrentSongTime = () => {
      const playerPositionChange = new CustomEvent('player/positionChange', {
        detail: roundTo(player.currentTime, 2)
      });
      document.dispatchEvent(playerPositionChange);
    };

    const lowResponseIntervalId = setInterval(() => {
      if (!player.paused) dispatchCurrentSongTime();
    }, LOW_RESPONSE_DURATION);

    const pausedResponseIntervalId = setInterval(() => {
      if (player.paused) dispatchCurrentSongTime();
    }, DURATION);

    return () => {
      clearInterval(lowResponseIntervalId);
      clearInterval(pausedResponseIntervalId);
    };
  }, []);

  useEffect(() => {
    // LOCAL STORAGE
    const { playback, preferences, queue } = storage.getAllItems();

    const syncLocalStorage = () => {
      const allItems = storage.getAllItems();
      dispatch({ type: 'UPDATE_LOCAL_STORAGE', data: allItems });

      console.log('local storage updated');
    };

    document.addEventListener('localStorage', syncLocalStorage);

    // if (playback?.volume) {
    //   dispatch({ type: 'UPDATE_VOLUME', data: playback.volume });
    // }

    if (
      store.state.navigationHistory.history.at(-1)?.pageTitle !== preferences?.defaultPageOnStartUp
    )
      changeCurrentActivePage(preferences?.defaultPageOnStartUp);

    toggleShuffling(playback?.isShuffling);
    toggleRepeat(playback?.isRepeating);

    window.api.audioLibraryControls
      .checkForStartUpSongs()
      .then((startUpSongData) => {
        if (startUpSongData) playSongFromUnknownSource(startUpSongData, true);
        else if (playback?.currentSong.songId) {
          playSong(playback?.currentSong.songId, false);

          const currSongPosition = Number(playback?.currentSong.stoppedPosition);
          player.currentTime = currSongPosition;
          // store.sta.player.songPosition = currSongPosition;
          dispatch({
            type: 'UPDATE_SONG_POSITION',
            data: currSongPosition
          });
        }
        return undefined;
      })
      .catch((err) => console.error(err));

    if (queue) {
      const updatedQueue = {
        ...store.state.localStorage.queue,
        queue: queue.queue || [],
        queueType: queue.queueType,
        queueId: queue.queueId
      };

      // dispatch({ type: 'UPDATE_QUEUE', data: updatedQueue });
      storage.queue.setQueue(updatedQueue);
    } else {
      window.api.audioLibraryControls
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

    return () => {
      document.removeEventListener('localStorage', syncLocalStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    syncUserData();

    const handleToggleSongPlayback = () => toggleSongPlayback();
    const handleSkipForwardClickListener = () => handleSkipForwardClick('PLAYER_SKIP');
    const handlePlaySongFromUnknownSource = (_: unknown, data: AudioPlayerData) =>
      playSongFromUnknownSource(data, true);

    window.api.unknownSource.playSongFromUnknownSource(handlePlaySongFromUnknownSource);

    window.api.playerControls.toggleSongPlayback(handleToggleSongPlayback);
    window.api.playerControls.skipBackwardToPreviousSong(handleSkipBackwardClick);
    window.api.playerControls.skipForwardToNextSong(handleSkipForwardClickListener);
    return () => {
      window.api.unknownSource.removePlaySongFromUnknownSourceEvent(handleToggleSongPlayback);
      window.api.playerControls.removeTogglePlaybackStateEvent(handleToggleSongPlayback);
      window.api.playerControls.removeSkipBackwardToPreviousSongEvent(handleSkipBackwardClick);
      window.api.playerControls.removeSkipForwardToNextSongEvent(handleSkipForwardClickListener);
      window.api.dataUpdates.removeDataUpdateEventListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const noticeDataUpdateEvents = (_: unknown, dataEvents: DataUpdateEvent[]) => {
      const event = new CustomEvent('app/dataUpdates', { detail: dataEvents });
      document.dispatchEvent(event);
    };

    window.api.dataUpdates.dataUpdateEvent(noticeDataUpdateEvents);

    return () => {
      window.api.dataUpdates.removeDataUpdateEventListeners();
    };
  }, []);

  const addNewNotifications = useCallback((newNotifications: AppNotification[]) => {
    if (newNotifications.length > 0) {
      const maxNotifications = 4;
      const currentNotifications = store.state.notificationPanelData.notifications;
      const newNotificationIds = newNotifications.map((x) => x.id);
      const resultNotifications = currentNotifications.filter(
        (x, index) => !newNotificationIds.some((y) => y === x.id) && index < maxNotifications
      );
      resultNotifications.unshift(...newNotifications);

      startTransition(() =>
        dispatch({
          type: 'ADD_NEW_NOTIFICATIONS',
          data: resultNotifications
        })
      );
    }
  }, []);

  const updateNotifications = useCallback(
    (callback: (currentNotifications: AppNotification[]) => AppNotification[]) => {
      const currentNotifications = store.state.notificationPanelData.notifications;
      const updatedNotifications = callback(currentNotifications);

      dispatch({ type: 'UPDATE_NOTIFICATIONS', data: updatedNotifications });
    },
    []
  );

  const toggleSongPlayback = useCallback(
    (startPlay?: boolean) => {
      if (store.state.currentSongData?.songId) {
        if (typeof startPlay !== 'boolean' || startPlay === player.paused) {
          if (player.readyState > 0) {
            if (player.paused) {
              player
                .play()
                .then(() => {
                  const playbackChange = new CustomEvent('player/playbackChange');
                  return player.dispatchEvent(playbackChange);
                })
                .catch((err) => managePlaybackErrors(err));
              return player.play();
            }
            if (player.ended) {
              player.currentTime = 0;
              player
                .play()
                .then(() => {
                  const playbackChange = new CustomEvent('player/playbackChange');
                  return player.dispatchEvent(playbackChange);
                })
                .catch((err) => managePlaybackErrors(err));
              return player.play();
            }
            const playbackChange = new CustomEvent('player/playbackChange');
            player.dispatchEvent(playbackChange);
            return player.pause();
          }
        }
      } else
        addNewNotifications([
          {
            id: 'noSongToPlay',
            content: t('notifications.selectASongToPlay'),
            iconName: 'error',
            iconClassName: 'material-icons-round-outlined'
          }
        ]);
      return undefined;
    },
    [addNewNotifications, t, managePlaybackErrors]
  );

  const displayMessageFromMain = useCallback(
    (_: unknown, messageCode: MessageCodes, data?: Record<string, unknown>) => {
      // const isNotificationWithProgress = data && 'total' in data && 'value' in data;

      // if(!isNotificationWithProgress)
      throttle(() => {
        const notification = parseNotificationFromMain(messageCode, data);

        addNewNotifications([notification]);
      }, 1000)();
    },
    [addNewNotifications]
  );

  useEffect(() => {
    window.api.messages.getMessageFromMain(displayMessageFromMain);
    return () => {
      window.api.messages.removeMessageToRendererEventListener(displayMessageFromMain);
    };
  }, [displayMessageFromMain]);

  const handleContextMenuVisibilityUpdate = useCallback(() => {
    if (store.state.contextMenuData.isVisible) {
      dispatch({
        type: 'CONTEXT_MENU_VISIBILITY_CHANGE',
        data: false
      });
      store.state.contextMenuData.isVisible = false;
    }
  }, []);

  const addSongTitleToTitleBar = useCallback(() => {
    if (store.state.currentSongData.title && store.state.currentSongData.artists)
      document.title = `${store.state.currentSongData.title} - ${
        Array.isArray(store.state.currentSongData.artists) &&
        store.state.currentSongData.artists.map((artist) => artist.name).join(', ')
      }`;
  }, []);

  const toggleRepeat = useCallback((newState?: RepeatTypes) => {
    const repeatState =
      newState ||
      (store.state.player.isRepeating === 'false'
        ? 'repeat'
        : store.state.player.isRepeating === 'repeat'
          ? 'repeat-1'
          : 'false');

    dispatch({
      type: 'UPDATE_IS_REPEATING_STATE',
      data: repeatState
    });
  }, []);

  const recordRef = useRef<ListeningDataSession>(undefined);

  const recordListeningData = useCallback(
    (songId: string, duration: number, isRepeating = false, isKnownSource = true) => {
      if (recordRef?.current?.songId !== songId || isRepeating) {
        if (isRepeating)
          console.warn(`Added another song record instance for the repetition of ${songId}`);
        if (recordRef.current) recordRef.current.stopRecording();

        const listeningDataSession = new ListeningDataSession(songId, duration, isKnownSource);
        listeningDataSession.recordListeningData();

        player.addEventListener(
          'pause',
          () => {
            listeningDataSession.isPaused = true;
          },
          { signal: listeningDataSession.abortController.signal }
        );
        player.addEventListener(
          'play',
          () => {
            listeningDataSession.isPaused = false;
          },
          { signal: listeningDataSession.abortController.signal }
        );
        player.addEventListener(
          'seeked',
          () => {
            listeningDataSession.addSeekPosition = player.currentTime;
          },
          { signal: listeningDataSession.abortController.signal }
        );

        recordRef.current = listeningDataSession;
      }
    },
    []
  );

  const setDynamicThemesFromSongPalette = useCallback((palette?: NodeVibrantPalette) => {
    const manageBrightness = (
      values: [number, number, number],
      range?: { min?: number; max?: number }
    ): [number, number, number] => {
      const max = range?.max || 1;
      const min = range?.min || 0.9;

      const [h, s, l] = values;

      const updatedL = l >= min ? (l <= max ? l : max) : min;
      return [h, s, updatedL];
    };
    const manageSaturation = (
      values: [number, number, number],
      range?: { min?: number; max?: number }
    ): [number, number, number] => {
      const max = range?.max || 1;
      const min = range?.min || 0.9;

      const [h, s, l] = values;

      const updatedS = s >= min ? (s <= max ? s : max) : min;
      return [h, updatedS, l];
    };

    const generateColor = (values: [number, number, number]) => {
      const [lh, ls, ll] = values;
      const color = `${lh * 360} ${ls * 100}% ${ll * 100}%`;
      return color;
    };

    const resetStyles = () => {
      const root = document.getElementById('root');

      if (root) {
        root.style.removeProperty('--side-bar-background');
        root.style.removeProperty('--background-color-2');
        root.style.removeProperty('--dark-background-color-2');
        root.style.removeProperty('--background-color-3');
        root.style.removeProperty('--dark-background-color-3');
        root.style.removeProperty('--text-color-highlight');
        root.style.removeProperty('--dark-text-color-highlight');
        root.style.removeProperty('--seekbar-background-color');
        root.style.removeProperty('--dark-seekbar-background-color');
        root.style.removeProperty('--scrollbar-thumb-background-color');
        root.style.removeProperty('--dark-scrollbar-thumb-background-color');
        root.style.removeProperty('--seekbar-track-background-color');
        root.style.removeProperty('--dark-seekbar-track-background-color');
        root.style.removeProperty('--text-color-highlight-2');
        root.style.removeProperty('--dark-text-color-highlight-2');
        root.style.removeProperty('--slider-opacity');
        root.style.removeProperty('--dark-slider-opacity');
        root.style.removeProperty('--context-menu-list-hover');
        root.style.removeProperty('--dark-context-menu-list-hover');
      }
    };

    const root = document.getElementById('root');
    if (root) {
      if (palette) {
        if (
          palette?.LightVibrant &&
          palette?.DarkVibrant &&
          palette?.LightMuted &&
          palette?.DarkMuted &&
          palette?.Vibrant &&
          palette?.Muted
        ) {
          const highLightVibrant = generateColor(manageBrightness(palette.LightVibrant.hsl));
          const mediumLightVibrant = generateColor(
            manageBrightness(palette.LightVibrant.hsl, { min: 0.75 })
          );
          const darkLightVibrant = generateColor(
            manageSaturation(
              manageBrightness(palette.LightVibrant.hsl, {
                max: 0.2,
                min: 0.2
              }),
              { max: 0.05, min: 0.05 }
            )
          );
          const highVibrant = generateColor(manageBrightness(palette.Vibrant.hsl, { min: 0.7 }));

          const lightVibrant = generateColor(palette.LightVibrant.hsl);
          const darkVibrant = generateColor(palette.DarkVibrant.hsl);
          // const lightMuted = generateColor(palette.LightMuted.hsl);
          // const darkMuted = generateColor(palette.DarkMuted.hsl);
          // const vibrant = generateColor(palette.Vibrant.hsl);
          // const muted = generateColor(palette.Muted.hsl);

          root.style.setProperty('--side-bar-background', highLightVibrant, 'important');
          root.style.setProperty('--background-color-2', highLightVibrant, 'important');

          root.style.setProperty('--context-menu-list-hover', highLightVibrant, 'important');
          root.style.setProperty('--dark-context-menu-list-hover', highLightVibrant, 'important');

          root.style.setProperty('--dark-background-color-2', darkLightVibrant, 'important');

          root.style.setProperty('--background-color-3', highVibrant, 'important');
          root.style.setProperty('--dark-background-color-3', lightVibrant, 'important');

          root.style.setProperty('--text-color-highlight', darkVibrant, 'important');
          root.style.setProperty('--dark-text-color-highlight', lightVibrant, 'important');

          root.style.setProperty('--seekbar-background-color', darkVibrant, 'important');
          root.style.setProperty('--dark-seekbar-background-color', lightVibrant, 'important');

          root.style.setProperty(
            '--scrollbar-thumb-background-color',
            mediumLightVibrant,
            'important'
          );
          root.style.setProperty(
            '--dark-scrollbar-thumb-background-color',
            mediumLightVibrant,
            'important'
          );

          root.style.setProperty('--seekbar-track-background-color', darkVibrant, 'important');
          root.style.setProperty(
            '--dark-seekbar-track-background-color',
            darkLightVibrant,
            'important'
          );

          root.style.setProperty('--slider-opacity', '0.25', 'important');
          root.style.setProperty('--dark-slider-opacity', '1', 'important');

          root.style.setProperty('--text-color-highlight-2', darkVibrant, 'important');
          root.style.setProperty('--dark-text-color-highlight-2', lightVibrant, 'important');
        }
      } else resetStyles();
    }
    return resetStyles;
  }, []);

  const isImageBasedDynamicThemesEnabled = useStore(
    store,
    (state) => state.localStorage.preferences.enableImageBasedDynamicThemes
  );

  useEffect(() => {
    setDynamicThemesFromSongPalette(undefined);
    const isDynamicThemesEnabled =
      isImageBasedDynamicThemesEnabled && store.state.currentSongData.paletteData;

    const resetStyles = setDynamicThemesFromSongPalette(
      isDynamicThemesEnabled ? store.state.currentSongData.paletteData : undefined
    );

    return () => {
      resetStyles();
    };
  }, [isImageBasedDynamicThemesEnabled, setDynamicThemesFromSongPalette]);

  const playSong = useCallback(
    (songId: string, isStartPlay = true, playAsCurrentSongIndex = false) => {
      repetitivePlaybackErrorsCount = 0;
      if (typeof songId === 'string') {
        if (store.state.currentSongData.songId === songId) return toggleSongPlayback();
        console.time('timeForSongFetch');

        return window.api.audioLibraryControls
          .getSong(songId)
          .then((songData) => {
            console.timeEnd('timeForSongFetch');
            if (songData) {
              console.log('playSong', songId, songData.path);

              dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: songData });

              storage.playback.setCurrentSongOptions('songId', songData.songId);

              player.src = `${songData.path}?ts=${Date.now()}`;

              const trackChangeEvent = new CustomEvent('player/trackchange', {
                detail: songId
              });
              player.dispatchEvent(trackChangeEvent);

              refStartPlay.current = isStartPlay;

              if (isStartPlay) toggleSongPlayback();

              if (songData.paletteData && isImageBasedDynamicThemesEnabled)
                setDynamicThemesFromSongPalette(songData.paletteData);

              recordListeningData(songId, songData.duration);

              // dispatch({
              //   type: 'UPDATE_QUEUE',
              //   data: updateQueueOnSongPlay(
              //     store.state.localStorage.queue,
              //     songData.songId,
              //     playAsCurrentSongIndex
              //   )
              // });
              storage.queue.setQueue(
                updateQueueOnSongPlay(
                  store.state.localStorage.queue,
                  songData.songId,
                  playAsCurrentSongIndex
                )
              );
            } else console.log(songData);
            return undefined;
          })
          .catch((err) => {
            console.error(err);
            changePromptMenuData(true, <SongUnplayableErrorPrompt err={err} />);
          });
      }
      changePromptMenuData(
        true,
        <ErrorPrompt
          reason="SONG_ID_UNDEFINED"
          message={`${t('player.errorTitle')}\nERROR : SONG_ID_UNDEFINED`}
        />
      );
      return log(
        'ERROR OCCURRED WHEN TRYING TO PLAY A S0NG.',
        {
          error: 'Song id is of unknown type',
          songIdType: typeof songId,
          songId
        },
        'ERROR'
      );
    },
    [
      changePromptMenuData,
      t,
      toggleSongPlayback,
      isImageBasedDynamicThemesEnabled,
      setDynamicThemesFromSongPalette,
      recordListeningData
    ]
  );

  const playSongFromUnknownSource = useCallback(
    (audioPlayerData: AudioPlayerData, isStartPlay = true) => {
      if (audioPlayerData) {
        const { isKnownSource } = audioPlayerData;
        if (isKnownSource) playSong(audioPlayerData.songId);
        else {
          console.log('playSong', audioPlayerData.path);
          dispatch({
            type: 'CURRENT_SONG_DATA_CHANGE',
            data: audioPlayerData
          });
          player.src = `${audioPlayerData.path}?ts=${Date.now()}`;
          refStartPlay.current = isStartPlay;
          if (isStartPlay) toggleSongPlayback();

          recordListeningData(audioPlayerData.songId, audioPlayerData.duration, undefined, false);
        }
      }
    },
    [playSong, recordListeningData, toggleSongPlayback]
  );

  const fetchSongFromUnknownSource = useCallback(
    (songPath: string) => {
      window.api.unknownSource
        .getSongFromUnknownSource(songPath)
        .then((res) => playSongFromUnknownSource(res, true))
        .catch((err) => {
          console.error(err);
          changePromptMenuData(true, <SongUnplayableErrorPrompt err={err} />);
        });
    },
    [playSongFromUnknownSource, changePromptMenuData]
  );

  const changeQueueCurrentSongIndex = useCallback(
    (currentSongIndex: number, isPlaySong = true) => {
      console.log('currentSongIndex', currentSongIndex);
      // dispatch({ type: 'UPDATE_QUEUE_CURRENT_SONG_INDEX', data: currentSongIndex });

      storage.queue.setCurrentSongIndex(currentSongIndex);

      if (isPlaySong) playSong(store.state.localStorage.queue.queue[currentSongIndex]);
    },
    [playSong]
  );

  const handleSkipBackwardClick = useCallback(() => {
    const queue = store.state.localStorage.queue;
    const { currentSongIndex } = queue;
    if (player.currentTime > 5) {
      player.currentTime = 0;
    } else if (typeof currentSongIndex === 'number') {
      if (currentSongIndex === 0) {
        if (queue.queue.length > 0) changeQueueCurrentSongIndex(queue.queue.length - 1);
      } else changeQueueCurrentSongIndex(currentSongIndex - 1);
    } else changeQueueCurrentSongIndex(0);
  }, [changeQueueCurrentSongIndex]);

  const handleSkipForwardClick = useCallback(
    (reason: SongSkipReason = 'USER_SKIP') => {
      const queue = store.state.localStorage.queue;

      const { currentSongIndex } = queue;
      if (store.state.player.isRepeating === 'repeat-1' && reason !== 'USER_SKIP') {
        player.currentTime = 0;
        toggleSongPlayback(true);
        recordListeningData(
          store.state.currentSongData.songId,
          store.state.currentSongData.duration,
          true
        );

        window.api.audioLibraryControls.updateSongListeningData(
          store.state.currentSongData.songId,
          'listens',
          1
        );
      } else if (typeof currentSongIndex === 'number') {
        if (queue.queue.length > 0) {
          if (queue.queue.length - 1 === currentSongIndex) {
            if (store.state.player.isRepeating === 'repeat') changeQueueCurrentSongIndex(0);
          } else changeQueueCurrentSongIndex(currentSongIndex + 1);
        } else console.log('Queue is empty.');
      } else if (queue.queue.length > 0) changeQueueCurrentSongIndex(0);
    },
    [changeQueueCurrentSongIndex, recordListeningData, toggleSongPlayback]
  );

  useEffect(() => {
    let artworkPath: string | undefined;

    const updateMediaSessionMetaData = () => {
      if (store.state.currentSongData.artwork !== undefined) {
        if (typeof store.state.currentSongData.artwork === 'object') {
          const blob = new Blob([store.state.currentSongData.artwork]);
          artworkPath = URL.createObjectURL(blob);
        } else {
          artworkPath = `data:;base64,${store.state.currentSongData.artwork}`;
        }
      } else artworkPath = '';

      navigator.mediaSession.metadata = new MediaMetadata({
        title: store.state.currentSongData.title,
        artist: Array.isArray(store.state.currentSongData.artists)
          ? store.state.currentSongData.artists.map((artist) => artist.name).join(', ')
          : t('common.unknownArtist'),
        album: store.state.currentSongData.album
          ? store.state.currentSongData.album.name || t('common.unknownAlbum')
          : t('common.unknownAlbum'),
        artwork: [
          {
            src: artworkPath,
            sizes: '1000x1000',
            type: 'image/webp'
          }
        ]
      });
      navigator.mediaSession.setPositionState({
        duration: player.duration,
        playbackRate: player.playbackRate,
        position: player.currentTime
      });

      navigator.mediaSession.setActionHandler('pause', () => toggleSongPlayback(false));
      navigator.mediaSession.setActionHandler('play', () => toggleSongPlayback(true));
      navigator.mediaSession.setActionHandler('previoustrack', handleSkipBackwardClick);
      navigator.mediaSession.setActionHandler(`nexttrack`, () =>
        handleSkipForwardClick('PLAYER_SKIP')
      );
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        /* Code excerpted. */
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        /* Code excerpted. */
      });
      navigator.mediaSession.setActionHandler('seekto', () => {
        /* Code excerpted. */
      });
      navigator.mediaSession.playbackState = store.state.player.isCurrentSongPlaying
        ? 'playing'
        : 'paused';
    };

    player.addEventListener('play', updateMediaSessionMetaData);
    player.addEventListener('pause', updateMediaSessionMetaData);

    return () => {
      if (artworkPath) URL.revokeObjectURL(artworkPath);
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.setPositionState(undefined);
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekto', null);

      player.removeEventListener('play', updateMediaSessionMetaData);
      player.removeEventListener('pause', updateMediaSessionMetaData);
    };
  }, [handleSkipBackwardClick, handleSkipForwardClick, t, toggleSongPlayback]);

  const setDiscordRpcActivity = useCallback(() => {
    if (store.state.currentSongData) {
      const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
      };
      const title = truncateText(
        store.state.currentSongData?.title ?? t('discordrpc.untitledSong'),
        128
      );
      const artists = truncateText(
        `${store.state.currentSongData.artists?.map((artist) => artist.name).join(', ') || t('discordrpc.unknownArtist')}`,
        128
      );

      const now = Date.now();
      const firstArtistWithArtwork = store.state.currentSongData?.artists?.find(
        (artist) => artist.onlineArtworkPaths !== undefined
      );
      const onlineArtworkLink = firstArtistWithArtwork?.onlineArtworkPaths?.picture_small;
      window.api.playerControls.setDiscordRpcActivity({
        timestamps: {
          start: player.paused ? undefined : now - (player.currentTime ?? 0) * 1000,
          end: player.paused
            ? undefined
            : now + ((player.duration ?? 0) - (player.currentTime ?? 0)) * 1000
        },
        details: title,
        state: artists,
        assets: {
          large_image: 'nora_logo',
          //large_text: 'Nora', //Large text will also be displayed as the 3rd line (state) so I skipped it for now
          small_image: onlineArtworkLink ?? 'song_artwork',
          small_text: firstArtistWithArtwork
            ? firstArtistWithArtwork.name
            : t('discordrpc.playingASong')
        },
        buttons: [
          {
            label: t('discordrpc.noraOnGitHub'),
            url: 'https://github.com/Sandakan/Nora/'
          }
        ]
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    player.addEventListener('play', setDiscordRpcActivity);
    player.addEventListener('pause', setDiscordRpcActivity);
    player.addEventListener('seeked', setDiscordRpcActivity);

    return () => {
      player.removeEventListener('play', setDiscordRpcActivity);
      player.removeEventListener('pause', setDiscordRpcActivity);
      player.removeEventListener('seeked', setDiscordRpcActivity);
    };
  }, [setDiscordRpcActivity]);

  const toggleShuffling = useCallback((isShuffling?: boolean) => {
    dispatch({ type: 'TOGGLE_SHUFFLE_STATE', data: isShuffling });
  }, []);

  const shuffleQueue = useCallback(
    (songIds: string[], currentSongIndex?: number) => {
      toggleShuffling(true);
      return shuffleQueueRandomly(songIds, currentSongIndex);
    },
    [toggleShuffling]
  );

  const createQueue = useCallback(
    (
      newQueue: string[],
      queueType: QueueTypes,
      isShuffleQueue = store.state.player.isShuffling,
      queueId?: string,
      startPlaying = false
    ) => {
      const queue = {
        currentSongIndex: 0,
        queue: newQueue,
        queueId,
        queueType
      } as Queue;

      if (isShuffleQueue) {
        const { shuffledQueue, positions } = shuffleQueue(queue.queue);
        queue.queue = shuffledQueue;

        if (positions.length > 0) queue.queueBeforeShuffle = positions;
        queue.currentSongIndex = 0;
      } else toggleShuffling(false);

      storage.queue.setQueue(queue);
      if (startPlaying) changeQueueCurrentSongIndex(0);
    },
    [changeQueueCurrentSongIndex, shuffleQueue, toggleShuffling]
  );

  const updateQueueData = useCallback(
    (
      currentSongIndex?: number | null,
      newQueue?: string[],
      isShuffleQueue = false,
      playCurrentSongIndex = true,
      restoreAndClearPreviousQueue = false
    ) => {
      const currentQueue = store.state.localStorage.queue;
      const queue: Queue = {
        ...currentQueue,
        currentSongIndex:
          typeof currentSongIndex === 'number' || currentSongIndex === null
            ? currentSongIndex
            : currentQueue.currentSongIndex,
        queue: newQueue ?? currentQueue.queue
      };

      if (
        restoreAndClearPreviousQueue &&
        Array.isArray(queue.queueBeforeShuffle) &&
        queue.queueBeforeShuffle.length > 0
      ) {
        const currentQueuePlayingSong = queue.queue.at(currentQueue.currentSongIndex ?? 0);
        const restoredQueue: string[] = [];

        for (let i = 0; i < queue.queueBeforeShuffle.length; i += 1) {
          restoredQueue.push(queue.queue[queue.queueBeforeShuffle[i]]);
        }

        queue.queue = restoredQueue;
        queue.queueBeforeShuffle = [];
        if (currentQueuePlayingSong)
          queue.currentSongIndex = queue.queue.indexOf(currentQueuePlayingSong);
      }

      if (queue.queue.length > 1 && isShuffleQueue) {
        // toggleShuffling will be called in the shuffleQueue function
        const { shuffledQueue, positions } = shuffleQueue(
          // Clone the songIds array because tanstack store thinks its values aren't changed if we don't do this
          [...queue.queue],
          queue.currentSongIndex ?? currentQueue.currentSongIndex ?? undefined
        );
        queue.queue = shuffledQueue;
        if (positions.length > 0) queue.queueBeforeShuffle = positions;
        queue.currentSongIndex = 0;
      } else toggleShuffling(false);

      storage.queue.setQueue(queue);
      if (playCurrentSongIndex && typeof currentSongIndex === 'number')
        playSong(currentQueue.queue[currentSongIndex]);
    },
    [playSong, shuffleQueue, toggleShuffling]
  );

  const updateCurrentSongPlaybackState = useCallback((isPlaying: boolean) => {
    if (isPlaying !== store.state.player.isCurrentSongPlaying)
      dispatch({ type: 'CURRENT_SONG_PLAYBACK_STATE', data: isPlaying });
  }, []);

  const updateContextMenuData = useCallback(
    (
      isVisible: boolean,
      menuItems: ContextMenuItem[] = [],
      pageX?: number,
      pageY?: number,
      contextMenuData?: ContextMenuAdditionalData
    ) => {
      const menuData: ContextMenuData = {
        isVisible,
        data: contextMenuData,
        menuItems: menuItems.length > 0 ? menuItems : store.state.contextMenuData.menuItems,
        pageX: pageX !== undefined ? pageX : store.state.contextMenuData.pageX,
        pageY: pageY !== undefined ? pageY : store.state.contextMenuData.pageY
      };

      dispatch({
        type: 'CONTEXT_MENU_DATA_CHANGE',
        data: menuData
      });
    },
    []
  );

  const updateBodyBackgroundImage = useCallback((isVisible: boolean, src?: string) => {
    let image: string | undefined;
    const disableBackgroundArtworks = storage.preferences.getPreferences(
      'disableBackgroundArtworks'
    );

    if (!disableBackgroundArtworks && isVisible && src) image = src;

    return dispatch({
      type: 'UPDATE_BODY_BACKGROUND_IMAGE',
      data: image
    });
  }, []);

  const updateCurrentlyActivePageData = useCallback(
    (callback: (currentPageData: PageData) => PageData) => {
      const { navigationHistory } = store.state;
      const updatedData = callback(
        navigationHistory.history[navigationHistory.pageHistoryIndex].data ?? {
          scrollTopOffset: 0
        }
      );
      dispatch({
        type: 'CURRENT_ACTIVE_PAGE_DATA_UPDATE',
        data: updatedData
      });
    },
    []
  );

  const updatePageHistoryIndex = useCallback((type: 'increment' | 'decrement' | 'home') => {
    const { history, pageHistoryIndex } = store.state.navigationHistory;
    if (type === 'decrement' && pageHistoryIndex - 1 >= 0) {
      const newPageHistoryIndex = pageHistoryIndex - 1;
      const data = {
        pageHistoryIndex: newPageHistoryIndex,
        history
      } as NavigationHistoryData;

      return dispatch({
        type: 'UPDATE_NAVIGATION_HISTORY',
        data
      });
    }
    if (type === 'increment' && pageHistoryIndex + 1 < history.length) {
      const newPageHistoryIndex = pageHistoryIndex + 1;
      const data = {
        pageHistoryIndex: newPageHistoryIndex,
        history
      } as NavigationHistoryData;

      return dispatch({
        type: 'UPDATE_NAVIGATION_HISTORY',
        data
      });
    }
    if (type === 'home') {
      const data: NavigationHistoryData = {
        history: [{ pageTitle: 'Home' }],
        pageHistoryIndex: 0
      };

      return dispatch({
        type: 'UPDATE_NAVIGATION_HISTORY',
        data
      });
    }
    return undefined;
  }, []);

  const updatePromptMenuHistoryIndex = useCallback((type: 'increment' | 'decrement' | 'home') => {
    const { prompts, currentActiveIndex } = store.state.promptMenuNavigationData;
    if (type === 'decrement' && currentActiveIndex - 1 >= 0) {
      const newPageHistoryIndex = currentActiveIndex - 1;
      const data = {
        isVisible: true,
        currentActiveIndex: newPageHistoryIndex,
        prompts
      };

      return dispatch({
        type: 'PROMPT_MENU_DATA_CHANGE',
        data
      });
    }
    if (type === 'increment' && currentActiveIndex + 1 < prompts.length) {
      const newPageHistoryIndex = currentActiveIndex + 1;
      const data = {
        isVisible: true,
        currentActiveIndex: newPageHistoryIndex,
        prompts
      };

      return dispatch({
        type: 'PROMPT_MENU_DATA_CHANGE',
        data
      });
    }
    return undefined;
  }, []);

  const updateMultipleSelections = useCallback(
    (id: string, selectionType: QueueTypes, type: 'add' | 'remove') => {
      if (
        store.state.multipleSelectionsData.selectionType &&
        selectionType !== store.state.multipleSelectionsData.selectionType
      )
        return;
      let { multipleSelections } = store.state.multipleSelectionsData;
      if (type === 'add') {
        if (multipleSelections.includes(id)) return;
        multipleSelections.push(id);
      } else if (type === 'remove') {
        if (!multipleSelections.includes(id)) return;
        multipleSelections = multipleSelections.filter((selection) => selection !== id);
      }

      dispatch({
        type: 'UPDATE_MULTIPLE_SELECTIONS_DATA',
        data: {
          ...store.state.multipleSelectionsData,
          selectionType,
          multipleSelections: [...multipleSelections]
        } as MultipleSelectionData
      });
    },
    []
  );

  const toggleMultipleSelections = useCallback(
    (
      isEnabled?: boolean,
      selectionType?: QueueTypes,
      addSelections?: string[],
      replaceSelections = false
    ) => {
      const updatedSelectionData = store.state.multipleSelectionsData;

      if (typeof isEnabled === 'boolean') {
        updatedSelectionData.selectionType = selectionType;

        if (Array.isArray(addSelections) && isEnabled === true)
          if (replaceSelections) {
            updatedSelectionData.multipleSelections = addSelections;
          } else updatedSelectionData.multipleSelections.push(...addSelections);

        if (isEnabled === false) {
          updatedSelectionData.multipleSelections = [];
          updatedSelectionData.selectionType = undefined;
        }
        updatedSelectionData.isEnabled = isEnabled;

        dispatch({
          type: 'UPDATE_MULTIPLE_SELECTIONS_DATA',
          data: {
            ...updatedSelectionData
          } as MultipleSelectionData
        });
      }
    },
    []
  );

  const changeCurrentActivePage = useCallback(
    (pageClass: PageTitles, data?: PageData) => {
      const navigationHistory = { ...store.state.navigationHistory };
      const { pageTitle, onPageChange } =
        navigationHistory.history[navigationHistory.pageHistoryIndex];

      const currentPageData = navigationHistory.history[navigationHistory.pageHistoryIndex].data;
      if (
        pageTitle !== pageClass ||
        (currentPageData && data && isDataChanged(currentPageData, data))
      ) {
        if (onPageChange) onPageChange(pageClass, data);

        const pageData = {
          pageTitle: pageClass,
          data
        };

        navigationHistory.history = navigationHistory.history.slice(
          0,
          navigationHistory.pageHistoryIndex + 1
        );
        navigationHistory.history.push(pageData);
        navigationHistory.pageHistoryIndex += 1;

        toggleMultipleSelections(false);
        log(`User navigated to '${pageClass}'`);

        dispatch({
          type: 'UPDATE_NAVIGATION_HISTORY',
          data: navigationHistory
        });
      } else
        addNewNotifications([
          {
            content: t('notifications.alreadyInPage'),
            iconName: 'info',
            iconClassName: 'material-icons-round-outlined',
            id: 'alreadyInCurrentPage',
            duration: 2500
          }
        ]);
    },
    [addNewNotifications, t, toggleMultipleSelections]
  );

  const updatePlayerType = useCallback((type: PlayerTypes) => {
    if (store.state.playerType !== type) {
      dispatch({ type: 'UPDATE_PLAYER_TYPE', data: type });
    }
  }, []);

  const toggleIsFavorite = useCallback(
    (isFavorite?: boolean, onlyChangeCurrentSongData = false) => {
      toggleSongIsFavorite(
        store.state.currentSongData.songId,
        store.state.currentSongData.isAFavorite,
        isFavorite,
        onlyChangeCurrentSongData
      )
        .then((newFavorite) => {
          if (typeof newFavorite === 'boolean') {
            store.state.currentSongData.isAFavorite = newFavorite;
            return dispatch({
              type: 'TOGGLE_IS_FAVORITE_STATE',
              data: newFavorite
            });
          }
          return undefined;
        })
        .catch((err) => console.error(err));
    },
    []
  );

  const updateVolume = useCallback((volume: number) => {
    storage.playback.setVolumeOptions('value', volume);

    dispatch({
      type: 'UPDATE_VOLUME_VALUE',
      data: volume
    });
  }, []);

  const updateSongPosition = useCallback((position: number) => {
    if (position >= 0 && position <= player.duration) player.currentTime = position;
  }, []);

  const toggleMutedState = useCallback((isMute?: boolean) => {
    if (isMute !== undefined) {
      if (isMute !== store.state.player.volume.isMuted) {
        dispatch({ type: 'UPDATE_MUTED_STATE', data: isMute });
      }
    } else {
      dispatch({ type: 'UPDATE_MUTED_STATE' });
    }
  }, []);

  const manageKeyboardShortcuts = useCallback((e) => {
    const shortcuts = getShortcuts().flatMap(category => category.shortcuts);
  
    const formatKey = (key) => {
      switch (key) {
        case ' ': return normalizedKeys.spaceKey;
        case 'ArrowUp': return normalizedKeys.upArrowKey;
        case 'ArrowDown': return normalizedKeys.downArrowKey;
        case 'ArrowLeft': return normalizedKeys.leftArrowKey;
        case 'ArrowRight': return normalizedKeys.rightArrowKey;
        case 'Enter': return normalizedKeys.enterKey;
        case 'End': return normalizedKeys.endKey;
        case 'Home': return normalizedKeys.homeKey;
        case ']': return ']';
        case '[': return '[';
        case '\\': return '\\';
        default: return key.length === 1 ? key.toUpperCase() : key;
      }
    };
  
    const pressedKeys = [
      e.ctrlKey ? 'Ctrl' : null,
      e.shiftKey ? 'Shift' : null,
      e.altKey ? 'Alt' : null,
      formatKey(e.key)
    ].filter(Boolean);
  
    const matchedShortcut = shortcuts.find(shortcut => {
      const storedKeys = shortcut.keys.map(formatKey).sort();
      const comboKeys = pressedKeys.sort();
      return JSON.stringify(storedKeys) === JSON.stringify(comboKeys);
    });
  
    if (matchedShortcut) {
      e.preventDefault();
      let updatedPlaybackRate;
      switch (matchedShortcut.label) {
        case i18n.t('appShortcutsPrompt.playPause'):
          toggleSongPlayback();
          break;
        case i18n.t('appShortcutsPrompt.toggleMute'):
          toggleMutedState(!store.state.player.volume.isMuted);
          break;
        case i18n.t('appShortcutsPrompt.nextSong'):
          handleSkipForwardClick();
          break;
        case i18n.t('appShortcutsPrompt.prevSong'):
          handleSkipBackwardClick();
          break;
        case i18n.t('appShortcutsPrompt.tenSecondsForward'):
          if (player.currentTime + 10 < player.duration) player.currentTime += 10;
          break;
        case i18n.t('appShortcutsPrompt.tenSecondsBackward'):
          if (player.currentTime - 10 >= 0) player.currentTime -= 10;
          else player.currentTime = 0;
          break;
        case i18n.t('appShortcutsPrompt.upVolume'):
          updateVolume(player.volume + 0.05 <= 1 ? player.volume * 100 + 5 : 100);
          break;
        case i18n.t('appShortcutsPrompt.downVolume'):
          updateVolume(player.volume - 0.05 >= 0 ? player.volume * 100 - 5 : 0);
          break;
        case i18n.t('appShortcutsPrompt.toggleShuffle'):
          toggleShuffling();
          break;
        case i18n.t('appShortcutsPrompt.toggleRepeat'):
          toggleRepeat();
          break;
        case i18n.t('appShortcutsPrompt.toggleFavorite'):
          toggleIsFavorite();
          break;
        case i18n.t('appShortcutsPrompt.upPlaybackRate'):
          updatedPlaybackRate = store.state.localStorage.playback.playbackRate || 1;
          if (updatedPlaybackRate + 0.05 > 4) updatedPlaybackRate = 4;
          else updatedPlaybackRate += 0.05;
          updatedPlaybackRate = parseFloat(updatedPlaybackRate.toFixed(2));
          storage.setItem('playback', 'playbackRate', updatedPlaybackRate);
          addNewNotifications([
            { id: 'playbackRate', iconName: 'avg_pace', content: t('notifications.playbackRateChanged', { val: updatedPlaybackRate }) }
          ]);
          break;
        case i18n.t('appShortcutsPrompt.downPlaybackRate'):
          updatedPlaybackRate = store.state.localStorage.playback.playbackRate || 1;
          if (updatedPlaybackRate - 0.05 < 0.25) updatedPlaybackRate = 0.25;
          else updatedPlaybackRate -= 0.05;
          updatedPlaybackRate = parseFloat(updatedPlaybackRate.toFixed(2));
          storage.setItem('playback', 'playbackRate', updatedPlaybackRate);
          addNewNotifications([
            { id: 'playbackRate', iconName: 'avg_pace', content: t('notifications.playbackRateChanged', { val: updatedPlaybackRate }) }
          ]);
          break;
        case i18n.t('appShortcutsPrompt.resetPlaybackRate'):
          storage.setItem('playback', 'playbackRate', 1);
          addNewNotifications([
            { id: 'playbackRate', iconName: 'avg_pace', content: t('notifications.playbackRateReset') }
          ]);
          break;
        case i18n.t('appShortcutsPrompt.goToSearch'):
          changeCurrentActivePage('Search');
          break;
        case i18n.t('appShortcutsPrompt.goToLyrics'):
          {
            const current = store.state.navigationHistory.history[store.state.navigationHistory.pageHistoryIndex];
            changeCurrentActivePage(current.pageTitle === 'Lyrics' ? 'Home' : 'Lyrics');
          }
          break;
        case i18n.t('appShortcutsPrompt.goToQueue'):
          {
            const current = store.state.navigationHistory.history[store.state.navigationHistory.pageHistoryIndex];
            changeCurrentActivePage(current.pageTitle === 'CurrentQueue' ? 'Home' : 'CurrentQueue');
          }
          break;
        case i18n.t('appShortcutsPrompt.goHome'):
          updatePageHistoryIndex('home');
          break;
        case i18n.t('appShortcutsPrompt.goBack'):
          updatePageHistoryIndex('decrement');
          break;
        case i18n.t('appShortcutsPrompt.goForward'):
          updatePageHistoryIndex('increment');
          break;
        case i18n.t('appShortcutsPrompt.openMiniPlayer'):
          updatePlayerType(store.state.playerType === 'mini' ? 'normal' : 'mini');
          break;
        case i18n.t('appShortcutsPrompt.selectMultipleItems'):
          toggleMultipleSelections(true);
          break;
        case i18n.t('appShortcutsPrompt.selectNextLyricsLine'):
          // MISSING IMPLEMENTATION.
          break;
        case i18n.t('appShortcutsPrompt.selectPrevLyricsLine'):
          // MISSING IMPLEMENTATION.
          break;
        case i18n.t('appShortcutsPrompt.selectCustomLyricsLine'):
          // MISSING IMPLEMENTATION.
          break;
        case i18n.t('appShortcutsPrompt.playNextLyricsLine'):
          // Implement logic to jump to next lyrics line. MISSING IMPLEMENTATION.
          break;
        case i18n.t('appShortcutsPrompt.playPrevLyricsLine'):
          // Implement logic to jump to previous lyrics line. MISSING IMPLEMENTATION.
          break;
        case i18n.t('appShortcutsPrompt.toggleTheme'):
          window.api.theme.changeAppTheme();
          break;
        case i18n.t('appShortcutsPrompt.toggleMiniPlayerAlwaysOnTop'):
          // Implement logic to jump to to trigger mini player always on top. MISSING IMPLEMENTATION.
          break;
        case i18n.t('appShortcutsPrompt.reload'):
          window.api.appControls.restartRenderer?.('Shortcut: Ctrl+R');
          break;
        case i18n.t('appShortcutsPrompt.openAppShortcutsPrompt'):
          changePromptMenuData(true, <AppShortcutsPrompt />);
          break;
        case i18n.t('appShortcutsPrompt.openDevtools'):
          if (!window.api.properties.isInDevelopment) {
            window.api.settingsHelpers.openDevtools();
          }
          break;
        default:
          console.warn(`Unhandled shortcut action: ${matchedShortcut.label}`);
      }
    }
  }, [
    updateVolume,
    toggleMutedState,
    handleSkipForwardClick,
    handleSkipBackwardClick,
    toggleShuffling,
    toggleRepeat,
    toggleIsFavorite,
    updatePlayerType,
    changeCurrentActivePage,
    changePromptMenuData,
    toggleMultipleSelections,
    toggleSongPlayback,
    updatePageHistoryIndex,
    addNewNotifications,
    t
  ]);
  
  

  useEffect(() => {
    window.addEventListener('click', handleContextMenuVisibilityUpdate);
    window.addEventListener('keydown', manageKeyboardShortcuts);
    return () => {
      window.removeEventListener('click', handleContextMenuVisibilityUpdate);
      window.removeEventListener('keydown', manageKeyboardShortcuts);
    };
  }, [handleContextMenuVisibilityUpdate, manageKeyboardShortcuts]);

  const updateUserData = useCallback(
    async (callback: (prevState: UserData) => UserData | Promise<UserData> | void) => {
      try {
        const updatedUserData = await callback(store.state.userData);

        if (typeof updatedUserData === 'object') {
          dispatch({ type: 'USER_DATA_CHANGE', data: updatedUserData });
        }
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  const fetchUserData = useCallback(
    () =>
      window.api.userData
        .getUserData()
        .then((res) => updateUserData(() => res))
        .catch((err) => console.error(err)),
    [updateUserData]
  );

  useEffect(() => {
    fetchUserData();
    const manageUserDataUpdates = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType.includes('userData') || event.dataType === 'settings/preferences')
            fetchUserData();
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageUserDataUpdates);
    return () => {
      document.removeEventListener('app/dataUpdates', manageUserDataUpdates);
    };
  }, [fetchUserData]);

  const onSongDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      console.log(e.dataTransfer.files);
      if (e.dataTransfer.files.length > 0) {
        const isASupportedAudioFormat = appPreferences.supportedMusicExtensions.some((type) =>
          e.dataTransfer.files[0].path.endsWith(type)
        );

        if (isASupportedAudioFormat) fetchSongFromUnknownSource(e.dataTransfer.files[0].path);
        else
          changePromptMenuData(
            true,
            <UnsupportedFileMessagePrompt
              filePath={e.dataTransfer.files[0].path || e.dataTransfer.files[0].name}
            />
          );
      }
      if (AppRef.current) AppRef.current.classList.remove('song-drop');
    },
    [changePromptMenuData, fetchSongFromUnknownSource]
  );

  const updateCurrentSongData = useCallback(
    (callback: (prevData: AudioPlayerData) => AudioPlayerData) => {
      const updatedData = callback(store.state.currentSongData);
      if (updatedData) {
        dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: updatedData });
      }
    },
    []
  );

  const clearAudioPlayerData = useCallback(() => {
    toggleSongPlayback(false);

    player.currentTime = 0;
    player.pause();

    const updatedQueue = store.state.localStorage.queue.queue.filter(
      (songId) => songId !== store.state.currentSongData.songId
    );
    updateQueueData(null, updatedQueue);

    dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: {} as AudioPlayerData });

    addNewNotifications([
      {
        id: 'songPausedOnDelete',
        duration: 7500,
        content: t('notifications.playbackPausedDueToSongDeletion')
      }
    ]);
  }, [addNewNotifications, t, toggleSongPlayback, updateQueueData]);

  const updateEqualizerOptions = useCallback((options: Equalizer) => {
    storage.equalizerPreset.setEqualizerPreset(options);
  }, []);

  const changeUpNextSongData = useCallback((upNextSongData?: AudioPlayerData) => {
    dispatch({ type: 'UP_NEXT_SONG_DATA_CHANGE', data: upNextSongData });
  }, []);

  const appUpdateContextValues: AppUpdateContextType = useMemo(
    () => ({
      updateUserData,
      updateCurrentSongData,
      updateContextMenuData,
      changePromptMenuData,
      changeUpNextSongData,
      updatePromptMenuHistoryIndex,
      playSong,
      changeCurrentActivePage,
      updateCurrentlyActivePageData,
      addNewNotifications,
      updateNotifications,
      createQueue,
      updatePageHistoryIndex,
      changeQueueCurrentSongIndex,
      updateCurrentSongPlaybackState,
      updatePlayerType,
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
      clearAudioPlayerData,
      updateBodyBackgroundImage,
      updateMultipleSelections,
      toggleMultipleSelections,
      updateAppUpdatesState,
      updateEqualizerOptions
    }),
    [
      updateUserData,
      updateCurrentSongData,
      updateContextMenuData,
      changePromptMenuData,
      changeUpNextSongData,
      updatePromptMenuHistoryIndex,
      playSong,
      changeCurrentActivePage,
      updateCurrentlyActivePageData,
      addNewNotifications,
      updateNotifications,
      createQueue,
      updatePageHistoryIndex,
      changeQueueCurrentSongIndex,
      updateCurrentSongPlaybackState,
      updatePlayerType,
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
      clearAudioPlayerData,
      updateBodyBackgroundImage,
      updateMultipleSelections,
      toggleMultipleSelections,
      updateAppUpdatesState,
      updateEqualizerOptions
    ]
  );

  const isReducedMotion = useStore(store, (state) => {
    storeRef.current = state;

    return (
      state.localStorage.preferences.isReducedMotion ||
      (state.isOnBatteryPower && state.localStorage.preferences.removeAnimationsOnBatteryPower)
    );
  });
  const isDarkMode = useStore(store, (state) => state.isDarkMode);
  const playerType = useStore(store, (state) => state.playerType);
  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);

  useEffect(() => {
    if (isDarkMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, [isDarkMode]);

  return (
    <ErrorBoundary>
      <AppUpdateContext.Provider value={appUpdateContextValues}>
        {playerType === 'normal' ? (
          <div
            className={`App relative select-none ${
              isDarkMode ? 'dark bg-dark-background-color-1' : 'bg-background-color-1'
            } ${
              isReducedMotion
                ? 'reduced-motion animate-none transition-none delay-0! duration-0! [&.dialog-menu]:backdrop-blur-none!'
                : 'transition-colors duration-200'
            } after:text-font-color-white dark:after:text-font-color-white grid !h-screen min-h-screen w-full grid-rows-[auto_1fr_auto] items-center overflow-y-hidden after:invisible after:absolute after:-z-10 after:grid after:h-full after:w-full after:place-items-center after:bg-[rgba(0,0,0,0)] after:text-4xl after:font-medium after:content-["Drop_your_song_here"] dark:after:bg-[rgba(0,0,0,0)] [&.blurred_#title-bar]:opacity-40 [&.fullscreen_#window-controls-container]:hidden [&.song-drop]:after:visible [&.song-drop]:after:z-20 [&.song-drop]:after:border-4 [&.song-drop]:after:border-dashed [&.song-drop]:after:border-[#ccc] [&.song-drop]:after:bg-[rgba(0,0,0,0.7)] [&.song-drop]:after:transition-[background,visibility,color] dark:[&.song-drop]:after:border-[#ccc] dark:[&.song-drop]:after:bg-[rgba(0,0,0,0.7)]`}
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
            {bodyBackgroundImage && (
              <div
                className={`body-background-image-container bg-dark-background-color-1! absolute h-full w-full overflow-hidden bg-center`}
              >
                <Img
                  className={`blur-0 w-full bg-cover opacity-100 brightness-100 transition-[filter,opacity] duration-500 ${
                    bodyBackgroundImage &&
                    'opacity-100! blur-[1.5rem]! brightness-[.75]! dark:brightness-[.5]!'
                  }`}
                  loading="eager"
                  src={bodyBackgroundImage}
                  alt=""
                />
              </div>
            )}
            <ContextMenu />
            <PromptMenu />
            <TitleBar />
            <BodyAndSideBarContainer />
            <SongControlsContainer />
          </div>
        ) : (
          <ErrorBoundary>
            {playerType === 'mini' ? (
              <Suspense fallback={<SuspenseLoader />}>
                <MiniPlayer
                  className={`${
                    isReducedMotion
                      ? 'reduced-motion animate-none transition-none duration-0! [&.dialog-menu]:backdrop-blur-none!'
                      : ''
                  }`}
                />
              </Suspense>
            ) : (
              <Suspense fallback={<SuspenseLoader />}>
                <FullScreenPlayer />
              </Suspense>
            )}
          </ErrorBoundary>
        )}
      </AppUpdateContext.Provider>
    </ErrorBoundary>
  );
}
