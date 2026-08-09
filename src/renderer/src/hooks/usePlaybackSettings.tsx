import { useCallback, useEffect, useRef } from 'react';

import type AudioPlayer from '../other/player';
import toggleSongIsFavorite from '../other/toggleSongIsFavorite';
import { dispatch, store } from '../store/store';
import storage from '../utils/localStorage';
import log from '../utils/log';
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
 *   updateEqualizerOptions({ '60': 1, preAmpValue: -2 });
 *   ```;
 *
 * @param player - The AudioPlayer instance (owns the audio graph, filters, and pre-amplification).
 * @returns Object containing playback setting functions
 */
const EQUALIZER_SAVE_DEBOUNCE_MS = 300;

const EQUALIZER_BAND_FILTERS: EqualizerBandFilters[] = [
  'thirtyTwoHertzFilter',
  'sixtyFourHertzFilter',
  'hundredTwentyFiveHertzFilter',
  'twoHundredFiftyHertzFilter',
  'fiveHundredHertzFilter',
  'thousandHertzFilter',
  'twoThousandHertzFilter',
  'fourThousandHertzFilter',
  'eightThousandHertzFilter',
  'sixteenThousandHertzFilter'
];

export function usePlaybackSettings(player: HTMLAudioElement, audioPlayer?: AudioPlayer) {
  const { saveEqualizerPresetAsync, equalizerPreset } = useUserPreferences();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPresetRef = useRef<Equalizer | null>(null);
  // Serialize equalizer saves: only one IPC save runs at a time, and each
  // save always persists the newest preset, so an older save can never
  // overwrite a newer one that completed first.
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  // Hydrate the persisted equalizer preset into the audio graph at startup.
  // The Settings page is not mounted on normal launch, so without this the
  // stored preset never reaches the filter nodes until the user opens
  // Settings. Applies only while no local change has happened yet: live
  // edits go through updateEqualizerOptions, so a query refetch (from a
  // completed save) must never roll back the audio graph to an older value.
  const equalizerLocalEditCountRef = useRef(0);
  useEffect(() => {
    if (!audioPlayer || !equalizerPreset) return;
    const { frequencyBands, preAmpValue } = equalizerPreset;
    if (!Array.isArray(frequencyBands) || frequencyBands.length !== EQUALIZER_BAND_FILTERS.length)
      return;
    const preset = {} as Equalizer;
    EQUALIZER_BAND_FILTERS.forEach((filterName, index) => {
      preset[filterName] = frequencyBands[index] ?? 0;
    });
    preset.preAmpValue = typeof preAmpValue === 'number' ? preAmpValue : 0;
    if (equalizerLocalEditCountRef.current === 0) {
      audioPlayer.applyEqualizerPreset(preset);
    }
  }, [audioPlayer, equalizerPreset]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      // Flush the latest pending preset so a shutdown within the debounce
      // window does not silently lose the last equalizer change. Runs through
      // the same serialized worker to avoid a duplicate write.
      if (pendingPresetRef.current) {
        const flush = pendingPresetRef.current;
        pendingPresetRef.current = null;
        saveChainRef.current = saveChainRef.current
          .then(() => saveEqualizerPresetAsync(flush))
          .catch(() => undefined);
      }
    };
  }, [saveEqualizerPresetAsync]);

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

  const updateEqualizerOptions = useCallback(
    (options: Equalizer) => {
      audioPlayer?.applyEqualizerPreset(options);
      equalizerLocalEditCountRef.current += 1;
      pendingPresetRef.current = options;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        const toSave = pendingPresetRef.current;
        if (!toSave) return;
        pendingPresetRef.current = null;
        // Serialize onto the chain so saves never run concurrently; each save
        // persists the newest preset at fire time, so an older save cannot
        // overwrite a newer one that completed first.
        saveChainRef.current = saveChainRef.current
          .then(() => saveEqualizerPresetAsync(toSave))
          .catch((err) => {
            log('Failed to save equalizer preset:', { err }, 'ERROR');
          });
      }, EQUALIZER_SAVE_DEBOUNCE_MS);
    },
    [saveEqualizerPresetAsync, audioPlayer]
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
