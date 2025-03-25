/* eslint-disable no-use-before-define */
import React, { ReactNode, Suspense } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import './assets/styles/styles.css';
import packageFile from '../../../package.json';

import { AppContext, AppStateContextType } from './contexts/AppContext';
import { AppUpdateContext, AppUpdateContextType } from './contexts/AppUpdateContext';
// import { SongPositionContext } from './contexts/SongPositionContext';

import useNetworkConnectivity from './hooks/useNetworkConnectivity';

import TitleBar from './components/TitleBar/TitleBar';
import SongControlsContainer from './components/SongsControlsContainer/SongControlsContainer';
import BodyAndSideBarContainer from './components/BodyAndSidebarContainer';
import PromptMenu from './components/PromptMenu/PromptMenu';
import ContextMenu from './components/ContextMenu/ContextMenu';
import ErrorPrompt from './components/ErrorPrompt';
import ReleaseNotesPrompt from './components/ReleaseNotesPrompt/ReleaseNotesPrompt';
import Img from './components/Img';
import Preloader from './components/Preloader/Preloader';

import isLatestVersion from './utils/isLatestVersion';
import roundTo from '../../common/roundTo';
import storage from './utils/localStorage';
import { isDataChanged } from './utils/hasDataChanged';
import log from './utils/log';

import ErrorBoundary from './components/ErrorBoundary';
import parseNotificationFromMain from './other/parseNotificationFromMain';
import reducer, { DEFAULT_REDUCER_DATA } from './other/appReducer';
import ListeningDataSession from './other/listeningDataSession';
import updateQueueOnSongPlay from './other/updateQueueOnSongPlay';
import SongUnplayableErrorPrompt, {
  unplayableSongNotificationConfig
} from './components/SongUnplayableErrorPrompt';
import shuffleQueueRandomly from './other/shuffleQueueRandomly';
import toggleSongIsFavorite from './other/toggleSongIsFavorite';
import UnsupportedFileMessagePrompt from './components/UnsupportedFileMessagePrompt';
import SuspenseLoader from './components/SuspenseLoader';
import { equalizerBandHertzData } from './other/equalizerData';
import throttle from './utils/throttle';
import { getShortcuts, normalizedKeys } from './other/appShortcuts';
import i18n from './i18n';

const MiniPlayer = React.lazy(() => import('./components/MiniPlayer/MiniPlayer'));
const FullScreenPlayer = React.lazy(() => import('./components/FullScreenPlayer/FullScreenPlayer'));

const player = new Audio();
let repetitivePlaybackErrorsCount = 0;
// const lowResponseTimeRequiredPages: PageTitles[] = ['Lyrics', 'LyricsEditor'];

// ? / / / / / / /  EQUALIZER INITIALIZATION / / / / / / / / / / / / / /
const context = new window.AudioContext();
const equalizerBands = new Map<EqualizerBandFilters, BiquadFilterNode>();

for (const [filterName, hertzValue] of Object.entries(equalizerBandHertzData)) {
  const equalizerFilterName = filterName as EqualizerBandFilters;
  const equalizerBand = context.createBiquadFilter();

  equalizerBand.type = 'peaking';
  equalizerBand.frequency.value = hertzValue;
  equalizerBand.Q.value = 1;
  equalizerBand.gain.value = 0;

  equalizerBands.set(equalizerFilterName, equalizerBand);
}

const source = context.createMediaElementSource(player);
const filterMapKeys = [...equalizerBands.keys()];

equalizerBands.forEach((filter, key, map) => {
  const currentFilterIndex = filterMapKeys.indexOf(key);
  const isTheFirstFilter = currentFilterIndex === 0;
  const isTheLastFilter = currentFilterIndex === filterMapKeys.length - 1;

  if (isTheFirstFilter) source.connect(filter);
  else {
    const prevFilter = map.get(filterMapKeys[currentFilterIndex - 1]);
    if (prevFilter) prevFilter.connect(filter);

    if (isTheLastFilter) filter.connect(context.destination);
  }
});

// ? / / / / / / /  PLAYER DEFAULT OPTIONS / / / / / / / / / / / / / /
player.preload = 'auto';
player.defaultPlaybackRate = 1.0;

player.addEventListener('player/trackchange', (e) => {
  if ('detail' in e) {
    console.log(`player track changed to ${(e as DetailAvailableEvent<string>).detail}.`);
  }
});
// / / / / / / / /

const updateNetworkStatus = () => window.api.settingsHelpers.networkStatusChange(navigator.onLine);

updateNetworkStatus();
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

storage.checkLocalStorage();

// console.log('Command line args', window.api.properties.commandLineArgs);

