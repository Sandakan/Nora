import PlayerQueue from './playerQueue';
import { store } from '../store/store';
import storage from '../utils/localStorage';

// Module-level singleton - created once when module loads
let queueInstance: PlayerQueue | null = null;
let isSettingUpSync = false;

/**
 * Initialize the singleton queue instance.
 * Called once when the app starts.
 * Loads queue from localStorage or creates empty queue.
 */
export function initializeQueue(): PlayerQueue {
  if (queueInstance) {
    return queueInstance;
  }

  // Load from localStorage
  const storedQueue = storage.queue.getQueue();
  queueInstance = storedQueue ? PlayerQueue.fromJSON(storedQueue) : new PlayerQueue();

  // Set up bidirectional sync with store (only once)
  if (!isSettingUpSync) {
    setupQueueStoreSync(queueInstance);
  }

  return queueInstance;
}

/**
 * Get the singleton queue instance.
 * Auto-initializes on first access if not already initialized.
 */
export function getQueue(): PlayerQueue {
  if (!queueInstance) {
    // Auto-initialize on first access (defensive programming)
    return initializeQueue();
  }
  return queueInstance;
}

/**
 * Set up bidirectional synchronization between queue and store.
 * Uses a flag to prevent infinite loops when syncing from store → queue.
 */
function setupQueueStoreSync(queue: PlayerQueue) {
  if (isSettingUpSync) return; // Prevent multiple setup calls
  isSettingUpSync = true;

  // Flag to prevent infinite loops during store → queue sync
  let isSyncingFromStore = false;

  // 1. Queue → Store: When queue changes, update store
  queue.on('queueChange', () => {
    console.log('[queueSingleton.queueChange]', {
      queueLength: queue.length,
      isSyncingFromStore
    });

    // Skip if we're syncing from store (prevents infinite loop)
    if (isSyncingFromStore) {
      return;
    }

    store.setState((state) => ({
      ...state,
      localStorage: {
        ...state.localStorage,
        queue: {
          songIds: queue.getAllSongIds(),
          position: queue.position,
          queueBeforeShuffle: queue.queueBeforeShuffle,
          metadata: queue.getMetadata()
        }
      }
    }));

    // Persist to localStorage
    storage.queue.setQueue(queue.toJSON());
  });

  queue.on('positionChange', () => {
    console.log('[queueSingleton.positionChange]', {
      position: queue.position,
      isSyncingFromStore
    });

    // Skip if we're syncing from store (prevents infinite loop)
    if (isSyncingFromStore) {
      return;
    }

    store.setState((state) => ({
      ...state,
      localStorage: {
        ...state.localStorage,
        queue: {
          ...state.localStorage.queue,
          position: queue.position
        }
      }
    }));

    // Persist to localStorage
    storage.queue.setQueue(queue.toJSON());
  });

  // 2. Store → Queue: When store changes externally, sync queue
  // (This handles cases where store is updated directly)
  store.subscribe((state) => {
    const storeQueue = state.currentVal.localStorage.queue;

    // Only sync if store data differs from queue data
    const queueSongIds = queue.getAllSongIds();
    const storeSongIds = storeQueue.songIds;

    const queueChanged = JSON.stringify(queueSongIds) !== JSON.stringify(storeSongIds);
    const positionChanged = queue.position !== storeQueue.position;

    if (queueChanged || positionChanged) {
      // Set flag to prevent handlers from updating store
      isSyncingFromStore = true;

      try {
        // Update queue from store
        queue.replaceQueue(
          storeSongIds,
          storeQueue.position,
          false, // Don't clear shuffle history
          storeQueue.metadata
        );
      } finally {
        // Reset flag
        isSyncingFromStore = false;
      }
    }
  });

  isSettingUpSync = false;
}

/**
 * For testing/debugging: Reset the queue singleton.
 * ⚠️ Should only be used in tests!
 */
export function resetQueueForTesting() {
  if (queueInstance) {
    queueInstance.removeAllListeners();
    queueInstance = null;
    isSettingUpSync = false;
  }
}
