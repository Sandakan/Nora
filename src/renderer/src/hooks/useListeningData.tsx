import { useCallback, useRef } from 'react';
import ListeningDataSession from '../other/listeningDataSession';

/**
 * Custom hook to manage listening data recording sessions.
 *
 * This hook handles the recording of user listening data for analytics
 * and statistics purposes. It tracks:
 * - Song playback duration
 * - Pause/play events
 * - Seek positions
 * - Whether the song is from a known source
 * - Song repetitions
 *
 * Each listening session is tracked independently, and sessions are
 * automatically managed when songs change or repeat. The hook ensures
 * only one session is active at a time and properly cleans up when
 * songs change.
 *
 * @param player - The HTML audio player element
 *
 * @returns Object with the recordListeningData function
 *
 * @example
 * ```tsx
 * function App() {
 *   const player = useAudioPlayer();
 *   const { recordListeningData } = useListeningData(player);
 *
 *   // Start recording when playing a song
 *   recordListeningData(songId, duration, false, true);
 * }
 * ```
 */
export function useListeningData(player: HTMLAudioElement) {
  // Track the current listening session
  const recordRef = useRef<ListeningDataSession>(undefined);

  /**
   * Records listening data for a song.
   *
   * Creates a new listening session to track how the user listens to a song.
   * If a session already exists for a different song, it stops the previous
   * session before starting a new one. For repeated songs, creates a new
   * session instance.
   *
   * @param songId - The unique identifier of the song
   * @param duration - The total duration of the song in seconds
   * @param isRepeating - Whether this is a repeated playback of the same song
   * @param isKnownSource - Whether the song is from the app's library or an external source
   */
  const recordListeningData = useCallback(
    (songId: number, duration: number, isRepeating = false, isKnownSource = true) => {
      // Check if we need to create a new session
      if (recordRef?.current?.songId !== songId || isRepeating) {
        if (isRepeating) {
          console.warn(`Added another song record instance for the repetition of ${songId}`);
        }

        // Stop the previous session if it exists
        if (recordRef.current) {
          recordRef.current.stopRecording();
        }

        // Create new listening session
        const listeningDataSession = new ListeningDataSession(songId, duration, isKnownSource);
        listeningDataSession.recordListeningData();

        // Set up event listeners for the session
        // These will be automatically cleaned up via the abort signal

        // Track pause events
        player.addEventListener(
          'pause',
          () => {
            listeningDataSession.isPaused = true;
          },
          { signal: listeningDataSession.abortController.signal }
        );

        // Track play events
        player.addEventListener(
          'play',
          () => {
            listeningDataSession.isPaused = false;
          },
          { signal: listeningDataSession.abortController.signal }
        );

        // Track seek events
        player.addEventListener(
          'seeked',
          () => {
            listeningDataSession.addSeekPosition = player.currentTime;
          },
          { signal: listeningDataSession.abortController.signal }
        );

        // Store the new session reference
        recordRef.current = listeningDataSession;
      }
    },
    [player]
  );

  return {
    recordListeningData
  };
}
