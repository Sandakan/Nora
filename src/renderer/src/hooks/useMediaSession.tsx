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
 * Accepts either an AudioPlayer instance (preferred) or a bare HTMLAudioElement.
 * When an AudioPlayer is provided, the hook subscribes through its event emitter
 * so all callbacks automatically track whichever audio element is active after
 * crossfade swaps. Falls back to DOM listeners for bare HTMLAudioElement usage.
 *
 * @example
 *   ```tsx
 *   function App() {
 *     const player = useAudioPlayer();
 *     useMediaSession(player, { ... });
 *   }
 *   ```
 *
 * @param playerInput - The AudioPlayer instance or HTMLAudioElement
 * @param dependencies - Object containing required callback functions
 */
export function useMediaSession(
  playerInput: AudioPlayer | HTMLAudioElement,
  dependencies: MediaSessionDependencies
) {
  const { t } = useTranslation();
  const {
    toggleSongPlayback,
    handleSkipBackwardClick,
    handleSkipForwardClick,
    updateSongPosition
  } = dependencies;

  const audioPlayer =
    playerInput instanceof HTMLAudioElement ? null : (playerInput as AudioPlayer);
  const player = audioPlayer ? audioPlayer.audio : (playerInput as HTMLAudioElement);

  // Track artwork URL for cleanup
  const artworkPathRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    const getAudioEl = () => audioPlayer?.getActiveAudio() ?? player;

    const safeSetPositionState = (el?: HTMLAudioElement) => {
      const audioEl = el ?? getAudioEl();
      if (
        Number.isFinite(audioEl.duration) &&
        audioEl.duration > 0 &&
        Number.isFinite(audioEl.currentTime)
      ) {
        mediaSession.setPositionState({
          duration: audioEl.duration,
          playbackRate: audioEl.playbackRate,
          position: audioEl.currentTime
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

      // Seek handlers — read from active element
      safeSetActionHandler('seekbackward', () => {
        const audioEl = getAudioEl();
        const newPosition = Math.max(0, audioEl.currentTime - 10);
        updateSongPosition(newPosition);
      });

      safeSetActionHandler('seekforward', () => {
        const audioEl = getAudioEl();
        const newPosition = Math.min(audioEl.duration, audioEl.currentTime + 10);
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

    // Event handler references — hoisted to effect scope so cleanup can reference them
    let handleTimeUpdate: (() => void) | undefined;

    if (audioPlayer) {
      handleTimeUpdate = () => safeSetPositionState(audioPlayer.getActiveAudio());

      // AudioPlayer path — subscribe through emitter (always routes to active element)
      audioPlayer.on('play', updateMediaSessionMetaData);
      audioPlayer.on('pause', updateMediaSessionMetaData);
      audioPlayer.on('durationChange', updateMediaSessionMetaData);
      audioPlayer.on('timeUpdate', handleTimeUpdate);
    } else {
      handleTimeUpdate = () => safeSetPositionState(player);

      // DOM fallback for bare HTMLAudioElement path
      player.addEventListener('play', updateMediaSessionMetaData);
      player.addEventListener('pause', updateMediaSessionMetaData);
      player.addEventListener('loadedmetadata', updateMediaSessionMetaData);
      player.addEventListener('timeupdate', handleTimeUpdate);
    }

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
      if (audioPlayer) {
        audioPlayer.off('play', updateMediaSessionMetaData);
        audioPlayer.off('pause', updateMediaSessionMetaData);
        audioPlayer.off('durationChange', updateMediaSessionMetaData);
        audioPlayer.off('timeUpdate', handleTimeUpdate);
      } else {
        player.removeEventListener('play', updateMediaSessionMetaData);
        player.removeEventListener('pause', updateMediaSessionMetaData);
        player.removeEventListener('loadedmetadata', updateMediaSessionMetaData);
        player.removeEventListener('timeupdate', handleTimeUpdate);
      }

      storeSubscription.unsubscribe();
    };
  }, [
    audioPlayer,
    handleSkipBackwardClick,
    handleSkipForwardClick,
    t,
    toggleSongPlayback,
    updateSongPosition,
    player
  ]);
}
