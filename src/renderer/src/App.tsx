// ? BASE IMPORTS
import { lazy, useCallback, useEffect, useMemo, useRef } from 'react';
import './assets/styles/styles.css';
import 'material-symbols/rounded.css';

// ? CONTEXTS
import { AppUpdateContext, type AppUpdateContextType } from './contexts/AppUpdateContext';
import { initializeQueue } from './other/queueSingleton';
// import { SongPositionContext } from './contexts/SongPositionContext';

// ? HOOKS
import useNetworkConnectivity from './hooks/useNetworkConnectivity';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useWindowManagement } from './hooks/useWindowManagement';
import { useNotifications } from './hooks/useNotifications';
import { useDynamicTheme } from './hooks/useDynamicTheme';
import { useMultiSelection } from './hooks/useMultiSelection';
import { usePromptMenu } from './hooks/usePromptMenu';
import { useContextMenu } from './hooks/useContextMenu';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAppLifecycle } from './hooks/useAppLifecycle';
import { useDataSync } from './hooks/useDataSync';
import { useMediaSession } from './hooks/useMediaSession';
import { useDiscordRpc } from './hooks/useDiscordRpc';
import { useAppUpdates } from './hooks/useAppUpdates';
import { useListeningData } from './hooks/useListeningData';
import { useQueueManagement } from './hooks/useQueueManagement';
import { usePlaybackErrors } from './hooks/usePlaybackErrors';
import { usePlaybackSettings } from './hooks/usePlaybackSettings';
import { usePlayerControl } from './hooks/usePlayerControl';
import { usePlayerNavigation } from './hooks/usePlayerNavigation';

// ? MAIN APP COMPONENTS
import ErrorBoundary from './components/ErrorBoundary';

// ? PROMPTS
const SongUnplayableErrorPrompt = lazy(() => import('./components/SongUnplayableErrorPrompt'));

// ? SCREENS

// ? UTILS
import { dispatch, store } from './store/store';
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Outlet } from '@tanstack/react-router';

// ? / / / / / / /  PLAYER DEFAULT OPTIONS / / / / / / / / / / / / / /
// player.addEventListener('player/trackchange', (e) => {
//   if ('detail' in e) {
//     console.log(`player track changed to ${(e as DetailAvailableEvent<string>).detail}.`);
//   }
// });
// / / / / / / / /

const updateNetworkStatus = () => window.api.settingsHelpers.networkStatusChange(navigator.onLine);

updateNetworkStatus();
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// console.log('Command line args', window.api.properties.commandLineArgs);

