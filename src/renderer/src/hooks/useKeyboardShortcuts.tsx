import { normalizedKeys } from '@renderer/other/appShortcuts';
import { LOCAL_STORAGE_DEFAULT_TEMPLATE } from '@renderer/other/appReducer';
import { store } from '@renderer/store/store';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, type ReactNode } from 'react';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';

import storage from '../utils/localStorage';
import { useAudioPlayer } from './useAudioPlayer';

const AppShortcutsPrompt = lazy(() => import('../components/SettingsPage/AppShortcutsPrompt'));

// Canonical id lookup for legacy shortcuts. Older stored data can carry
// fallback ids (e.g. `unknown-0-0`) or human-readable labels instead of the
// stable action ids used by the dispatch switch below. Resolve via the
// default template's label mapping so customized legacy shortcuts still fire.
const legacyShortcutLabelToId = new Map<string, string>(
  LOCAL_STORAGE_DEFAULT_TEMPLATE.keyboardShortcuts.flatMap((category) =>
    category.shortcuts.map((shortcut) => [shortcut.label, shortcut.id])
  )
);

const canonicalizeShortcutId = (shortcut: Shortcut): string => {
  // Prefer the canonical action id resolved from the label: legacy entries can
  // carry meaningless fallback ids (e.g. `unknown-0-0`) that the dispatch
  // switch doesn't recognize, while their human-readable label is intact.
  const resolved = legacyShortcutLabelToId.get(shortcut.label);
  if (resolved) return resolved;
  return shortcut.id || shortcut.label;
};

/** Dependencies required by the keyboard shortcuts hook */
export interface KeyboardShortcutDependencies {
  /** Toggle song playback (play/pause) */
  toggleSongPlayback: () => void;

  /** Toggle muted state */
  toggleMutedState: (isMute?: boolean) => void;

  /** Skip to next song */
  handleSkipForwardClick: () => void;

  /** Skip to previous song */
  handleSkipBackwardClick: () => void;

  /** Update volume */
  updateVolume: (volume: number) => void;

  /** Toggle shuffle mode */
  toggleShuffling: () => void;

  /** Toggle repeat mode */
  toggleRepeat: () => void;

  /** Toggle favorite status of current song */
  toggleIsFavorite: () => void;

  /** Add new notifications */
  addNewNotifications: (notifications: AppNotification[]) => void;

  /** Update player type (mini/normal) */
  updatePlayerType: (type: PlayerTypes) => void;

  /** Toggle multiple selections mode */
  toggleMultipleSelections: (isEnabled?: boolean) => void;

  /** Change prompt menu data (show/hide prompts) */
  changePromptMenuData: (
    isVisible?: boolean,
    prompt?: ReactNode | null,
    className?: string
  ) => void;
}

/**
 * Hook for managing keyboard shortcuts
 *
 * Automatically sets up event listeners for keyboard shortcuts and handles all shortcut actions
 * including playback control, navigation, volume control, and more.
 *
 * This hook does not return any values - it automatically manages keyboard event listeners and
 * cleanup.
 *
 * @example
 *   ```tsx
 *   function App() {
 *     const { toggleSongPlayback, handleSkipForwardClick } = usePlayerControl();
 *     const { updateVolume } = usePlaybackSettings();
 *     // ... other hooks
 *
 *     // Set up keyboard shortcuts
 *     useKeyboardShortcuts({
 *       toggleSongPlayback,
 *       handleSkipForwardClick,
 *       updateVolume
 *       // ... other dependencies
 *     });
 *
 *     return <div>...</div>;
 *   }
 *   ```;
 *
 * @param dependencies - Object containing all required callback functions
 */
