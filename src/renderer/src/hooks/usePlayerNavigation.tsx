import { useCallback } from 'react';
import { store } from '../store/store';
import type PlayerQueue from '../other/playerQueue';
import type AudioPlayer from '../other/player';

/**
 * Hook for navigating through the playback queue.
 *
 * This hook provides functions for navigating backward/forward through the queue,
 * handling repeat modes, and changing the current song index. It integrates with
 * the PlayerQueue class and AudioPlayer's automatic song loading.
 *
 * Note: Songs are automatically loaded by AudioPlayer when queue position changes.
 * This hook is being migrated to use AudioPlayer's skip methods directly.
 *
 * @param playerInstance - The AudioPlayer instance or HTMLAudioElement
 * @param playerQueue - The PlayerQueue instance for queue navigation
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
 * } = usePlayerNavigation(player, playerQueue, toggleSongPlayback, recordListeningData);
 *
 * // Use in UI or event handlers
 * <button onClick={handleSkipBackwardClick}>Previous</button>
 * <button onClick={() => handleSkipForwardClick('USER_SKIP')}>Next</button>
 * ```
 */
export function usePlayerNavigation(
  playerInstance: AudioPlayer | HTMLAudioElement,
  playerQueue: PlayerQueue,
  toggleSongPlayback: (startPlay?: boolean) => void,
  recordListeningData: (
    songId: number,
    songDuration: number,
    repetition?: boolean,
    isKnownSource?: boolean
  ) => void
) {
  // Support both AudioPlayer instance and HTMLAudioElement for backward compatibility
  const player =
    playerInstance instanceof HTMLAudioElement
      ? playerInstance
      : (playerInstance as AudioPlayer).audio;
  const audioPlayer =
    playerInstance instanceof HTMLAudioElement ? null : (playerInstance as AudioPlayer);
  const changeQueueCurrentSongIndex = useCallback(
    (currentSongIndex: number, _isPlaySong = true) => {
      // Use PlayerQueue's moveToPosition method
      const moved = playerQueue.moveToPosition(currentSongIndex);

      if (!moved) {
        return console.error('Failed to move to position:', currentSongIndex);
      }

      const songId = playerQueue.currentSongId;
      if (songId == null) {
        return console.error('Selected song id not found.');
      }

      // Song will be auto-loaded by AudioPlayer's positionChange listener
      // The _isPlaySong parameter is kept for backward compatibility but no longer used
    },
    [playerQueue]
  );

  const handleSkipBackwardClick = useCallback(() => {
    // Use AudioPlayer's skipBackward if available
    if (audioPlayer) {
      audioPlayer.skipBackward();
      return;
    }

    // Fallback to direct control
    console.log('[handleSkipBackwardClick]', {
      currentTime: player.currentTime,
      position: playerQueue.position,
      hasPrevious: playerQueue.hasPrevious
    });

    if (player.currentTime > 5) {
      player.currentTime = 0;
    } else if (typeof playerQueue.currentSongId === 'string') {
      if (playerQueue.hasPrevious) {
        playerQueue.moveToPrevious();
        // Song will be auto-loaded by AudioPlayer's positionChange listener
      } else {
        // At first song, restart it
        playerQueue.moveToStart();
        // Song will be auto-loaded by AudioPlayer's positionChange listener
      }
    } else if (playerQueue.length > 0) {
      // No current song but queue has songs, play first
      playerQueue.moveToStart();
      // Song will be auto-loaded by AudioPlayer's positionChange listener
    }
  }, [audioPlayer, player, playerQueue]);

  const handleSkipForwardClick = useCallback(
    (reason: SongSkipReason = 'USER_SKIP') => {
      // Use AudioPlayer's skipForward if available
      if (audioPlayer) {
        // Set up listener for repeat event to record listening data
        if (reason !== 'USER_SKIP') {
          const handleRepeat = (data: { songId: number; duration: number }) => {
            recordListeningData(data.songId, data.duration, true);
            audioPlayer.off('repeatSong', handleRepeat);
          };
          audioPlayer.once('repeatSong', handleRepeat);
        }
        audioPlayer.skipForward(reason);
        return;
      }

      // Fallback to direct control
      console.log('[handleSkipForwardClick]', {
        reason,
        position: playerQueue.position,
        hasNext: playerQueue.hasNext,
        repeatMode: store.state.player.isRepeating
      });

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
        // Move to next song - AudioPlayer will auto-load it via positionChange event
        playerQueue.moveToNext();
        console.log('[handleSkipForwardClick.moved]', { position: playerQueue.position });
      } else if (store.state.player.isRepeating === 'repeat') {
        // At end of queue with repeat-all, go to start
        playerQueue.moveToStart();
      } else if (playerQueue.isEmpty) {
        console.log('Queue is empty.');
      }
      // else: at end without repeat, do nothing (song ends)
    },
    [audioPlayer, recordListeningData, toggleSongPlayback, player, playerQueue]
  );

  return {
    changeQueueCurrentSongIndex,
    handleSkipBackwardClick,
    handleSkipForwardClick
  };
}
