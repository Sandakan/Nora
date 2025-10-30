import { useRef } from 'react';
import AudioPlayer from '../other/player';

/**
 * Custom hook to get the singleton AudioPlayer instance.
 * The player instance persists across component re-renders.
 * @returns The AudioPlayer instance (not wrapped in a ref)
 */
export function useAudioPlayer() {
  const playerRef = useRef<AudioPlayer | undefined>(undefined);

  if (!playerRef.current) {
    playerRef.current = new AudioPlayer();
  }

  return playerRef.current;
}
