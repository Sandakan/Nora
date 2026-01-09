import { useCallback } from 'react';
import { getQueue } from '../other/queueSingleton';

/**
 * Custom hook providing centralized queue modification methods.
 * Use this hook in components that need to modify the playback queue.
 *
 * Benefits:
 * - Eliminates duplicate queue manipulation logic across components
 * - Provides consistent behavior (e.g., duplicate removal)
 * - Type-safe methods
 * - Automatic state synchronization with TanStack Store (via queueSingleton)
 *
 * ⚠️ IMPORTANT: Store sync happens automatically via event listeners in queueSingleton.
 * No manual dispatch() calls needed - the queue emits events and the store updates automatically.
 *
 * @example
 * ```tsx
 * function Song({ songId }) {
 *   const { addToNext, addToEnd, removeSongs } = useQueueOperations();
 *
 *   const handlePlayNext = () => {
 *     addToNext([songId], { removeDuplicates: true });
 *   };
 *
 *   return <button onClick={handlePlayNext}>Play Next</button>;
 * }
 * ```
 */
export function useQueueOperations() {
  // Get singleton queue directly - no need for hook dependency
  const queue = getQueue();

  /**
   * Add songs to the queue immediately after the currently playing song.
   * @param songIds - Array of song IDs to add
   * @param options.removeDuplicates - Remove existing occurrences before adding (default: true)
   */
  const addToNext = useCallback(
    (songIds: number[], options: { removeDuplicates?: boolean } = { removeDuplicates: true }) => {
      if (options.removeDuplicates) {
        // Remove existing occurrences first
        songIds.forEach((id) => queue.removeSongId(id));
      }

      queue.addSongIdsToNext(songIds);
      // Store sync happens automatically via queueSingleton event listeners
    },
    []
  );

  /**
   * Add songs to the end of the queue.
   * @param songIds - Array of song IDs to add
   * @param options.removeDuplicates - Remove existing occurrences before adding (default: false)
   */
  const addToEnd = useCallback(
    (songIds: number[], options: { removeDuplicates?: boolean } = { removeDuplicates: false }) => {
      if (options.removeDuplicates) {
        songIds.forEach((id) => queue.removeSongId(id));
      }

      queue.addSongIdsToEnd(songIds);
      // Store sync happens automatically via queueSingleton event listeners
    },
    []
  );

  /**
   * Remove songs from the queue.
   * @param songIds - Array of song IDs to remove
   */
  const removeSongs = useCallback((songIds: number[]) => {
    songIds.forEach((id) => queue.removeSongId(id));
    // Store sync happens automatically via queueSingleton event listeners
  }, []);

  /**
   * Replace the entire queue with new songs and optionally start at a specific position.
   * @param songIds - Array of song IDs for the new queue
   * @param startPosition - Position to start at (default: 0)
   * @param metadata - Optional queue metadata to set
   */
  const replaceQueue = useCallback(
    (songIds: number[], startPosition: number = 0, metadata?: PlayerQueueMetadata) => {
      queue.replaceQueue(songIds, startPosition, true, metadata);
      // Store sync happens automatically via queueSingleton event listeners
    },
    []
  );

  /**
   * Clear the entire queue.
   */
  const clearQueue = useCallback(() => {
    queue.clear();
    // Store sync happens automatically via queueSingleton event listeners
  }, []);

  /**
   * Toggle shuffle mode for the queue.
   * @param isShuffled - Whether to shuffle the queue
   */
  const toggleShuffle = useCallback((isShuffled: boolean) => {
    if (isShuffled) {
      queue.shuffle();
    } else {
      queue.restoreFromShuffle(queue.currentSongId || undefined);
    }
    // Store sync happens automatically via queueSingleton event listeners
  }, []);

  /**
   * Play a specific song from the queue by its position.
   * @param position - Queue position (0-based index)
   */
  const playSongAtPosition = useCallback((position: number) => {
    queue.moveToPosition(position);
    // Store sync happens automatically via queueSingleton event listeners
  }, []);

  return {
    addToNext,
    addToEnd,
    removeSongs,
    replaceQueue,
    clearQueue,
    toggleShuffle,
    playSongAtPosition
    // ⚠️ State removed - use store selectors instead:
    // const queueData = useStore(store, (state) => state.queue);
  };
}
