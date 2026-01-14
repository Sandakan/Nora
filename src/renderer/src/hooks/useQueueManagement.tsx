import { useCallback } from 'react';
import { dispatch, store } from '../store/store';
import type PlayerQueue from '../other/playerQueue';

/**
 * Dependencies required by the useQueueManagement hook.
 */
export interface QueueManagementDependencies {
  /** The PlayerQueue instance */
  playerQueue: PlayerQueue;
  /** Function to play a song by ID */
  playSong: (songId: number, isStartPlay?: boolean, playAsCurrentSongIndex?: boolean) => void;
}

/**
 * Custom hook to manage the playback queue.
 *
 * This hook provides comprehensive queue management functionality including:
 * - Creating new queues with different types (songs, artists, albums, playlists, genres)
 * - Updating queue data (position, songs, shuffle state)
 * - Shuffling and unshuffling the queue
 * - Restoring original queue order from shuffle
 * - Syncing queue state with localStorage
 * - Managing shuffle state in the store
 * - Managing "up next" song data
 *
 * The hook integrates with the PlayerQueue class to provide a React-friendly
 * interface for queue operations and ensures state consistency across the app.
 *
 * @param dependencies - Object containing required dependencies
 *
 * @returns Object with queue management functions
 *
 * @example
 * ```tsx
 * function App() {
 *   const playerQueue = usePlayerQueue();
 *
 *   const { createQueue, toggleQueueShuffle, changeUpNextSongData } = useQueueManagement({
 *     playerQueue,
 *     playSong
 *   });
 *
 *   // Create a new queue
 *   createQueue(songIds, 'songs', false, undefined, true);
 *
 *   // Toggle shuffle
 *   toggleQueueShuffle();
 *
 *   // Update up next song
 *   changeUpNextSongData(nextSongData);
 * }
 * ```
 */
export function useQueueManagement(dependencies: QueueManagementDependencies) {
  const { playerQueue, playSong } = dependencies;

  /**
   * Updates the shuffle state in the Redux store.
   *
   * @param isShuffling - The new shuffle state (optional, toggles if not provided)
   */
  const toggleShuffling = useCallback((isShuffling?: boolean) => {
    dispatch({ type: 'TOGGLE_SHUFFLE_STATE', data: isShuffling });
  }, []);

  /**
   * Creates a new playback queue.
   *
   * This function:
   * 1. Replaces the current queue with new songs
   * 2. Sets the queue type and ID (for context)
   * 3. Optionally shuffles the queue
   * 4. Syncs to localStorage
   * 5. Optionally starts playback
   *
   * @param newQueue - Array of song IDs to add to the queue
   * @param queueType - Type of queue (songs, artists, albums, playlists, genres, folder, search)
   * @param isShuffleQueue - Whether to shuffle the queue (defaults to current shuffle state)
   * @param queueId - Optional ID to identify the queue source (e.g., playlist ID)
   * @param startPlaying - Whether to start playing the first song
   */
  const createQueue = useCallback(
    (
      newQueue: number[],
      queueType: QueueTypes,
      isShuffleQueue = store.state.player.isShuffling,
      queueId?: string | number,
      startPlaying = false
    ) => {
      // Replace the queue with new songs, starting at position 0
      playerQueue.replaceQueue(newQueue, 0, true, {
        queueId: queueId === undefined ? undefined : String(queueId),
        queueType
      });

      // Update shuffle state
      toggleShuffling(isShuffleQueue);

      // Shuffle if requested
      if (isShuffleQueue && !playerQueue.isEmpty) {
        playerQueue.shuffle();
      }

      // Persist to localStorage
      // storage.queue.setQueue(playerQueue); // Handled by queueSingleton events

      // Start playing if requested
      if (startPlaying && playerQueue.currentSongId) {
        playSong(playerQueue.currentSongId);
      }
    },
    [playSong, playerQueue, toggleShuffling]
  );

  /**
   * Toggles shuffle on/off for the current queue.
   *
   * When enabling shuffle:
   * - Shuffles the queue while keeping the current song in place
   * - Stores the original queue order for later restoration
   *
   * When disabling shuffle:
   * - Restores the original queue order
   * - Keeps the current song in place
   */
  const toggleQueueShuffle = useCallback(() => {
    const wasShuffling = store.state.player.isShuffling;

    if (wasShuffling) {
      // Restore from shuffle
      if (playerQueue.canRestoreFromShuffle()) {
        const currentId = playerQueue.currentSongId;
        if (currentId !== null) {
          playerQueue.restoreFromShuffle(currentId);
        }
      }
      toggleShuffling(false);
    } else {
      // Shuffle the queue
      if (!playerQueue.isEmpty) {
        playerQueue.shuffle();
      }
      toggleShuffling(true);
    }

    // Event listeners will handle localStorage sync automatically
    // storage.queue.setQueue(playerQueue);
  }, [playerQueue, toggleShuffling]);

  /**
   * Updates the queue with new data.
   *
   * This flexible function can:
   * - Replace the entire queue with new songs
   * - Change the current playback position
   * - Toggle shuffle on/off
   * - Restore from shuffle state
   * - Start playback at a specific position
   *
   * @param currentSongIndex - The index to move to (optional)
   * @param newQueue - New array of song IDs (replaces current queue if provided)
   * @param isShuffleQueue - Whether to shuffle the queue
   * @param playCurrentSongIndex - Whether to start playing after update
   * @param restoreAndClearPreviousQueue - Whether to restore from shuffle before updating
   */
  const updateQueueData = useCallback(
    (
      currentSongIndex?: number | null,
      newQueue?: number[],
      isShuffleQueue = false,
      playCurrentSongIndex = true,
      restoreAndClearPreviousQueue = false
    ) => {
      // Replace queue with new songs if provided
      if (newQueue) {
        playerQueue.replaceQueue(newQueue, currentSongIndex ?? 0, true);
      } else if (typeof currentSongIndex === 'number') {
        // Just update position without replacing queue
        playerQueue.moveToPosition(currentSongIndex);
      }

      // Restore from shuffle if requested
      if (restoreAndClearPreviousQueue && playerQueue.canRestoreFromShuffle()) {
        const currentId = playerQueue.currentSongId;
        if (currentId !== null) {
          playerQueue.restoreFromShuffle(currentId);
        }
      }

      // Shuffle if requested
      if (!playerQueue.isEmpty && isShuffleQueue) {
        playerQueue.shuffle();
      }

      // Update shuffle state
      toggleShuffling(isShuffleQueue);

      // Persist to localStorage
      // Event listeners already handle localStorage sync
      // storage.queue.setQueue(playerQueue);

      // Start playing if requested
      if (playCurrentSongIndex && playerQueue.currentSongId) {
        playSong(playerQueue.currentSongId);
      }
    },
    [playSong, playerQueue, toggleShuffling]
  );

  const changeUpNextSongData = useCallback((upNextSongData?: AudioPlayerData) => {
    dispatch({ type: 'UP_NEXT_SONG_DATA_CHANGE', data: upNextSongData });
  }, []);

  return {
    createQueue,
    updateQueueData,
    toggleQueueShuffle,
    toggleShuffling,
    changeUpNextSongData
  };
}
