import { useCallback, useEffect, useRef } from 'react';

import type AudioPlayer from '../other/player';
import toggleSongIsFavorite from '../other/toggleSongIsFavorite';
import { dispatch, store } from '../store/store';
import storage from '../utils/localStorage';
import { useUserPreferences } from './useUserPreferences';

/**
 * Hook for managing playback settings (repeat, volume, mute, position, favorites, equalizer).
 *
 * This hook provides functions to control various playback settings including repeat modes, volume
 * control, mute state, song position seeking, favorite song toggling, and equalizer presets. All
 * settings are persisted to localStorage where appropriate.
 *
 * @example
 *   ```tsx
 *   const {
 *   toggleRepeat,
 *   toggleMutedState,
 *   updateVolume,
 *   updateSongPosition,
 *   toggleIsFavorite,
 *   updateEqualizerOptions
 *   } = usePlaybackSettings(player);
 *
 *   // Use in UI controls
 *   <button onClick={() => toggleRepeat()}>Repeat</button>
 *   <input onChange={(e) => updateVolume(e.target.value)} />
 *   updateEqualizerOptions({ preset: 'rock', bands: [...] });
 *   ```;
 *
 * @param player - The AudioPlayer or HTMLAudioElement instance
 * @returns Object containing playback setting functions
 */
export function usePlaybackSettings(player: AudioPlayer | HTMLAudioElement) {
  const { saveEqualizerPreset } = useUserPreferences();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPresetRef = useRef<Equalizer | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        if (pendingPresetRef.current) {
          saveEqualizerPreset(pendingPresetRef.current);
        }
      }
    };
  }, [saveEqualizerPreset]);

  const toggleRepeat = useCallback((newState?: RepeatTypes) => {
    const repeatState =
      newState ||
      (store.state.player.isRepeating === 'false'
        ? 'repeat'
        : store.state.player.isRepeating === 'repeat'
          ? 'repeat-1'
          : 'false');

    dispatch({
      type: 'UPDATE_IS_REPEATING_STATE',
      data: repeatState
    });
  }, []);

  const toggleMutedState = useCallback((isMute?: boolean) => {
    if (isMute !== undefined) {
      if (isMute !== store.state.player.volume.isMuted) {
        dispatch({ type: 'UPDATE_MUTED_STATE', data: isMute });
      }
    } else {
      dispatch({ type: 'UPDATE_MUTED_STATE' });
    }
  }, []);

  const updateVolume = useCallback((volume: number) => {
    storage.playback.setVolumeOptions('value', volume);

    dispatch({
      type: 'UPDATE_VOLUME_VALUE',
      data: volume
    });
  }, []);

  const updateSongPosition = useCallback(
    (position: number) => {
      const dur = player.duration;
      if (position >= 0 && (Number.isNaN(dur) || dur === 0 || position <= dur)) {
        player.currentTime = position;
      }
    },
    [player]
  );

  const toggleIsFavorite = useCallback(
    (isFavorite?: boolean, onlyChangeCurrentSongData = false) => {
      toggleSongIsFavorite(
        store.state.currentSongData.songId,
        store.state.currentSongData.isAFavorite,
        isFavorite,
        onlyChangeCurrentSongData
      )
        .then((newFavorite) => {
          if (typeof newFavorite === 'boolean') {
            store.state.currentSongData.isAFavorite = newFavorite;
            return dispatch({
              type: 'TOGGLE_IS_FAVORITE_STATE',
              data: newFavorite
            });
          }
          return undefined;
        })
        .catch((err) => console.error(err));
    },
    []
  );

  const updateEqualizerOptions = useCallback(
    (options: Equalizer) => {
      // 1. Immediately apply to local storage cache and live audio player (0ms latency)
      storage.equalizerPreset.setEqualizerPreset(options);
      if (
        'applyEqualizerSettings' in player &&
        typeof player.applyEqualizerSettings === 'function'
      ) {
        player.applyEqualizerSettings(options);
      }

      // 2. Debounce database persistence by 350ms to avoid flooding PostgreSQL transactions
      pendingPresetRef.current = options;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        saveEqualizerPreset(options);
        pendingPresetRef.current = null;
        debounceTimerRef.current = null;
      }, 350);
    },
    [saveEqualizerPreset, player]
  );

  return {
    toggleRepeat,
    toggleMutedState,
    updateVolume,
    updateSongPosition,
    toggleIsFavorite,
    updateEqualizerOptions
  };
}