export default function App() {
  // ? INITIALIZE QUEUE (singleton with store sync)
  // This must be called before useAudioPlayer to ensure queue is ready
  useEffect(() => {
    initializeQueue();
  }, []);

  // ? INITIALIZE PLAYER AND QUEUE (singleton instances via custom hooks)
  const player = useAudioPlayer();
  const audio = player.audio;
  const playerQueue = player.queue; // Access properties directly from AudioPlayer instance

  // const [content, dispatch] = useReducer(reducer, DEFAULT_REDUCER_DATA);
  // // Had to use a Ref in parallel with the Reducer to avoid an issue that happens when using content.* not giving the intended data in useCallback functions even though it was added as a dependency of that function.
  // const contentRef = useRef(DEFAULT_REDUCER_DATA);

  const AppRef = useRef(null as HTMLDivElement | null);
  // const storeRef = useRef<AppReducer>(undefined);

  const { isOnline } = useNetworkConnectivity();

  // ? INITIALIZE NOTIFICATIONS
  // Notifications hook handles adding/updating notifications and IPC messages from main
  const { addNewNotifications, updateNotifications } = useNotifications();

  // ? INITIALIZE DYNAMIC THEME
  // Dynamic theme hook handles theme generation from song palettes and background images
  // Theme is automatically applied/removed based on preferences and song data
  const { updateBodyBackgroundImage } = useDynamicTheme();

  // ? INITIALIZE MULTI-SELECTION
  // Multi-selection hook handles selecting multiple items for batch operations
  const { updateMultipleSelections, toggleMultipleSelections } = useMultiSelection();

  // ? INITIALIZE PROMPT MENU
  // Prompt menu hook handles modal dialogs, error messages, and overlay content
  const { changePromptMenuData, updatePromptMenuHistoryIndex } = usePromptMenu();

  // ? INITIALIZE CONTEXT MENU
  // Context menu hook handles right-click menu state and visibility
  // Note: Global click listener is now handled automatically inside the hook
  const { updateContextMenuData } = useContextMenu();

  // ? INITIALIZE KEYBOARD SHORTCUTS
  // Keyboard shortcuts hook handles all keyboard shortcuts and their actions
  // Will be initialized after all other dependencies are defined
  // Note: Hook call moved to after all callbacks are defined due to dependencies

  // ? INITIALIZE DATA SYNC
  // Data sync hook handles IPC data update events and query cache invalidation
  useDataSync();

  // ? INITIALIZE PLAYBACK ERRORS
  // Playback errors hook handles error management and retry logic
  const { managePlaybackErrors } = usePlaybackErrors(audio, changePromptMenuData);

  // ? INITIALIZE PLAYBACK SETTINGS
  // Playback settings hook handles repeat, volume, mute, position, favorites, and equalizer
  const {
    toggleRepeat,
    toggleMutedState,
    updateVolume,
    updateSongPosition,
    toggleIsFavorite,
    updateEqualizerOptions
  } = usePlaybackSettings(audio);

  // ? INITIALIZE LISTENING DATA
  // Listening data hook handles recording song playback sessions for analytics
  const { recordListeningData } = useListeningData(audio);

  // ? WIRE UP LISTENING DATA RECORDING TO PLAYER EVENTS
  // Listen for songLoaded events from AudioPlayer to record listening data
  useEffect(() => {
    const handleSongLoaded = (songData: AudioPlayerData) => {
      recordListeningData(songData.songId, songData.duration, false, true);
    };

    player.on('songLoaded', handleSongLoaded);

    return () => {
      player.off('songLoaded', handleSongLoaded);
    };
  }, [player, recordListeningData]);

  // ? INITIALIZE PLAYER CONTROL
  // Player control hook handles play/pause, song loading, and player state management
  const {
    toggleSongPlayback,
    playSong,
    playSongFromUnknownSource,
    updateCurrentSongData,
    clearAudioPlayerData,
    updateCurrentSongPlaybackState,
    refStartPlay
  } = usePlayerControl(
    player, // Pass AudioPlayer instance instead of audio element
    playerQueue,
    recordListeningData,
    managePlaybackErrors,
    changePromptMenuData,
    addNewNotifications
  );

  // ? INITIALIZE PLAYER NAVIGATION
  // Player navigation hook handles skip forward/backward and queue navigation
  // Songs are auto-loaded by AudioPlayer on queue position changes
  const { changeQueueCurrentSongIndex, handleSkipBackwardClick, handleSkipForwardClick } =
    usePlayerNavigation(player, playerQueue, toggleSongPlayback, recordListeningData);

  // ? INITIALIZE APP UPDATES
  // App updates hook handles checking for updates and showing release notes
  const { updateAppUpdatesState } = useAppUpdates({
    changePromptMenuData,
    isOnline
  });

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

  // ? INITIALIZE WINDOW MANAGEMENT
  // Window management hook handles blur/focus, fullscreen, drag-and-drop, and title bar updates
  const windowManagement = useWindowManagement(AppRef, {
    changePromptMenuData,
    fetchSongFromUnknownSource
  });

  // ? INITIALIZE QUEUE MANAGEMENT
  // Queue management hook handles queue creation, updates, and shuffle operations
  const {
    createQueue,
    updateQueueData,
    toggleQueueShuffle,
    toggleShuffling,
    changeUpNextSongData
  } = useQueueManagement({
    playerQueue,
    playSong
  });

  const updatePlayerType = useCallback((type: PlayerTypes) => {
    if (store.state.playerType !== type) {
      dispatch({ type: 'UPDATE_PLAYER_TYPE', data: type });
    }
  }, []);

  // ? INITIALIZE MEDIA SESSION
  // Media session hook handles OS-level media controls and browser media notifications
  useMediaSession(audio, {
    toggleSongPlayback,
    handleSkipBackwardClick,
    handleSkipForwardClick,
    updateSongPosition
  });

  // ? INITIALIZE DISCORD RPC
  // Discord RPC hook handles Discord Rich Presence integration
  useDiscordRpc(audio);

  // Set up keyboard shortcuts with all required dependencies
  useKeyboardShortcuts({
    toggleSongPlayback,
    toggleMutedState,
    handleSkipForwardClick,
    handleSkipBackwardClick,
    updateVolume,
    toggleShuffling,
    toggleRepeat,
    toggleIsFavorite,
    addNewNotifications,
    updatePlayerType,
    toggleMultipleSelections,
    changePromptMenuData
  });

  // Initialize app lifecycle (startup, localStorage sync, queue initialization, event listeners)
  // Must be called after all dependencies are defined
  // This hook now manages all player event listeners, IPC controls, and lifecycle events
  useAppLifecycle({
    audio: player, // Pass AudioPlayer instance
    playerQueue,
    toggleShuffling,
    toggleRepeat,
    playSongFromUnknownSource,
    playSong,
    createQueue,
    changeUpNextSongData,
    managePlaybackErrors,
    toggleSongPlayback,
    handleSkipBackwardClick,
    handleSkipForwardClick,
    refStartPlay,
    windowManagement
  });

  const appUpdateContextValues = useMemo<AppUpdateContextType>(
    () => {
      const contextValue: AppUpdateContextType = {
        updateCurrentSongData,
        updateContextMenuData,
        changePromptMenuData,
        changeUpNextSongData,
        updatePromptMenuHistoryIndex,
        playSong,
        addNewNotifications,
        updateNotifications,
        createQueue,
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
        toggleQueueShuffle,
        toggleIsFavorite,
        toggleSongPlayback,
        updateQueueData,
        clearAudioPlayerData,
        updateBodyBackgroundImage,
        updateMultipleSelections,
        toggleMultipleSelections,
        updateAppUpdatesState,
        updateEqualizerOptions
      };
      return contextValue;
    },
    [
      updateCurrentSongData,
      updateContextMenuData,
      changePromptMenuData,
      changeUpNextSongData,
      updatePromptMenuHistoryIndex,
      playSong,
      addNewNotifications,
      updateNotifications,
      createQueue,
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
      toggleQueueShuffle,
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

  return (
    <ErrorBoundary>
      <AppUpdateContext.Provider value={appUpdateContextValues}>
        <div
          className="main-app bg-background-color-1 dark:bg-dark-background-color-1 relative h-screen! min-h-screen w-full overflow-hidden"
          ref={AppRef}
          onDragEnter={windowManagement.addSongDropPlaceholder}
          onDragLeave={windowManagement.removeSongDropPlaceholder}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={windowManagement.onSongDrop}
        >
          <Outlet />
        </div>
      </AppUpdateContext.Provider>
      {/* <TanStackRouterDevtools position="bottom-right" /> */}
    </ErrorBoundary>
  );
}
