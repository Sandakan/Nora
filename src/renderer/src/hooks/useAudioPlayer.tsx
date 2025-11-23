import { useEffect } from 'react';
import AudioPlayer from '../other/player';
import { getQueue } from '../other/queueSingleton';
import roundTo from '@common/roundTo';

const LOW_RESPONSE_DURATION = 100;
const DURATION = 1000;

// Module-level singleton - initialized with queue on first hook call
let playerInstance: AudioPlayer | null = null;

/**
 * Custom hook to get the singleton AudioPlayer instance.
 * The player instance integrates with PlayerQueue for automatic song loading.
 * Persists across component re-renders.
 * @returns The AudioPlayer instance with integrated queue
 */
export function useAudioPlayer() {
  // Get the singleton queue directly (not via hook)
  const queue = getQueue();

  // Initialize player with queue on first call
  if (!playerInstance) {
    playerInstance = new AudioPlayer(queue);
  }

  useEffect(() => {
    // Store the non-null playerInstance in a local variable for readability
    const player = playerInstance!;

    const dispatchCurrentSongTime = () => {
      const playerPositionChange = new CustomEvent('player/positionChange', {
        detail: roundTo(player.currentTime || 0, 2)
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

  return playerInstance;
}
