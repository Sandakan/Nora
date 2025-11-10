import { getQueue } from '../other/queueSingleton';

/**
 * Custom hook to get the singleton PlayerQueue instance.
 * Returns the same queue instance across all components.
 *
 * ⚠️ IMPORTANT: This should only be called by:
 * - useAudioPlayer (to pass to AudioPlayer constructor)
 * - useQueueOperations (to get operation methods)
 *
 * Child components should use useQueueOperations instead.
 *
 * @returns The singleton PlayerQueue instance
 */
export function usePlayerQueue() {
  // Simply return the module-level singleton
  // No ref needed - it's already a singleton at module level
  return getQueue();
}
