import AudioPlayer from '../other/player';
import { getQueue } from '../other/queueSingleton';

// Module-level singleton - initialized with queue on first hook call
let playerInstance: AudioPlayer | null = null;

/**
 * Custom hook to get the singleton AudioPlayer instance. The player instance integrates with
 * PlayerQueue for automatic song loading and native push ticker position updates. Persists across component re-renders.
 *
 * @returns The AudioPlayer instance with integrated queue
 */
export function useAudioPlayer() {
  // Get the singleton queue directly (not via hook)
  const queue = getQueue();

  // Initialize player with queue on first call
  if (!playerInstance) {
    playerInstance = new AudioPlayer(queue);
  }

  return playerInstance;
}
