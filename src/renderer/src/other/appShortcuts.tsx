import i18n from '../i18n';

export const SHORTCUTS_STORAGE_KEY = 'app_shortcuts';

export interface Shortcut {
  label: string;
  keys: string[];
}

export interface ShortcutCategory {
  shortcutCategoryTitle: string;
  shortcuts: Shortcut[];
}

export class normalizedKeys {
  static enterKey = i18n.t('appShortcutsPrompt.enterKey');
  static spaceKey = i18n.t('appShortcutsPrompt.spaceKey');
  static ctrlKey = i18n.t('appShortcutsPrompt.ctrlKey');
  static shiftKey = i18n.t('appShortcutsPrompt.shiftKey');
  static altKey = i18n.t('appShortcutsPrompt.altKey');
  static rightArrowKey = i18n.t('appShortcutsPrompt.rightArrowKey');
  static leftArrowKey = i18n.t('appShortcutsPrompt.leftArrowKey');
  static upArrowKey = i18n.t('appShortcutsPrompt.upArrowKey');
  static downArrowKey = i18n.t('appShortcutsPrompt.downArrowKey');
  static homeKey = i18n.t('appShortcutsPrompt.homeKey');
  static mouseClick = i18n.t('appShortcutsPrompt.mouseClick');
  static doubleClick = i18n.t('appShortcutsPrompt.doubleClick');
  static endKey = "End";
}


export const shortcutData: ShortcutCategory[] = [
    {
      shortcutCategoryTitle: i18n.t('appShortcutsPrompt.mediaPlayback'),
      shortcuts: [
        {
          label: i18n.t('appShortcutsPrompt.playPause'),
          keys: [normalizedKeys.spaceKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.toggleMute'),
          keys: [normalizedKeys.ctrlKey, 'M']
        },
        {
          label: i18n.t('appShortcutsPrompt.nextSong'),
          keys: [normalizedKeys.ctrlKey, normalizedKeys.rightArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.prevSong'),
          keys: [normalizedKeys.ctrlKey, normalizedKeys.leftArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.tenSecondsForward'),
          keys: [normalizedKeys.shiftKey, normalizedKeys.rightArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.tenSecondsBackward'),
          keys: [normalizedKeys.shiftKey, normalizedKeys.leftArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.upVolume'),
          keys: [normalizedKeys.ctrlKey, normalizedKeys.upArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.downVolume'),
          keys: [normalizedKeys.ctrlKey, normalizedKeys.downArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.toggleShuffle'),
          keys: [normalizedKeys.ctrlKey, 'S']
        },
        {
          label: i18n.t('appShortcutsPrompt.toggleRepeat'),
          keys: [normalizedKeys.ctrlKey, 'T']
        },
        {
          label: i18n.t('appShortcutsPrompt.toggleFavorite'),
          keys: [normalizedKeys.ctrlKey, 'H']
        },
        {
          label: i18n.t('appShortcutsPrompt.upPlaybackRate'),
          keys: [normalizedKeys.ctrlKey, ']']
        },
        {
          label: i18n.t('appShortcutsPrompt.downPlaybackRate'),
          keys: [normalizedKeys.ctrlKey, '[']
        },
        {
          label: i18n.t('appShortcutsPrompt.resetPlaybackRate'),
          keys: [normalizedKeys.ctrlKey, '\\']
        },
        {
          label: i18n.t('appShortcutsPrompt.openAppShortcutsPrompt'),
          keys: [normalizedKeys.ctrlKey, '/']
        }
      ]
    },
    {
      shortcutCategoryTitle: i18n.t('appShortcutsPrompt.navigation'),
      shortcuts: [
        {
          label: i18n.t('appShortcutsPrompt.goHome'),
          keys: [normalizedKeys.altKey, normalizedKeys.homeKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.goBack'),
          keys: [normalizedKeys.altKey, normalizedKeys.leftArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.goForward'),
          keys: [normalizedKeys.altKey, normalizedKeys.rightArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.openMiniPlayer'),
          keys: [normalizedKeys.ctrlKey, 'N']
        },
        {
          label: i18n.t('appShortcutsPrompt.goToLyrics'),
          keys: [normalizedKeys.ctrlKey, 'L']
        },
        {
          label: i18n.t('appShortcutsPrompt.goToQueue'),
          keys: [normalizedKeys.ctrlKey, 'Q']
        },
        {
          label: i18n.t('appShortcutsPrompt.goToSearch'),
          keys: [normalizedKeys.ctrlKey, 'F']
        }
      ]
    },
    {
      shortcutCategoryTitle: i18n.t('appShortcutsPrompt.selections'),
      shortcuts: [
        {
          label: i18n.t('appShortcutsPrompt.selectMultipleItems'),
          keys: [normalizedKeys.shiftKey, normalizedKeys.mouseClick]
        }
      ]
    },
    {
      shortcutCategoryTitle: i18n.t('appShortcutsPrompt.lyrics'),
      shortcuts: [
        {
          label: i18n.t('appShortcutsPrompt.playNextLyricsLine'),
          keys: [normalizedKeys.altKey, normalizedKeys.downArrowKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.playPrevLyricsLine'),
          keys: [normalizedKeys.altKey, normalizedKeys.upArrowKey]
        }
      ]
    },
    {
      shortcutCategoryTitle: i18n.t('appShortcutsPrompt.lyricsEditor'),
      shortcuts: [
        {
          label: i18n.t('appShortcutsPrompt.selectNextLyricsLine'),
          keys: [normalizedKeys.enterKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.selectPrevLyricsLine'),
          keys: [normalizedKeys.shiftKey, normalizedKeys.enterKey]
        },
        {
          label: i18n.t('appShortcutsPrompt.selectCustomLyricsLine'),
          keys: [normalizedKeys.doubleClick]
        }
      ]
    },
    {
      shortcutCategoryTitle: i18n.t('appShortcutsPrompt.otherShortcuts'),
      shortcuts: [
        {
          label: i18n.t('appShortcutsPrompt.toggleTheme'),
          keys: [normalizedKeys.ctrlKey, 'Y']
        },
        {
          label: i18n.t('appShortcutsPrompt.toggleMiniPlayerAlwaysOnTop'),
          keys: [normalizedKeys.ctrlKey, 'O']
        },
        {
          label: i18n.t('appShortcutsPrompt.reload'),
          keys: [normalizedKeys.ctrlKey, 'R']
        },
        {
          label: i18n.t('appShortcutsPrompt.openDevtools'),
          keys: ['F12']
        }
      ]
    }
  ];
  

export function getShortcuts(): ShortcutCategory[] {
  const stored = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : shortcutData;
}

export function updateShortcutKeys(
    label: string,
    newKeys: string[]
  ): ShortcutCategory[] {
    const currentData = getShortcuts();
  
    const updatedData = currentData.map(category => ({
      ...category,
      shortcuts: category.shortcuts.map(shortcut => {
        if (shortcut.label === label) {
          return { ...shortcut, keys: newKeys };
        }
        return shortcut;
      })
    }));
    
  
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(updatedData));
    return updatedData;
  }
  

export function resetShortcutsToDefaults(): ShortcutCategory[] {
  localStorage.removeItem(SHORTCUTS_STORAGE_KEY);
  return shortcutData;
}

export function initializeShortcuts() {
  if (!localStorage.getItem(SHORTCUTS_STORAGE_KEY)) {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcutData));
  }
}