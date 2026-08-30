import { useCallback, useEffect, useRef } from 'react';

import ListeningDataSession from '../other/listeningDataSession';
import type AudioPlayer from '../other/player';

/**
 * Custom hook to manage listening data recording sessions.
 *
 * Accepts either an AudioPlayer instance (preferred) or a bare HTMLAudioElement. When an
 * AudioPlayer is provided, the hook subscribes through its event emitter so event callbacks always
 * track the active audio element, even after crossfade element swaps.
 *
 * This hook handles the recording of user listening data for analytics and statistics purposes. It
 * tracks: - Song playback duration - Pause/play events - Seek positions - Whether the song is from
 * a known source - Song repetitions
 *
 * Each listening session is tracked independently, and sessions are automatically managed when
 * songs change or repeat. The hook ensures only one session is active at a time and properly cleans
 * up when songs change.
 *
 * @example
 *   ```tsx
 *   function App() {
 *     const player = useAudioPlayer();
 *     const { recordListeningData } = useListeningData(player);
 *
 *     // Start recording when playing a song
 *     recordListeningData(songId, duration, false, true);
 *   }
 *   ```;
 *
 * @param playerInput - The AudioPlayer instance or HTMLAudioElement
 * @returns Object with the recordListeningData function
 */
export function useListeningData(playerInput: AudioPlayer | HTMLAudioElement) {
  // Track the current listening session
  const recordRef = useRef<ListeningDataSession>(undefined);
  // Track cleanup function for emitter subscriptions (AudioPlayer path)
  const emitterCleanupRef = useRef<() => void>(undefined);

  const audioPlayer = playerInput instanceof HTMLAudioElement ? null : (playerInput as AudioPlayer);
  const player = audioPlayer ? audioPlayer.audio : (playerInput as HTMLAudioElement);

  /**
   * Records listening data for a song.
   *
   * Creates a new listening session to track how the user listens to a song. If a session already
   * exists for a different song, it stops the previous session before starting a new one. For
   * repeated songs, creates a new session instance.
   *
   * When an AudioPlayer is available, subscribes to emitter events so all callbacks automatically
   * route to the active audio element after crossfade swaps.
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

        // Clean up previous emitter subscriptions
        if (emitterCleanupRef.current) {
          emitterCleanupRef.current();
          emitterCleanupRef.current = undefined;
        }

        // Create new listening session
        const listeningDataSession = new ListeningDataSession(songId, duration, isKnownSource);
        listeningDataSession.recordListeningData();

        if (audioPlayer) {
          // AudioPlayer path — subscribe through emitter (always routes to active element)
          const handlePause = () => {
            listeningDataSession.isPaused = true;
          };
          const handlePlay = () => {
            listeningDataSession.isPaused = false;
          };
          const handleSeeked = () => {
            listeningDataSession.addSeekPosition = audioPlayer.currentTime;
          };

          audioPlayer.on('pause', handlePause);
          audioPlayer.on('play', handlePlay);
          audioPlayer.on('seeked', handleSeeked);

          emitterCleanupRef.current = () => {
            audioPlayer.off('pause', handlePause);
            audioPlayer.off('play', handlePlay);
            audioPlayer.off('seeked', handleSeeked);
          };
        } else {
          // DOM fallback for bare HTMLAudioElement path
          // These are automatically cleaned up via the abort signal
          player.addEventListener(
            'pause',
            () => {
              listeningDataSession.isPaused = true;
            },
            { signal: listeningDataSession.abortController.signal }
          );

          player.addEventListener(
            'play',
            () => {
              listeningDataSession.isPaused = false;
            },
            { signal: listeningDataSession.abortController.signal }
          );

          player.addEventListener(
            'seeked',
            () => {
              listeningDataSession.addSeekPosition = player.currentTime;
            },
            { signal: listeningDataSession.abortController.signal }
          );
        }

        // Store the new session reference
        recordRef.current = listeningDataSession;
      }
    },
    [audioPlayer, player]
  );

  useEffect(() => {
    return () => {
      emitterCleanupRef.current?.();
      emitterCleanupRef.current = undefined;
      recordRef.current?.stopRecording();
    };
  }, []);

  return {
    recordListeningData
  };
}
