import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { store } from '../store/store';

/**
 * Dependencies required by the useMediaSession hook.
 */
export interface MediaSessionDependencies {
  /** Function to toggle song playback (play/pause) */
  toggleSongPlayback: (startPlay?: boolean) => void;
  /** Function to skip backward to previous song */
  handleSkipBackwardClick: () => void;
  /** Function to skip forward to next song */
  handleSkipForwardClick: (reason?: SongSkipReason) => void;
  /** Function to update song position */
  updateSongPosition: (position: number) => void;
}

/**
 * Custom hook to manage the Media Session API integration.
 *
 * This hook automatically updates the browser's media session metadata
 * (title, artist, album, artwork) and sets up media control handlers
 * (play, pause, skip, seek) that integrate with OS-level media controls
 * and browser media notifications.
 *
 * Features:
 * - Updates media metadata when songs change
 * - Handles artwork (both Uint8Array and base64 formats)
 * - Sets up playback state tracking
 * - Configures media control action handlers
 * - Automatically cleans up on unmount
 *
 * @param player - The HTML audio player element
 * @param dependencies - Object containing required callback functions
 *
 * @example
 * ```tsx
 * function App() {
 *   const player = useAudioPlayer();
 *
 *   useMediaSession(player, {
 *     toggleSongPlayback,
 *     handleSkipBackwardClick,
 *     handleSkipForwardClick,
 *     updateSongPosition
 *   });
 * }
 * ```
 */
export function useMediaSession(player: HTMLAudioElement, dependencies: MediaSessionDependencies) {
  const { t } = useTranslation();
  const {
    toggleSongPlayback,
    handleSkipBackwardClick,
    handleSkipForwardClick,
    updateSongPosition
  } = dependencies;

  // Track artwork URL for cleanup
  const artworkPathRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const updateMediaSessionMetaData = () => {
      const currentSong = store.state.currentSongData;

      // Handle artwork
      let artworkPath: string | undefined;
      if (currentSong.artwork !== undefined) {
        if (typeof currentSong.artwork === 'object') {
          // Handle Uint8Array artwork
          const artwork = currentSong.artwork as Uint8Array<ArrayBuffer>;
          const blob = new Blob([artwork]);
          artworkPath = URL.createObjectURL(blob);
        } else {
          // Handle base64 artwork
          artworkPath = `data:;base64,${currentSong.artwork}`;
        }
      } else {
        artworkPath = '';
      }

      // Clean up previous artwork URL
      if (artworkPathRef.current && artworkPathRef.current !== artworkPath) {
        URL.revokeObjectURL(artworkPathRef.current);
      }
      artworkPathRef.current = artworkPath;

      // Update metadata
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: Array.isArray(currentSong.artists)
          ? currentSong.artists.map((artist) => artist.name).join(', ')
          : t('common.unknownArtist'),
        album: currentSong.album
          ? currentSong.album.name || t('common.unknownAlbum')
          : t('common.unknownAlbum'),
        artwork: [
          {
            src: artworkPath,
            sizes: '1000x1000',
            type: 'image/webp'
          }
        ]
      });

      // Update position state
      navigator.mediaSession.setPositionState({
        duration: player.duration,
        playbackRate: player.playbackRate,
        position: player.currentTime
      });

      // Set up action handlers
      navigator.mediaSession.setActionHandler('pause', () => toggleSongPlayback(false));
      navigator.mediaSession.setActionHandler('play', () => toggleSongPlayback(true));
      navigator.mediaSession.setActionHandler('previoustrack', handleSkipBackwardClick);
      navigator.mediaSession.setActionHandler('nexttrack', () =>
        handleSkipForwardClick('PLAYER_SKIP')
      );

      // Seek handlers
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        const newPosition = Math.max(0, player.currentTime - 10);
        updateSongPosition(newPosition);
      });

      navigator.mediaSession.setActionHandler('seekforward', () => {
        const newPosition = Math.min(player.duration, player.currentTime + 10);
        updateSongPosition(newPosition);
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          updateSongPosition(details.seekTime);
        }
      });

      // Update playback state
      navigator.mediaSession.playbackState = store.state.player.isCurrentSongPlaying
        ? 'playing'
        : 'paused';
    };

    // Listen to player events
    player.addEventListener('play', updateMediaSessionMetaData);
    player.addEventListener('pause', updateMediaSessionMetaData);

    // Cleanup
    return () => {
      // Revoke artwork URL
      if (artworkPathRef.current) {
        URL.revokeObjectURL(artworkPathRef.current);
        artworkPathRef.current = undefined;
      }

      // Clear media session
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.setPositionState(undefined);

      // Remove action handlers
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);

      // Remove event listeners
      player.removeEventListener('play', updateMediaSessionMetaData);
      player.removeEventListener('pause', updateMediaSessionMetaData);
    };
  }, [
    handleSkipBackwardClick,
    handleSkipForwardClick,
    t,
    toggleSongPlayback,
    updateSongPosition,
    player
  ]);
}
