import { useCallback, useEffect } from 'react';
import { useStore } from '@tanstack/react-store';
import { useSuspenseQuery } from '@tanstack/react-query';
import { dispatch, store } from '../store/store';
import storage from '../utils/localStorage';
import { settingsQuery } from '../queries/settings';

const manageBrightness = (
  values: [number, number, number],
  range?: { min?: number; max?: number }
): [number, number, number] => {
  const max = range?.max || 1;
  const min = range?.min || 0.9;

  const [h, s, l] = values;

  const updatedL = l >= min ? (l <= max ? l : max) : min;
  return [h, s, updatedL];
};

const manageSaturation = (
  values: [number, number, number],
  range?: { min?: number; max?: number }
): [number, number, number] => {
  const max = range?.max || 1;
  const min = range?.min || 0.9;

  const [h, s, l] = values;

  const updatedS = s >= min ? (s <= max ? s : max) : min;
  return [h, updatedS, l];
};

const resetStyles = () => {
  const root = document.getElementById('root');

  if (root) {
    root.style.removeProperty('--side-bar-background');
    root.style.removeProperty('--background-color-2');
    root.style.removeProperty('--dark-background-color-2');
    root.style.removeProperty('--background-color-3');
    root.style.removeProperty('--dark-background-color-3');
    root.style.removeProperty('--text-color-highlight');
    root.style.removeProperty('--dark-text-color-highlight');
    root.style.removeProperty('--seekbar-background-color');
    root.style.removeProperty('--dark-seekbar-background-color');
    root.style.removeProperty('--scrollbar-thumb-background-color');
    root.style.removeProperty('--dark-scrollbar-thumb-background-color');
    root.style.removeProperty('--seekbar-track-background-color');
    root.style.removeProperty('--dark-seekbar-track-background-color');
    root.style.removeProperty('--text-color-highlight-2');
    root.style.removeProperty('--dark-text-color-highlight-2');
    root.style.removeProperty('--slider-opacity');
    root.style.removeProperty('--dark-slider-opacity');
    root.style.removeProperty('--context-menu-list-hover');
    root.style.removeProperty('--dark-context-menu-list-hover');
  }
};

export interface UseDynamicThemeReturn {
  setDynamicThemesFromSongPalette: (palette?: NodeVibrantPalette) => () => void;
  updateBodyBackgroundImage: (isVisible: boolean, src?: string) => void;
}

/**
 * Hook for managing dynamic themes, background images, and dark mode.
 *
 * Provides functions to apply color palettes from song artwork and manage
 * background images. Automatically applies themes when enabled and when
 * song palette data is available. Also manages dark mode by toggling the
 * 'dark' class on document.body based on user preferences.
 *
 * @example
 * ```tsx
 * function ThemeManager() {
 *   const { setDynamicThemesFromSongPalette } = useDynamicTheme();
 *
 *   const applyTheme = (palette) => {
 *     const resetStyles = setDynamicThemesFromSongPalette(palette);
 *     // Later: resetStyles() to remove custom theme
 *   };
 * }
 * ```
 *
 * @returns Theme management functions
 */
