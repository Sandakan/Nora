import { useCallback } from 'react';
import { store } from '../store/store';
import type PlayerQueue from '../other/playerQueue';

/**
 * Hook for navigating through the playback queue.
 *
 * This hook provides functions for navigating backward/forward through the queue,
 * handling repeat modes, and changing the current song index. It integrates with
 * the PlayerQueue class and player control functions.
 *
 * @param player - The HTMLAudioElement instance
 * @param playerQueue - The PlayerQueue instance for queue navigation
 * @param playSong - Function to play a song by ID
 * @param toggleSongPlayback - Function to toggle play/pause state
 * @param recordListeningData - Function to record listening session data
 * @returns Object containing navigation functions
 *
 * @example
 * ```tsx
 * const {
 *   handleSkipBackwardClick,
 *   handleSkipForwardClick,
 *   changeQueueCurrentSongIndex
 * } = usePlayerNavigation(player, playerQueue, playSong, toggleSongPlayback, recordListeningData);
 *
 * // Use in UI or event handlers
 * <button onClick={handleSkipBackwardClick}>Previous</button>
 * <button onClick={() => handleSkipForwardClick('USER_SKIP')}>Next</button>
 * ```
 */
export function usePlayerNavigation(
  player: HTMLAudioElement,
  playerQueue: PlayerQueue,
  playSong: (songId: string, isStartPlay?: boolean, playAsCurrentSongIndex?: boolean) => void,
  toggleSongPlayback: (startPlay?: boolean) => void,
  recordListeningData: (
    songId: string,
    songDuration: number,
    repetition?: boolean,
    isKnownSource?: boolean
  ) => void
) {
  const changeQueueCurrentSongIndex = useCallback(
    (currentSongIndex: number, isPlaySong = true) => {
      console.log('changeQueueCurrentSongIndex', currentSongIndex);

      // Use PlayerQueue's moveToPosition method
      const moved = playerQueue.moveToPosition(currentSongIndex);

      if (!moved) {
        return console.error('Failed to move to position:', currentSongIndex);
      }

      const songId = playerQueue.currentSongId;
      if (songId == null) {
        return console.error('Selected song id not found.');
      }

      if (isPlaySong) playSong(songId);
    },
    [playSong, playerQueue]
  );

  const handleSkipBackwardClick = useCallback(() => {
    if (player.currentTime > 5) {
      player.currentTime = 0;
    } else if (typeof playerQueue.currentSongId === 'string') {
      if (playerQueue.hasPrevious) {
        playerQueue.moveToPrevious();
        playSong(playerQueue.currentSongId!);
      } else {
        // At first song, restart it
        playerQueue.moveToStart();
        playSong(playerQueue.currentSongId!);
      }
    } else if (playerQueue.length > 0) {
      // No current song but queue has songs, play first
      playerQueue.moveToStart();
      playSong(playerQueue.currentSongId!);
    }
  }, [playSong, player, playerQueue]);

  const handleSkipForwardClick = useCallback(
    (reason: SongSkipReason = 'USER_SKIP') => {
      if (store.state.player.isRepeating === 'repeat-1' && reason !== 'USER_SKIP') {
        // Repeat current song
        player.currentTime = 0;
        toggleSongPlayback(true);
        recordListeningData(
          store.state.currentSongData.songId,
          store.state.currentSongData.duration,
          true
        );
      } else if (playerQueue.hasNext) {
        // Move to next song
        playerQueue.moveToNext();
        if (playerQueue.currentSongId) {
          playSong(playerQueue.currentSongId);
        }
      } else if (store.state.player.isRepeating === 'repeat') {
        // At end of queue with repeat-all, go to start
        playerQueue.moveToStart();
        if (playerQueue.currentSongId) {
          playSong(playerQueue.currentSongId);
        }
      } else if (playerQueue.isEmpty) {
        console.log('Queue is empty.');
      }
      // else: at end without repeat, do nothing (song ends)
    },
    [playSong, recordListeningData, toggleSongPlayback, player, playerQueue]
  );

  return {
    changeQueueCurrentSongIndex,
    handleSkipBackwardClick,
    handleSkipForwardClick
  };
}
