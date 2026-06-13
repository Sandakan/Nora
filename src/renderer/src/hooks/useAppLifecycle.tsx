import PlayerQueue from '@renderer/other/playerQueue';
import { useEffect } from 'react';

import type AudioPlayer from '../other/player';
import { dispatch, store } from '../store/store';
import storage from '../utils/localStorage';

/** Dependencies required by the app lifecycle hook */
export interface AppLifecycleDependencies {
  /** AudioPlayer instance or HTMLAudioElement for playback control */
  audio: AudioPlayer | HTMLAudioElement;

  /** PlayerQueue instance for queue management */
  playerQueue: PlayerQueue;

  /** Toggle shuffle mode */
  toggleShuffling: (isShuffling?: boolean) => void;

  /** Toggle repeat mode */
  toggleRepeat: (newState?: RepeatTypes) => void;

  /** Play a song from unknown source (file path) */
  playSongFromUnknownSource: (audioPlayerData: AudioPlayerData, isStartPlay?: boolean) => void;

  /** Play a song by ID */
  playSong: (songId: number, isStartPlay?: boolean, playAsCurrentSongIndex?: boolean) => void;

  /** Create a new queue */
  createQueue: (
    newQueue: number[],
    queueType: QueueTypes,
    isShuffleQueue?: boolean,
    queueId?: string,
    startPlaying?: boolean
  ) => void;

  /** Change up next song data */
  changeUpNextSongData: (upNextSongData?: AudioPlayerData) => void;

  /** Manage playback errors */
  managePlaybackErrors: (error: unknown) => void;

  /** Reset playback error retry counter */
  resetErrorCount: () => void;

  /** Toggle song playback (play/pause) */
  toggleSongPlayback: (startPlay?: boolean) => void;

  /** Skip backward to previous song */
  handleSkipBackwardClick: () => void;

  /** Skip forward to next song */
  handleSkipForwardClick: (reason?: SongSkipReason) => void;

  /** Ref to control auto-play after song loads */
  refStartPlay: React.MutableRefObject<boolean>;

  /** Window management functions */
  windowManagement: {
    addSongTitleToTitleBar: () => void;
    resetTitleBarInfo: () => void;
  };
}

/**
 * Hook for managing app lifecycle events
 *
 * Handles application startup initialization including: - LocalStorage synchronization - Default
 * page navigation - Restore playback state (shuffle, repeat) - Resume playing previous song or
 * startup songs - Initialize queue from localStorage or create new queue - Player event listeners
 * (error, play, pause, canplay, ended) - IPC control listeners (playback controls, file
 * associations) - Title bar updates based on playback state
 *
 * This hook automatically sets up all lifecycle listeners and cleanup.
 *
 * @example
 *   ```tsx
 *   function App() {
 *     const { createQueue } = useQueueManagement();
 *     const { managePlaybackErrors } = usePlaybackErrors();
 *     const { toggleSongPlayback, refStartPlay } = usePlayerControl();
 *     const windowManagement = useWindowManagement();
 *     // ... other hooks
 *
 *     useAppLifecycle({
 *       playSong,
 *       createQueue,
 *       managePlaybackErrors,
 *       toggleSongPlayback,
 *       refStartPlay,
 *       windowManagement
 *       // ... other dependencies
 *     });
 *
 *     return <div>...</div>;
 *   }
 *   ```;
 *
 * @param dependencies - Object containing all required callback functions
 */