export function useDynamicTheme(): UseDynamicThemeReturn {
  const setDynamicThemesFromSongPalette = useCallback((palette?: NodeVibrantPalette) => {
    const generateColor = (values: [number, number, number]) => {
      const [lh, ls, ll] = values;
      const color = `${lh * 360} ${ls * 100}% ${ll * 100}%`;
      return color;
    };

    const root = document.getElementById('root');
    if (root) {
      if (palette) {
        if (
          palette?.LightVibrant &&
          palette?.DarkVibrant &&
          palette?.LightMuted &&
          palette?.DarkMuted &&
          palette?.Vibrant &&
          palette?.Muted
        ) {
          const highLightVibrant = generateColor(manageBrightness(palette.LightVibrant.hsl));
          const mediumLightVibrant = generateColor(
            manageBrightness(palette.LightVibrant.hsl, { min: 0.75 })
          );
          const darkLightVibrant = generateColor(
            manageSaturation(
              manageBrightness(palette.LightVibrant.hsl, {
                max: 0.2,
                min: 0.2
              }),
              { max: 0.05, min: 0.05 }
            )
          );
          const highVibrant = generateColor(manageBrightness(palette.Vibrant.hsl, { min: 0.7 }));

          const lightVibrant = generateColor(palette.LightVibrant.hsl);
          const darkVibrant = generateColor(palette.DarkVibrant.hsl);
          // const lightMuted = generateColor(palette.LightMuted.hsl);
          // const darkMuted = generateColor(palette.DarkMuted.hsl);
          // const vibrant = generateColor(palette.Vibrant.hsl);
          // const muted = generateColor(palette.Muted.hsl);

          root.style.setProperty('--side-bar-background', highLightVibrant, 'important');
          root.style.setProperty('--background-color-2', highLightVibrant, 'important');

          root.style.setProperty('--context-menu-list-hover', highLightVibrant, 'important');
          root.style.setProperty('--dark-context-menu-list-hover', highLightVibrant, 'important');

          root.style.setProperty('--dark-background-color-2', darkLightVibrant, 'important');

          root.style.setProperty('--background-color-3', highVibrant, 'important');
          root.style.setProperty('--dark-background-color-3', lightVibrant, 'important');

          root.style.setProperty('--text-color-highlight', darkVibrant, 'important');
          root.style.setProperty('--dark-text-color-highlight', lightVibrant, 'important');

          root.style.setProperty('--seekbar-background-color', darkVibrant, 'important');
          root.style.setProperty('--dark-seekbar-background-color', lightVibrant, 'important');

          root.style.setProperty(
            '--scrollbar-thumb-background-color',
            mediumLightVibrant,
            'important'
          );
          root.style.setProperty(
            '--dark-scrollbar-thumb-background-color',
            mediumLightVibrant,
            'important'
          );

          root.style.setProperty('--seekbar-track-background-color', darkVibrant, 'important');
          root.style.setProperty(
            '--dark-seekbar-track-background-color',
            darkLightVibrant,
            'important'
          );

          root.style.setProperty('--slider-opacity', '0.25', 'important');
          root.style.setProperty('--dark-slider-opacity', '1', 'important');

          root.style.setProperty('--text-color-highlight-2', darkVibrant, 'important');
          root.style.setProperty('--dark-text-color-highlight-2', lightVibrant, 'important');
        }
      } else {
        resetStyles();
      }
    }
    return resetStyles;
  }, []);

  const updateBodyBackgroundImage = useCallback((isVisible: boolean, src?: string) => {
    let image: string | undefined;
    const disableBackgroundArtworks = storage.preferences.getPreferences(
      'disableBackgroundArtworks'
    );

    if (!disableBackgroundArtworks && isVisible && src) image = src;

    return dispatch({
      type: 'UPDATE_BODY_BACKGROUND_IMAGE',
      data: image
    });
  }, []);

  // Monitor preference and song data changes to apply/remove dynamic themes
  const isImageBasedDynamicThemesEnabled = useStore(
    store,
    (state) => state.localStorage.preferences.enableImageBasedDynamicThemes
  );

  useEffect(() => {
    // Reset styles first
    setDynamicThemesFromSongPalette(undefined);

    // Apply dynamic theme if enabled and palette data is available
    const isDynamicThemesEnabled =
      isImageBasedDynamicThemesEnabled && store.state.currentSongData.paletteData;

    const resetStyles = setDynamicThemesFromSongPalette(
      isDynamicThemesEnabled ? store.state.currentSongData.paletteData : undefined
    );

    // Cleanup on unmount or when dependencies change
    return () => {
      resetStyles();
    };
  }, [isImageBasedDynamicThemesEnabled, setDynamicThemesFromSongPalette]);

  // Monitor dark mode setting and apply/remove 'dark' class on document.body
  const { data: userSettings } = useSuspenseQuery(settingsQuery.all);
  const isDarkMode = userSettings.isDarkMode;

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  return {
    setDynamicThemesFromSongPalette,
    updateBodyBackgroundImage
  };
}