export default function App() {
  const { t } = useTranslation();

  const [content, dispatch] = React.useReducer(reducer, DEFAULT_REDUCER_DATA);
  // Had to use a Ref in parallel with the Reducer to avoid an issue that happens when using content.* not giving the intended data in useCallback functions even though it was added as a dependency of that function.
  const contentRef = React.useRef(DEFAULT_REDUCER_DATA);

  const AppRef = React.useRef(null as HTMLDivElement | null);

  const [, startTransition] = React.useTransition();
  const refStartPlay = React.useRef(false);
  const refQueue = React.useRef({
    currentSongIndex: null,
    queue: [],
    queueBeforeShuffle: [],
    queueType: 'songs'
  } as Queue);

  const { isOnline } = useNetworkConnectivity();

  const addSongDropPlaceholder = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget === null) AppRef.current?.classList.add('song-drop');
  }, []);

  const removeSongDropPlaceholder = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget === null) AppRef.current?.classList.remove('song-drop');
  }, []);

  const changePromptMenuData = React.useCallback(
    (isVisible = false, prompt?: ReactNode | null, className = '') => {
      const promptData: PromptMenuData = { prompt, className };

      const data = {
        isVisible,
        currentActiveIndex:
          prompt && isVisible
            ? content.promptMenuNavigationData.prompts.length
            : prompt === null && isVisible === false
              ? 0
              : content.promptMenuNavigationData.currentActiveIndex,
        prompts:
          prompt && isVisible
            ? content.promptMenuNavigationData.prompts.concat(promptData)
            : prompt === null && isVisible === false
              ? []
              : content.promptMenuNavigationData.prompts
      };

      contentRef.current.promptMenuNavigationData = data;
      dispatch({
        type: 'PROMPT_MENU_DATA_CHANGE',
        data
      });
    },
    [content.promptMenuNavigationData.currentActiveIndex, content.promptMenuNavigationData.prompts]
  );

  const managePlaybackErrors = React.useCallback(
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

  const AUDIO_FADE_INTERVAL = 50;
  const AUDIO_FADE_DURATION = 250;
  const fadeOutIntervalId = React.useRef(undefined as NodeJS.Timeout | undefined);
  const fadeInIntervalId = React.useRef(undefined as NodeJS.Timeout | undefined);
  const fadeOutAudio = React.useCallback(() => {
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
    if (fadeInIntervalId.current) clearInterval(fadeInIntervalId.current);
    if (fadeOutIntervalId.current) clearInterval(fadeOutIntervalId.current);
    fadeInIntervalId.current = setInterval(() => {
      if (player.volume < contentRef.current.player.volume.value / 100) {
        const rate =
          (contentRef.current.player.volume.value / 100 / AUDIO_FADE_INTERVAL) *
          (AUDIO_FADE_DURATION / AUDIO_FADE_INTERVAL);
        if (player.volume + rate >= contentRef.current.player.volume.value / 100)
          player.volume = contentRef.current.player.volume.value / 100;
        else player.volume += rate;
      } else if (fadeInIntervalId.current) {
        clearInterval(fadeInIntervalId.current);
      }
    }, AUDIO_FADE_INTERVAL);
  }, []);

  const handleBeforeQuitEvent = React.useCallback(async () => {
    storage.playback.setCurrentSongOptions('stoppedPosition', player.currentTime);
    storage.playback.setPlaybackOptions('isRepeating', contentRef.current.player.isRepeating);
    storage.playback.setPlaybackOptions('isShuffling', contentRef.current.player.isShuffling);
    storage.queue.setQueue(refQueue.current);
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
    [isOnline]
  );

  React.useEffect(() => {
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
      contentRef.current.userData.theme = theme;
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

  React.useEffect(() => {
    if (content.localStorage.equalizerPreset) {
      const filters = content.localStorage.equalizerPreset;
      for (const filter of Object.entries(filters)) {
        const filterName = filter[0] as EqualizerBandFilters;
        const gainValue: number = filter[1];

        const equalizerFilter = equalizerBands.get(filterName);
        if (equalizerFilter) equalizerFilter.gain.value = gainValue;
      }
    }
  }, [content.localStorage.equalizerPreset]);

  const manageWindowBlurOrFocus = React.useCallback((state: 'blur' | 'focus') => {
    if (AppRef.current) {
      if (state === 'blur') AppRef.current.classList.add('blurred');
      if (state === 'focus') AppRef.current.classList.remove('blurred');
    }
  }, []);

  const manageWindowFullscreen = React.useCallback((state: 'fullscreen' | 'windowed') => {
    if (AppRef.current) {
      if (state === 'fullscreen') return AppRef.current.classList.add('fullscreen');
      if (state === 'windowed') return AppRef.current.classList.remove('fullscreen');
    }
    return undefined;
  }, []);

  React.useEffect(() => {
    player.addEventListener('error', (err) => managePlaybackErrors(err));
    player.addEventListener('play', () => {
      dispatch({
        type: 'CURRENT_SONG_PLAYBACK_STATE',
        data: true
      });
      window.api.playerControls.songPlaybackStateChange(true);
    });
    player.addEventListener('pause', () => {
      dispatch({
        type: 'CURRENT_SONG_PLAYBACK_STATE',
        data: false
      });
      window.api.playerControls.songPlaybackStateChange(false);
    });
    window.api.quitEvent.beforeQuitEvent(handleBeforeQuitEvent);

    window.api.windowControls.onWindowBlur(() => manageWindowBlurOrFocus('blur'));
    window.api.windowControls.onWindowFocus(() => manageWindowBlurOrFocus('focus'));

    window.api.fullscreen.onEnterFullscreen(() => manageWindowFullscreen('fullscreen'));
    window.api.fullscreen.onLeaveFullscreen(() => manageWindowFullscreen('windowed'));

    return () => {
      window.api.quitEvent.removeBeforeQuitEventListener(handleBeforeQuitEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const displayDefaultTitleBar = () => {
      document.title = `Nora`;
      storage.playback.setCurrentSongOptions('stoppedPosition', player.currentTime);
    };
    const playSongIfPlayable = () => {
      if (refStartPlay.current) toggleSongPlayback(true);
    };
    // const manageSongPositionUpdate = () => {
    //   contentRef.current.player.songPosition = roundTo(player.currentTime, 2);
    // };
    const managePlayerStalledStatus = () => {
      dispatch({ type: 'PLAYER_WAITING_STATUS', data: true });
    };
    const managePlayerNotStalledStatus = () => {
      dispatch({ type: 'PLAYER_WAITING_STATUS', data: false });
    };

    const handleSkipForwardClickWithParams = () => handleSkipForwardClick('PLAYER_SKIP');

    player.addEventListener('canplay', managePlayerNotStalledStatus);
    player.addEventListener('canplaythrough', managePlayerNotStalledStatus);
    player.addEventListener('loadeddata', managePlayerNotStalledStatus);
    player.addEventListener('loadedmetadata', managePlayerNotStalledStatus);

    player.addEventListener('suspend', managePlayerStalledStatus);
    player.addEventListener('stalled', managePlayerStalledStatus);
    player.addEventListener('waiting', managePlayerStalledStatus);
    player.addEventListener('progress', managePlayerStalledStatus);

    player.addEventListener('canplay', playSongIfPlayable);
    player.addEventListener('ended', handleSkipForwardClickWithParams);
    player.addEventListener('play', addSongTitleToTitleBar);
    player.addEventListener('pause', displayDefaultTitleBar);

    // player.addEventListener('timeupdate', manageSongPositionUpdate);

    return () => {
      toggleSongPlayback(false);
      player.removeEventListener('canplay', managePlayerNotStalledStatus);
      player.removeEventListener('canplaythrough', managePlayerNotStalledStatus);
      player.removeEventListener('loadeddata', managePlayerNotStalledStatus);
      player.removeEventListener('loadedmetadata', managePlayerNotStalledStatus);
      player.removeEventListener('suspend', managePlayerStalledStatus);
      player.removeEventListener('stalled', managePlayerStalledStatus);
      player.removeEventListener('waiting', managePlayerStalledStatus);
      player.removeEventListener('progress', managePlayerStalledStatus);
      // player.removeEventListener('timeupdate', manageSongPositionUpdate);
      player.removeEventListener('canplay', playSongIfPlayable);
      player.removeEventListener('ended', handleSkipForwardClickWithParams);
      player.removeEventListener('play', addSongTitleToTitleBar);
      player.removeEventListener('pause', displayDefaultTitleBar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    // const index = content.navigationHistory.pageHistoryIndex;
    // const { pageTitle: currentPage, data } =
    //   content.navigationHistory.history[index];
    // // const isLowResponseRequired =
    // //   lowResponseTimeRequiredPages.includes(currentPage) ||
    // //   data?.isLowResponseRequired ||
    // //   content.playerType === 'mini' ||
    // //   content.playerType === 'full';

    const LOW_RESPONSE_DURATION = 100;
    // const DURATION = 1000;

    const lowResponseIntervalId = setInterval(() => {
      if (!player.paused) {
        // const currentPosition = contentRef.current.player.songPosition;

        const playerPositionChange = new CustomEvent('player/positionChange', {
          detail: roundTo(player.currentTime, 2)
        });
        document.dispatchEvent(playerPositionChange);
      }
    }, LOW_RESPONSE_DURATION);

    // const intervalId = setInterval(() => {
    //   const currentPosition = contentRef.current.player.songPosition;
    //   if (!player.paused) {
    //     startTransition(() =>
    //       dispatch({
    //         type: 'UPDATE_SONG_POSITION',
    //         data: currentPosition,
    //       }),
    //     );
    //   }
    // }, DURATION);

    return () => {
      // clearInterval(intervalId);
      clearInterval(lowResponseIntervalId);
    };
  }, []);

  // VOLUME RELATED SETTINGS
  React.useEffect(() => {
    player.volume = content.player.volume.value / 100;
    player.muted = content.player.volume.isMuted;
  }, [content.player.volume]);

  React.useEffect(() => {
    // LOCAL STORAGE
    const { playback, preferences, queue } = storage.getAllItems();

    const syncLocalStorage = () => {
      const allItems = storage.getAllItems();
      dispatch({ type: 'UPDATE_LOCAL_STORAGE', data: allItems });

      if (player.playbackRate !== allItems.playback.playbackRate)
        player.playbackRate = allItems.playback.playbackRate;

      console.log('local storage updated');
    };

    document.addEventListener('localStorage', syncLocalStorage);

    if (playback?.volume) {
      dispatch({ type: 'UPDATE_VOLUME', data: playback.volume });
      contentRef.current.player.volume = playback.volume;
    }

    if (content.navigationHistory.history.at(-1)?.pageTitle !== preferences?.defaultPageOnStartUp)
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
          // contentRef.current.player.songPosition = currSongPosition;
          dispatch({
            type: 'UPDATE_SONG_POSITION',
            data: currSongPosition
          });
        }
        return undefined;
      })
      .catch((err) => console.error(err));

    if (queue)
      refQueue.current = {
        ...refQueue.current,
        queue: queue.queue || [],
        queueType: queue.queueType,
        queueId: queue.queueId
      };
    else {
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

  React.useEffect(() => {
    window.api.userData
      .getUserData()
      .then((res) => {
        if (!res) return undefined;

        dispatch({ type: 'USER_DATA_CHANGE', data: res });
        contentRef.current.userData = res;
        dispatch({ type: 'APP_THEME_CHANGE', data: res.theme });
        return undefined;
      })
      .catch((err) => console.error(err));

    const handleToggleSongPlayback = () => toggleSongPlayback();
    const handlePlaySongFromUnknownSource = (_: unknown, data: AudioPlayerData) =>
      playSongFromUnknownSource(data, true);

    window.api.unknownSource.playSongFromUnknownSource(handlePlaySongFromUnknownSource);

    window.api.playerControls.toggleSongPlayback(handleToggleSongPlayback);
    window.api.playerControls.skipBackwardToPreviousSong(handleSkipBackwardClick);
    window.api.playerControls.skipForwardToNextSong(handleSkipForwardClick);
    return () => {
      window.api.unknownSource.removePlaySongFromUnknownSourceEvent(handleToggleSongPlayback);
      window.api.playerControls.removeTogglePlaybackStateEvent(handleToggleSongPlayback);
      window.api.playerControls.removeSkipBackwardToPreviousSongEvent(handleSkipBackwardClick);
      window.api.playerControls.removeSkipForwardToNextSongEvent(handleSkipForwardClick);
      window.api.dataUpdates.removeDataUpdateEventListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const noticeDataUpdateEvents = (_: unknown, dataEvents: DataUpdateEvent[]) => {
      const event = new CustomEvent('app/dataUpdates', { detail: dataEvents });
      document.dispatchEvent(event);
    };

    window.api.dataUpdates.dataUpdateEvent(noticeDataUpdateEvents);

    return () => {
      window.api.dataUpdates.removeDataUpdateEventListeners();
    };
  }, []);

  const addNewNotifications = React.useCallback((newNotifications: AppNotification[]) => {
    if (newNotifications.length > 0) {
      const maxNotifications = 4;
      const currentNotifications = contentRef.current.notificationPanelData.notifications;
      const newNotificationIds = newNotifications.map((x) => x.id);
      const resultNotifications = currentNotifications.filter(
        (x, index) => !newNotificationIds.some((y) => y === x.id) && index < maxNotifications
      );
      resultNotifications.unshift(...newNotifications);
      contentRef.current.notificationPanelData.notifications = resultNotifications;

      startTransition(() =>
        dispatch({
          type: 'ADD_NEW_NOTIFICATIONS',
          data: resultNotifications
        })
      );
    }
  }, []);

  const updateNotifications = React.useCallback(
    (callback: (currentNotifications: AppNotification[]) => AppNotification[]) => {
      const currentNotifications = content.notificationPanelData.notifications;
      const updatedNotifications = callback(currentNotifications);
      contentRef.current.notificationPanelData.notifications = updatedNotifications;
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
                  const playbackChange = new CustomEvent('player/playbackChange');
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
                  const playbackChange = new CustomEvent('player/playbackChange');
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
            content: t('notifications.selectASongToPlay'),
            iconName: 'error',
            iconClassName: 'material-icons-round-outlined'
          }
        ]);
      return undefined;
    },
    [addNewNotifications, t, fadeOutAudio, fadeInAudio, managePlaybackErrors]
  );

  const displayMessageFromMain = React.useCallback(
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

  React.useEffect(() => {
    window.api.messages.getMessageFromMain(displayMessageFromMain);
    return () => {
      window.api.messages.removeMessageToRendererEventListener(displayMessageFromMain);
    };
  }, [displayMessageFromMain]);

  const handleContextMenuVisibilityUpdate = React.useCallback(() => {
    if (contentRef.current.contextMenuData.isVisible) {
      dispatch({
        type: 'CONTEXT_MENU_VISIBILITY_CHANGE',
        data: false
      });
      contentRef.current.contextMenuData.isVisible = false;
    }
  }, []);

  const addSongTitleToTitleBar = React.useCallback(() => {
    if (contentRef.current.currentSongData.title && contentRef.current.currentSongData.artists)
      document.title = `${contentRef.current.currentSongData.title} - ${
        Array.isArray(contentRef.current.currentSongData.artists) &&
        contentRef.current.currentSongData.artists.map((artist) => artist.name).join(', ')
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
      data: repeatState
    });
  }, []);

  const recordRef = React.useRef<ListeningDataSession>();

  const recordListeningData = React.useCallback(
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

  const setDynamicThemesFromSongPalette = React.useCallback((palette?: NodeVibrantPalette) => {
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
        // root.style.removeProperty('--dark-background-color-2', lightVibrant, 'important');
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

  React.useEffect(() => {
    const isDynamicThemesEnabled =
      content.localStorage.preferences.enableImageBasedDynamicThemes &&
      content.currentSongData.paletteData;

    const resetStyles = setDynamicThemesFromSongPalette(
      isDynamicThemesEnabled ? content.currentSongData.paletteData : undefined
    );

    return () => {
      resetStyles();
    };
  }, [
    content.currentSongData.paletteData,
    content.localStorage.preferences.enableImageBasedDynamicThemes,
    setDynamicThemesFromSongPalette
  ]);

  const playSong = React.useCallback(
    (songId: string, isStartPlay = true, playAsCurrentSongIndex = false) => {
      repetitivePlaybackErrorsCount = 0;
      if (typeof songId === 'string') {
        if (contentRef.current.currentSongData.songId === songId) return toggleSongPlayback();
        console.time('timeForSongFetch');

        return window.api.audioLibraryControls
          .getSong(songId)
          .then((songData) => {
            console.timeEnd('timeForSongFetch');
            if (songData) {
              console.log('playSong', songId, songData.path);

              dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: songData });
              contentRef.current.currentSongData = songData;

              storage.playback.setCurrentSongOptions('songId', songData.songId);

              player.src = songData.path;

              const trackChangeEvent = new CustomEvent('player/trackchange', {
                detail: songId
              });
              player.dispatchEvent(trackChangeEvent);

              refStartPlay.current = isStartPlay;

              if (isStartPlay) toggleSongPlayback();

              if (songData.paletteData) setDynamicThemesFromSongPalette(songData.paletteData);

              recordListeningData(songId, songData.duration);

              refQueue.current = updateQueueOnSongPlay(
                refQueue.current,
                songData.songId,
                playAsCurrentSongIndex
              );
            } else console.log(songData);
            return undefined;
          })
          .catch((err) => {
            console.error(err);
            addNewNotifications([unplayableSongNotificationConfig]);
            changePromptMenuData(true, <SongUnplayableErrorPrompt err={err} />);
          });
      }
      addNewNotifications([unplayableSongNotificationConfig]);
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
      addNewNotifications,
      changePromptMenuData,
      t,
      toggleSongPlayback,
      setDynamicThemesFromSongPalette,
      recordListeningData
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
            data: audioPlayerData
          });
          contentRef.current.currentSongData = audioPlayerData;
          player.src = audioPlayerData.path;
          refStartPlay.current = isStartPlay;
          if (isStartPlay) toggleSongPlayback();

          recordListeningData(audioPlayerData.songId, audioPlayerData.duration, undefined, false);
        }
      }
    },
    [playSong, recordListeningData, toggleSongPlayback]
  );

  const fetchSongFromUnknownSource = React.useCallback(
    (songPath: string) => {
      window.api.unknownSource
        .getSongFromUnknownSource(songPath)
        .then((res) => playSongFromUnknownSource(res, true))
        .catch((err) => {
          console.error(err);
          addNewNotifications([unplayableSongNotificationConfig]);
          changePromptMenuData(true, <SongUnplayableErrorPrompt err={err} />);
        });
    },
    [playSongFromUnknownSource, addNewNotifications, changePromptMenuData]
  );

  const changeQueueCurrentSongIndex = React.useCallback(
    (currentSongIndex: number, isPlaySong = true) => {
      console.log('currentSongIndex', currentSongIndex);
      refQueue.current.currentSongIndex = currentSongIndex;
      if (isPlaySong) playSong(refQueue.current.queue[currentSongIndex]);
    },
    [playSong]
  );

  const handleSkipBackwardClick = React.useCallback(() => {
    const { currentSongIndex } = refQueue.current;
    if (player.currentTime > 5) {
      player.currentTime = 0;
    } else if (typeof currentSongIndex === 'number') {
      if (currentSongIndex === 0) {
        if (refQueue.current.queue.length > 0)
          changeQueueCurrentSongIndex(refQueue.current.queue.length - 1);
      } else changeQueueCurrentSongIndex(currentSongIndex - 1);
    } else changeQueueCurrentSongIndex(0);
  }, [changeQueueCurrentSongIndex]);

  const handleSkipForwardClick = React.useCallback(
    (reason: SongSkipReason = 'USER_SKIP') => {
      const { currentSongIndex } = refQueue.current;
      if (contentRef.current.player.isRepeating === 'repeat-1' && reason !== 'USER_SKIP') {
        player.currentTime = 0;
        toggleSongPlayback(true);
        recordListeningData(
          contentRef.current.currentSongData.songId,
          contentRef.current.currentSongData.duration,
          true
        );

        window.api.audioLibraryControls.updateSongListeningData(
          contentRef.current.currentSongData.songId,
          'listens',
          1
        );
      } else if (typeof currentSongIndex === 'number') {
        if (refQueue.current.queue.length > 0) {
          if (refQueue.current.queue.length - 1 === currentSongIndex) {
            if (contentRef.current.player.isRepeating === 'repeat') changeQueueCurrentSongIndex(0);
          } else changeQueueCurrentSongIndex(currentSongIndex + 1);
        } else console.log('Queue is empty.');
      } else if (refQueue.current.queue.length > 0) changeQueueCurrentSongIndex(0);
    },
    [changeQueueCurrentSongIndex, recordListeningData, toggleSongPlayback]
  );

  React.useEffect(() => {
    const { isInDevelopment } = window.api.properties;
    let artworkPath: string | undefined;

    if (!isInDevelopment && contentRef.current.currentSongData.artwork) {
      const blob = new Blob([contentRef.current.currentSongData.artwork]);
      artworkPath = URL.createObjectURL(blob);
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: contentRef.current.currentSongData.title,
      artist: Array.isArray(contentRef.current.currentSongData.artists)
        ? contentRef.current.currentSongData.artists.map((artist) => artist.name).join(', ')
        : t('common.unknownArtist'),
      album: contentRef.current.currentSongData.album
        ? contentRef.current.currentSongData.album.name || t('common.unknownAlbum')
        : t('common.unknownAlbum'),
      artwork: [
        {
          // src: `http://nora.app/local/${contentRef.current.currentSongData.artworkPath}`,
          // src: `data:;base64,${contentRef.current.currentSongData.artwork}`,
          src: artworkPath || `data:;base64,${contentRef.current.currentSongData.artwork}`,
          // src: contentRef.current.currentSongData.artworkPath || '',
          sizes: '1000x1000',
          type: 'image/webp'
        }
      ]
    });

    // if (content.currentSongData) {
    //   const title = `Listening to '${content.currentSongData.title}'`;
    //   const artists = `By ${content.currentSongData.artists?.map((artist) => artist.name).join(', ') || 'an unknown artist'}`;
    //   console.log(title, artists);

    //   const now = Date.now();
    //   window.api.playerControls.setDiscordRpcActivity({
    //     details: title,
    //     state: artists,
    //     largeImageKey: 'nora_logo',
    //     smallImageKey: 'song_artwork'
    //     // largeImageText: 'Nora',
    //     // smallImageText: 'Playing a song'
    //     // startTimestamp: now,
    //     // endTimestamp: now + (player.duration || 0) - (player.currentTime || 0)
    //   });
    // }

    const handleSkipForwardClickWithParams = () => handleSkipForwardClick('PLAYER_SKIP');

    navigator.mediaSession.setActionHandler('pause', () => toggleSongPlayback(false));
    navigator.mediaSession.setActionHandler('play', () => toggleSongPlayback(true));
    navigator.mediaSession.setActionHandler('previoustrack', handleSkipBackwardClick);
    navigator.mediaSession.setActionHandler(`nexttrack`, handleSkipForwardClickWithParams);
    navigator.mediaSession.playbackState = content.player.isCurrentSongPlaying
      ? 'playing'
      : 'paused';
    return () => {
      if (artworkPath) URL.revokeObjectURL(artworkPath);
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    };
  }, [
    content.currentSongData,
    content.player.isCurrentSongPlaying,
    handleSkipBackwardClick,
    handleSkipForwardClick,
    t,
    toggleSongPlayback
  ]);

  const toggleShuffling = React.useCallback((isShuffling?: boolean) => {
    dispatch({ type: 'TOGGLE_SHUFFLE_STATE', data: isShuffling });
    if (isShuffling !== undefined) contentRef.current.player.isShuffling = isShuffling;
    else contentRef.current.player.isShuffling = !contentRef.current.player.isShuffling;
  }, []);

  const shuffleQueue = React.useCallback(
    (songIds: string[], currentSongIndex?: number) => {
      toggleShuffling(true);
      return shuffleQueueRandomly(songIds, currentSongIndex);
    },
    [toggleShuffling]
  );

  const createQueue = React.useCallback(
    (
      newQueue: string[],
      queueType: QueueTypes,
      isShuffleQueue = content.player.isShuffling,
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
      refQueue.current = queue;
      if (startPlaying) changeQueueCurrentSongIndex(0);
    },
    [changeQueueCurrentSongIndex, content.player.isShuffling, shuffleQueue, toggleShuffling]
  );

  const updateQueueData = React.useCallback(
    (
      currentSongIndex?: number | null,
      newQueue?: string[],
      isShuffleQueue = false,
      playCurrentSongIndex = true,
      clearPreviousQueueData = false
    ) => {
      const queue: Queue = {
        ...refQueue.current,
        currentSongIndex:
          typeof currentSongIndex === 'number' || currentSongIndex === null
            ? currentSongIndex
            : refQueue.current.currentSongIndex,
        queue: newQueue ?? refQueue.current.queue
      };
      if (clearPreviousQueueData) queue.queueBeforeShuffle = [];
      if (Array.isArray(newQueue) && newQueue.length > 1 && isShuffleQueue) {
        const { shuffledQueue, positions } = shuffleQueue(
          queue.queue,
          queue.currentSongIndex ?? refQueue.current.currentSongIndex ?? undefined
        );
        queue.queue = shuffledQueue;
        if (positions.length > 0) queue.queueBeforeShuffle = positions;
        queue.currentSongIndex = 0;
      }
      storage.queue.setQueue(queue);
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
      const menuData: ContextMenuData = {
        isVisible,
        data: contextMenuData,
        menuItems: menuItems.length > 0 ? menuItems : contentRef.current.contextMenuData.menuItems,
        pageX: pageX !== undefined ? pageX : contentRef.current.contextMenuData.pageX,
        pageY: pageY !== undefined ? pageY : contentRef.current.contextMenuData.pageY
      };

      dispatch({
        type: 'CONTEXT_MENU_DATA_CHANGE',
        data: menuData
      });
      contentRef.current.contextMenuData = menuData;
    },
    []
  );

  const updateBodyBackgroundImage = React.useCallback((isVisible: boolean, src?: string) => {
    let image: string | undefined;
    const disableBackgroundArtworks = storage.preferences.getPreferences(
      'disableBackgroundArtworks'
    );

    if (!disableBackgroundArtworks && isVisible && src) image = src;

    contentRef.current.bodyBackgroundImage = image;
    return dispatch({
      type: 'UPDATE_BODY_BACKGROUND_IMAGE',
      data: image
    });
  }, []);

  const updateCurrentlyActivePageData = React.useCallback(
    (callback: (currentPageData: PageData) => PageData) => {
      const { navigationHistory } = contentRef.current;
      const updatedData = callback(
        navigationHistory.history[navigationHistory.pageHistoryIndex].data ?? {
          scrollTopOffset: 0
        }
      );
      contentRef.current.navigationHistory.history[
        contentRef.current.navigationHistory.pageHistoryIndex
      ].data = updatedData;
      dispatch({
        type: 'CURRENT_ACTIVE_PAGE_DATA_UPDATE',
        data: updatedData
      });
    },
    []
  );

  const updatePageHistoryIndex = React.useCallback((type: 'increment' | 'decrement' | 'home') => {
    const { history, pageHistoryIndex } = contentRef.current.navigationHistory;
    if (type === 'decrement' && pageHistoryIndex - 1 >= 0) {
      const newPageHistoryIndex = pageHistoryIndex - 1;
      const data = {
        pageHistoryIndex: newPageHistoryIndex,
        history
      } as NavigationHistoryData;
      contentRef.current.navigationHistory = data;
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
      contentRef.current.navigationHistory = data;
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
      contentRef.current.navigationHistory = data;
      return dispatch({
        type: 'UPDATE_NAVIGATION_HISTORY',
        data
      });
    }
    return undefined;
  }, []);

  const updatePromptMenuHistoryIndex = React.useCallback(
    (type: 'increment' | 'decrement' | 'home') => {
      const { prompts, currentActiveIndex } = contentRef.current.promptMenuNavigationData;
      if (type === 'decrement' && currentActiveIndex - 1 >= 0) {
        const newPageHistoryIndex = currentActiveIndex - 1;
        const data = {
          isVisible: true,
          currentActiveIndex: newPageHistoryIndex,
          prompts
        };
        contentRef.current.promptMenuNavigationData = data;
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
        contentRef.current.promptMenuNavigationData = data;
        return dispatch({
          type: 'PROMPT_MENU_DATA_CHANGE',
          data
        });
      }
      return undefined;
    },
    []
  );

  const updateMultipleSelections = React.useCallback(
    (id: string, selectionType: QueueTypes, type: 'add' | 'remove') => {
      if (
        contentRef.current.multipleSelectionsData.selectionType &&
        selectionType !== contentRef.current.multipleSelectionsData.selectionType
      )
        return;
      let { multipleSelections } = contentRef.current.multipleSelectionsData;
      if (type === 'add') {
        if (multipleSelections.includes(id)) return;
        multipleSelections.push(id);
      } else if (type === 'remove') {
        if (!multipleSelections.includes(id)) return;
        multipleSelections = multipleSelections.filter((selection) => selection !== id);
      }

      contentRef.current.multipleSelectionsData.multipleSelections = multipleSelections;
      contentRef.current.multipleSelectionsData.selectionType = selectionType;
      dispatch({
        type: 'UPDATE_MULTIPLE_SELECTIONS_DATA',
        data: {
          ...contentRef.current.multipleSelectionsData,
          selectionType,
          multipleSelections
        } as MultipleSelectionData
      });
    },
    []
  );

  const toggleMultipleSelections = React.useCallback(
    (
      isEnabled?: boolean,
      selectionType?: QueueTypes,
      addSelections?: string[],
      replaceSelections = false
    ) => {
      if (typeof isEnabled === 'boolean') {
        contentRef.current.multipleSelectionsData.selectionType = selectionType;
        if (Array.isArray(addSelections) && isEnabled === true)
          if (replaceSelections) {
            contentRef.current.multipleSelectionsData.multipleSelections = addSelections;
          } else
            contentRef.current.multipleSelectionsData.multipleSelections.push(...addSelections);
        if (isEnabled === false) {
          contentRef.current.multipleSelectionsData.multipleSelections = [];
          contentRef.current.multipleSelectionsData.selectionType = undefined;
        }
        contentRef.current.multipleSelectionsData.isEnabled = isEnabled;
        dispatch({
          type: 'UPDATE_MULTIPLE_SELECTIONS_DATA',
          data: {
            ...contentRef.current.multipleSelectionsData
          } as MultipleSelectionData
        });
      }
    },
    []
  );

  const changeCurrentActivePage = React.useCallback(
    (pageClass: PageTitles, data?: PageData) => {
      const { navigationHistory } = contentRef.current;
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
        contentRef.current.navigationHistory = navigationHistory;
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
            delay: 2500
          }
        ]);
    },
    [addNewNotifications, t, toggleMultipleSelections]
  );

  const updatePlayerType = React.useCallback(
    (type: PlayerTypes) => {
      if (content.playerType !== type) {
        dispatch({ type: 'UPDATE_PLAYER_TYPE', data: type });
        contentRef.current.playerType = type;
      }
    },
    [content.playerType]
  );

  const toggleIsFavorite = React.useCallback(
    (isFavorite?: boolean, onlyChangeCurrentSongData = false) => {
      toggleSongIsFavorite(
        contentRef.current.currentSongData.songId,
        contentRef.current.currentSongData.isAFavorite,
        isFavorite,
        onlyChangeCurrentSongData
      )
        .then((newFavorite) => {
          if (typeof newFavorite === 'boolean') {
            contentRef.current.currentSongData.isAFavorite = newFavorite;
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

  const updateVolume = React.useCallback((volume: number) => {
    if (fadeInIntervalId.current) clearInterval(fadeInIntervalId.current);
    if (fadeOutIntervalId.current) clearInterval(fadeOutIntervalId.current);

    storage.playback.setVolumeOptions('value', volume);
    contentRef.current.player.volume.value = volume;
    dispatch({
      type: 'UPDATE_VOLUME_VALUE',
      data: volume
    });
  }, []);

  const updateSongPosition = React.useCallback((position: number) => {
    if (position >= 0 && position <= player.duration) player.currentTime = position;
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
        contentRef.current.player.volume.isMuted = !contentRef.current.player.volume.isMuted;
      }
    },
    [content.player.volume.isMuted]
  );

  const manageKeyboardShortcuts = React.useCallback((e) => {
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
      console.log(comboKeys)

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
          toggleMutedState(!contentRef.current.player.volume.isMuted);
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
          updatedPlaybackRate = content.localStorage.playback.playbackRate || 1;
          if (updatedPlaybackRate + 0.05 > 4) updatedPlaybackRate = 4;
          else updatedPlaybackRate += 0.05;
          updatedPlaybackRate = parseFloat(updatedPlaybackRate.toFixed(2));
          storage.setItem('playback', 'playbackRate', updatedPlaybackRate);
          addNewNotifications([
            { id: 'playbackRate', iconName: 'avg_pace', content: t('notifications.playbackRateChanged', { val: updatedPlaybackRate }) }
          ]);
          break;
        case i18n.t('appShortcutsPrompt.downPlaybackRate'):
          updatedPlaybackRate = content.localStorage.playback.playbackRate || 1;
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
        case i18n.t('appShortcutsPrompt.openDevtools'):
          if (!window.api.properties.isInDevelopment) {
            window.api.settingsHelpers.openDevtools();
          }
          break;
        default:
          console.warn(`Unhandled shortcut action: ${matchedShortcut.label}`);
      }
    }
  }, [updateVolume, toggleMutedState, handleSkipForwardClick, handleSkipBackwardClick, toggleShuffling, toggleRepeat, toggleIsFavorite, content.localStorage.playback.playbackRate, changeCurrentActivePage, toggleSongPlayback, addNewNotifications, t]);
  

  React.useEffect(() => {
    window.addEventListener('click', handleContextMenuVisibilityUpdate);
    window.addEventListener('keydown', manageKeyboardShortcuts);
    return () => {
      window.removeEventListener('click', handleContextMenuVisibilityUpdate);
      window.removeEventListener('keydown', manageKeyboardShortcuts);
    };
  }, [handleContextMenuVisibilityUpdate, manageKeyboardShortcuts]);

  const updateUserData = React.useCallback(
    async (callback: (prevState: UserData) => UserData | Promise<UserData> | void) => {
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

  const fetchUserData = React.useCallback(
    () =>
      window.api.userData
        .getUserData()
        .then((res) => updateUserData(() => res))
        .catch((err) => console.error(err)),
    [updateUserData]
  );

  React.useEffect(() => {
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

  const onSongDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      console.log(e.dataTransfer.files);
      if (e.dataTransfer.files.length > 0) {
        const isASupportedAudioFormat = packageFile.appPreferences.supportedMusicExtensions.some(
          (type) => e.dataTransfer.files[0].path.endsWith(type)
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

    const updatedQueue = refQueue.current.queue.filter(
      (songId) => songId !== content.currentSongData.songId
    );
    updateQueueData(null, updatedQueue);

    dispatch({ type: 'CURRENT_SONG_DATA_CHANGE', data: {} });
    contentRef.current.currentSongData = {} as AudioPlayerData;

    addNewNotifications([
      {
        id: 'songPausedOnDelete',
        delay: 7500,
        content: t('notifications.playbackPausedDueToSongDeletion')
      }
    ]);
  }, [addNewNotifications, content.currentSongData.songId, t, toggleSongPlayback, updateQueueData]);

  const updateEqualizerOptions = React.useCallback((options: Equalizer) => {
    storage.equalizerPreset.setEqualizerPreset(options);
  }, []);

  const changeUpNextSongData = React.useCallback((upNextSongData?: AudioPlayerData) => {
    // dispatch({ type: 'UP_NEXT_SONG_DATA_CHANGE', data: upNextSongData });
    contentRef.current.upNextSongData = upNextSongData;
  }, []);

  const promptMenuData = React.useMemo(() => {
    const { currentActiveIndex, isVisible, prompts } = content.promptMenuNavigationData;

    return {
      isVisible,
      prompt: prompts?.at(currentActiveIndex)?.prompt,
      className: prompts?.at(currentActiveIndex)?.className,
      noOfPrompts: prompts.length,
      currentActiveIndex
    };
  }, [content.promptMenuNavigationData]);

  const appContextStateValues: AppStateContextType = React.useMemo(
    () => ({
      isDarkMode: content.isDarkMode,
      contextMenuData: content.contextMenuData,
      promptMenuData,
      currentSongData: {
        ...content.currentSongData,
        duration: player.duration || content.currentSongData.duration
      },
      upNextSongData: contentRef.current.upNextSongData,
      currentlyActivePage:
        contentRef.current.navigationHistory.history[content.navigationHistory.pageHistoryIndex],
      notificationPanelData: content.notificationPanelData,
      userData: content.userData,
      localStorageData: content.localStorage,
      queue: refQueue.current,
      isCurrentSongPlaying: content.player.isCurrentSongPlaying,
      noOfPagesInHistory: content.navigationHistory.history.length - 1,
      pageHistoryIndex: content.navigationHistory.pageHistoryIndex,
      volume: content.player.volume.value,
      isMuted: content.player.volume.isMuted,
      isRepeating: content.player.isRepeating,
      isShuffling: content.player.isShuffling,
      isPlayerStalled: content.player.isPlayerStalled,
      bodyBackgroundImage: content.bodyBackgroundImage,
      isMultipleSelectionEnabled: content.multipleSelectionsData.isEnabled,
      multipleSelectionsData: content.multipleSelectionsData,
      appUpdatesState: content.appUpdatesState,
      equalizerOptions: content.localStorage.equalizerPreset,
      playerType: content.playerType
    }),
    [
      content.isDarkMode,
      content.contextMenuData,
      content.currentSongData,
      content.navigationHistory.pageHistoryIndex,
      content.navigationHistory.history.length,
      content.notificationPanelData,
      content.userData,
      content.localStorage,
      content.player.isCurrentSongPlaying,
      content.player.volume.value,
      content.player.volume.isMuted,
      content.player.isRepeating,
      content.player.isShuffling,
      content.player.isPlayerStalled,
      content.bodyBackgroundImage,
      content.multipleSelectionsData,
      content.appUpdatesState,
      content.playerType,
      promptMenuData
    ]
  );

  const appUpdateContextValues: AppUpdateContextType = React.useMemo(
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

  // const songPositionContextValues = React.useMemo(
  //   () => ({
  //     songPosition: content.player.songPosition,
  //   }),
  //   [content.player.songPosition],
  // );

  const isReducedMotion =
    content.localStorage.preferences.isReducedMotion ||
    (content.isOnBatteryPower && content.localStorage.preferences.removeAnimationsOnBatteryPower);

  return (
    <ErrorBoundary>
      <AppContext.Provider value={appContextStateValues}>
        <AppUpdateContext.Provider value={appUpdateContextValues}>
          {content.playerType === 'normal' ? (
            <div
              className={`App select-none ${
                content.isDarkMode ? 'dark bg-dark-background-color-1' : 'bg-background-color-1'
              } ${
                isReducedMotion
                  ? 'reduced-motion animate-none transition-none !delay-0 !duration-[0] [&.dialog-menu]:!backdrop-blur-none'
                  : ''
              } grid !h-screen w-full grid-rows-[auto_1fr_auto] items-center overflow-y-hidden after:invisible after:absolute after:-z-10 after:grid after:h-full after:w-full after:place-items-center after:bg-[rgba(0,0,0,0)] after:text-4xl after:font-medium after:text-font-color-white after:content-["Drop_your_song_here"] dark:after:bg-[rgba(0,0,0,0)] dark:after:text-font-color-white [&.blurred_#title-bar]:opacity-40 [&.fullscreen_#window-controls-container]:hidden [&.song-drop]:after:visible [&.song-drop]:after:z-20 [&.song-drop]:after:border-4 [&.song-drop]:after:border-dashed [&.song-drop]:after:border-[#ccc] [&.song-drop]:after:bg-[rgba(0,0,0,0.7)] [&.song-drop]:after:transition-[background,visibility,color] dark:[&.song-drop]:after:border-[#ccc] dark:[&.song-drop]:after:bg-[rgba(0,0,0,0.7)]`}
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
              {content.bodyBackgroundImage && (
                <div
                  className={`body-background-image-container absolute h-full w-full overflow-hidden bg-center opacity-100 blur-0 brightness-100 transition-[filter,opacity] duration-500 ${
                    content.bodyBackgroundImage && '!opacity-100 !blur-sm !brightness-75'
                  }`}
                >
                  <Img
                    className="w-full bg-cover"
                    loading="eager"
                    src={content.bodyBackgroundImage}
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
              {content.playerType === 'mini' ? (
                <Suspense fallback={<SuspenseLoader />}>
                  <MiniPlayer
                    className={`${
                      isReducedMotion
                        ? 'reduced-motion animate-none transition-none !duration-[0] [&.dialog-menu]:!backdrop-blur-none'
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
      </AppContext.Provider>
    </ErrorBoundary>
  );
}
