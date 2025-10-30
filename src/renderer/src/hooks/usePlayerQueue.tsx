import { useRef } from 'react';
import PlayerQueue from '../other/playerQueue';
import storage from '../utils/localStorage';

/**
 * Custom hook to get the singleton PlayerQueue instance.
 * The queue instance persists across component re-renders.
 * Initializes from localStorage if available, otherwise creates a new empty queue.
 * @returns The PlayerQueue instance (not wrapped in a ref)
 */
export function usePlayerQueue() {
  const queueRef = useRef<PlayerQueue | undefined>(undefined);

  if (!queueRef.current) {
    const storedQueue = storage.queue.getQueue();
    queueRef.current = storedQueue ? PlayerQueue.fromJSON(storedQueue) : new PlayerQueue();
  }

  return queueRef.current;
}