export function useKeyboardShortcuts(dependencies: KeyboardShortcutDependencies): void {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const player = useAudioPlayer();

  const {
    toggleSongPlayback,
    toggleMutedState,
    handleSkipForwardClick,
    handleSkipBackwardClick,
    updateVolume,
    toggleShuffling,
    toggleRepeat,
    toggleIsFavorite,
    addNewNotifications,
    updatePlayerType,
    toggleMultipleSelections,
    changePromptMenuData
  } = dependencies;

  const manageKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      // Do not intercept keystrokes while the user edits text: global
      // shortcuts would preventDefault and break typing/IME composition.
      const target = e.target as HTMLElement | null;
      const isEditableTarget =
        target &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');
      if (isEditableTarget || e.isComposing) return;

      const shortcuts = storage.keyboardShortcuts
        .getKeyboardShortcuts()
        .flatMap((category) => category.shortcuts);

      const formatKey = (key: string) => {
        switch (key) {
          case ' ':
            return normalizedKeys.spaceKey;
          case 'ArrowUp':
            return normalizedKeys.upArrowKey;
          case 'ArrowDown':
            return normalizedKeys.downArrowKey;
          case 'ArrowLeft':
            return normalizedKeys.leftArrowKey;
          case 'ArrowRight':
            return normalizedKeys.rightArrowKey;
          case 'Enter':
            return normalizedKeys.enterKey;
          case 'End':
            return normalizedKeys.endKey;
          case 'Home':
            return normalizedKeys.homeKey;
          case ']':
            return ']';
          case '[':
            return '[';
          case '\\':
            return '\\';
          default:
            return key.length === 1 ? key.toUpperCase() : key;
        }
      };

      const pressedKeys = [
        e.metaKey ? 'Cmd' : null,
        e.ctrlKey ? 'Ctrl' : null,
        e.shiftKey ? 'Shift' : null,
        e.altKey ? 'Alt' : null,
        formatKey(e.key)
      ].filter(Boolean) as string[];

      // Reject modifier-only combos (Ctrl alone, Shift alone, etc.).
      if (pressedKeys.every((key) => ['Cmd', 'Ctrl', 'Shift', 'Alt'].includes(key))) return;

      const matchedShortcut = shortcuts.find((shortcut) => {
        const storedKeys = shortcut.keys.map(formatKey).sort();
        const comboKeys = pressedKeys.sort();
        return JSON.stringify(storedKeys) === JSON.stringify(comboKeys);
      });

      if (matchedShortcut) {
        e.preventDefault();
        let updatedPlaybackRate: number;
        const shortcutId = canonicalizeShortcutId(matchedShortcut).replace(
          /(_key|Key)$/i,
          ''
        );
        switch (shortcutId) {
          case 'playPause':
            toggleSongPlayback();
            break;
          case 'toggleMute':
            toggleMutedState(!store.state.player.volume.isMuted);
            break;
          case 'nextSong':
            handleSkipForwardClick();
            break;
          case 'prevSong':
            handleSkipBackwardClick();
            break;
          case 'tenSecondsForward':
            if (player.currentTime + 10 < player.duration) player.currentTime += 10;
            break;
          case 'tenSecondsBackward':
            if (player.currentTime - 10 >= 0) player.currentTime -= 10;
            else player.currentTime = 0;
            break;
          case 'upVolume':
            updateVolume(player.volume + 0.05 <= 1 ? player.volume * 100 + 5 : 100);
            break;
          case 'downVolume':
            updateVolume(player.volume - 0.05 >= 0 ? player.volume * 100 - 5 : 0);
            break;
          case 'toggleShuffle':
            toggleShuffling();
            break;
          case 'toggleRepeat':
            toggleRepeat();
            break;
          case 'toggleFavorite':
            toggleIsFavorite();
            break;
          case 'upPlaybackRate':
            updatedPlaybackRate = store.state.localStorage.playback.playbackRate || 1;
            if (updatedPlaybackRate + 0.05 > 4) updatedPlaybackRate = 4;
            else updatedPlaybackRate += 0.05;
            updatedPlaybackRate = parseFloat(updatedPlaybackRate.toFixed(2));
            storage.setItem('playback', 'playbackRate', updatedPlaybackRate);
            addNewNotifications([
              {
                id: 'playbackRate',
                iconName: 'avg_pace',
                content: t('notifications.playbackRateChanged', { val: updatedPlaybackRate })
              }
            ]);
            break;
          case 'downPlaybackRate':
            updatedPlaybackRate = store.state.localStorage.playback.playbackRate || 1;
            if (updatedPlaybackRate - 0.05 < 0.25) updatedPlaybackRate = 0.25;
            else updatedPlaybackRate -= 0.05;
            updatedPlaybackRate = parseFloat(updatedPlaybackRate.toFixed(2));
            storage.setItem('playback', 'playbackRate', updatedPlaybackRate);
            addNewNotifications([
              {
                id: 'playbackRate',
                iconName: 'avg_pace',
                content: t('notifications.playbackRateChanged', { val: updatedPlaybackRate })
              }
            ]);
            break;
          case 'resetPlaybackRate':
            storage.setItem('playback', 'playbackRate', 1);
            addNewNotifications([
              {
                id: 'playbackRate',
                iconName: 'avg_pace',
                content: t('notifications.playbackRateReset')
              }
            ]);
            break;
          case 'goToSearch':
            navigate({ to: '/main-player/search' });
            break;
          case 'goToLyrics':
            navigate({ to: '/main-player/lyrics' });
            break;
          case 'goToQueue':
            navigate({ to: '/main-player/queue' });
            break;
          case 'goHome':
            navigate({ to: '/main-player/home' });
            break;
          case 'goBack':
            // TODO: Implement page history back navigation.
            break;
          case 'goForward':
            // TODO: Implement page history forward navigation.
            break;
          case 'openMiniPlayer':
            updatePlayerType(store.state.playerType === 'mini' ? 'normal' : 'mini');
            break;
          case 'toggleFullscreenPlayer': {
            const isCurrentlyFull = store.state.playerType === 'full';
            updatePlayerType(isCurrentlyFull ? 'normal' : 'full');
            navigate({
              to: isCurrentlyFull ? '/main-player/home' : '/fullscreen-player'
            });
            break;
          }
          case 'selectMultipleItems':
            toggleMultipleSelections(true);
            break;
          case 'selectNextLyricsLine':
            // TODO: Implement logic to select next lyrics line.
            break;
          case 'selectPrevLyricsLine':
            // TODO: Implement logic to select previous lyrics line.
            break;
          case 'selectCustomLyricsLine':
            // TODO: Implement logic to select custom lyrics line.
            break;
          case 'playNextLyricsLine':
            // TODO: Implement logic to jump to next lyrics line.
            break;
          case 'playPrevLyricsLine':
            // TODO: Implement logic to jump to previous lyrics line.
            break;
          case 'toggleTheme':
            window.api.theme.changeAppTheme();
            break;
          case 'toggleEqualizer':
            player.toggleEqualizer();
            break;
          case 'toggleMiniPlayerAlwaysOnTop':
            // TODO: Implement logic to jump to to trigger mini player always on top.
            break;
          case 'reload':
            window.api.appControls.restartRenderer?.('Shortcut: Ctrl+R');
            break;
          case 'openAppShortcutsPrompt':
            changePromptMenuData(true, <AppShortcutsPrompt />);
            break;
          case 'openDevtools':
            if (!window.api.properties.isInDevelopment) {
              window.api.settingsHelpers.openDevtools();
            }
            break;
          default:
            console.warn(`Unhandled shortcut action: ${shortcutId}`);
        }
      }
    },
    [
      toggleSongPlayback,
      toggleMutedState,
      handleSkipForwardClick,
      handleSkipBackwardClick,
      updateVolume,
      toggleShuffling,
      toggleRepeat,
      toggleIsFavorite,
      addNewNotifications,
      t,
      navigate,
      updatePlayerType,
      toggleMultipleSelections,
      changePromptMenuData,
      player
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', manageKeyboardShortcuts);
    return () => {
      window.removeEventListener('keydown', manageKeyboardShortcuts);
    };
  }, [manageKeyboardShortcuts]);
}
