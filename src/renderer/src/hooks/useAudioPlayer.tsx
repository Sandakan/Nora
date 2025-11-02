import { useEffect } from 'react';
import AudioPlayer from '../other/player';
import roundTo from '@common/roundTo';

const LOW_RESPONSE_DURATION = 100;
const DURATION = 1000;
const player = new AudioPlayer();

/**
 * Custom hook to get the singleton AudioPlayer instance.
 * The player instance persists across component re-renders.
 * @returns The AudioPlayer instance (not wrapped in a ref)
 */
export function useAudioPlayer() {
  useEffect(() => {
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

  return player;
}
