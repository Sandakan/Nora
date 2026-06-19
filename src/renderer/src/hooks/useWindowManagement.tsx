import { type DragEvent, type RefObject, useCallback, useEffect } from 'react';
import { lazy } from 'react';

import { appPreferences } from '../../../../package.json';
import { store } from '../store/store';

// Lazy load prompts
const UnsupportedFileMessagePrompt = lazy(
  () => import('../components/UnsupportedFileMessagePrompt')
);

export interface UseWindowManagementOptions {
  changePromptMenuData?: (isVisible: boolean, prompt?: React.ReactNode, className?: string) => void;
  fetchSongFromUnknownSource?: (filePath: string) => void;
  importPlaylistFromPath?: (filePath: string) => void;
}

/**
 * Hook for managing window-related interactions and behaviors.
 *
 * This hook provides functions for: - Window blur/focus state management - Fullscreen state
 * management - Drag-and-drop file handling - Title bar updates with current song information
 *
 * @example
 *   ```tsx
 *   function App() {
 *   const appRef = useRef<HTMLDivElement>(null);
 *
 *   // Define handlers first
 *   const changePromptMenuData = useCallback(...);
 *   const fetchSongFromUnknownSource = useCallback(...);
 *
 *   // Then use the hook
 *   const windowMgmt = useWindowManagement(appRef, {
 *   changePromptMenuData,
 *   fetchSongFromUnknownSource
 *   });
 *
 *   return (
 *   <div
 *   ref={appRef}
 *   onDragEnter={windowMgmt.addSongDropPlaceholder}
 *   onDragLeave={windowMgmt.removeSongDropPlaceholder}
 *   onDrop={windowMgmt.onSongDrop}
 *   >
 *   {children}
 *   </div>
 *   );
 *   }
 *   ```;
 *
 * @param appRef - Reference to the main app container element
 * @param options - Configuration options for window management
 * @returns Window management functions and event handlers
 */
export function useWindowManagement(
  appRef: RefObject<HTMLDivElement | null>,
  options: UseWindowManagementOptions = {}
) {
  const { changePromptMenuData, fetchSongFromUnknownSource, importPlaylistFromPath } = options;

  /**
   * Manages window blur and focus states by adding/removing CSS classes.
   *
   * @param state - The window state to apply ('blur-sm' for blurred, 'focus' for focused)
   */
  const manageWindowBlurOrFocus = useCallback(
    (state: 'blur-sm' | 'focus') => {
      if (appRef.current) {
        if (state === 'blur-sm') appRef.current.classList.add('blurred');
        if (state === 'focus') appRef.current.classList.remove('blurred');
      }
    },
    [appRef]
  );

  /**
   * Manages fullscreen state by adding/removing CSS classes.
   *
   * @param state - The fullscreen state to apply ('fullscreen' or 'windowed')
   */
  const manageWindowFullscreen = useCallback(
    (state: 'fullscreen' | 'windowed') => {
      if (appRef.current) {
        if (state === 'fullscreen') return appRef.current.classList.add('fullscreen');
        if (state === 'windowed') return appRef.current.classList.remove('fullscreen');
      }
      return undefined;
    },
    [appRef]
  );

  /**
   * Adds visual placeholder when a file is being dragged over the app.
   *
   * @param e - React drag event
   */
  const addSongDropPlaceholder = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.relatedTarget === null) appRef.current?.classList.add('song-drop');
    },
    [appRef]
  );

  /**
   * Removes visual placeholder when a dragged file leaves the app area.
   *
   * @param e - React drag event
   */
  const removeSongDropPlaceholder = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.relatedTarget === null) appRef.current?.classList.remove('song-drop');
    },
    [appRef]
  );

  /**
   * Handles file drop events, validating and processing dropped audio files and playlists.
   *
   * @param e - React drag event containing dropped files
   */
  const onSongDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        const files = Array.from(e.dataTransfer.files);

        for (const file of files) {
          const filePath = window.api.utils.showFilePath(file);

          const ext = filePath.toLowerCase().split('.').pop() || '';
          const isPlaylistFile = ext === 'm3u8' || ext === 'm3u';

          const isASupportedAudioFormat = appPreferences.supportedMusicExtensions.some((type) =>
            filePath.toLowerCase().endsWith(type.toLowerCase())
          );

          if (isPlaylistFile && importPlaylistFromPath) {
            importPlaylistFromPath(filePath);
          } else if (isASupportedAudioFormat && fetchSongFromUnknownSource) {
            fetchSongFromUnknownSource(filePath);
          } else if (changePromptMenuData) {
            changePromptMenuData(
              true,
              <UnsupportedFileMessagePrompt filePath={filePath || file.name} />
            );
          }
        }
      } finally {
        if (appRef.current) appRef.current.classList.remove('song-drop');
      }
    },
    [appRef, changePromptMenuData, fetchSongFromUnknownSource, importPlaylistFromPath]
  );

  /**
   * Updates the browser/window title bar with current song information. Displays song title and
   * artist names if available.
   */
  const addSongTitleToTitleBar = useCallback(() => {
    if (store.state.currentSongData.title && store.state.currentSongData.artists)
      document.title = `${store.state.currentSongData.title} - ${
        Array.isArray(store.state.currentSongData.artists) &&
        store.state.currentSongData.artists.map((artist) => artist.name).join(', ')
      }`;
  }, []);

  /** Resets the browser/window title bar to the default "Nora" title. */
  const resetTitleBarInfo = useCallback(() => {
    document.title = `Nora`;
  }, []);

  /**
   * Sets up event listeners for window state changes (blur, focus, fullscreen). Automatically
   * cleans up listeners on unmount.
   */
  useEffect(() => {
    const unsubBlur = window.api.windowControls.onWindowBlur(() => manageWindowBlurOrFocus('blur-sm'));
    const unsubFocus = window.api.windowControls.onWindowFocus(() => manageWindowBlurOrFocus('focus'));

    const unsubFullscreenEnter = window.api.fullscreen.onEnterFullscreen(() => manageWindowFullscreen('fullscreen'));
    const unsubFullscreenLeave = window.api.fullscreen.onLeaveFullscreen(() => manageWindowFullscreen('windowed'));

    return () => {
      unsubBlur();
      unsubFocus();
      unsubFullscreenEnter();
      unsubFullscreenLeave();
    };
  }, [manageWindowBlurOrFocus, manageWindowFullscreen]);

  return {
    manageWindowBlurOrFocus,
    manageWindowFullscreen,
    addSongDropPlaceholder,
    removeSongDropPlaceholder,
    onSongDrop,
    addSongTitleToTitleBar,
    resetTitleBarInfo
  };
}

export type UseWindowManagementReturn = ReturnType<typeof useWindowManagement>;
