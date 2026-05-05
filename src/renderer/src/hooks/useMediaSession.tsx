import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { store } from '../store/store';

/** Dependencies required by the useMediaSession hook. */
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
 * This hook automatically updates the browser's media session metadata (title, artist, album,
 * artwork) and sets up media control handlers (play, pause, skip, seek) that integrate with
 * OS-level media controls and browser media notifications.
 *
 * Features: - Updates media metadata when songs change - Handles artwork (both Uint8Array and
 * base64 formats) - Sets up playback state tracking - Configures media control action handlers -
 * Automatically cleans up on unmount
 *
 * @example
 *   ```tsx
 *   function App() {
 *     const player = useAudioPlayer();
 *
 *     useMediaSession(player, {
 *       toggleSongPlayback,
 *       handleSkipBackwardClick,
 *       handleSkipForwardClick,
 *       updateSongPosition
 *     });
 *   }
 *   ```;
 *
 * @param player - The HTML audio player element
 * @param dependencies - Object containing required callback functions
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
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    const safeSetPositionState = () => {
      if (
        Number.isFinite(player.duration) &&
        player.duration > 0 &&
        Number.isFinite(player.currentTime)
      ) {
        mediaSession.setPositionState({
          duration: player.duration,
          playbackRate: player.playbackRate,
          position: player.currentTime
        });
      } else {
        mediaSession.setPositionState(undefined);
      }
    };

    const safeSetActionHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch {
        // Some platforms throw for unsupported Media Session actions.
      }
    };

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

      const artwork = artworkPath
        ? [
            {
              src: artworkPath,
              sizes: '1000x1000',
              type: 'image/webp'
            }
          ]
        : [];

      // Update metadata
      if (typeof MediaMetadata !== 'undefined') {
        mediaSession.metadata = new MediaMetadata({
          title: currentSong.title,
          artist: Array.isArray(currentSong.artists)
            ? currentSong.artists.map((artist) => artist.name).join(', ')
            : t('common.unknownArtist'),
          album: currentSong.album
            ? currentSong.album.name || t('common.unknownAlbum')
            : t('common.unknownAlbum'),
          artwork
        });
      }

      // Update position state
      safeSetPositionState();

      // Set up action handlers
      safeSetActionHandler('pause', () => toggleSongPlayback(false));
      safeSetActionHandler('play', () => toggleSongPlayback(true));
      safeSetActionHandler('previoustrack', handleSkipBackwardClick);
      safeSetActionHandler('nexttrack', () => handleSkipForwardClick('PLAYER_SKIP'));

      // Seek handlers
      safeSetActionHandler('seekbackward', () => {
        const newPosition = Math.max(0, player.currentTime - 10);
        updateSongPosition(newPosition);
      });

      safeSetActionHandler('seekforward', () => {
        const newPosition = Math.min(player.duration, player.currentTime + 10);
        updateSongPosition(newPosition);
      });

      safeSetActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          updateSongPosition(details.seekTime);
        }
      });

      // Update playback state
      mediaSession.playbackState = store.state.player.isCurrentSongPlaying ? 'playing' : 'paused';
    };

    const storeSubscription = store.subscribe(() => {
      updateMediaSessionMetaData();
    });

    // Register metadata + handlers immediately so media keys are available without requiring
    // a play/pause round-trip first.
    updateMediaSessionMetaData();

    // Listen to player events
    player.addEventListener('play', updateMediaSessionMetaData);
    player.addEventListener('pause', updateMediaSessionMetaData);
    player.addEventListener('loadedmetadata', updateMediaSessionMetaData);
    player.addEventListener('timeupdate', safeSetPositionState);

    // Cleanup
    return () => {
      // Revoke artwork URL
      if (artworkPathRef.current) {
        URL.revokeObjectURL(artworkPathRef.current);
        artworkPathRef.current = undefined;
      }

      // Clear media session
      mediaSession.metadata = null;
      mediaSession.playbackState = 'none';
      mediaSession.setPositionState(undefined);

      // Remove action handlers
      safeSetActionHandler('play', null);
      safeSetActionHandler('pause', null);
      safeSetActionHandler('seekbackward', null);
      safeSetActionHandler('seekforward', null);
      safeSetActionHandler('previoustrack', null);
      safeSetActionHandler('nexttrack', null);
      safeSetActionHandler('seekto', null);

      // Remove event listeners
      player.removeEventListener('play', updateMediaSessionMetaData);
      player.removeEventListener('pause', updateMediaSessionMetaData);
      player.removeEventListener('loadedmetadata', updateMediaSessionMetaData);
      player.removeEventListener('timeupdate', safeSetPositionState);

      storeSubscription.unsubscribe();
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
