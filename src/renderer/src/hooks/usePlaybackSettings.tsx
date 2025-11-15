import { useCallback } from 'react';
import { dispatch, store } from '../store/store';
import storage from '../utils/localStorage';
import toggleSongIsFavorite from '../other/toggleSongIsFavorite';

/**
 * Hook for managing playback settings (repeat, volume, mute, position, favorites, equalizer).
 *
 * This hook provides functions to control various playback settings including
 * repeat modes, volume control, mute state, song position seeking, favorite
 * song toggling, and equalizer presets. All settings are persisted to localStorage
 * where appropriate.
 *
 * @param player - The HTMLAudioElement instance
 * @returns Object containing playback setting functions
 *
 * @example
 * ```tsx
 * const {
 *   toggleRepeat,
 *   toggleMutedState,
 *   updateVolume,
 *   updateSongPosition,
 *   toggleIsFavorite,
 *   updateEqualizerOptions
 * } = usePlaybackSettings(player);
 *
 * // Use in UI controls
 * <button onClick={() => toggleRepeat()}>Repeat</button>
 * <input onChange={(e) => updateVolume(e.target.value)} />
 * updateEqualizerOptions({ preset: 'rock', bands: [...] });
 * ```
 */
export function usePlaybackSettings(player: HTMLAudioElement) {
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
      if (position >= 0 && position <= player.duration) player.currentTime = position;
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

  const updateEqualizerOptions = useCallback((options: Equalizer) => {
    storage.equalizerPreset.setEqualizerPreset(options);
  }, []);

  return {
    toggleRepeat,
    toggleMutedState,
    updateVolume,
    updateSongPosition,
    toggleIsFavorite,
    updateEqualizerOptions
  };
}