export function useAppLifecycle(dependencies: AppLifecycleDependencies): void {
  const {
    audio: playerInstance,
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
  } = dependencies;

  // Extract audio element from AudioPlayer or use HTMLAudioElement directly.
  // audioPlayerAccess gives us the AudioPlayer instance when available so we can
  // subscribe through its event emitter — the emitter routes events from whichever
  // audio element is currently active, so listeners stay alive after crossfade.
  const audioPlayerAccess =
    playerInstance instanceof HTMLAudioElement ? null : (playerInstance as AudioPlayer);
  const player = audioPlayerAccess
    ? audioPlayerAccess.audio
    : (playerInstance as HTMLAudioElement);

  useEffect(() => {
    // LOCAL STORAGE
    const { playback, preferences, queue } = storage.getAllItems();

    const syncLocalStorage = () => {
      const allItems = storage.getAllItems();
      dispatch({ type: 'UPDATE_LOCAL_STORAGE', data: allItems });

      console.log('local storage updated');
    };

    document.addEventListener('localStorage', syncLocalStorage);

    // Navigate to default page on startup if needed
    if (
      playback?.currentSong?.songId &&
      preferences?.defaultPageOnStartUp &&
      window.location.pathname !== `/main-player/${preferences.defaultPageOnStartUp}`
    ) {
      // TODO: Implement default page navigation
      // navigate(preferences.defaultPageOnStartUp);
    }

    // Restore playback state
    toggleShuffling(playback?.isShuffling);
    toggleRepeat(playback?.isRepeating);

    // Check for startup songs (e.g., songs opened via file association)
    window.api.audioLibraryControls
      .checkForStartUpSongs()
      .then((startUpSongData) => {
        if (startUpSongData) {
          playSongFromUnknownSource(startUpSongData, true);
        } else if (playback?.currentSong?.songId) {
          // Resume previous song
          playSong(playback.currentSong.songId, false);

          const currSongPosition = Number(playback.currentSong.stoppedPosition);
          player.currentTime = currSongPosition;
          dispatch({
            type: 'UPDATE_SONG_POSITION',
            data: currSongPosition
          });
        }
        return undefined;
      })
      .catch((err) => console.error(err));

    // Initialize queue from localStorage or create new queue
    if (queue) {
      // PlayerQueue already initialized from localStorage via usePlayerQueue hook
      // No need to reassign, just verify it matches
      const storedQueue = PlayerQueue.fromJSON(queue);
      if (storedQueue.length !== playerQueue.length) {
        console.warn('Queue mismatch detected, reinitializing from localStorage');
        playerQueue.replaceQueue(storedQueue.songIds, storedQueue.position, false);
      }
    } else {
      // No queue in localStorage, create default queue from all songs
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

  // Setup player queue event listeners
  useEffect(() => {
    // Note: localStorage queue persistence is now handled by queueSingleton.ts
    // to avoid duplicate writes on every queue/position change

    // Update up next song when position changes
    const unsubscribeUpNext = playerQueue.on('positionChange', async () => {
      const nextSongId = playerQueue.nextSongId;
      if (nextSongId) {
        try {
          const songData = await window.api.audioLibraryControls.getSong(nextSongId);
          if (songData) changeUpNextSongData(songData);
        } catch (err) {
          console.error('Failed to fetch up next song:', err);
        }
      } else {
        changeUpNextSongData(undefined);
      }
    });

    // Cleanup
    return () => {
      unsubscribeUpNext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setup player event listeners for error, play, pause, and quit events
  useEffect(() => {
    // When the AudioPlayer emitter is available, the dedicated emitter-subscription
    // useEffect below handles the same play/pause/error callbacks. Skip the DOM
    // fallback here to avoid firing each event twice.
    if (audioPlayerAccess) return;
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

    return () => {
      player.removeEventListener('error', handlePlayerErrorEvent);
      player.removeEventListener('play', handlePlayerPlayEvent);
      player.removeEventListener('pause', handlePlayerPauseEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managePlaybackErrors]);

  // Persist playback state on quit. Lives in its own effect (outside the
  // audioPlayerAccess guard above) so register/unregister always happens,
  // and uses audioPlayerAccess.getActiveAudio() so stoppedPosition reflects
  // whichever element actually played last after a crossfade.
  useEffect(() => {
    const handleBeforeQuitEvent = async () => {
      const activeAudio = audioPlayerAccess ? audioPlayerAccess.getActiveAudio() : player;
      storage.playback.setCurrentSongOptions('stoppedPosition', activeAudio.currentTime);
      storage.playback.setPlaybackOptions('isRepeating', store.state.player.isRepeating);
      storage.playback.setPlaybackOptions('isShuffling', store.state.player.isShuffling);
    };

    window.api.quitEvent.beforeQuitEvent(handleBeforeQuitEvent);

    return () => {
      window.api.quitEvent.removeBeforeQuitEventListener(handleBeforeQuitEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to AudioPlayer's play/pause/error emitter when available so that
  // subscribers stay alive across crossfade swaps. The DOM listeners above are
  // kept as a fallback for the HTMLAudioElement-only path.
  useEffect(() => {
    if (!audioPlayerAccess) return;
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

    audioPlayerAccess.on('error', handlePlayerErrorEvent);
    audioPlayerAccess.on('play', handlePlayerPlayEvent);
    audioPlayerAccess.on('pause', handlePlayerPauseEvent);

    return () => {
      audioPlayerAccess.off('error', handlePlayerErrorEvent);
      audioPlayerAccess.off('play', handlePlayerPlayEvent);
      audioPlayerAccess.off('pause', handlePlayerPauseEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioPlayerAccess, managePlaybackErrors]);

  // Setup player lifecycle event listeners for canplay and title bar updates
  useEffect(() => {
    // When the AudioPlayer emitter is available, the dedicated emitter-subscription
    // useEffect below covers canplay/play/pause. Skip the DOM fallback to avoid
    // a second dispatch per event.
    if (audioPlayerAccess) return;
    const displayDefaultTitleBar = () => {
      windowManagement.resetTitleBarInfo();
      storage.playback.setCurrentSongOptions('stoppedPosition', player.currentTime);
    };
    const playSongIfPlayable = () => {
      if (refStartPlay.current) toggleSongPlayback(true);
    };
    // Note: 'ended' event is now handled entirely by AudioPlayer.handleSongEnd()
    // which automatically moves to the next song and resumes playback

    player.addEventListener('canplay', playSongIfPlayable);
    player.addEventListener('play', windowManagement.addSongTitleToTitleBar);
    player.addEventListener('pause', displayDefaultTitleBar);

    return () => {
      toggleSongPlayback(false);
      player.removeEventListener('canplay', playSongIfPlayable);
      player.removeEventListener('play', windowManagement.addSongTitleToTitleBar);
      player.removeEventListener('pause', displayDefaultTitleBar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to AudioPlayer's canplay/play/pause emitter when available so the
  // title-bar and playSongIfPlayable callbacks stay alive across crossfade swaps.
  useEffect(() => {
    if (!audioPlayerAccess) return;
    const displayDefaultTitleBar = () => {
      windowManagement.resetTitleBarInfo();
      storage.playback.setCurrentSongOptions('stoppedPosition', player.currentTime);
    };
    const playSongIfPlayable = () => {
      if (refStartPlay.current) toggleSongPlayback(true);
    };

    audioPlayerAccess.on('canplay', playSongIfPlayable);
    audioPlayerAccess.on('play', windowManagement.addSongTitleToTitleBar);
    audioPlayerAccess.on('pause', displayDefaultTitleBar);

    return () => {
      toggleSongPlayback(false);
      audioPlayerAccess.off('canplay', playSongIfPlayable);
      audioPlayerAccess.off('play', windowManagement.addSongTitleToTitleBar);
      audioPlayerAccess.off('pause', displayDefaultTitleBar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioPlayerAccess]);

  // Setup IPC control listeners from main process
  useEffect(() => {
    const handleToggleSongPlayback = () => toggleSongPlayback();
    const handleSkipForwardClickListener = () => handleSkipForwardClick('PLAYER_SKIP');
    const handlePlaySongFromUnknownSource = (_: unknown, data: AudioPlayerData) =>
      playSongFromUnknownSource(data, true);

    window.api.unknownSource.playSongFromUnknownSource(handlePlaySongFromUnknownSource);
    window.api.playerControls.toggleSongPlayback(handleToggleSongPlayback);
    window.api.playerControls.skipBackwardToPreviousSong(handleSkipBackwardClick);
    window.api.playerControls.skipForwardToNextSong(handleSkipForwardClickListener);

    return () => {
      window.api.unknownSource.removePlaySongFromUnknownSourceEvent(
        handlePlaySongFromUnknownSource
      );
      window.api.playerControls.removeTogglePlaybackStateEvent(handleToggleSongPlayback);
      window.api.playerControls.removeSkipBackwardToPreviousSongEvent(handleSkipBackwardClick);
      window.api.playerControls.removeSkipForwardToNextSongEvent(handleSkipForwardClickListener);
      window.api.dataUpdates.removeDataUpdateEventListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
