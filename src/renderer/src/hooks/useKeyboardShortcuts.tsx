import { useCallback, useEffect, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { lazy } from 'react';
import storage from '../utils/localStorage';

import { useAudioPlayer } from './useAudioPlayer';
import { normalizedKeys } from '@renderer/other/appShortcuts';
import i18n from '@renderer/i18n';
import { store } from '@renderer/store/store';

const AppShortcutsPrompt = lazy(() => import('../components/SettingsPage/AppShortcutsPrompt'));

/**
 * Dependencies required by the keyboard shortcuts hook
 */
export interface KeyboardShortcutDependencies {
  /**
   * Toggle song playback (play/pause)
   */
  toggleSongPlayback: () => void;

  /**
   * Toggle muted state
   */
  toggleMutedState: (isMute?: boolean) => void;

  /**
   * Skip to next song
   */
  handleSkipForwardClick: () => void;

  /**
   * Skip to previous song
   */
  handleSkipBackwardClick: () => void;

  /**
   * Update volume
   */
  updateVolume: (volume: number) => void;

  /**
   * Toggle shuffle mode
   */
  toggleShuffling: () => void;

  /**
   * Toggle repeat mode
   */
  toggleRepeat: () => void;

  /**
   * Toggle favorite status of current song
   */
  toggleIsFavorite: () => void;

  /**
   * Add new notifications
   */
  addNewNotifications: (notifications: AppNotification[]) => void;

  /**
   * Update page history index (back/forward navigation)
   */
  updatePageHistoryIndex: (type: 'increment' | 'decrement' | 'home') => void;

  /**
   * Update player type (mini/normal)
   */
  updatePlayerType: (type: PlayerTypes) => void;

  /**
   * Toggle multiple selections mode
   */
  toggleMultipleSelections: (isEnabled?: boolean) => void;

  /**
   * Change prompt menu data (show/hide prompts)
   */
  changePromptMenuData: (
    isVisible?: boolean,
    prompt?: ReactNode | null,
    className?: string
  ) => void;
}

/**
 * Hook for managing keyboard shortcuts
 *
 * Automatically sets up event listeners for keyboard shortcuts and
 * handles all shortcut actions including playback control, navigation,
 * volume control, and more.
 *
 * This hook does not return any values - it automatically manages
 * keyboard event listeners and cleanup.
 *
 * @param dependencies - Object containing all required callback functions
 *
 * @example
 * ```tsx
 * function App() {
 *   const { toggleSongPlayback, handleSkipForwardClick } = usePlayerControl();
 *   const { updateVolume } = usePlaybackSettings();
 *   // ... other hooks
 *
 *   // Set up keyboard shortcuts
 *   useKeyboardShortcuts({
 *     toggleSongPlayback,
 *     handleSkipForwardClick,
 *     updateVolume,
 *     // ... other dependencies
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
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
    updatePageHistoryIndex,
    updatePlayerType,
    toggleMultipleSelections,
    changePromptMenuData
  } = dependencies;

  const manageKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
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
        e.ctrlKey ? 'Ctrl' : null,
        e.shiftKey ? 'Shift' : null,
        e.altKey ? 'Alt' : null,
        formatKey(e.key)
      ].filter(Boolean);

      const matchedShortcut = shortcuts.find((shortcut) => {
        const storedKeys = shortcut.keys.map(formatKey).sort();
        const comboKeys = pressedKeys.sort();
        return JSON.stringify(storedKeys) === JSON.stringify(comboKeys);
      });

      if (matchedShortcut) {
        e.preventDefault();
        let updatedPlaybackRate: number;
        switch (matchedShortcut.label) {
          case i18n.t('appShortcutsPrompt.playPause'):
            toggleSongPlayback();
            break;
          case i18n.t('appShortcutsPrompt.toggleMute'):
            toggleMutedState(!store.state.player.volume.isMuted);
            break;
          case i18n.t('appShortcutsPrompt.nextSong'):
            handleSkipForwardClick();
            break;
          case i18n.t('appShortcutsPrompt.prevSong'):
            handleSkipBackwardClick();
            break;
          case i18n.t('appShortcutsPrompt.tenSecondsForward'):
            if (player.currentTime + 10 < player.duration) player.currentTime += 10;
            break;
          case i18n.t('appShortcutsPrompt.tenSecondsBackward'):
            if (player.currentTime - 10 >= 0) player.currentTime -= 10;
            else player.currentTime = 0;
            break;
          case i18n.t('appShortcutsPrompt.upVolume'):
            updateVolume(player.volume + 0.05 <= 1 ? player.volume * 100 + 5 : 100);
            break;
          case i18n.t('appShortcutsPrompt.downVolume'):
            updateVolume(player.volume - 0.05 >= 0 ? player.volume * 100 - 5 : 0);
            break;
          case i18n.t('appShortcutsPrompt.toggleShuffle'):
            toggleShuffling();
            break;
          case i18n.t('appShortcutsPrompt.toggleRepeat'):
            toggleRepeat();
            break;
          case i18n.t('appShortcutsPrompt.toggleFavorite'):
            toggleIsFavorite();
            break;
          case i18n.t('appShortcutsPrompt.upPlaybackRate'):
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
          case i18n.t('appShortcutsPrompt.downPlaybackRate'):
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
          case i18n.t('appShortcutsPrompt.resetPlaybackRate'):
            storage.setItem('playback', 'playbackRate', 1);
            addNewNotifications([
              {
                id: 'playbackRate',
                iconName: 'avg_pace',
                content: t('notifications.playbackRateReset')
              }
            ]);
            break;
          case i18n.t('appShortcutsPrompt.goToSearch'):
            navigate({ to: '/main-player/search' });
            break;
          case i18n.t('appShortcutsPrompt.goToLyrics'):
            navigate({ to: '/main-player/lyrics' });
            break;
          case i18n.t('appShortcutsPrompt.goToQueue'):
            navigate({ to: '/main-player/queue' });
            break;
          case i18n.t('appShortcutsPrompt.goHome'):
            navigate({ to: '/main-player/home' });
            break;
          case i18n.t('appShortcutsPrompt.goBack'):
            updatePageHistoryIndex('decrement');
            break;
          case i18n.t('appShortcutsPrompt.goForward'):
            updatePageHistoryIndex('increment');
            break;
          case i18n.t('appShortcutsPrompt.openMiniPlayer'):
            updatePlayerType(store.state.playerType === 'mini' ? 'normal' : 'mini');
            break;
          case i18n.t('appShortcutsPrompt.selectMultipleItems'):
            toggleMultipleSelections(true);
            break;
          case i18n.t('appShortcutsPrompt.selectNextLyricsLine'):
            // TODO: Implement logic to select next lyrics line.
            break;
          case i18n.t('appShortcutsPrompt.selectPrevLyricsLine'):
            // TODO: Implement logic to select previous lyrics line.
            break;
          case i18n.t('appShortcutsPrompt.selectCustomLyricsLine'):
            // TODO: Implement logic to select custom lyrics line.
            break;
          case i18n.t('appShortcutsPrompt.playNextLyricsLine'):
            // TODO: Implement logic to jump to next lyrics line.
            break;
          case i18n.t('appShortcutsPrompt.playPrevLyricsLine'):
            // TODO: Implement logic to jump to previous lyrics line.
            break;
          case i18n.t('appShortcutsPrompt.toggleTheme'):
            window.api.theme.changeAppTheme();
            break;
          case i18n.t('appShortcutsPrompt.toggleMiniPlayerAlwaysOnTop'):
            // TODO: Implement logic to jump to to trigger mini player always on top.
            break;
          case i18n.t('appShortcutsPrompt.reload'):
            window.api.appControls.restartRenderer?.('Shortcut: Ctrl+R');
            break;
          case i18n.t('appShortcutsPrompt.openAppShortcutsPrompt'):
            changePromptMenuData(true, <AppShortcutsPrompt />);
            break;
          case i18n.t('appShortcutsPrompt.openDevtools'):
            if (!window.api.properties.isInDevelopment) {
              window.api.settingsHelpers.openDevtools();
            }
            break;
          default:
            console.warn(`Unhandled shortcut action: ${matchedShortcut.label}`);
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
      updatePageHistoryIndex,
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
