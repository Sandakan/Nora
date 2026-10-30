import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type AudioPlayer from '../other/player';
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
 * @param player - The AudioPlayer or HTMLAudioElement instance
 * @param dependencies - Object containing required callback functions
 */
export function useMediaSession(
  player: AudioPlayer | HTMLAudioElement,
  dependencies: MediaSessionDependencies
) {
  const { t } = useTranslation();
  const depsRef = useRef(dependencies);
  depsRef.current = dependencies;

  // Track artwork URL and song ID for cleanup & caching
  const artworkPathRef = useRef<string | undefined>(undefined);
  const currentSongIdRef = useRef<number | undefined>(undefined);
  const lastArtworkDataRef = useRef<unknown>(undefined);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    const safeSetPositionState = () => {
      try {
        if (
          Number.isFinite(player.duration) &&
          player.duration > 0 &&
          Number.isFinite(player.currentTime)
        ) {
          const pos = Math.min(Math.max(0, player.currentTime), player.duration);
          mediaSession.setPositionState({
            duration: player.duration,
            playbackRate: player.playbackRate > 0 ? player.playbackRate : 1.0,
            position: pos
          });
        } else {
          mediaSession.setPositionState(undefined);
        }
      } catch {
        // Some platforms throw for position boundary errors
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

      // Handle artwork - only regenerate if song or artwork changed
      const hasSongChanged = currentSong.songId !== currentSongIdRef.current;
      const hasArtworkChanged = currentSong.artwork !== lastArtworkDataRef.current;

      if (hasSongChanged || hasArtworkChanged) {
        currentSongIdRef.current = currentSong.songId;
        lastArtworkDataRef.current = currentSong.artwork;

        let artworkPath: string | undefined;
        if (currentSong.artwork !== undefined) {
          if (typeof currentSong.artwork === 'object') {
            // Handle Uint8Array artwork
            const artwork = currentSong.artwork as Uint8Array<ArrayBuffer>;
            const blob = new Blob([artwork], { type: 'image/jpeg' });
            artworkPath = URL.createObjectURL(blob);
          } else {
            // Handle base64 artwork
            artworkPath = `data:image/jpeg;base64,${currentSong.artwork}`;
          }
        } else {
          artworkPath = '';
        }

        // Clean up previous blob URL if replacing
        if (artworkPathRef.current && artworkPathRef.current !== artworkPath) {
          URL.revokeObjectURL(artworkPathRef.current);
        }
        artworkPathRef.current = artworkPath;
      }

      const artwork = artworkPathRef.current
        ? [
            {
              src: artworkPathRef.current,
              sizes: '1000x1000',
              type: 'image/jpeg'
            }
          ]
        : [];

      // Update metadata
      if (typeof MediaMetadata !== 'undefined' && currentSong.title) {
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

      // Update playback state
      mediaSession.playbackState = store.state.player.isCurrentSongPlaying ? 'playing' : 'paused';
    };

    // Set up action handlers using stable refs
    safeSetActionHandler('pause', () => depsRef.current.toggleSongPlayback(false));
    safeSetActionHandler('play', () => depsRef.current.toggleSongPlayback(true));
    safeSetActionHandler('stop', () => depsRef.current.toggleSongPlayback(false));
    safeSetActionHandler('previoustrack', () => depsRef.current.handleSkipBackwardClick());
    safeSetActionHandler('nexttrack', () => depsRef.current.handleSkipForwardClick('PLAYER_SKIP'));

    // Seek handlers
    safeSetActionHandler('seekbackward', () => {
      const newPosition = Math.max(0, player.currentTime - 10);
      depsRef.current.updateSongPosition(newPosition);
    });

    safeSetActionHandler('seekforward', () => {
      const newPosition = Math.min(player.duration, player.currentTime + 10);
      depsRef.current.updateSongPosition(newPosition);
    });

    safeSetActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        depsRef.current.updateSongPosition(details.seekTime);
      }
    });

    const storeSubscription = store.subscribe(() => {
      updateMediaSessionMetaData();
    });

    // Register metadata + handlers immediately
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
      currentSongIdRef.current = undefined;
      lastArtworkDataRef.current = undefined;

      // Clear media session
      mediaSession.metadata = null;
      mediaSession.playbackState = 'none';
      mediaSession.setPositionState(undefined);

      // Remove action handlers
      safeSetActionHandler('play', null);
      safeSetActionHandler('pause', null);
      safeSetActionHandler('stop', null);
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
  }, [player, t]);
}
